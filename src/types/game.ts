export type TankClass = 'STRIKER' | 'SCOUT' | 'JUGGERNAUT';

export type PowerUpType = 'TRIPLE_SHOT' | 'SPEED_BOOST' | 'SHIELD' | 'REPAIR' | 'RAPID_FIRE';

export type ObstacleType = 'BRICK' | 'STEEL' | 'WATER' | 'BUSH';

export interface TankStats {
  name: string;
  description: string;
  speed: number;
  maxHp: number;
  fireCooldown: number; // in ms
  bulletDamage: number;
  bulletSpeed: number;
  colorPreset: string;
}

export const TANK_CLASSES: Record<TankClass, TankStats> = {
  STRIKER: {
    name: 'Chiến Binh (Striker)',
    description: 'Cân bằng hoàn hảo giữa tốc độ, hỏa lực và giáp',
    speed: 4.6,
    maxHp: 100,
    fireCooldown: 320,
    bulletDamage: 25,
    bulletSpeed: 10.5,
    colorPreset: '#2563eb', // Blue
  },
  SCOUT: {
    name: 'Trinh Sát (Scout)',
    description: 'Cực nhanh, bắn liên tục nhưng lượng máu thấp',
    speed: 6.0,
    maxHp: 80,
    fireCooldown: 210,
    bulletDamage: 18,
    bulletSpeed: 12.5,
    colorPreset: '#16a34a', // Green
  },
  JUGGERNAUT: {
    name: 'Thiết Giáp (Juggernaut)',
    description: 'Giáp siêu dày, đạn nổ cực mạnh nhưng di chuyển chậm',
    speed: 3.6,
    maxHp: 150,
    fireCooldown: 540,
    bulletDamage: 45,
    bulletSpeed: 9.0,
    colorPreset: '#d97706', // Amber / Gold
  },
};

export type BulletModifier =
  | 'STANDARD'
  | 'EXPLOSIVE'
  | 'TRIPLE'
  | 'PLASMA'
  | 'CRYO'
  | 'INCENDIARY'
  | 'RICOCHET'
  | 'PIERCING';

export type SkillType = 'BOOST' | 'SHIELD' | 'MINE' | 'BARRAGE';

export interface TankSkillState {
  boostUntil: number;
  boostCooldownUntil: number;
  shieldUntil: number;
  shieldCooldownUntil: number;
  mineCooldownUntil: number;
  barrageUntil: number;
  barrageCooldownUntil: number;
}

export interface Landmine {
  id: string;
  ownerId: string;
  ownerName: string;
  x: number;
  y: number;
  createdAt: number;
  expiresAt: number;
}

export type PerkId =
  | 'VAMPIRISM'
  | 'ARMOR_PIERCING'
  | 'THORNS_ARMOR'
  | 'HEAVY_HULL'
  | 'RAPID_RELOAD'
  | 'BLAST_RADIUS'
  | 'NITRO_ENGINE'
  | 'EVASION_MATRIX';

export interface PerkCard {
  id: PerkId;
  name: string;
  vietnameseName: string;
  icon: string;
  description: string;
  badge: string;
  color: string;
  themeGradient: string;
}

export const ALL_PERK_CARDS: Record<PerkId, PerkCard> = {
  VAMPIRISM: {
    id: 'VAMPIRISM',
    name: 'Vampirism',
    vietnameseName: 'Hút Máu Lương Duyên',
    icon: '🩸',
    description: 'Hồi lại 15% lượng sát thương gây ra cho kẻ địch thành máu cho xe tăng của bạn.',
    badge: '+15% HÚT MÁU',
    color: '#ef4444',
    themeGradient: 'from-rose-900/90 via-red-950 to-slate-950 border-rose-500/80 shadow-rose-500/30',
  },
  ARMOR_PIERCING: {
    id: 'ARMOR_PIERCING',
    name: 'Armor Piercing',
    vietnameseName: 'Đạn Xuyên Phá Cường Hóa',
    icon: '🏹',
    description: 'Đạn bay xuyên qua bụi rậm và xuyên qua 1 lớp chướng ngại vật mỏng.',
    badge: 'ĐẠN XUYÊN TƯỜNG',
    color: '#10b981',
    themeGradient: 'from-emerald-900/90 via-teal-950 to-slate-950 border-emerald-500/80 shadow-emerald-500/30',
  },
  THORNS_ARMOR: {
    id: 'THORNS_ARMOR',
    name: 'Thorns Armor',
    vietnameseName: 'Giáp Gai Phản Đòn',
    icon: '🛡️',
    description: 'Phản lại 20% sát thương nhận vào từ đạn kẻ địch trực tiếp cho kẻ tấn công.',
    badge: 'PHẢN 20% SÁT THƯƠNG',
    color: '#f59e0b',
    themeGradient: 'from-amber-900/90 via-orange-950 to-slate-950 border-amber-500/80 shadow-amber-500/30',
  },
  HEAVY_HULL: {
    id: 'HEAVY_HULL',
    name: 'Reinforced Hull',
    vietnameseName: 'Thân Xe Bọc Thép',
    icon: '🚜',
    description: '+30 Max HP ngay lập tức và tự động hồi máu ngoài giao tranh (+3 HP/giây).',
    badge: '+30 MAX HP & HỒI MÁU',
    color: '#38bdf8',
    themeGradient: 'from-sky-900/90 via-blue-950 to-slate-950 border-sky-500/80 shadow-sky-500/30',
  },
  RAPID_RELOAD: {
    id: 'RAPID_RELOAD',
    name: 'Rapid Reload',
    vietnameseName: 'Nạp Đạn Thần Tốc',
    icon: '⚡',
    description: 'Giảm 20% thời gian nạp đạn bắn pháo và giảm hồi chiêu tất cả kỹ năng.',
    badge: '-20% THỜI GIAN NẠP',
    color: '#eab308',
    themeGradient: 'from-yellow-900/90 via-amber-950 to-slate-950 border-yellow-500/80 shadow-yellow-500/30',
  },
  BLAST_RADIUS: {
    id: 'BLAST_RADIUS',
    name: 'Blast Radius',
    vietnameseName: 'Đạn Nổ Diện Rộng',
    icon: '💥',
    description: '+35% Bán kính nổ đạn diện rộng & +12% Sát thương đạn pháo.',
    badge: '+35% BÁN KÍNH NỔ',
    color: '#f97316',
    themeGradient: 'from-orange-900/90 via-red-950 to-slate-950 border-orange-500/80 shadow-orange-500/30',
  },
  NITRO_ENGINE: {
    id: 'NITRO_ENGINE',
    name: 'Nitro Engine',
    vietnameseName: 'Động Cơ Siêu Tốc',
    icon: '🏎️',
    description: '+22% Tốc độ di chuyển thân xe tăng, di chuyển linh hoạt vượt trội.',
    badge: '+22% TỐC ĐỘ XE',
    color: '#a855f7',
    themeGradient: 'from-purple-900/90 via-fuchsia-950 to-slate-950 border-purple-500/80 shadow-purple-500/30',
  },
  EVASION_MATRIX: {
    id: 'EVASION_MATRIX',
    name: 'Evasion Matrix',
    vietnameseName: 'Lưới Né Đạn Cyber',
    icon: '🔮',
    description: '15% Tỷ lệ né tránh hoàn toàn đạn bắn từ đối thủ, không tốn chút HP nào.',
    badge: '15% NÉ ĐẠN',
    color: '#06b6d4',
    themeGradient: 'from-cyan-900/90 via-teal-950 to-slate-950 border-cyan-500/80 shadow-cyan-500/30',
  },
};

export interface PlayerTank {
  id: string;
  name: string;
  color: string;
  tankClass: TankClass;
  x: number;
  y: number;
  angle: number; // hull rotation
  turretAngle: number; // cannon rotation
  speed: number;
  hp: number;
  maxHp: number;
  shield: number;
  isDead: boolean;
  respawnCountdown: number; // seconds left
  kills: number;
  deaths: number;
  score: number;
  streak: number;
  isBot: boolean;
  activePowerUp: {
    type: PowerUpType;
    expiresAt: number;
  } | null;
  invulnerableUntil: number;
  lastFired: number;
  ping: number;
  nextAmmoType?: BulletModifier;
  slowUntil?: number;
  burnUntil?: number;
  skills?: TankSkillState;
  level: number;
  exp: number;
  maxExp: number;
  perks: PerkId[];
  pendingPerkChoices?: PerkCard[];
  lastDamagedTime?: number;
  team?: Team;
  inStorm?: boolean;
  inHealingBase?: boolean;
}

export type Team = 'RED' | 'BLUE' | 'NONE';

export interface StormZone {
  centerX: number;
  centerY: number;
  currentRadius: number;
  targetRadius: number;
  phase: number;
  maxPhases: number;
  phaseTimeLeft: number;
  isShrinking: boolean;
  active: boolean;
  dps: number;
}

export interface TeamScore {
  red: number;
  blue: number;
  targetKills: number;
  winner: Team | null;
}

export interface BaseZone {
  team: Team;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BossInfo {
  id: string;
  name: string;
  x: number;
  y: number;
  angle: number;
  turretAngle: number;
  hp: number;
  maxHp: number;
  shield: number;
  isAlive: boolean;
  phase: number;
  nextSkillTime: number;
  respawnTimeLeft?: number;
  lastSkillName?: string;
}

export interface Bullet {
  id: string;
  shooterId: string;
  shooterName: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  rangeLeft: number;
  color: string;
  isHeavy?: boolean;
  modifier?: BulletModifier;
  bouncesLeft?: number;
}

export interface Obstacle {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
  w: number;
  h: number;
  hp?: number;
  maxHp?: number;
}

export interface PowerUpCrate {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
  createdAt: number;
  duration: number; // how long it lasts after pickup
}

export interface CombatEvent {
  id: string;
  type: 'kill' | 'join' | 'leave' | 'powerup' | 'chat';
  text: string;
  timestamp: number;
  killerId?: string;
  victimId?: string;
  killerName?: string;
  victimName?: string;
  color?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  color?: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  color: string;
  kills: number;
  deaths: number;
  score: number;
  streak: number;
  isBot: boolean;
  tankClass: TankClass;
}

export interface GameSnapshot {
  tanks: PlayerTank[];
  bullets: Bullet[];
  powerUps: PowerUpCrate[];
  obstacles: Obstacle[];
  leaderboard: LeaderboardEntry[];
  serverTime: number;
  landmines?: Landmine[];
  mode?: GameMode;
  storm?: StormZone;
  teamScore?: TeamScore;
  boss?: BossInfo | null;
  aliveCount?: number;
  totalParticipants?: number;
  brWinner?: { id: string; name: string; color: string; kills: number } | null;
  bases?: BaseZone[];
}

export type GameMode = 'PUBLIC' | 'BATTLE_ROYALE' | 'TEAM_DEATHMATCH' | 'BOSS_RAID' | 'AI';

export interface PublicPlayerInfo {
  id: string;
  name: string;
  color: string;
  tankClass: TankClass;
  kills: number;
  score: number;
}

export type ClientMessage =
  | {
      type: 'JOIN';
      name: string;
      color: string;
      tankClass: TankClass;
      mode?: GameMode;
      roomId?: string;
      botCount?: number;
      isSpectator?: boolean;
      team?: Team;
    }
  | {
      type: 'INPUT';
      up: boolean;
      down: boolean;
      left: boolean;
      right: boolean;
      turretAngle: number;
      isFiring: boolean;
      skillTrigger?: SkillType;
    }
  | { type: 'USE_SKILL'; skill: SkillType }
  | { type: 'RESPAWN' }
  | {
      type: 'SET_SPECTATOR';
      isSpectator: boolean;
      name?: string;
      color?: string;
      tankClass?: TankClass;
    }
  | { type: 'CHAT'; text: string }
  | { type: 'PING'; timestamp: number }
  | { type: 'TOGGLE_BOTS'; count?: number }
  | { type: 'SELECT_PERK'; perkId: PerkId };

export type ServerMessage =
  | {
      type: 'INIT';
      playerId: string;
      world: { width: number; height: number };
      obstacles: Obstacle[];
      snapshot: GameSnapshot;
      recentEvents: CombatEvent[];
      chatHistory: ChatMessage[];
      roomId?: string;
    }
  | { type: 'TICK'; snapshot: GameSnapshot }
  | { type: 'EVENT'; event: CombatEvent }
  | { type: 'CHAT'; message: ChatMessage }
  | { type: 'PONG'; clientTimestamp: number; serverTimestamp: number }
  | {
      type: 'LOBBY_STATE';
      totalSockets: number;
      publicOnlineCount: number;
      publicPlayers: PublicPlayerInfo[];
      activeRoomId?: string;
    };

export type WeatherType = 'DAWN' | 'DESERT' | 'RAIN' | 'SUNSET' | 'SNOW';

export interface WeatherInfo {
  type: WeatherType;
  name: string;
  vietnameseName: string;
  icon: string;
  themeColor: string;
  ambientColor: string;
  gridColor: string;
  groundBgColor: string;
  description: string;
}

export const WEATHER_CONFIGS: Record<WeatherType, WeatherInfo> = {
  DAWN: {
    type: 'DAWN',
    name: 'Dawn',
    vietnameseName: 'Bình Minh Rạng Rỡ',
    icon: '🌅',
    themeColor: '#f59e0b',
    ambientColor: 'rgba(251, 146, 60, 0.08)',
    gridColor: 'rgba(253, 186, 116, 0.12)',
    groundBgColor: '#0f172a',
    description: 'Ánh nắng ban mai vàng ấm, sương sớm dịu nhẹ phủ quanh chiến trường.',
  },
  DESERT: {
    type: 'DESERT',
    name: 'Desert',
    vietnameseName: 'Sa Mạc Cát Vàng',
    icon: '🏜️',
    themeColor: '#d97706',
    ambientColor: 'rgba(217, 119, 6, 0.12)',
    gridColor: 'rgba(245, 158, 11, 0.14)',
    groundBgColor: '#1c160c',
    description: 'Nắng sa mạc vàng óng, gió cát sa mạc cuộn bay mờ ảo khắp đấu trường.',
  },
  RAIN: {
    type: 'RAIN',
    name: 'Rain',
    vietnameseName: 'Mưa Bão Sấm Sét',
    icon: '🌧️',
    themeColor: '#0ea5e9',
    ambientColor: 'rgba(14, 165, 233, 0.12)',
    gridColor: 'rgba(56, 189, 248, 0.12)',
    groundBgColor: '#061021',
    description: 'Mưa giông rào rạt, giọt mưa bắn nước và chớp sấm chói rọi khắp bản đồ.',
  },
  SUNSET: {
    type: 'SUNSET',
    name: 'Sunset',
    vietnameseName: 'Hoàng Hôn Tím Đỏ',
    icon: '🌇',
    themeColor: '#ec4899',
    ambientColor: 'rgba(236, 72, 153, 0.1)',
    gridColor: 'rgba(244, 114, 182, 0.13)',
    groundBgColor: '#1a0d26',
    description: 'Bầu trời rực ánh tà dương huyền ảo, đốm lửa hoàng hôn lung linh.',
  },
  SNOW: {
    type: 'SNOW',
    name: 'Snow',
    vietnameseName: 'Tuyết Trắng Mùa Đông',
    icon: '❄️',
    themeColor: '#38bdf8',
    ambientColor: 'rgba(224, 242, 254, 0.09)',
    gridColor: 'rgba(186, 230, 253, 0.14)',
    groundBgColor: '#081426',
    description: 'Bông tuyết trắng tinh khôi lãng đãng rơi, phủ một lớp băng giá lạnh.',
  },
};

export const WEATHER_CYCLE: WeatherType[] = ['RAIN', 'DAWN', 'DESERT', 'SUNSET', 'SNOW'];

