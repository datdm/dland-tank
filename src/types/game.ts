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
}

export type GameMode = 'AI' | 'PUBLIC';

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
    }
  | {
      type: 'INPUT';
      up: boolean;
      down: boolean;
      left: boolean;
      right: boolean;
      turretAngle: number;
      isFiring: boolean;
    }
  | { type: 'RESPAWN' }
  | { type: 'CHAT'; text: string }
  | { type: 'PING'; timestamp: number }
  | { type: 'TOGGLE_BOTS'; count?: number };

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
