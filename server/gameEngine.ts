import {
  TankClass,
  TANK_CLASSES,
  PlayerTank,
  Bullet,
  BulletModifier,
  Obstacle,
  PowerUpCrate,
  PowerUpType,
  CombatEvent,
  ChatMessage,
  LeaderboardEntry,
  GameSnapshot,
  SkillType,
  Landmine,
  TankSkillState,
  PerkId,
  PerkCard,
  ALL_PERK_CARDS,
  GameMode,
  Team,
  StormZone,
  TeamScore,
  BossInfo,
  BaseZone,
  TankSkinId,
  BulletTrailId,
  RoofDecalId,
  CombatMedalType,
  MatchType,
  RankTier,
  getRankFromRp,
  WeatherType,
  WEATHER_CYCLE,
  WEATHER_CONFIGS,
} from '../src/types/game';

export const WORLD_WIDTH = 4200;
export const WORLD_HEIGHT = 4200;
export const TANK_RADIUS = 22;
export const BULLET_RADIUS = 5;
export const BOSS_RADIUS = 72;

// Utility functions
function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function circleRectCollision(
  cx: number,
  cy: number,
  r: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  const closestX = clamp(cx, rx, rx + rw);
  const closestY = clamp(cy, ry, ry + rh);
  const distX = cx - closestX;
  const distY = cy - closestY;
  return distX * distX + distY * distY < r * r;
}

export class GameEngine {
  private tanks: Map<string, PlayerTank> = new Map();
  private tankInputs: Map<
    string,
    { up: boolean; down: boolean; left: boolean; right: boolean; turretAngle: number; isFiring: boolean }
  > = new Map();
  private bullets: Bullet[] = [];
  private obstacles: Obstacle[] = [];
  private powerUps: PowerUpCrate[] = [];
  private landmines: Landmine[] = [];
  private events: CombatEvent[] = [];
  private pendingEvents: CombatEvent[] = [];
  private chatHistory: ChatMessage[] = [];
  private botTargetIds: Map<string, string | null> = new Map();
  private botTargetExpiry: Map<string, number> = new Map();
  private botNextMoveTime: Map<string, number> = new Map();
  private botLastPositions: Map<string, { x: number; y: number; stuckCount: number }> = new Map();

  private maxBots: number = 0;
  private nextPowerUpSpawn: number = 0;
  private nextEventId: number = 1;

  // Mode fields
  private mode: GameMode = 'PUBLIC';
  private bases: BaseZone[] = [
    { team: 'RED', x: 80, y: 1700, w: 380, h: 800 },
    { team: 'BLUE', x: 3740, y: 1700, w: 380, h: 800 },
  ];

  // Battle Royale Storm Zone
  private stormZone: StormZone = {
    centerX: WORLD_WIDTH / 2,
    centerY: WORLD_HEIGHT / 2,
    currentRadius: 2400,
    targetRadius: 2400,
    phase: 1,
    maxPhases: 5,
    phaseTimeLeft: 60,
    isShrinking: false,
    active: false,
    dps: 5,
  };
  private brWinner: { id: string; name: string; color: string; kills: number } | null = null;
  private brRoundResetTimer: number = 0;
  private lastStormDamageTick: number = 0;

  // Team Deathmatch Score
  private teamScore: TeamScore = {
    red: 0,
    blue: 0,
    targetKills: 30,
    winner: null,
  };
  private tdmRoundResetTimer: number = 0;
  private lastBaseRegenTick: number = 0;

  // World Boss Leviathan
  private boss: BossInfo | null = null;
  private customBossEnabled: boolean = false;
  private nextBossSpawnTime: number = 0;
  private bossNextFireTime: number = 0;
  private bossNextSkillTime: number = 0;
  private bossMoveAngle: number = 0;
  private bossNextMoveChange: number = 0;

  private firstBloodOccurred: boolean = false;
  private passiveExpTimer: number = 0;

  // Weather Cycle System
  private currentWeather: WeatherType = 'RAIN';
  private weatherCycleTimer: number = 60;

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${this.nextEventId++}`;
  }

  public getWeather(): WeatherType {
    return this.currentWeather;
  }

  public setWeather(weather: WeatherType) {
    this.currentWeather = weather;
    this.weatherCycleTimer = 60;
  }

  constructor(defaultBots: number = 0, mode: GameMode = 'PUBLIC') {
    this.mode = mode;
    this.maxBots = Math.max(0, defaultBots);

    if (this.mode === 'BATTLE_ROYALE') {
      this.stormZone.active = true;
      this.stormZone.currentRadius = 2400;
      this.stormZone.targetRadius = 2400;
      this.stormZone.phase = 1;
      this.stormZone.phaseTimeLeft = 60;
    }

    if (this.mode === 'BOSS_RAID') {
      this.spawnBoss();
    } else {
      this.nextBossSpawnTime = Date.now() + 180000;
    }

    this.initMap();
    this.spawnInitialPowerUps();
    if (this.maxBots > 0) {
      this.syncBots();
    }
  }

  private initMap() {
    this.obstacles = [];

    // Outer reinforced borders
    const wallThick = 44;
    this.obstacles.push(
      { id: 'border_top', type: 'STEEL', x: 0, y: 0, w: WORLD_WIDTH, h: wallThick },
      { id: 'border_bottom', type: 'STEEL', x: 0, y: WORLD_HEIGHT - wallThick, w: WORLD_WIDTH, h: wallThick },
      { id: 'border_left', type: 'STEEL', x: 0, y: 0, w: wallThick, h: WORLD_HEIGHT },
      { id: 'border_right', type: 'STEEL', x: WORLD_WIDTH - wallThick, y: 0, w: wallThick, h: WORLD_HEIGHT }
    );

    const cx = WORLD_WIDTH / 2; // 2100
    const cy = WORLD_HEIGHT / 2; // 2100

    // ==========================================
    // 1. SECTOR 0: CENTRAL CITADEL (cx, cy)
    // ==========================================
    // 4 Corner Steel Bastions
    this.obstacles.push(
      { id: 'cit_stl_nw', type: 'STEEL', x: cx - 240, y: cy - 240, w: 80, h: 80 },
      { id: 'cit_stl_ne', type: 'STEEL', x: cx + 160, y: cy - 240, w: 80, h: 80 },
      { id: 'cit_stl_sw', type: 'STEEL', x: cx - 240, y: cy + 160, w: 80, h: 80 },
      { id: 'cit_stl_se', type: 'STEEL', x: cx + 160, y: cy + 160, w: 80, h: 80 },
      { id: 'cit_core', type: 'STEEL', x: cx - 40, y: cy - 40, w: 80, h: 80 }
    );

    // Citadel Brick Walls with Gateways
    // North wall
    this.obstacles.push(
      { id: 'cit_brk_n1', type: 'BRICK', x: cx - 150, y: cy - 230, w: 80, h: 44, hp: 120, maxHp: 120 },
      { id: 'cit_brk_n2', type: 'BRICK', x: cx + 70, y: cy - 230, w: 80, h: 44, hp: 120, maxHp: 120 }
    );
    // South wall
    this.obstacles.push(
      { id: 'cit_brk_s1', type: 'BRICK', x: cx - 150, y: cy + 186, w: 80, h: 44, hp: 120, maxHp: 120 },
      { id: 'cit_brk_s2', type: 'BRICK', x: cx + 70, y: cy + 186, w: 80, h: 44, hp: 120, maxHp: 120 }
    );
    // West wall
    this.obstacles.push(
      { id: 'cit_brk_w1', type: 'BRICK', x: cx - 230, y: cy - 150, w: 44, h: 80, hp: 120, maxHp: 120 },
      { id: 'cit_brk_w2', type: 'BRICK', x: cx - 230, y: cy + 70, w: 44, h: 80, hp: 120, maxHp: 120 }
    );
    // East wall
    this.obstacles.push(
      { id: 'cit_brk_e1', type: 'BRICK', x: cx + 186, y: cy - 150, w: 44, h: 80, hp: 120, maxHp: 120 },
      { id: 'cit_brk_e2', type: 'BRICK', x: cx + 186, y: cy + 70, w: 44, h: 80, hp: 120, maxHp: 120 }
    );

    // ==========================================
    // 2. SECTOR NORTH-WEST: INDUSTRIAL CONTAINER DEPOT (1000, 1000)
    // ==========================================
    const nwx = 1000;
    const nwy = 1000;
    // Rows of Shipping Containers (Steel)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        this.obstacles.push({
          id: `ind_stl_${r}_${c}`,
          type: 'STEEL',
          x: nwx - 350 + c * 300,
          y: nwy - 350 + r * 280,
          w: 110,
          h: 56,
        });
        // Pallet stacks / brick barricades between containers
        if ((r + c) % 2 === 1) {
          this.obstacles.push({
            id: `ind_brk_${r}_${c}`,
            type: 'BRICK',
            x: nwx - 220 + c * 300,
            y: nwy - 340 + r * 280,
            w: 60,
            h: 40,
            hp: 90,
            maxHp: 90,
          });
        }
      }
    }

    // ==========================================
    // 3. SECTOR NORTH-EAST: RIVER DELTA & CANYON (3100, 1000)
    // ==========================================
    const nex = 3100;
    const ney = 1000;
    // Winding river lakes with bridge crossing
    this.obstacles.push(
      { id: 'water_ne_main', type: 'WATER', x: nex - 400, y: ney - 300, w: 340, h: 260 },
      { id: 'water_ne_river', type: 'WATER', x: nex + 60, y: ney - 300, w: 340, h: 260 },
      { id: 'water_ne_lower', type: 'WATER', x: nex - 200, y: ney + 120, w: 450, h: 240 }
    );
    // Bridge ramparts
    this.obstacles.push(
      { id: 'bridge_rail_n', type: 'STEEL', x: nex - 60, y: ney - 320, w: 30, h: 140 },
      { id: 'bridge_rail_s', type: 'STEEL', x: nex + 30, y: ney - 320, w: 30, h: 140 }
    );
    // River shore defensive brick bunkers
    this.obstacles.push(
      { id: 'riv_brk_1', type: 'BRICK', x: nex - 420, y: ney + 20, w: 90, h: 44, hp: 100, maxHp: 100 },
      { id: 'riv_brk_2', type: 'BRICK', x: nex + 350, y: ney + 20, w: 90, h: 44, hp: 100, maxHp: 100 }
    );

    // ==========================================
    // 4. SECTOR SOUTH-WEST: ANCIENT RUINS & CAMO FOREST (1000, 3100)
    // ==========================================
    const swx = 1000;
    const swy = 3100;
    // Maze of stone brick ruins
    for (let i = 0; i < 6; i++) {
      const isHoriz = i % 2 === 0;
      this.obstacles.push({
        id: `ruin_brk_${i}`,
        type: 'BRICK',
        x: swx - 300 + (i % 3) * 260,
        y: swy - 300 + Math.floor(i / 3) * 320,
        w: isHoriz ? 140 : 44,
        h: isHoriz ? 44 : 140,
        hp: 110,
        maxHp: 110,
      });
    }

    // Dense Forest Bush Clusters (Camouflage)
    const forestBushes = [
      { x: swx - 420, y: swy - 420, w: 220, h: 160 },
      { x: swx + 120, y: swy - 420, w: 260, h: 180 },
      { x: swx - 400, y: swy + 160, w: 240, h: 180 },
      { x: swx + 100, y: swy + 140, w: 280, h: 200 },
      { x: swx - 80, y: swy - 80, w: 160, h: 160 },
      // Ambush groves in other sectors
      { x: cx - 500, y: cy - 400, w: 180, h: 140 },
      { x: cx + 320, y: cy - 400, w: 180, h: 140 },
      { x: cx - 500, y: cy + 280, w: 180, h: 140 },
      { x: cx + 320, y: cy + 280, w: 180, h: 140 },
      { x: nwx + 380, y: nwy + 350, w: 200, h: 150 },
      { x: nex - 450, y: ney + 380, w: 220, h: 160 },
      { x: 2100, y: 800, w: 220, h: 150 },
      { x: 2100, y: 3400, w: 220, h: 150 },
      { x: 800, y: 2100, w: 160, h: 220 },
      { x: 3400, y: 2100, w: 160, h: 220 },
    ];
    forestBushes.forEach((b, idx) => {
      this.obstacles.push({
        id: `bush_${idx}`,
        type: 'BUSH',
        x: b.x,
        y: b.y,
        w: b.w,
        h: b.h,
      });
    });

    // ==========================================
    // 5. SECTOR SOUTH-EAST: TANK PROVING GROUNDS (3100, 3100)
    // ==========================================
    const sex = 3100;
    const sey = 3100;
    // Hardened Pillboxes (Steel)
    this.obstacles.push(
      { id: 'prv_stl_1', type: 'STEEL', x: sex - 260, y: sey - 260, w: 90, h: 90 },
      { id: 'prv_stl_2', type: 'STEEL', x: sex + 170, y: sey - 260, w: 90, h: 90 },
      { id: 'prv_stl_3', type: 'STEEL', x: sex - 260, y: sey + 170, w: 90, h: 90 },
      { id: 'prv_stl_4', type: 'STEEL', x: sex + 170, y: sey + 170, w: 90, h: 90 }
    );
    // Trench Crossings & Firing Ranges
    for (let i = 0; i < 4; i++) {
      this.obstacles.push({
        id: `prv_brk_${i}`,
        type: 'BRICK',
        x: sex - 140 + (i % 2) * 200,
        y: sey - 120 + Math.floor(i / 2) * 200,
        w: 80,
        h: 50,
        hp: 120,
        maxHp: 120,
      });
    }

    // ==========================================
    // 6. STRATEGIC CHECKPOINTS & HIGHWAY PILLBOXES
    // ==========================================
    const checkpoints = [
      { x: 2100, y: 1300 },
      { x: 2100, y: 2900 },
      { x: 1300, y: 2100 },
      { x: 2900, y: 2100 },
    ];
    checkpoints.forEach((cp, idx) => {
      this.obstacles.push(
        { id: `cp_stl_${idx}`, type: 'STEEL', x: cp.x - 30, y: cp.y - 30, w: 60, h: 60 },
        { id: `cp_brk_l_${idx}`, type: 'BRICK', x: cp.x - 130, y: cp.y - 20, w: 70, h: 40, hp: 100, maxHp: 100 },
        { id: `cp_brk_r_${idx}`, type: 'BRICK', x: cp.x + 60, y: cp.y - 20, w: 70, h: 40, hp: 100, maxHp: 100 }
      );
    });
  }

  private spawnInitialPowerUps() {
    const types: PowerUpType[] = ['TRIPLE_SHOT', 'SPEED_BOOST', 'SHIELD', 'REPAIR', 'RAPID_FIRE'];
    for (let i = 0; i < 12; i++) {
      const type = types[i % types.length];
      const pos = this.findSafeSpawnPosition();
      this.powerUps.push({
        id: `crate_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type,
        x: pos.x,
        y: pos.y,
        createdAt: Date.now(),
        duration: 14000,
      });
    }
  }

  private findSafeSpawnPosition(): { x: number; y: number } {
    let attempts = 0;
    const padding = 150;
    while (attempts < 60) {
      attempts++;
      const x = padding + Math.random() * (WORLD_WIDTH - padding * 2);
      const y = padding + Math.random() * (WORLD_HEIGHT - padding * 2);

      let collides = false;
      for (const obs of this.obstacles) {
        if (obs.type !== 'BUSH' && circleRectCollision(x, y, 40, obs.x, obs.y, obs.w, obs.h)) {
          collides = true;
          break;
        }
      }
      if (!collides && this.boss && this.boss.isAlive) {
        if (distance(x, y, this.boss.x, this.boss.y) < BOSS_RADIUS + 120) {
          collides = true;
        }
      }
      if (!collides) {
        return { x, y };
      }
    }
    return { x: 500, y: 500 };
  }

  public addPlayer(
    id: string,
    name: string,
    color: string,
    tankClass: TankClass,
    isBot: boolean = false,
    team?: Team,
    skinId?: TankSkinId,
    bulletTrail?: BulletTrailId,
    roofDecal?: RoofDecalId,
    matchType?: MatchType,
    rankTier?: RankTier,
    rankRp?: number
  ): PlayerTank {
    const stats = TANK_CLASSES[tankClass] || TANK_CLASSES.STRIKER;
    let spawn = this.findSafeSpawnPosition();

    let assignedTeam: Team = team && team !== 'NONE' ? team : 'NONE';
    let assignedColor = color || stats.colorPreset;

    if (this.mode === 'TEAM_DEATHMATCH') {
      if (assignedTeam === 'NONE') {
        let redCount = 0;
        let blueCount = 0;
        for (const t of this.tanks.values()) {
          if (t.team === 'RED') redCount++;
          if (t.team === 'BLUE') blueCount++;
        }
        assignedTeam = redCount <= blueCount ? 'RED' : 'BLUE';
      }

      if (assignedTeam === 'RED') {
        assignedColor = '#ef4444';
        spawn = { x: 200 + Math.random() * 150, y: 1800 + Math.random() * 600 };
      } else {
        assignedColor = '#3b82f6';
        spawn = { x: 3800 + Math.random() * 150, y: 1800 + Math.random() * 600 };
      }
    }

    const botSkins: TankSkinId[] = ['CAMO_WOODLAND', 'ARCTIC_FROST', 'VOLCANIC_MAGMA', 'NEON_CYBERPUNK', 'ROYAL_GOLD'];
    const botTrails: BulletTrailId[] = ['PURPLE_LIGHTNING', 'DRAGON_FIRE', 'FROST_SNOW', 'CYAN_LASER'];
    const botDecals: RoofDecalId[] = ['FLAG_VIETNAM', 'PIRATE_SKULL', 'TIGER_BEAST', 'MILITARY_STAR', 'DRAGON_CREST', 'ROYAL_SHIELD'];

    const chosenSkin: TankSkinId = skinId || (isBot ? botSkins[Math.floor(Math.random() * botSkins.length)] : 'DEFAULT');
    const chosenTrail: BulletTrailId = bulletTrail || (isBot && Math.random() > 0.4 ? botTrails[Math.floor(Math.random() * botTrails.length)] : 'STANDARD');
    const chosenDecal: RoofDecalId = roofDecal || (isBot && Math.random() > 0.4 ? botDecals[Math.floor(Math.random() * botDecals.length)] : 'NONE');

    const tank: PlayerTank = {
      id,
      name: name || (isBot ? `Bot [${tankClass}]` : 'Chiến Binh Mới'),
      color: assignedColor,
      tankClass,
      x: spawn.x,
      y: spawn.y,
      angle: Math.random() * Math.PI * 2,
      turretAngle: 0,
      speed: stats.speed,
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      shield: 0,
      isDead: false,
      respawnCountdown: 0,
      kills: 0,
      deaths: 0,
      score: 0,
      streak: 0,
      isBot,
      activePowerUp: null,
      invulnerableUntil: Date.now() + 3000,
      lastFired: 0,
      ping: 15,
      nextAmmoType: this.getRandomAmmoType(),
      slowUntil: 0,
      burnUntil: 0,
      skills: {
        boostUntil: 0,
        boostCooldownUntil: 0,
        shieldUntil: 0,
        shieldCooldownUntil: 0,
        mineCooldownUntil: 0,
        barrageUntil: 0,
        barrageCooldownUntil: 0,
      },
      skillPoints: 0,
      skillLevels: {
        BOOST: 1,
        SHIELD: 1,
        MINE: 1,
        BARRAGE: 1,
      },
      level: 1,
      exp: 0,
      maxExp: 75,
      perks: [],
      pendingPerkChoices: [],
      team: assignedTeam,
      inStorm: false,
      inHealingBase: false,
      skinId: chosenSkin,
      bulletTrail: chosenTrail,
      roofDecal: chosenDecal,
      matchType: matchType || 'CASUAL',
      rankTier: rankTier || (isBot ? 'SILVER' : 'GOLD'),
      rankRp: rankRp || (isBot ? 600 : 850),
    };

    this.tanks.set(id, tank);

    this.tankInputs.set(id, {
      up: false,
      down: false,
      left: false,
      right: false,
      turretAngle: 0,
      isFiring: false,
    });

    if (!isBot) {
      this.addEvent({
        id: this.generateEventId(),
        type: 'join',
        text: `🟢 [ONLINE] ${tank.name} đã kết nối vào phòng qua Socket!`,
        timestamp: Date.now(),
        color: '#10b981',
      });
    }

    return tank;
  }

  public updateCosmetics(
    id: string,
    cosmetics: { skinId?: TankSkinId; bulletTrail?: BulletTrailId; roofDecal?: RoofDecalId }
  ) {
    const tank = this.tanks.get(id);
    if (!tank) return;
    if (cosmetics.skinId !== undefined) tank.skinId = cosmetics.skinId;
    if (cosmetics.bulletTrail !== undefined) tank.bulletTrail = cosmetics.bulletTrail;
    if (cosmetics.roofDecal !== undefined) tank.roofDecal = cosmetics.roofDecal;
  }

  public removePlayer(id: string) {
    const tank = this.tanks.get(id);
    if (tank) {
      if (!tank.isBot) {
        this.addEvent({
          id: this.generateEventId(),
          type: 'leave',
          text: `🔴 [ONLINE] ${tank.name} đã ngắt kết nối Socket.`,
          timestamp: Date.now(),
          color: '#94a3b8',
        });
      }
      this.tanks.delete(id);
      this.tankInputs.delete(id);
      this.botTargetIds.delete(id);
      this.botTargetExpiry.delete(id);
      this.botNextMoveTime.delete(id);
      this.botLastPositions.delete(id);
    }
  }

  public setInput(
    id: string,
    input: { up: boolean; down: boolean; left: boolean; right: boolean; turretAngle: number; isFiring: boolean }
  ) {
    this.tankInputs.set(id, input);
  }

  public useSkill(id: string, skill: SkillType): boolean {
    const tank = this.tanks.get(id);
    if (!tank || tank.isDead) return false;

    const now = Date.now();
    if (!tank.skills) {
      tank.skills = {
        boostUntil: 0,
        boostCooldownUntil: 0,
        shieldUntil: 0,
        shieldCooldownUntil: 0,
        mineCooldownUntil: 0,
        barrageUntil: 0,
        barrageCooldownUntil: 0,
      };
    }

    if (!tank.skillLevels) {
      tank.skillLevels = { BOOST: 1, SHIELD: 1, MINE: 1, BARRAGE: 1 };
    }

    const stats = TANK_CLASSES[tank.tankClass];

    const lvl = tank.level || 1;
    // Cooldown reduction from Level (-2.5% per level above 1) + Rapid Reload perk (-20%)
    const perkCdMult = tank.perks.includes('RAPID_RELOAD') ? 0.8 : 1.0;
    const levelCdMult = Math.max(0.75, 1 - (lvl - 1) * 0.025);
    const cdMult = perkCdMult * levelCdMult;

    if (skill === 'BOOST') {
      if (now < tank.skills.boostCooldownUntil) return false;
      const skillLvl = tank.skillLevels.BOOST || 1;
      const boostDuration = 3500 + (skillLvl - 1) * 600;
      const baseCd = Math.max(5000, 10000 - (skillLvl - 1) * 1000);
      tank.skills.boostUntil = now + boostDuration;
      tank.skills.boostCooldownUntil = now + Math.round(baseCd * cdMult);
      this.addEvent({
        id: this.generateEventId(),
        type: 'powerup',
        text: `⚡ [CHIÊU 1 - LV.${skillLvl}] ${tank.name} kích hoạt TĂNG TỐC NITRO (+${80 + skillLvl * 10}% Tốc độ ${(boostDuration / 1000).toFixed(1)}s)!`,
        timestamp: now,
        color: '#38bdf8',
      });
      return true;
    }

    if (skill === 'SHIELD') {
      if (now < tank.skills.shieldCooldownUntil) return false;
      const skillLvl = tank.skillLevels.SHIELD || 1;
      const shieldDuration = 3500 + (skillLvl - 1) * 750;
      const baseCd = Math.max(6000, 12000 - (skillLvl - 1) * 1250);
      tank.skills.shieldUntil = now + shieldDuration;
      tank.skills.shieldCooldownUntil = now + Math.round(baseCd * cdMult);
      if (skillLvl >= 3) {
        const heal = (skillLvl - 2) * 15;
        tank.hp = Math.min(stats.maxHp, tank.hp + heal);
      }
      this.addEvent({
        id: this.generateEventId(),
        type: 'powerup',
        text: `🛡️ [CHIÊU 2 - LV.${skillLvl}] ${tank.name} bật KHIÊN TỪ TRƯỜNG (Bảo vệ ${(shieldDuration / 1000).toFixed(1)}s)!`,
        timestamp: now,
        color: '#00f0ff',
      });
      return true;
    }

    if (skill === 'MINE') {
      if (now < tank.skills.mineCooldownUntil) return false;
      const skillLvl = tank.skillLevels.MINE || 1;
      const baseCd = Math.max(5000, 10000 - (skillLvl - 1) * 1000);
      tank.skills.mineCooldownUntil = now + Math.round(baseCd * cdMult);
      const mineDamage = 70 + (skillLvl - 1) * 25;
      this.landmines.push({
        id: `mine_${now}_${Math.random().toString(36).substring(2, 6)}`,
        ownerId: tank.id,
        ownerName: tank.name,
        x: tank.x,
        y: tank.y,
        createdAt: now,
        expiresAt: now + 30000,
      });
      this.addEvent({
        id: this.generateEventId(),
        type: 'powerup',
        text: `💣 [CHIÊU 3 - LV.${skillLvl}] ${tank.name} gài MÌN BẪY PLASMA (Nổ ${mineDamage} sát thương & Làm chậm)!`,
        timestamp: now,
        color: '#eab308',
      });
      return true;
    }

    if (skill === 'BARRAGE') {
      if (now < tank.skills.barrageCooldownUntil) return false;
      const skillLvl = tank.skillLevels.BARRAGE || 1;
      const barrageDuration = 4000 + (skillLvl - 1) * 600;
      const baseCd = Math.max(8000, 15000 - (skillLvl - 1) * 1500);
      tank.skills.barrageUntil = now + barrageDuration;
      tank.skills.barrageCooldownUntil = now + Math.round(baseCd * cdMult);
      this.addEvent({
        id: this.generateEventId(),
        type: 'powerup',
        text: `🔥 [CHIÊU CUỐI - LV.${skillLvl}] ${tank.name} kích hoạt PHÁO SIÊU TỐC (Xả đạn x2 trong ${(barrageDuration / 1000).toFixed(1)}s)!`,
        timestamp: now,
        color: '#f43f5e',
      });
      return true;
    }

    return false;
  }

  public respawnPlayer(id: string) {
    const tank = this.tanks.get(id);
    if (!tank || !tank.isDead) return;

    const stats = TANK_CLASSES[tank.tankClass];
    const spawn = this.findSafeSpawnPosition();
    tank.x = spawn.x;
    tank.y = spawn.y;
    const extraHp = tank.perks.includes('HEAVY_HULL') ? 30 : 0;
    tank.maxHp = stats.maxHp + extraHp;
    tank.hp = tank.maxHp;
    tank.shield = 0;
    tank.isDead = false;
    tank.respawnCountdown = 0;
    tank.invulnerableUntil = Date.now() + 3000;
    tank.activePowerUp = null;
    tank.nextAmmoType = this.getRandomAmmoType();
    tank.skills = {
      boostUntil: 0,
      boostCooldownUntil: 0,
      shieldUntil: 0,
      shieldCooldownUntil: 0,
      mineCooldownUntil: 0,
      barrageUntil: 0,
      barrageCooldownUntil: 0,
    };
  }

  public addTankExp(tank: PlayerTank, expGained: number) {
    if (tank.isDead) return;

    tank.exp += expGained;

    while (tank.exp >= tank.maxExp && tank.level < 10) {
      tank.exp -= tank.maxExp;
      tank.level += 1;
      tank.maxExp = Math.floor(tank.maxExp * 1.45);

      // Level up heal bonus +35% HP
      const healBonus = Math.floor(tank.maxHp * 0.35);
      tank.hp = Math.min(tank.maxHp, tank.hp + healBonus);

      // Level up grants +1 Skill Point to upgrade skills (Cộng chiêu thức)
      tank.skillPoints = (tank.skillPoints || 0) + 1;
      tank.pendingPerkChoices = [];

      if (!tank.skillLevels) {
        tank.skillLevels = { BOOST: 1, SHIELD: 1, MINE: 1, BARRAGE: 1 };
      }

      if (tank.isBot) {
        const skills: SkillType[] = ['BOOST', 'SHIELD', 'MINE', 'BARRAGE'];
        const upgradable = skills.filter((s) => (tank.skillLevels?.[s] || 1) < 5);
        if (upgradable.length > 0) {
          const picked = upgradable[Math.floor(Math.random() * upgradable.length)];
          tank.skillLevels[picked] = (tank.skillLevels[picked] || 1) + 1;
          tank.skillPoints = Math.max(0, (tank.skillPoints || 0) - 1);
        }
      }

      this.addEvent({
        id: this.generateEventId(),
        type: 'powerup',
        text: `⚡ [THĂNG CẤP LV.${tank.level}] ${tank.name} nhận +1 ĐIỂM CỘNG CHIÊU (Bấm dấu + quanh kỹ năng để nâng cấp)!`,
        timestamp: Date.now(),
        color: '#f59e0b',
      });
    }
  }

  public upgradeSkill(playerId: string, skill: SkillType): boolean {
    const tank = this.tanks.get(playerId);
    if (!tank || tank.isDead) return false;

    if (!tank.skillLevels) {
      tank.skillLevels = { BOOST: 1, SHIELD: 1, MINE: 1, BARRAGE: 1 };
    }
    const currentLvl = tank.skillLevels[skill] || 1;
    if (currentLvl >= 5) return false;
    if ((tank.skillPoints || 0) <= 0) return false;

    tank.skillPoints = Math.max(0, (tank.skillPoints || 0) - 1);
    tank.skillLevels[skill] = currentLvl + 1;

    const skillNames: Record<SkillType, string> = {
      BOOST: 'Tăng Tốc Nitro',
      SHIELD: 'Khiên Từ Trường',
      MINE: 'Mìn Bẫy Plasma',
      BARRAGE: 'Pháo Siêu Tốc',
    };

    this.addEvent({
      id: this.generateEventId(),
      type: 'powerup',
      text: `⭐ [CỘNG CHIÊU] ${tank.name} đã nâng cấp [${skillNames[skill]}] lên CẤP ${tank.skillLevels[skill]}!`,
      timestamp: Date.now(),
      color: '#fbbf24',
    });

    return true;
  }

  public selectPerk(playerId: string, perkId: PerkId): boolean {
    const tank = this.tanks.get(playerId);
    if (!tank || tank.isDead) return false;

    const perkCard = ALL_PERK_CARDS[perkId];
    if (!perkCard) return false;

    if (!tank.perks.includes(perkId)) {
      tank.perks.push(perkId);
      if (perkId === 'HEAVY_HULL') {
        tank.maxHp += 30;
        tank.hp += 30;
      }
      tank.pendingPerkChoices = [];

      this.addEvent({
        id: this.generateEventId(),
        type: 'powerup',
        text: `🌟 [MỞ KHÓA KỸ NĂNG] ${tank.name} đã mở khóa [${perkCard.vietnameseName}]!`,
        timestamp: Date.now(),
        color: perkCard.color,
      });
      return true;
    }
    return false;
  }

  public addChatMessage(senderId: string, text: string): ChatMessage | null {
    const tank = this.tanks.get(senderId);
    if (!tank) return null;

    const cleanText = text.trim().slice(0, 150);
    if (!cleanText) return null;

    const msg: ChatMessage = {
      id: `chat_${Date.now()}_${Math.random()}`,
      senderId,
      senderName: tank.name,
      text: cleanText,
      timestamp: Date.now(),
      color: tank.color,
    };

    this.chatHistory.push(msg);
    if (this.chatHistory.length > 50) {
      this.chatHistory.shift();
    }
    return msg;
  }

  public addEvent(event: CombatEvent) {
    this.events.push(event);
    if (this.events.length > 25) {
      this.events.shift();
    }
    this.pendingEvents.push(event);
  }

  public drainNewEvents(): CombatEvent[] {
    const list = this.pendingEvents;
    this.pendingEvents = [];
    return list;
  }

  public getTanks(): Map<string, PlayerTank> {
    return this.tanks;
  }

  public getBoss(): BossInfo | null {
    return this.boss;
  }

  public getMode(): GameMode {
    return this.mode;
  }

  public setBossEnabled(enabled: boolean, customMaxHp?: number) {
    this.customBossEnabled = enabled;
    if (enabled) {
      if (!this.boss || !this.boss.isAlive) {
        this.spawnBoss(customMaxHp);
      }
    } else {
      this.boss = null;
    }
  }

  public setMaxBots(count: number) {
    this.maxBots = clamp(count, 0, 14);
    this.syncBots();
  }

  public getMaxBots(): number {
    return this.maxBots;
  }

  private syncBots() {
    const botClasses: TankClass[] = ['STRIKER', 'SCOUT', 'JUGGERNAUT'];
    const botColors = ['#dc2626', '#ea580c', '#0284c7', '#7c3aed', '#10b981'];
    const botNames = ['Hắc Báo AI', 'Bão Lửa AI', 'Sấm Sét AI', 'Thiết Đầu AI', 'Bóng Ma AI', 'Chiến Mã AI', 'Kỵ Sĩ AI', 'Lôi Thần AI'];

    let currentBotCount = 0;
    for (const [, tank] of this.tanks) {
      if (tank.isBot) currentBotCount++;
    }

    // Add bots if below target
    while (currentBotCount < this.maxBots) {
      const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const cls = botClasses[currentBotCount % botClasses.length];
      const color = botColors[currentBotCount % botColors.length];
      const name = botNames[currentBotCount % botNames.length] || `Chiến Xe Bot #${currentBotCount + 1}`;
      this.addPlayer(botId, name, color, cls, true);
      currentBotCount++;
    }

    // Remove excess bots if configured
    if (currentBotCount > this.maxBots) {
      for (const [id, tank] of this.tanks) {
        if (tank.isBot && currentBotCount > this.maxBots) {
          this.tanks.delete(id);
          this.tankInputs.delete(id);
          this.botTargetIds.delete(id);
          this.botTargetExpiry.delete(id);
          this.botNextMoveTime.delete(id);
          currentBotCount--;
        }
      }
    }
  }

  public update(deltaTime: number) {
    const now = Date.now();

    // 0. Update dynamic weather cycle timer (1-minute cycle)
    this.weatherCycleTimer -= deltaTime;
    if (this.weatherCycleTimer <= 0) {
      this.weatherCycleTimer = 60;
      const currentIdx = WEATHER_CYCLE.indexOf(this.currentWeather);
      const nextIdx = (currentIdx + 1) % WEATHER_CYCLE.length;
      this.currentWeather = WEATHER_CYCLE[nextIdx];
    }

    // 1. Update power-up spawns
    if (now > this.nextPowerUpSpawn && this.powerUps.length < 14) {
      const types: PowerUpType[] = ['TRIPLE_SHOT', 'SPEED_BOOST', 'SHIELD', 'REPAIR', 'RAPID_FIRE'];
      const randType = types[Math.floor(Math.random() * types.length)];
      const pos = this.findSafeSpawnPosition();
      this.powerUps.push({
        id: `crate_${now}_${Math.random().toString(36).substring(2, 6)}`,
        type: randType,
        x: pos.x,
        y: pos.y,
        createdAt: now,
        duration: 14000,
      });
      this.nextPowerUpSpawn = now + 8000;
    }

    // 2. Mode mechanics
    this.updateStorm(deltaTime, now);
    this.updateTdm(deltaTime, now);
    this.updateBoss(deltaTime, now);

    // 3. Bot AI updates
    this.updateBots(now);

    // 3.5. Passive In-Combat EXP Gain (+3 EXP every 1.5s for all active tanks)
    this.passiveExpTimer = (this.passiveExpTimer || 0) + deltaTime;
    if (this.passiveExpTimer >= 1.5) {
      this.passiveExpTimer = 0;
      for (const tank of this.tanks.values()) {
        if (!tank.isDead) {
          this.addTankExp(tank, 3);
        }
      }
    }

    // 4. Process Tank Movements & Fire
    for (const [id, tank] of this.tanks) {
      if (tank.isDead) {
        if (tank.respawnCountdown > 0) {
          tank.respawnCountdown -= deltaTime;
          if (tank.respawnCountdown <= 0) {
            this.respawnPlayer(id);
          }
        }
        continue;
      }

      // Check power-up expiration
      if (tank.activePowerUp && now > tank.activePowerUp.expiresAt) {
        tank.activePowerUp = null;
      }

      const input = this.tankInputs.get(id);
      if (!input) continue;

      const baseStats = TANK_CLASSES[tank.tankClass];
      let speedMult = 1.0;
      if (tank.activePowerUp) {
        if (tank.activePowerUp.type === 'SPEED_BOOST') {
          speedMult = 1.85; // +85% Nitro Speed Turbo
        } else {
          speedMult = 1.35; // All component item crates grant +35% Speed!
        }
      }

      // [Shift] Nitro Boost Skill
      if (tank.skills && now < tank.skills.boostUntil) {
        speedMult *= 1.85; // +85% Boost Turbo
      }

      if (tank.slowUntil && now < tank.slowUntil) {
        speedMult *= 0.52;
      }
      if (tank.burnUntil && now < tank.burnUntil) {
        tank.hp = Math.max(1, tank.hp - 0.2);
      }

      const currentSpeed = baseStats.speed * speedMult;
      tank.speed = currentSpeed;

      // 8-Directional Movement with Dynamic Weather Mobility Physics
      let moveX = 0;
      let moveY = 0;

      if (input.left) moveX -= 1;
      if (input.right) moveX += 1;
      if (input.up) moveY -= 1;
      if (input.down) moveY += 1;

      const isInputMoving = moveX !== 0 || moveY !== 0;
      let targetVx = 0;
      let targetVy = 0;

      if (isInputMoving) {
        const moveAngle = Math.atan2(moveY, moveX);
        targetVx = Math.cos(moveAngle) * currentSpeed;
        targetVy = Math.sin(moveAngle) * currentSpeed;

        // Steering rotation factor: slightly looser on slippery snow or thick desert sand
        const rotFactor = this.currentWeather === 'SNOW' ? 0.22 : (this.currentWeather === 'DESERT' ? 0.28 : 0.35);
        const angleDiff = Math.atan2(Math.sin(moveAngle - tank.angle), Math.cos(moveAngle - tank.angle));
        tank.angle += angleDiff * rotFactor;
      }

      // Dynamic Weather Mobility Physics (Snow Ice Drift, Desert Wind & Drag, Rain Wet Track)
      let curVx = tank.vx || 0;
      let curVy = tank.vy || 0;
      let isDrifting = false;

      if (this.currentWeather === 'SNOW') {
        // Snow (Bão tuyết): Slippery ice drift physics!
        if (isInputMoving) {
          // Slight traction slippage: blends previous momentum with target input
          curVx = curVx * 0.84 + targetVx * 0.16;
          curVy = curVy * 0.84 + targetVy * 0.16;
          const vAngle = Math.atan2(curVy, curVx);
          const slipAngle = Math.abs(Math.atan2(Math.sin(vAngle - tank.angle), Math.cos(vAngle - tank.angle)));
          if (slipAngle > 0.38 && Math.hypot(curVx, curVy) > 1.2) {
            isDrifting = true;
          }
        } else {
          // Released directional keys: slide on ice with gradual smooth deceleration
          curVx *= 0.89;
          curVy *= 0.89;
          if (Math.hypot(curVx, curVy) < 0.15) {
            curVx = 0;
            curVy = 0;
          } else {
            isDrifting = true;
          }
        }
      } else if (this.currentWeather === 'DESERT') {
        // Desert (Bão cát): Periodic sandstorm wind gusts & sand resistance
        const windCycle = Math.sin(now / 3200);
        const gustStrength = Math.max(0, windCycle * 0.7 + 0.25);
        const windPushX = 0.5 * gustStrength;
        const windPushY = 0.2 * gustStrength;

        if (isInputMoving) {
          curVx = targetVx * 0.95 + windPushX;
          curVy = targetVy * 0.95 + windPushY;
        } else {
          curVx *= 0.35;
          curVy *= 0.35;
          if (Math.hypot(curVx, curVy) < 0.1) {
            curVx = 0;
            curVy = 0;
          }
        }
      } else if (this.currentWeather === 'RAIN') {
        // Rain: Wet roads, slight hydroplaning
        if (isInputMoving) {
          curVx = curVx * 0.35 + targetVx * 0.65;
          curVy = curVy * 0.35 + targetVy * 0.65;
        } else {
          curVx *= 0.4;
          curVy *= 0.4;
          if (Math.hypot(curVx, curVy) < 0.1) {
            curVx = 0;
            curVy = 0;
          }
        }
      } else {
        // Standard DAWN / SUNSET: Direct crisp control
        curVx = targetVx;
        curVy = targetVy;
      }

      tank.vx = curVx;
      tank.vy = curVy;
      tank.isDrifting = isDrifting;

      if (curVx !== 0 || curVy !== 0) {
        const nextX = tank.x + curVx;
        const nextY = tank.y + curVy;

        // Check X movement with sliding
        let canMoveX = true;
        for (const obs of this.obstacles) {
          if (obs.type === 'BUSH') continue; // tanks can move through bushes
          if (circleRectCollision(nextX, tank.y, TANK_RADIUS, obs.x, obs.y, obs.w, obs.h)) {
            canMoveX = false;
            break;
          }
        }
        if (canMoveX) {
          for (const [otherId, otherTank] of this.tanks) {
            if (otherId === id || otherTank.isDead) continue;
            if (distance(nextX, tank.y, otherTank.x, otherTank.y) < TANK_RADIUS * 2) {
              canMoveX = false;
              break;
            }
          }
        }
        // Physical collision with Boss Leviathan on X-axis (prevent driving through boss)
        if (canMoveX && this.boss && this.boss.isAlive) {
          if (distance(nextX, tank.y, this.boss.x, this.boss.y) < TANK_RADIUS + BOSS_RADIUS) {
            canMoveX = false;
          }
        }

        // Check Y movement with sliding
        let canMoveY = true;
        for (const obs of this.obstacles) {
          if (obs.type === 'BUSH') continue;
          if (circleRectCollision(tank.x, nextY, TANK_RADIUS, obs.x, obs.y, obs.w, obs.h)) {
            canMoveY = false;
            break;
          }
        }
        if (canMoveY) {
          for (const [otherId, otherTank] of this.tanks) {
            if (otherId === id || otherTank.isDead) continue;
            if (distance(tank.x, nextY, otherTank.x, otherTank.y) < TANK_RADIUS * 2) {
              canMoveY = false;
              break;
            }
          }
        }
        // Physical collision with Boss Leviathan on Y-axis (prevent driving through boss)
        if (canMoveY && this.boss && this.boss.isAlive) {
          if (distance(tank.x, nextY, this.boss.x, this.boss.y) < TANK_RADIUS + BOSS_RADIUS) {
            canMoveY = false;
          }
        }

        // Compound diagonal collision check with Boss Leviathan (prevent corner clipping)
        if (canMoveX && canMoveY && this.boss && this.boss.isAlive) {
          if (distance(nextX, nextY, this.boss.x, this.boss.y) < TANK_RADIUS + BOSS_RADIUS) {
            const distIfXOnly = distance(nextX, tank.y, this.boss.x, this.boss.y);
            const distIfYOnly = distance(tank.x, nextY, this.boss.x, this.boss.y);
            if (distIfXOnly >= distIfYOnly) {
              canMoveY = false;
            } else {
              canMoveX = false;
            }
          }
        }

        if (canMoveX) {
          tank.x = clamp(nextX, TANK_RADIUS + 44, WORLD_WIDTH - TANK_RADIUS - 44);
        } else {
          tank.vx = 0;
        }
        if (canMoveY) {
          tank.y = clamp(nextY, TANK_RADIUS + 44, WORLD_HEIGHT - TANK_RADIUS - 44);
        } else {
          tank.vy = 0;
        }

        // Failsafe: If tank is already inside Boss Leviathan boundary, gently push it outside
        if (this.boss && this.boss.isAlive) {
          const dToBoss = distance(tank.x, tank.y, this.boss.x, this.boss.y);
          const minSafeDist = TANK_RADIUS + BOSS_RADIUS;
          if (dToBoss < minSafeDist && dToBoss > 0) {
            const pushAngle = Math.atan2(tank.y - this.boss.y, tank.x - this.boss.x);
            const pushDist = minSafeDist - dToBoss;
            tank.x = clamp(tank.x + Math.cos(pushAngle) * pushDist, TANK_RADIUS + 44, WORLD_WIDTH - TANK_RADIUS - 44);
            tank.y = clamp(tank.y + Math.sin(pushAngle) * pushDist, TANK_RADIUS + 44, WORLD_HEIGHT - TANK_RADIUS - 44);
          }
        }
      } else {
        tank.vx = 0;
        tank.vy = 0;
        tank.isDrifting = false;
      }

      // Turret rotation
      tank.turretAngle = input.turretAngle;

      // Handle Firing
      let cooldown = baseStats.fireCooldown;
      if (tank.activePowerUp?.type === 'RAPID_FIRE') {
        cooldown *= 0.55;
      }
      // [R] Barrage Skill: Double fire rate
      if (tank.skills && now < tank.skills.barrageUntil) {
        cooldown *= 0.5;
      }

      if (input.isFiring && now - tank.lastFired >= cooldown) {
        tank.lastFired = now;
        this.fireBullet(tank);
      }

      // Check power-up crate pickup
      for (let i = this.powerUps.length - 1; i >= 0; i--) {
        const crate = this.powerUps[i];
        if (distance(tank.x, tank.y, crate.x, crate.y) < TANK_RADIUS + 20) {
          this.applyPowerUp(tank, crate.type);
          this.powerUps.splice(i, 1);
          break;
        }
      }
    }

    // 4. Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.rangeLeft -= Math.hypot(b.vx, b.vy);

      // Range expired
      if (b.rangeLeft <= 0) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Collision with obstacles
      let bulletDestroyed = false;
      for (const obs of this.obstacles) {
        if (obs.type === 'BUSH' || obs.type === 'WATER') continue; // bullets pass over water & bushes

        if (circleRectCollision(b.x, b.y, BULLET_RADIUS, obs.x, obs.y, obs.w, obs.h)) {
          // Ricochet Bouncing Bullet
          if (b.modifier === 'RICOCHET' && (b.bouncesLeft || 0) > 0) {
            b.bouncesLeft = (b.bouncesLeft || 1) - 1;
            const prevX = b.x - b.vx;
            if (prevX <= obs.x || prevX >= obs.x + obs.w) {
              b.vx = -b.vx;
            } else {
              b.vy = -b.vy;
            }
            b.x += b.vx * 1.5;
            b.y += b.vy * 1.5;
            continue;
          }

          // Damage brick walls
          if (obs.type === 'BRICK' && obs.hp !== undefined) {
            obs.hp -= b.damage;
            if (obs.hp <= 0) {
              const idx = this.obstacles.indexOf(obs);
              if (idx !== -1) {
                this.obstacles.splice(idx, 1);
                if (b.shooterId) {
                  const shooter = this.tanks.get(b.shooterId);
                  if (shooter && !shooter.isDead) {
                    shooter.score += 15;
                    this.addTankExp(shooter, 20);
                  }
                }
              }
            }
          }

          // Piercing shell continues through brick with reduced range
          if (b.modifier === 'PIERCING') {
            b.rangeLeft -= 180;
            if (b.rangeLeft > 0) continue;
          }

          // Explosive shell AoE blast on walls
          if (b.modifier === 'EXPLOSIVE') {
            for (const otherObs of this.obstacles) {
              if (otherObs.type === 'BRICK' && otherObs.hp !== undefined && distance(b.x, b.y, otherObs.x + otherObs.w / 2, otherObs.y + otherObs.h / 2) < 80) {
                otherObs.hp -= 25;
                if (otherObs.hp <= 0) {
                  const idx = this.obstacles.indexOf(otherObs);
                  if (idx !== -1) {
                    this.obstacles.splice(idx, 1);
                    if (b.shooterId) {
                      const shooter = this.tanks.get(b.shooterId);
                      if (shooter && !shooter.isDead) {
                        shooter.score += 15;
                        this.addTankExp(shooter, 20);
                      }
                    }
                  }
                }
              }
            }
          }

          bulletDestroyed = true;
          break;
        }
      }

      if (bulletDestroyed) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Collision with enemy tanks
      for (const [targetId, targetTank] of this.tanks) {
        if (targetId === b.shooterId || targetTank.isDead) continue;

        // Check invulnerability
        if (now < targetTank.invulnerableUntil) continue;

        // Check Force Shield Skill (100% absorption)
        if (targetTank.skills && now < targetTank.skills.shieldUntil) {
          if (distance(b.x, b.y, targetTank.x, targetTank.y) < TANK_RADIUS + BULLET_RADIUS + 8) {
            this.bullets.splice(i, 1);
            break;
          }
        }

        if (distance(b.x, b.y, targetTank.x, targetTank.y) < TANK_RADIUS + BULLET_RADIUS) {
          this.damageTank(targetTank, b);

          // Piercing shell continues through enemy tank
          if (b.modifier === 'PIERCING') {
            b.rangeLeft -= 260;
            if (b.rangeLeft > 0) continue;
          }

          this.bullets.splice(i, 1);
          break;
        }
      }

      // Collision with World Boss Leviathan
      if (this.boss && this.boss.isAlive) {
        if (distance(b.x, b.y, this.boss.x, this.boss.y) < BOSS_RADIUS + BULLET_RADIUS) {
          this.damageBoss(b);
          this.bullets.splice(i, 1);
          continue;
        }
      }
    }

    // 5. Update Landmines
    for (let mi = this.landmines.length - 1; mi >= 0; mi--) {
      const mine = this.landmines[mi];
      if (now > mine.expiresAt) {
        this.landmines.splice(mi, 1);
        continue;
      }

      // Arm after 400ms
      if (now - mine.createdAt < 400) continue;

      // Boss Leviathan triggers landmine if stepping over it
      if (this.boss && this.boss.isAlive && distance(mine.x, mine.y, this.boss.x, this.boss.y) < BOSS_RADIUS + 12) {
        const dmg = 85;
        if (this.boss.shield > 0) {
          if (this.boss.shield >= dmg) {
            this.boss.shield -= dmg;
          } else {
            const rem = dmg - this.boss.shield;
            this.boss.shield = 0;
            this.boss.hp = Math.max(0, this.boss.hp - rem);
          }
        } else {
          this.boss.hp = Math.max(0, this.boss.hp - dmg);
        }
        const owner = this.tanks.get(mine.ownerId);
        if (owner) {
          owner.score += 25;
          this.addTankExp(owner, 35);
        }
        this.addEvent({
          id: this.generateEventId(),
          type: 'powerup',
          text: `💥 [MÌN PLASMA] Boss Leviathan đạp trúng Mìn Plasma của ${owner ? owner.name : 'Chiến Binh'} (-85 HP)!`,
          timestamp: now,
          color: '#f97316',
        });
        this.landmines.splice(mi, 1);
        continue;
      }

      for (const [tid, target] of this.tanks) {
        if (target.isDead || tid === mine.ownerId) continue;
        if (distance(mine.x, mine.y, target.x, target.y) < TANK_RADIUS + 14) {
          if (!target.skills || now >= target.skills.shieldUntil) {
            target.hp = Math.max(0, target.hp - 70);
            target.slowUntil = now + 2500;
            if (target.hp <= 0) {
              target.hp = 0;
              target.isDead = true;
              target.respawnCountdown = 3.5;
              target.deaths += 1;
              target.streak = 0;
              const owner = this.tanks.get(mine.ownerId);
              if (owner) {
                owner.kills += 1;
                owner.score += 150;
                this.addEvent({
                  id: this.generateEventId(),
                  type: 'kill',
                  text: `💥 [MÌN PLASMA] ${target.name} đã đạp trúng mìn của ${owner.name}!`,
                  timestamp: now,
                  killerId: owner.id,
                  victimId: target.id,
                  killerName: owner.name,
                  victimName: target.name,
                  color: '#ef4444',
                });
              }
            } else {
              this.addEvent({
                id: this.generateEventId(),
                type: 'powerup',
                text: `💥 ${target.name} đạp trúng Mìn Plasma (-70 HP & Làm chậm 2.5s)!`,
                timestamp: now,
                color: '#f97316',
              });
            }
          }
          this.landmines.splice(mi, 1);
          break;
        }
      }
    }
  }

  private getRandomAmmoType(): BulletModifier {
    const list: BulletModifier[] = [
      'EXPLOSIVE',
      'TRIPLE',
      'PLASMA',
      'CRYO',
      'INCENDIARY',
      'RICOCHET',
      'PIERCING',
      'STANDARD',
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  private fireBullet(tank: PlayerTank) {
    const stats = TANK_CLASSES[tank.tankClass];
    const baseRange = stats.firingRange || 750;
    const muzzleDist = TANK_RADIUS + 16;
    const spawnX = tank.x + Math.cos(tank.turretAngle) * muzzleDist;
    const spawnY = tank.y + Math.sin(tank.turretAngle) * muzzleDist;
    const trail = tank.bulletTrail || 'STANDARD';

    // Use currently loaded random ammo, then prepare the next random ammo
    const modifier = tank.nextAmmoType || this.getRandomAmmoType();
    tank.nextAmmoType = this.getRandomAmmoType();

    if (modifier === 'TRIPLE' || tank.activePowerUp?.type === 'TRIPLE_SHOT') {
      const spreads = [-0.2, 0, 0.2];
      for (const spread of spreads) {
        const angle = tank.turretAngle + spread;
        this.bullets.push({
          id: `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          shooterId: tank.id,
          shooterName: tank.name,
          x: spawnX,
          y: spawnY,
          vx: Math.cos(angle) * stats.bulletSpeed,
          vy: Math.sin(angle) * stats.bulletSpeed,
          damage: Math.round(stats.bulletDamage * 0.85),
          rangeLeft: Math.round(baseRange * 0.95),
          color: '#fbbf24',
          isHeavy: tank.tankClass === 'JUGGERNAUT',
          modifier: 'TRIPLE',
          trailEffect: trail,
          originX: spawnX,
          originY: spawnY,
        });
      }
      return;
    }

    if (modifier === 'EXPLOSIVE') {
      this.bullets.push({
        id: `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        shooterId: tank.id,
        shooterName: tank.name,
        x: spawnX,
        y: spawnY,
        vx: Math.cos(tank.turretAngle) * (stats.bulletSpeed * 0.9),
        vy: Math.sin(tank.turretAngle) * (stats.bulletSpeed * 0.9),
        damage: Math.round(stats.bulletDamage * 1.45),
        rangeLeft: Math.round(baseRange * 1.05),
        color: '#ef4444',
        isHeavy: true,
        modifier: 'EXPLOSIVE',
        trailEffect: trail,
        originX: spawnX,
        originY: spawnY,
      });
      return;
    }

    if (modifier === 'PLASMA') {
      this.bullets.push({
        id: `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        shooterId: tank.id,
        shooterName: tank.name,
        x: spawnX,
        y: spawnY,
        vx: Math.cos(tank.turretAngle) * (stats.bulletSpeed * 1.8),
        vy: Math.sin(tank.turretAngle) * (stats.bulletSpeed * 1.8),
        damage: Math.round(stats.bulletDamage * 1.15),
        rangeLeft: Math.round(baseRange * 1.35),
        color: '#00f0ff',
        isHeavy: false,
        modifier: 'PLASMA',
        trailEffect: trail,
        originX: spawnX,
        originY: spawnY,
      });
      return;
    }

    if (modifier === 'CRYO') {
      this.bullets.push({
        id: `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        shooterId: tank.id,
        shooterName: tank.name,
        x: spawnX,
        y: spawnY,
        vx: Math.cos(tank.turretAngle) * stats.bulletSpeed,
        vy: Math.sin(tank.turretAngle) * stats.bulletSpeed,
        damage: stats.bulletDamage,
        rangeLeft: baseRange,
        color: '#38bdf8',
        isHeavy: false,
        modifier: 'CRYO',
        trailEffect: trail,
        originX: spawnX,
        originY: spawnY,
      });
      return;
    }

    if (modifier === 'INCENDIARY') {
      this.bullets.push({
        id: `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        shooterId: tank.id,
        shooterName: tank.name,
        x: spawnX,
        y: spawnY,
        vx: Math.cos(tank.turretAngle) * stats.bulletSpeed,
        vy: Math.sin(tank.turretAngle) * stats.bulletSpeed,
        damage: Math.round(stats.bulletDamage * 1.1),
        rangeLeft: baseRange,
        color: '#f97316',
        isHeavy: false,
        modifier: 'INCENDIARY',
        trailEffect: trail,
        originX: spawnX,
        originY: spawnY,
      });
      return;
    }

    if (modifier === 'RICOCHET') {
      this.bullets.push({
        id: `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        shooterId: tank.id,
        shooterName: tank.name,
        x: spawnX,
        y: spawnY,
        vx: Math.cos(tank.turretAngle) * (stats.bulletSpeed * 1.1),
        vy: Math.sin(tank.turretAngle) * (stats.bulletSpeed * 1.1),
        damage: stats.bulletDamage,
        rangeLeft: Math.round(baseRange * 1.15),
        color: '#c084fc',
        isHeavy: false,
        modifier: 'RICOCHET',
        bouncesLeft: 2,
        trailEffect: trail,
        originX: spawnX,
        originY: spawnY,
      });
      return;
    }

    if (modifier === 'PIERCING') {
      this.bullets.push({
        id: `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        shooterId: tank.id,
        shooterName: tank.name,
        x: spawnX,
        y: spawnY,
        vx: Math.cos(tank.turretAngle) * (stats.bulletSpeed * 1.25),
        vy: Math.sin(tank.turretAngle) * (stats.bulletSpeed * 1.25),
        damage: Math.round(stats.bulletDamage * 1.2),
        rangeLeft: Math.round(baseRange * 1.2),
        color: '#10b981',
        isHeavy: true,
        modifier: 'PIERCING',
        trailEffect: trail,
        originX: spawnX,
        originY: spawnY,
      });
      return;
    }

    // Standard
    this.bullets.push({
      id: `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      shooterId: tank.id,
      shooterName: tank.name,
      x: spawnX,
      y: spawnY,
      vx: Math.cos(tank.turretAngle) * stats.bulletSpeed,
      vy: Math.sin(tank.turretAngle) * stats.bulletSpeed,
      damage: stats.bulletDamage,
      rangeLeft: baseRange,
      color: tank.color,
      isHeavy: tank.tankClass === 'JUGGERNAUT',
      modifier: 'STANDARD',
      trailEffect: trail,
      originX: spawnX,
      originY: spawnY,
    });
  }

  private applyPowerUp(tank: PlayerTank, type: PowerUpType) {
    const stats = TANK_CLASSES[tank.tankClass];
    const typeNames: Record<PowerUpType, string> = {
      TRIPLE_SHOT: 'Đạn Ba Tia & +35% Tốc độ linh kiện',
      SPEED_BOOST: 'NITRO SIÊU TỐC (+85% Tốc độ cực bốc)',
      SHIELD: 'Lá Chắn & +35% Tốc độ linh kiện',
      REPAIR: 'Hộp Sửa Chữa & +35% Tốc độ linh kiện',
      RAPID_FIRE: 'Nạp Đạn Thần Tốc & +35% Tốc độ linh kiện',
    };

    if (type === 'REPAIR') {
      tank.hp = Math.min(stats.maxHp, tank.hp + 50);
      tank.activePowerUp = {
        type: 'REPAIR',
        expiresAt: Date.now() + 15000,
      };
    } else if (type === 'SHIELD') {
      tank.shield = 100;
      tank.activePowerUp = {
        type: 'SHIELD',
        expiresAt: Date.now() + 15000,
      };
    } else {
      tank.activePowerUp = {
        type,
        expiresAt: Date.now() + 15000,
      };
    }

    // Award supply crate pickup EXP (+50 EXP for all crate pickups)
    this.addTankExp(tank, 50);

    this.addEvent({
      id: this.generateEventId(),
      type: 'powerup',
      text: `🚀 ${tank.name} nhặt linh kiện: ${typeNames[type]} (+50 EXP)!`,
      timestamp: Date.now(),
      color: type === 'REPAIR' ? '#10b981' : type === 'SHIELD' ? '#38bdf8' : '#f59e0b',
    });
  }

  private damageTank(target: PlayerTank, bullet: Bullet) {
    // Friendly fire check in TDM
    if (this.mode === 'TEAM_DEATHMATCH' && bullet.shooterId) {
      const shooter = this.tanks.get(bullet.shooterId);
      if (shooter && shooter.team && target.team && shooter.team === target.team && shooter.team !== 'NONE') {
        return;
      }
    }

    let damageRemaining = bullet.damage;

    // Shield absorption first
    if (target.shield > 0) {
      if (target.shield >= damageRemaining) {
        target.shield -= damageRemaining;
        damageRemaining = 0;
      } else {
        damageRemaining -= target.shield;
        target.shield = 0;
      }
    }

    target.hp -= damageRemaining;

    // Award hit combat EXP to shooter
    if (bullet.shooterId && bullet.shooterId !== target.id) {
      const shooter = this.tanks.get(bullet.shooterId);
      if (shooter && !shooter.isDead) {
        this.addTankExp(shooter, Math.max(8, Math.round(bullet.damage * 0.6)));
      }
    }

    // Retaliation: If a bot is damaged, it retaliates against whoever attacked it
    if (target.isBot && bullet.shooterId && bullet.shooterId !== target.id) {
      if (Math.random() < 0.85) {
        this.botTargetIds.set(target.id, bullet.shooterId);
        this.botTargetExpiry.set(target.id, Date.now() + 5000);
      }
    }

    // Apply special bullet debuffs
    if (bullet.modifier === 'CRYO') {
      target.slowUntil = Date.now() + 2500;
    }
    if (bullet.modifier === 'INCENDIARY') {
      target.burnUntil = Date.now() + 3000;
    }
    if (bullet.modifier === 'EXPLOSIVE') {
      // AoE Splash damage to all other nearby tanks in 80px radius
      for (const [otherId, otherTank] of this.tanks) {
        if (otherId === target.id || otherTank.isDead) continue;
        if (this.mode === 'TEAM_DEATHMATCH' && target.team && otherTank.team && target.team === otherTank.team) continue;
        if (distance(target.x, target.y, otherTank.x, otherTank.y) < 80) {
          otherTank.hp = Math.max(0, otherTank.hp - 20);
          if (otherTank.hp <= 0) {
            otherTank.isDead = true;
            otherTank.respawnCountdown = this.mode === 'BATTLE_ROYALE' ? 0 : 3.5;
            otherTank.deaths += 1;
          }
        }
      }
    }

    if (target.hp <= 0) {
      target.hp = 0;
      target.isDead = true;
      target.respawnCountdown = this.mode === 'BATTLE_ROYALE' ? 0 : 3.5;
      target.deaths += 1;
      target.streak = 0;

      // Shooter rewards
      const shooter = this.tanks.get(bullet.shooterId);
      if (shooter) {
        shooter.kills += 1;
        shooter.streak += 1;
        const streakBonus = Math.min(shooter.streak * 20, 100);
        shooter.score += 100 + streakBonus;

        // Award major enemy elimination EXP (+120 EXP + Level bonus)
        this.addTankExp(shooter, 120 + (target.level || 1) * 25);

        // TDM Score Update
        if (this.mode === 'TEAM_DEATHMATCH') {
          if (shooter.team === 'RED') {
            this.teamScore.red += 1;
          } else if (shooter.team === 'BLUE') {
            this.teamScore.blue += 1;
          }

          if (this.teamScore.red >= this.teamScore.targetKills && !this.teamScore.winner) {
            this.teamScore.winner = 'RED';
            this.tdmRoundResetTimer = Date.now() + 10000;
            this.addEvent({
              id: this.generateEventId(),
              type: 'kill',
              text: `🏆 ĐỘI ĐỎ ĐÃ ĐẠT 30 KILLS VÀ CHIẾN THẮNG TRẬN ĐẤU ĐỘI!`,
              timestamp: Date.now(),
              color: '#ef4444',
            });
            this.rewardTdmRankedWinners('RED');
          } else if (this.teamScore.blue >= this.teamScore.targetKills && !this.teamScore.winner) {
            this.teamScore.winner = 'BLUE';
            this.tdmRoundResetTimer = Date.now() + 10000;
            this.addEvent({
              id: this.generateEventId(),
              type: 'kill',
              text: `🏆 ĐỘI XANH ĐÃ ĐẠT 30 KILLS VÀ CHIẾN THẮNG TRẬN ĐẤU ĐỘI!`,
              timestamp: Date.now(),
              color: '#3b82f6',
            });
            this.rewardTdmRankedWinners('BLUE');
          }
        }

        // Check Combat Medals & Accolades
        let awardedMedal: CombatMedalType | undefined = undefined;
        const now = Date.now();

        // 1. Sniper Kill: bullet origin distance >= 750
        const bulletDist = distance(bullet.originX ?? shooter.x, bullet.originY ?? shooter.y, target.x, target.y);
        const isSniper = bulletDist >= 750;

        // 2. Revenge: shooter was killed by target previously
        const isRevenge = shooter.lastKilledById === target.id;

        // 3. First Blood
        const isFirstBlood = !this.firstBloodOccurred;
        if (isFirstBlood) {
          this.firstBloodOccurred = true;
        }

        // 4. Multi-Kill streak window (within 5.5s)
        const sAny = shooter as { _lastKillTime?: number; _multiKillCount?: number };
        const lastKillTime = sAny._lastKillTime || 0;
        let multiCount = 1;
        if (now - lastKillTime <= 5500) {
          multiCount = (sAny._multiKillCount || 1) + 1;
        }
        sAny._lastKillTime = now;
        sAny._multiKillCount = multiCount;

        // Select highest honor medal
        if (shooter.streak >= 10) {
          awardedMedal = 'GODLIKE';
        } else if (shooter.streak === 8) {
          awardedMedal = 'UNSTOPPABLE';
        } else if (shooter.streak === 5) {
          awardedMedal = 'RAMPAGE';
        } else if (multiCount >= 3) {
          awardedMedal = 'TRIPLE_KILL';
        } else if (multiCount === 2) {
          awardedMedal = 'DOUBLE_KILL';
        } else if (isRevenge) {
          awardedMedal = 'REVENGE';
        } else if (isSniper) {
          awardedMedal = 'SNIPER';
        } else if (isFirstBlood) {
          awardedMedal = 'FIRST_BLOOD';
        }

        // Record target's killer for revenge in subsequent lives
        target.lastKilledById = shooter.id;
        if (isRevenge) {
          shooter.lastKilledById = undefined;
        }

        let killText = `🎯 ${shooter.name} đã tiêu diệt đối thủ ${target.name}!`;
        if (awardedMedal === 'FIRST_BLOOD') {
          killText = `🩸 [FIRST BLOOD] ${shooter.name} giành CHIẾN CÔNG ĐẦU khi hạ gục ${target.name}!`;
        } else if (awardedMedal === 'DOUBLE_KILL') {
          killText = `⚔️ [DOUBLE KILL] ${shooter.name} HẠ GỤC KÉP liên tiếp (${target.name})!`;
        } else if (awardedMedal === 'TRIPLE_KILL') {
          killText = `🔥 [TRIPLE KILL] ${shooter.name} HẠ GỤC LIÊN HOÀN 3 XE (${target.name})!`;
        } else if (awardedMedal === 'RAMPAGE') {
          killText = `⚡ [RAMPAGE] ${shooter.name} ĐANG CUỒNG NỘ CHIẾN TRẬN (Chuỗi 5 mạng)!`;
        } else if (awardedMedal === 'UNSTOPPABLE') {
          killText = `🌪️ [UNSTOPPABLE] ${shooter.name} BẤT KHẢ CHIẾN BẠI (Chuỗi 8 mạng)!`;
        } else if (awardedMedal === 'GODLIKE') {
          killText = `👑 [GODLIKE] ${shooter.name} THẦN THÁNH VÔ SONG (Chuỗi 10 mạng)!`;
        } else if (awardedMedal === 'SNIPER') {
          killText = `🎯 [SNIPER] ${shooter.name} BẮN TỈA TẦM XA (${Math.round(bulletDist)}m) hạ gục ${target.name}!`;
        } else if (awardedMedal === 'REVENGE') {
          killText = `💀 [REVENGE] ${shooter.name} ĐÃ PHỤC THÙ RỬA HẬN trước ${target.name}!`;
        } else if (shooter.streak >= 3) {
          killText = `🔥 ${shooter.name} đang NỔI GIẬN (${shooter.streak} KILLS) khi hạ gục ${target.name}!`;
        }

        this.addEvent({
          id: this.generateEventId(),
          type: 'kill',
          text: killText,
          timestamp: Date.now(),
          killerId: shooter.id,
          victimId: target.id,
          killerName: shooter.name,
          victimName: target.name,
          color: '#ef4444',
          streak: shooter.streak,
          medal: awardedMedal,
        });

        // ==========================================
        // RANKED MATCHMAKING: RP GAIN / LOSS LOGIC
        // ==========================================
        if (shooter.matchType === 'RANKED') {
          const rpGain = awardedMedal ? 35 : 25;
          const oldRank = getRankFromRp(shooter.rankRp || 850);
          shooter.rankRp = Math.min(9999, (shooter.rankRp || 850) + rpGain);
          const newRank = getRankFromRp(shooter.rankRp);
          shooter.rankTier = newRank.tier;

          let rankText = `🏆 [ĐẤU RANK] ${shooter.name} +${rpGain} RP (${shooter.rankRp} RP - ${newRank.name})`;
          if (newRank.tier !== oldRank.tier) {
            rankText = `🎉 [THĂNG HẠNG ĐẤU RANK] ${shooter.name} đã thăng lên ${newRank.vietnameseName} (${shooter.rankRp} RP)!`;
          }

          this.addEvent({
            id: this.generateEventId(),
            type: 'powerup',
            text: rankText,
            timestamp: Date.now(),
            color: '#fbbf24',
          });
        }

        if (target.matchType === 'RANKED') {
          const rpLoss = 15;
          const oldRank = getRankFromRp(target.rankRp || 850);
          target.rankRp = Math.max(0, (target.rankRp || 850) - rpLoss);
          const newRank = getRankFromRp(target.rankRp);
          target.rankTier = newRank.tier;

          let rankLossText = `🔻 [ĐẤU RANK] ${target.name} bị trừ -${rpLoss} RP (${target.rankRp} RP - ${newRank.name})`;
          if (newRank.tier !== oldRank.tier) {
            rankLossText = `⚠️ [TỤT HẠNG ĐẤU RANK] ${target.name} đã rơi xuống ${newRank.vietnameseName} (${target.rankRp} RP).`;
          }

          this.addEvent({
            id: this.generateEventId(),
            type: 'powerup',
            text: rankLossText,
            timestamp: Date.now(),
            color: '#f87171',
          });
        }
      }
    }
  }

  public spawnBoss(customMaxHp?: number) {
    const cx = WORLD_WIDTH / 2;
    const cy = WORLD_HEIGHT / 2;
    const maxHp = customMaxHp || 1000;
    this.boss = {
      id: `boss_leviathan_${Date.now()}`,
      name: 'Siêu Xe Tăng Leviathan',
      x: cx,
      y: cy,
      angle: 0,
      turretAngle: 0,
      hp: maxHp,
      maxHp: maxHp,
      shield: Math.round(maxHp * 0.25),
      isAlive: true,
      phase: 1,
      nextSkillTime: Date.now() + 20000,
      respawnTimeLeft: 0,
    };
    this.addEvent({
      id: this.generateEventId(),
      type: 'powerup',
      text: `☠️ [WORLD BOSS] SIÊU XE TĂNG BOSS LEVIATHAN (${maxHp} HP, 4 NÒNG PHÁO) ĐÃ XUẤT HIỆN TẠI PHÁO ĐÀI TRUNG TÂM!`,
      timestamp: Date.now(),
      color: '#f59e0b',
    });
  }

  private damageBoss(bullet: Bullet) {
    if (!this.boss || !this.boss.isAlive) return;

    let dmg = bullet.damage;
    if (bullet.modifier === 'EXPLOSIVE') dmg = Math.round(dmg * 1.3);

    if (this.boss.shield > 0) {
      if (this.boss.shield >= dmg) {
        this.boss.shield -= dmg;
        dmg = 0;
      } else {
        dmg -= this.boss.shield;
        this.boss.shield = 0;
      }
    }

    this.boss.hp = Math.max(0, this.boss.hp - dmg);

    const shooter = this.tanks.get(bullet.shooterId);
    if (shooter) {
      shooter.score += 15;
      this.addTankExp(shooter, Math.round(bullet.damage * 0.9));
    }

    if (this.boss.hp <= 0) {
      this.boss.hp = 0;
      this.boss.isAlive = false;
      this.nextBossSpawnTime = Date.now() + (this.mode === 'BOSS_RAID' ? 25000 : 180000);

      // Spawn 4 Legendary Golden Crates
      const cx = this.boss.x;
      const cy = this.boss.y;
      const lootTypes: PowerUpType[] = ['REPAIR', 'SHIELD', 'RAPID_FIRE', 'TRIPLE_SHOT'];
      const offsets = [
        { dx: -70, dy: -70 },
        { dx: 70, dy: -70 },
        { dx: -70, dy: 70 },
        { dx: 70, dy: 70 },
      ];
      for (let i = 0; i < 4; i++) {
        this.powerUps.push({
          id: `legendary_crate_${Date.now()}_${i}`,
          type: lootTypes[i],
          x: clamp(cx + offsets[i].dx, 100, WORLD_WIDTH - 100),
          y: clamp(cy + offsets[i].dy, 100, WORLD_HEIGHT - 100),
          createdAt: Date.now(),
          duration: 35000,
        });
      }

      if (shooter) {
        shooter.kills += 3;
        shooter.score += 800;
        this.addTankExp(shooter, 500);
      }

      this.addEvent({
        id: this.generateEventId(),
        type: 'kill',
        text: `👑 [SĂN BOSS] ${shooter ? shooter.name : 'Chiến Binh'} cùng đồng đội đã TIÊU DIỆT THÀNH CÔNG SIÊU BOSS LEVIATHAN!`,
        timestamp: Date.now(),
        color: '#f59e0b',
      });
    }
  }

  private updateBoss(deltaTime: number, now: number) {
    if (!this.boss || !this.boss.isAlive) {
      if (this.boss) {
        this.boss.respawnTimeLeft = Math.max(0, (this.nextBossSpawnTime - now) / 1000);
      }
      if (this.mode === 'BOSS_RAID' || (this.mode === 'PUBLIC' && now >= this.nextBossSpawnTime) || (this.customBossEnabled && now >= this.nextBossSpawnTime)) {
        if (!this.boss || now >= this.nextBossSpawnTime) {
          this.spawnBoss();
        }
      }
      return;
    }

    const boss = this.boss;

    if (now > this.bossNextMoveChange) {
      this.bossNextMoveChange = now + 2500 + Math.random() * 2000;
      this.bossMoveAngle = Math.random() * Math.PI * 2;
    }

    const speed = 1.6;
    const targetX = boss.x + Math.cos(this.bossMoveAngle) * speed;
    const targetY = boss.y + Math.sin(this.bossMoveAngle) * speed;
    const cx = WORLD_WIDTH / 2;
    const cy = WORLD_HEIGHT / 2;
    if (distance(targetX, targetY, cx, cy) < 220) {
      boss.x = targetX;
      boss.y = targetY;
      boss.angle += 0.02;
    } else {
      this.bossMoveAngle = Math.atan2(cy - boss.y, cx - boss.x);
    }

    // Physical Dreadnought Collision: Boss pushes tanks outward so they cannot clip inside
    for (const tank of this.tanks.values()) {
      if (tank.isDead) continue;
      const d = distance(boss.x, boss.y, tank.x, tank.y);
      const minD = TANK_RADIUS + BOSS_RADIUS;
      if (d < minD) {
        const pushAngle = d > 0 ? Math.atan2(tank.y - boss.y, tank.x - boss.x) : Math.random() * Math.PI * 2;
        const overlap = Math.max(1, minD - d);
        tank.x = clamp(tank.x + Math.cos(pushAngle) * overlap, TANK_RADIUS + 44, WORLD_WIDTH - TANK_RADIUS - 44);
        tank.y = clamp(tank.y + Math.sin(pushAngle) * overlap, TANK_RADIUS + 44, WORLD_HEIGHT - TANK_RADIUS - 44);
      }
    }

    let nearestTank: PlayerTank | null = null;
    let minDist = 1400;
    for (const tank of this.tanks.values()) {
      if (tank.isDead) continue;
      const d = distance(boss.x, boss.y, tank.x, tank.y);
      if (d < minDist) {
        minDist = d;
        nearestTank = tank;
      }
    }

    if (nearestTank) {
      const aimAngle = Math.atan2(nearestTank.y - boss.y, nearestTank.x - boss.x);
      boss.turretAngle = aimAngle;

      if (now > this.bossNextFireTime) {
        this.bossNextFireTime = now + 1500;
        const offsets = [-0.12, 0.12];
        for (const off of offsets) {
          const angle = aimAngle + off;
          this.bullets.push({
            id: `boss_b_${Date.now()}_${Math.random()}`,
            shooterId: boss.id,
            shooterName: 'Boss Leviathan',
            x: boss.x + Math.cos(angle) * 75,
            y: boss.y + Math.sin(angle) * 75,
            vx: Math.cos(angle) * 8.5,
            vy: Math.sin(angle) * 8.5,
            damage: 32,
            rangeLeft: 1100,
            color: '#f59e0b',
            isHeavy: true,
            modifier: 'EXPLOSIVE',
          });
        }
        if (minDist < 600) {
          const flakAngles = [aimAngle - 0.45, aimAngle + 0.45];
          for (const fa of flakAngles) {
            this.bullets.push({
              id: `boss_flak_${Date.now()}_${Math.random()}`,
              shooterId: boss.id,
              shooterName: 'Boss Leviathan',
              x: boss.x + Math.cos(fa) * 65,
              y: boss.y + Math.sin(fa) * 65,
              vx: Math.cos(fa) * 9.5,
              vy: Math.sin(fa) * 9.5,
              damage: 22,
              rangeLeft: 700,
              color: '#00f0ff',
              modifier: 'PLASMA',
            });
          }
        }
      }

      if (now > boss.nextSkillTime) {
        boss.nextSkillTime = now + 24000;
        boss.lastSkillName = 'EMP_SHOCKWAVE';
        for (const tank of this.tanks.values()) {
          if (tank.isDead) continue;
          const d = distance(boss.x, boss.y, tank.x, tank.y);
          if (d < 380) {
            tank.hp = Math.max(1, tank.hp - 45);
            tank.slowUntil = now + 3500;
          }
        }
        this.addEvent({
          id: this.generateEventId(),
          type: 'powerup',
          text: `⚡ [BOSS LEVIATHAN] KÍCH HOẠT SÓNG XUNG KÍCH EMP (-45 HP & Làm chậm toàn bộ xung quanh)!`,
          timestamp: now,
          color: '#00f0ff',
        });
      }
    }
  }

  public resetBattleRoyaleRound() {
    this.brWinner = null;
    this.stormZone.active = true;
    this.stormZone.currentRadius = 2400;
    this.stormZone.targetRadius = 2400;
    this.stormZone.phase = 1;
    this.stormZone.phaseTimeLeft = 60;
    this.stormZone.isShrinking = false;
    this.stormZone.dps = 5;

    for (const tank of this.tanks.values()) {
      this.respawnPlayer(tank.id);
    }

    this.addEvent({
      id: this.generateEventId(),
      type: 'powerup',
      text: `🔄 [VÒNG BO SINH TỒN] Trận đấu sinh tồn mới đã bắt đầu! Vòng bo an toàn trong 60s!`,
      timestamp: Date.now(),
      color: '#38bdf8',
    });
  }

  private updateStorm(deltaTime: number, now: number) {
    if (!this.stormZone.active && this.mode !== 'BATTLE_ROYALE') return;
    this.stormZone.active = true;

    if (this.brWinner && now >= this.brRoundResetTimer) {
      this.resetBattleRoyaleRound();
      return;
    }

    if (!this.stormZone.isShrinking) {
      this.stormZone.phaseTimeLeft -= deltaTime;
      if (this.stormZone.phaseTimeLeft <= 0) {
        this.stormZone.isShrinking = true;
        const phaseTargets = [2400, 1600, 1050, 550, 220, 60];
        const nextTarget = phaseTargets[Math.min(this.stormZone.phase, phaseTargets.length - 1)];
        this.stormZone.targetRadius = nextTarget;
        this.addEvent({
          id: this.generateEventId(),
          type: 'powerup',
          text: `⚠️ [VÒNG BO SINH TỒN] Vòng bo đang thu hẹp về bán kính ${nextTarget}m! Hãy di chuyển vào vùng an toàn!`,
          timestamp: now,
          color: '#c084fc',
        });
      }
    } else {
      const shrinkSpeed = 38 * deltaTime;
      if (this.stormZone.currentRadius > this.stormZone.targetRadius) {
        this.stormZone.currentRadius = Math.max(this.stormZone.targetRadius, this.stormZone.currentRadius - shrinkSpeed);
      } else {
        this.stormZone.currentRadius = this.stormZone.targetRadius;
        this.stormZone.isShrinking = false;
        this.stormZone.phase += 1;
        this.stormZone.phaseTimeLeft = Math.max(25, 60 - this.stormZone.phase * 8);
        this.stormZone.dps = 4 + this.stormZone.phase * 2;
        this.addEvent({
          id: this.generateEventId(),
          type: 'powerup',
          text: `⚡ [VÒNG BO GIAI ĐOẠN ${this.stormZone.phase}] Vòng bo tạm dừng co lại trong ${Math.round(this.stormZone.phaseTimeLeft)}s!`,
          timestamp: now,
          color: '#a855f7',
        });
      }
    }

    if (now - this.lastStormDamageTick >= 800) {
      this.lastStormDamageTick = now;
      for (const tank of this.tanks.values()) {
        if (tank.isDead) continue;
        const dist = distance(tank.x, tank.y, this.stormZone.centerX, this.stormZone.centerY);
        if (dist > this.stormZone.currentRadius) {
          tank.inStorm = true;
          tank.hp = Math.max(0, tank.hp - Math.round(this.stormZone.dps * 0.8));
          if (tank.hp <= 0 && !tank.isDead) {
            tank.hp = 0;
            tank.isDead = true;
            tank.deaths += 1;
            tank.streak = 0;
            this.addEvent({
              id: this.generateEventId(),
              type: 'kill',
              text: `⚡ ${tank.name} đã bị BÃO ĐIỆN TỪ thiêu rụi bên ngoài vòng bo!`,
              timestamp: now,
              color: '#ef4444',
            });
          }
        } else {
          tank.inStorm = false;
        }
      }
    }

    if (this.mode === 'BATTLE_ROYALE' && !this.brWinner && this.tanks.size >= 2) {
      const aliveTanks = Array.from(this.tanks.values()).filter((t) => !t.isDead);
      if (aliveTanks.length === 1) {
        const survivor = aliveTanks[0];
        this.brWinner = {
          id: survivor.id,
          name: survivor.name,
          color: survivor.color,
          kills: survivor.kills,
        };
        this.brRoundResetTimer = now + 12000;
        this.addEvent({
          id: this.generateEventId(),
          type: 'kill',
          text: `👑 WINNER WINNER CHICKEN DINNER! ${survivor.name} LÀ CHIẾN THẦN DUY NHẤT SỐNG SÓT!`,
          timestamp: now,
          color: '#f59e0b',
        });

        if (survivor.matchType === 'RANKED') {
          const brBonus = 80;
          survivor.rankRp = Math.min(9999, (survivor.rankRp || 850) + brBonus);
          const newRank = getRankFromRp(survivor.rankRp);
          survivor.rankTier = newRank.tier;
          this.addEvent({
            id: this.generateEventId(),
            type: 'powerup',
            text: `👑 [QUÁN QUÂN ĐẤU RANK] ${survivor.name} +${brBonus} RP (${survivor.rankRp} RP - ${newRank.vietnameseName})!`,
            timestamp: now,
            color: '#fbbf24',
          });
        }
      }
    }
  }

  private updateTdm(deltaTime: number, now: number) {
    if (this.mode !== 'TEAM_DEATHMATCH') return;

    if (this.teamScore.winner && now >= this.tdmRoundResetTimer) {
      this.teamScore = {
        red: 0,
        blue: 0,
        targetKills: 30,
        winner: null,
      };
      for (const tank of this.tanks.values()) {
        this.respawnPlayer(tank.id);
      }
      return;
    }

    if (now - this.lastBaseRegenTick >= 500) {
      this.lastBaseRegenTick = now;
      for (const tank of this.tanks.values()) {
        if (tank.isDead) continue;
        tank.inHealingBase = false;

        for (const base of this.bases) {
          const inBase =
            tank.x >= base.x &&
            tank.x <= base.x + base.w &&
            tank.y >= base.y &&
            tank.y <= base.y + base.h;

          if (inBase) {
            if (tank.team === base.team) {
              tank.inHealingBase = true;
              tank.hp = Math.min(tank.maxHp, tank.hp + 10);
              tank.shield = Math.min(100, tank.shield + 8);
            } else if (tank.team && tank.team !== 'NONE') {
              tank.hp = Math.max(0, tank.hp - 16);
              if (tank.hp <= 0) {
                tank.hp = 0;
                tank.isDead = true;
                tank.respawnCountdown = 3.5;
                tank.deaths += 1;
                this.addEvent({
                  id: this.generateEventId(),
                  type: 'kill',
                  text: `⚡ ${tank.name} đã bị Hệ Thống Laser Phòng Thủ Căn Cứ tiêu diệt!`,
                  timestamp: now,
                  color: '#ef4444',
                });
              }
            }
          }
        }
      }
    }
  }

  private rewardTdmRankedWinners(winnerTeam: Team) {
    for (const tank of this.tanks.values()) {
      if (!tank.isBot && tank.team === winnerTeam && tank.matchType === 'RANKED') {
        const bonus = 40;
        tank.rankRp = Math.min(9999, (tank.rankRp || 850) + bonus);
        const newRank = getRankFromRp(tank.rankRp);
        tank.rankTier = newRank.tier;
        this.addEvent({
          id: this.generateEventId(),
          type: 'powerup',
          text: `🎖️ [THẮNG ĐẤU ĐỘI RANK] ${tank.name} +${bonus} RP (${tank.rankRp} RP - ${newRank.vietnameseName})!`,
          timestamp: Date.now(),
          color: '#fbbf24',
        });
      }
    }
  }

  private updateBots(now: number) {
    // If there are bot tanks in the match, always execute AI update logic for them!
    let hasAnyBot = false;
    for (const tank of this.tanks.values()) {
      if (tank.isBot && !tank.isDead) {
        hasAnyBot = true;
        break;
      }
    }
    if (!hasAnyBot) return;

    for (const [id, tank] of this.tanks) {
      if (!tank.isBot || tank.isDead) continue;

      let nextMove = this.botNextMoveTime.get(id) || 0;
      let input = this.tankInputs.get(id);
      if (!input) {
        input = { up: false, down: false, left: false, right: false, turretAngle: 0, isFiring: false };
        this.tankInputs.set(id, input);
      }

      // Check obstacle stuck detection
      let lastPos = this.botLastPositions.get(id);
      if (!lastPos) {
        lastPos = { x: tank.x, y: tank.y, stuckCount: 0 };
        this.botLastPositions.set(id, lastPos);
      } else {
        const dMoved = distance(tank.x, tank.y, lastPos.x, lastPos.y);
        if (dMoved < 4 && (input.up || input.down || input.left || input.right)) {
          lastPos.stuckCount = (lastPos.stuckCount || 0) + 1;
        } else {
          lastPos.stuckCount = 0;
        }
        lastPos.x = tank.x;
        lastPos.y = tank.y;
      }

      // -------------------------------------------------------------
      // 1. TARGET SELECTION BASED ON CURRENT GAME MODE OBJECTIVE
      // -------------------------------------------------------------
      let currentTargetId = this.botTargetIds.get(id);
      let targetExpiry = this.botTargetExpiry.get(id) || 0;
      let target: PlayerTank | null = null;

      // Validate cached target
      if (currentTargetId && now < targetExpiry) {
        const potentialTarget = this.tanks.get(currentTargetId);
        if (potentialTarget && !potentialTarget.isDead) {
          // If in TDM, never target allies
          const isAlly = this.mode === 'TEAM_DEATHMATCH' && tank.team && potentialTarget.team && tank.team === potentialTarget.team && tank.team !== 'NONE';
          if (!isAlly) {
            const d = distance(tank.x, tank.y, potentialTarget.x, potentialTarget.y);
            if (d < 1800) {
              target = potentialTarget;
            }
          }
        }
      }

      // If no valid target, pick target based strictly on game mode
      if (!target) {
        const candidates: { tank: PlayerTank; dist: number }[] = [];
        for (const [otherId, otherTank] of this.tanks) {
          if (otherId === id || otherTank.isDead) continue;
          // STRICT TDM OBJECTIVE: Never target friendly team members!
          if (this.mode === 'TEAM_DEATHMATCH') {
            if (tank.team && otherTank.team && tank.team === otherTank.team && tank.team !== 'NONE') {
              continue;
            }
          }
          const dist = distance(tank.x, tank.y, otherTank.x, otherTank.y);
          if (dist < 1800) {
            candidates.push({ tank: otherTank, dist });
          }
        }

        if (candidates.length > 0) {
          // Prioritize closest enemy players/bots
          candidates.sort((a, b) => a.dist - b.dist);
          const topSlice = candidates.slice(0, Math.min(3, candidates.length));
          const chosen = topSlice[Math.floor(Math.random() * topSlice.length)];
          target = chosen.tank;
          this.botTargetIds.set(id, target.id);
          this.botTargetExpiry.set(id, now + 2500 + Math.random() * 2500);
        } else {
          this.botTargetIds.set(id, null);
        }
      }

      // -------------------------------------------------------------
      // 2. MODE-SPECIFIC OBJECTIVE OVERRIDES (BOSS RAID & BATTLE ROYALE)
      // -------------------------------------------------------------
      // Objective in BOSS_RAID: If Boss Leviathan is alive, prioritize Boss!
      const isBossObjective = (this.mode === 'BOSS_RAID' || (this.mode === 'PUBLIC' && this.boss?.isAlive)) && this.boss && this.boss.isAlive;
      const distToBoss = isBossObjective && this.boss ? distance(tank.x, tank.y, this.boss.x, this.boss.y) : 99999;
      const targetBoss = isBossObjective && this.boss && (distToBoss < 1600 || !target);

      // Objective in BATTLE_ROYALE: Move into safe zone if storm is closing in
      const distToStormCenter = distance(tank.x, tank.y, this.stormZone.centerX, this.stormZone.centerY);
      const isOutsideOrNearStorm = this.mode === 'BATTLE_ROYALE' && this.stormZone.active && (distToStormCenter > this.stormZone.currentRadius * 0.75);

      const distToTarget = target ? distance(tank.x, tank.y, target.x, target.y) : 9999;

      // -------------------------------------------------------------
      // 3. TACTICAL MOVEMENT LOGIC
      // -------------------------------------------------------------
      if (now > nextMove || (lastPos && lastPos.stuckCount >= 2)) {
        this.botNextMoveTime.set(id, now + 350 + Math.random() * 450);

        // A. If stuck against obstacle/wall: Unstuck maneuver
        if (lastPos && lastPos.stuckCount >= 2) {
          lastPos.stuckCount = 0;
          const unstuckAngle = Math.random() * Math.PI * 2;
          input.left = Math.cos(unstuckAngle) < -0.2;
          input.right = Math.cos(unstuckAngle) > 0.2;
          input.up = Math.sin(unstuckAngle) < -0.2;
          input.down = Math.sin(unstuckAngle) > 0.2;
        }
        // B. Battle Royale: Escape storm priority
        else if (isOutsideOrNearStorm) {
          const angleToSafety = Math.atan2(this.stormZone.centerY - tank.y, this.stormZone.centerX - tank.x);
          const jitter = (Math.random() - 0.5) * 0.4;
          const moveAngle = angleToSafety + jitter;
          input.left = Math.cos(moveAngle) < -0.25;
          input.right = Math.cos(moveAngle) > 0.25;
          input.up = Math.sin(moveAngle) < -0.25;
          input.down = Math.sin(moveAngle) > 0.25;
        }
        // C. Boss Raid: Move toward Boss Leviathan & circle around it
        else if (targetBoss && this.boss) {
          const angleToBoss = Math.atan2(this.boss.y - tank.y, this.boss.x - tank.x);
          const strafe = Math.sin(now / 500 + id.charCodeAt(0)) > 0 ? 0.6 : -0.6;
          let moveAngle = angleToBoss + strafe;
          // Keep optimal shooting distance from boss (~350 - 550)
          if (distToBoss < 320) {
            moveAngle = angleToBoss + Math.PI; // back away
          }
          input.left = Math.cos(moveAngle) < -0.3;
          input.right = Math.cos(moveAngle) > 0.3;
          input.up = Math.sin(moveAngle) < -0.3;
          input.down = Math.sin(moveAngle) > 0.3;
        }
        // D. Combat with target enemy tank
        else if (target) {
          const angleToTarget = Math.atan2(target.y - tank.y, target.x - tank.x);
          const strafe = Math.sin(now / 400 + id.charCodeAt(0)) > 0 ? 0.5 : -0.5;
          const moveAngle = angleToTarget + strafe;
          input.left = Math.cos(moveAngle) < -0.3;
          input.right = Math.cos(moveAngle) > 0.3;
          input.up = Math.sin(moveAngle) < -0.3;
          input.down = Math.sin(moveAngle) > 0.3;

          // Back away if too close (< 140)
          if (distToTarget < 140) {
            input.left = target.x > tank.x;
            input.right = target.x < tank.x;
            input.up = target.y > tank.y;
            input.down = target.y < tank.y;
          }
        }
        // E. Patrol wander towards center arena
        else {
          const cx = 2100;
          const cy = 2100;
          const angleToCenter = Math.atan2(cy - tank.y, cx - tank.x);
          const wanderAngle = angleToCenter + (Math.random() - 0.5) * 1.5;
          input.left = Math.cos(wanderAngle) < -0.3;
          input.right = Math.cos(wanderAngle) > 0.3;
          input.up = Math.sin(wanderAngle) < -0.3;
          input.down = Math.sin(wanderAngle) > 0.3;
        }
      }

      // -------------------------------------------------------------
      // 4. AIMING & SHOOTING DISCIPLINE
      // -------------------------------------------------------------
      if (targetBoss && this.boss) {
        // Aim directly at Boss Leviathan
        const jitter = (Math.random() - 0.5) * 0.15;
        input.turretAngle = Math.atan2(this.boss.y - tank.y, this.boss.x - tank.x) + jitter;
        input.isFiring = distToBoss < 1100 && Math.random() > 0.05;

        // Skill usage against boss
        if (tank.hp < tank.maxHp * 0.4 && Math.random() < 0.1) {
          this.useSkill(id, 'SHIELD');
        } else if (distToBoss < 600 && Math.random() < 0.08) {
          this.useSkill(id, 'BARRAGE');
        } else if (distToBoss > 400 && distToBoss < 900 && Math.random() < 0.05) {
          this.useSkill(id, 'BOOST');
        }
      } else if (target) {
        // Aim with lead prediction and random angular jitter
        const jitter = (Math.random() - 0.5) * 0.18;
        input.turretAngle = Math.atan2(target.y - tank.y, target.x - tank.x) + jitter;
        input.isFiring = distToTarget < 950 && Math.random() > 0.06;

        // Tactical Bot Skill Usage
        if (tank.hp < tank.maxHp * 0.45 && Math.random() < 0.08) {
          this.useSkill(id, 'SHIELD');
        } else if (distToTarget > 350 && distToTarget < 850 && Math.random() < 0.04) {
          this.useSkill(id, 'BOOST');
        } else if (distToTarget < 550 && Math.random() < 0.06) {
          this.useSkill(id, 'BARRAGE');
        } else if (distToTarget < 180 && Math.random() < 0.05) {
          this.useSkill(id, 'MINE');
        }
      } else {
        // Occasional suppressive shot in moving direction
        if (Math.random() < 0.04) {
          input.turretAngle = tank.angle + (Math.random() - 0.5) * 0.6;
          input.isFiring = true;
        } else {
          input.turretAngle = tank.angle;
          input.isFiring = false;
        }
      }
    }
  }
  public getSnapshot(): GameSnapshot {
    const sortedLeaderboard: LeaderboardEntry[] = Array.from(this.tanks.values())
      .map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        kills: t.kills,
        deaths: t.deaths,
        score: t.score,
        streak: t.streak,
        isBot: t.isBot,
        tankClass: t.tankClass,
        rankTier: t.rankTier,
      }))
      .sort((a, b) => b.score - a.score || b.kills - a.kills)
      .slice(0, 10);

    const aliveCount = Array.from(this.tanks.values()).filter((t) => !t.isDead).length;

    return {
      tanks: Array.from(this.tanks.values()),
      bullets: this.bullets,
      powerUps: this.powerUps,
      obstacles: this.obstacles,
      landmines: this.landmines,
      leaderboard: sortedLeaderboard,
      serverTime: Date.now(),
      mode: this.mode,
      storm: this.stormZone,
      teamScore: this.teamScore,
      boss: this.boss,
      aliveCount,
      totalParticipants: this.tanks.size,
      brWinner: this.brWinner,
      bases: this.bases,
      weather: this.currentWeather,
      weatherSecondsLeft: Math.round(this.weatherCycleTimer),
    };
  }

  public getInitData(playerId: string) {
    return {
      playerId,
      world: { width: WORLD_WIDTH, height: WORLD_HEIGHT },
      obstacles: this.obstacles,
      snapshot: this.getSnapshot(),
      recentEvents: this.events.slice(-10),
      chatHistory: this.chatHistory.slice(-25),
    };
  }
}
