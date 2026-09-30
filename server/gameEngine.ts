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
} from '../src/types/game';

export const WORLD_WIDTH = 4200;
export const WORLD_HEIGHT = 4200;
export const TANK_RADIUS = 22;
export const BULLET_RADIUS = 5;

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
  private events: CombatEvent[] = [];
  private pendingEvents: CombatEvent[] = [];
  private chatHistory: ChatMessage[] = [];
  private botTargetIds: Map<string, string | null> = new Map();
  private botTargetExpiry: Map<string, number> = new Map();
  private botNextMoveTime: Map<string, number> = new Map();

  private maxBots: number = 0;
  private nextPowerUpSpawn: number = 0;
  private nextEventId: number = 1;

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${this.nextEventId++}`;
  }

  constructor(defaultBots: number = 0) {
    this.maxBots = Math.max(0, defaultBots);
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
    isBot: boolean = false
  ): PlayerTank {
    const stats = TANK_CLASSES[tankClass] || TANK_CLASSES.STRIKER;
    const spawn = this.findSafeSpawnPosition();

    const tank: PlayerTank = {
      id,
      name: name || (isBot ? `Bot [${tankClass}]` : 'Chiến Binh Mới'),
      color: color || stats.colorPreset,
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
      this.botNextMoveTime.delete(id);
    }
  }

  public setInput(
    id: string,
    input: { up: boolean; down: boolean; left: boolean; right: boolean; turretAngle: number; isFiring: boolean }
  ) {
    this.tankInputs.set(id, input);
  }

  public respawnPlayer(id: string) {
    const tank = this.tanks.get(id);
    if (!tank || !tank.isDead) return;

    const stats = TANK_CLASSES[tank.tankClass];
    const spawn = this.findSafeSpawnPosition();
    tank.x = spawn.x;
    tank.y = spawn.y;
    tank.hp = stats.maxHp;
    tank.shield = 0;
    tank.isDead = false;
    tank.respawnCountdown = 0;
    tank.invulnerableUntil = Date.now() + 3000;
    tank.activePowerUp = null;
    tank.nextAmmoType = this.getRandomAmmoType();
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

    // 2. Bot AI updates
    this.updateBots(now);

    // 3. Process Tank Movements & Fire
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
      if (tank.slowUntil && now < tank.slowUntil) {
        speedMult *= 0.52;
      }
      if (tank.burnUntil && now < tank.burnUntil) {
        tank.hp = Math.max(1, tank.hp - 0.2);
      }

      const currentSpeed = baseStats.speed * speedMult;
      tank.speed = currentSpeed;

      // 8-Directional Responsive Movement with Wall Sliding
      let moveX = 0;
      let moveY = 0;

      if (input.left) moveX -= 1;
      if (input.right) moveX += 1;
      if (input.up) moveY -= 1;
      if (input.down) moveY += 1;

      if (moveX !== 0 || moveY !== 0) {
        const moveAngle = Math.atan2(moveY, moveX);
        const vx = Math.cos(moveAngle) * currentSpeed;
        const vy = Math.sin(moveAngle) * currentSpeed;

        // Smoothly rotate tank hull towards movement direction
        const angleDiff = Math.atan2(Math.sin(moveAngle - tank.angle), Math.cos(moveAngle - tank.angle));
        tank.angle += angleDiff * 0.35;

        const nextX = tank.x + vx;
        const nextY = tank.y + vy;

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

        if (canMoveX) {
          tank.x = clamp(nextX, TANK_RADIUS + 44, WORLD_WIDTH - TANK_RADIUS - 44);
        }
        if (canMoveY) {
          tank.y = clamp(nextY, TANK_RADIUS + 44, WORLD_HEIGHT - TANK_RADIUS - 44);
        }
      }

      // Turret rotation
      tank.turretAngle = input.turretAngle;

      // Handle Firing
      let cooldown = baseStats.fireCooldown;
      if (tank.activePowerUp?.type === 'RAPID_FIRE') {
        cooldown *= 0.55;
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
                  if (idx !== -1) this.obstacles.splice(idx, 1);
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
    const muzzleDist = TANK_RADIUS + 16;
    const spawnX = tank.x + Math.cos(tank.turretAngle) * muzzleDist;
    const spawnY = tank.y + Math.sin(tank.turretAngle) * muzzleDist;

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
          rangeLeft: 950,
          color: '#fbbf24',
          isHeavy: tank.tankClass === 'JUGGERNAUT',
          modifier: 'TRIPLE',
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
        rangeLeft: 1050,
        color: '#ef4444',
        isHeavy: true,
        modifier: 'EXPLOSIVE',
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
        rangeLeft: 1350,
        color: '#00f0ff',
        isHeavy: false,
        modifier: 'PLASMA',
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
        rangeLeft: 1050,
        color: '#38bdf8',
        isHeavy: false,
        modifier: 'CRYO',
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
        rangeLeft: 1050,
        color: '#f97316',
        isHeavy: false,
        modifier: 'INCENDIARY',
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
        rangeLeft: 1250,
        color: '#c084fc',
        isHeavy: false,
        modifier: 'RICOCHET',
        bouncesLeft: 2,
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
        rangeLeft: 1250,
        color: '#10b981',
        isHeavy: true,
        modifier: 'PIERCING',
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
      rangeLeft: 1000,
      color: tank.color,
      isHeavy: tank.tankClass === 'JUGGERNAUT',
      modifier: 'STANDARD',
    });
  }

  private applyPowerUp(tank: PlayerTank, type: PowerUpType) {
    const stats = TANK_CLASSES[tank.tankClass];
    if (type === 'REPAIR') {
      tank.hp = Math.min(stats.maxHp, tank.hp + 50);
      tank.activePowerUp = {
        type: 'REPAIR',
        expiresAt: Date.now() + 15000,
      };
      this.addEvent({
        id: this.generateEventId(),
        type: 'powerup',
        text: `⚡ ${tank.name} nhặt Hộp Cứu Thương (+50 HP & +35% Tốc độ linh kiện!)`,
        timestamp: Date.now(),
        color: '#10b981',
      });
      return;
    }

    if (type === 'SHIELD') {
      tank.shield = 100;
      tank.activePowerUp = {
        type: 'SHIELD',
        expiresAt: Date.now() + 15000,
      };
      this.addEvent({
        id: this.generateEventId(),
        type: 'powerup',
        text: `🛡️ ${tank.name} kích hoạt Lá Chắn (+100 Giáp & +35% Tốc độ linh kiện!)`,
        timestamp: Date.now(),
        color: '#38bdf8',
      });
      return;
    }

    const typeNames: Record<PowerUpType, string> = {
      TRIPLE_SHOT: 'Đạn Ba Tia & +35% Tốc độ linh kiện',
      SPEED_BOOST: 'NITRO SIÊU TỐC (+85% Tốc độ cực bốc)',
      SHIELD: 'Lá Chắn & +35% Tốc độ linh kiện',
      REPAIR: 'Hộp Sửa Chữa & +35% Tốc độ linh kiện',
      RAPID_FIRE: 'Nạp Đạn Thần Tốc & +35% Tốc độ linh kiện',
    };

    tank.activePowerUp = {
      type,
      expiresAt: Date.now() + 15000,
    };

    this.addEvent({
      id: this.generateEventId(),
      type: 'powerup',
      text: `🚀 ${tank.name} nhặt linh kiện: ${typeNames[type]}!`,
      timestamp: Date.now(),
      color: '#f59e0b',
    });
  }

  private damageTank(target: PlayerTank, bullet: Bullet) {
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
        if (distance(target.x, target.y, otherTank.x, otherTank.y) < 80) {
          otherTank.hp = Math.max(0, otherTank.hp - 20);
          if (otherTank.hp <= 0) {
            otherTank.isDead = true;
            otherTank.respawnCountdown = 3.5;
            otherTank.deaths += 1;
          }
        }
      }
    }

    if (target.hp <= 0) {
      target.hp = 0;
      target.isDead = true;
      target.respawnCountdown = 3.5;
      target.deaths += 1;
      target.streak = 0;

      // Shooter rewards
      const shooter = this.tanks.get(bullet.shooterId);
      if (shooter) {
        shooter.kills += 1;
        shooter.streak += 1;
        const streakBonus = Math.min(shooter.streak * 20, 100);
        shooter.score += 100 + streakBonus;

        let killText = `🎯 ${shooter.name} đã tiêu diệt đối thủ ${target.name}!`;
        if (shooter.streak >= 3) {
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
        });
      }
    }
  }

  private updateBots(now: number) {
    if (this.maxBots === 0) return;

    for (const [id, tank] of this.tanks) {
      if (!tank.isBot || tank.isDead) continue;

      let nextMove = this.botNextMoveTime.get(id) || 0;
      let input = this.tankInputs.get(id);
      if (!input) {
        input = { up: false, down: false, left: false, right: false, turretAngle: 0, isFiring: false };
        this.tankInputs.set(id, input);
      }

      // Check current target
      let currentTargetId = this.botTargetIds.get(id);
      let targetExpiry = this.botTargetExpiry.get(id) || 0;
      let target: PlayerTank | null = null;

      if (currentTargetId && now < targetExpiry) {
        const potentialTarget = this.tanks.get(currentTargetId);
        if (potentialTarget && !potentialTarget.isDead) {
          const d = distance(tank.x, tank.y, potentialTarget.x, potentialTarget.y);
          if (d < 1600) {
            target = potentialTarget;
          }
        }
      }

      // If no valid target or target expired, pick a random opponent from all nearby tanks (both bots and players)
      if (!target) {
        const candidates: { tank: PlayerTank; dist: number }[] = [];
        for (const [otherId, otherTank] of this.tanks) {
          if (otherId === id || otherTank.isDead) continue;
          const dist = distance(tank.x, tank.y, otherTank.x, otherTank.y);
          if (dist < 1500) {
            candidates.push({ tank: otherTank, dist });
          }
        }

        if (candidates.length > 0) {
          // Sort by distance and pick randomly among top nearby opponents
          candidates.sort((a, b) => a.dist - b.dist);
          const topSlice = candidates.slice(0, Math.min(3, candidates.length));
          const chosen = topSlice[Math.floor(Math.random() * topSlice.length)];
          target = chosen.tank;
          this.botTargetIds.set(id, target.id);
          // Lock target for 2.5 - 5.5s then evaluate another random opponent
          this.botTargetExpiry.set(id, now + 2500 + Math.random() * 3000);
        } else {
          this.botTargetIds.set(id, null);
        }
      }

      const distToTarget = target ? distance(tank.x, tank.y, target.x, target.y) : 9999;

      if (now > nextMove) {
        this.botNextMoveTime.set(id, now + 400 + Math.random() * 600);

        if (target) {
          // Tactical movement: advance, strafe and circle around target
          const angleToTarget = Math.atan2(target.y - tank.y, target.x - tank.x);
          const strafe = Math.sin(now / 400 + id.charCodeAt(0)) > 0 ? 0.45 : -0.45;
          const moveAngle = angleToTarget + strafe;

          input.left = Math.cos(moveAngle) < -0.3;
          input.right = Math.cos(moveAngle) > 0.3;
          input.up = Math.sin(moveAngle) < -0.3;
          input.down = Math.sin(moveAngle) > 0.3;

          if (distToTarget < 130) {
            // Back away if too close
            input.left = target.x > tank.x;
            input.right = target.x < tank.x;
            input.up = target.y > tank.y;
            input.down = target.y < tank.y;
          }
        } else {
          // Patrol wander
          input.up = Math.random() > 0.38;
          input.down = Math.random() > 0.62;
          input.left = Math.random() > 0.5;
          input.right = Math.random() > 0.5 && !input.left;
        }
      }

      // Aim turret and fire randomly at target
      if (target) {
        // Aim with lead prediction and random angular jitter
        const jitter = (Math.random() - 0.5) * 0.22;
        input.turretAngle = Math.atan2(target.y - tank.y, target.x - tank.x) + jitter;
        // Fire when in range (< 950) with active combat cadence
        input.isFiring = distToTarget < 950 && Math.random() > 0.08;
      } else {
        // Occasional random suppressive shot in patrolling direction
        if (Math.random() < 0.06) {
          input.turretAngle = tank.angle + (Math.random() - 0.5) * 0.8;
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
      }))
      .sort((a, b) => b.score - a.score || b.kills - a.kills)
      .slice(0, 10);

    return {
      tanks: Array.from(this.tanks.values()),
      bullets: this.bullets,
      powerUps: this.powerUps,
      obstacles: this.obstacles,
      leaderboard: sortedLeaderboard,
      serverTime: Date.now(),
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
