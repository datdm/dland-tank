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
  firingRange: number; // Tầm bắn hiệu dụng (pixels / meters)
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
    firingRange: 500,
    colorPreset: '#2563eb', // Blue
  },
  SCOUT: {
    name: 'Trinh Sát (Scout)',
    description: 'Cực nhanh, bắn tỉa tầm xa nhưng lượng máu thấp',
    speed: 6.0,
    maxHp: 80,
    fireCooldown: 210,
    bulletDamage: 18,
    bulletSpeed: 12.5,
    firingRange: 620,
    colorPreset: '#16a34a', // Green
  },
  JUGGERNAUT: {
    name: 'Thiết Giáp (Juggernaut)',
    description: 'Giáp siêu dày, pháo cối cự ly cận-trung chiến với sát thương cực đại',
    speed: 3.6,
    maxHp: 150,
    fireCooldown: 540,
    bulletDamage: 45,
    bulletSpeed: 9.0,
    firingRange: 400,
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

export interface AmmoConfig {
  type: BulletModifier;
  name: string;
  vietnameseName: string;
  icon: string;
  color: string;
  maxAmmo: number;        // Số lượng đạn cố định trong băng
  regenTimeSec: number;   // Thời gian hồi 1 viên đạn (giây)
  tag: string;
  description: string;
  tacticalInfo: string;
  tacticalVi: string;
  hotkey: string;
}

export const AMMO_TYPES: BulletModifier[] = [
  'STANDARD',
  'EXPLOSIVE',
  'TRIPLE',
  'PLASMA',
  'CRYO',
  'INCENDIARY',
  'RICOCHET',
  'PIERCING',
];

export const AMMO_CONFIGS: Record<BulletModifier, AmmoConfig> = {
  STANDARD: {
    type: 'STANDARD',
    name: 'Standard Kinetic',
    vietnameseName: 'Đạn Tiêu Chuẩn',
    icon: '⚡',
    color: '#38bdf8',
    maxAmmo: 15,
    regenTimeSec: 0.8,
    tag: 'ĐẠN CĂN BẢN',
    description: 'Băng đạn 15 viên, nạp hồi cực nhanh 0.8s/viên. Hỏa lực ổn định.',
    tacticalInfo: 'Standard: High fire rate, rapid reload, balanced kinetic damage',
    tacticalVi: 'Tiêu chuẩn: Tốc độ bắn cao, nạp hồi cực nhanh, sát thương ổn định',
    hotkey: '1',
  },
  EXPLOSIVE: {
    type: 'EXPLOSIVE',
    name: 'High Explosive',
    vietnameseName: 'Đại Bác Nổ Diện Rộng',
    icon: '💥',
    color: '#ef4444',
    maxAmmo: 5,
    regenTimeSec: 2.8,
    tag: 'SÁT THƯƠNG DIỆN RỘNG',
    description: 'Sát thương x1.45, gây nổ lan phá hủy xe tăng và tường gạch lân cận.',
    tacticalInfo: 'Explosive: High splash damage, low fire rate',
    tacticalVi: 'Nổ diện rộng: Sát thương lan cực lớn, tốc độ bắn chậm, phá vỡ công sự',
    hotkey: '2',
  },
  TRIPLE: {
    type: 'TRIPLE',
    name: 'Triple Spread',
    vietnameseName: 'Pháo Chùm 3 Tia',
    icon: '🔱',
    color: '#fbbf24',
    maxAmmo: 6,
    regenTimeSec: 2.2,
    tag: 'CÀN QUÉT GÓC RỘNG',
    description: 'Bắn 3 viên pháo góc quạt cùng lúc, quét sạch khu vực hẹp.',
    tacticalInfo: 'Triple: High spread burst, wide area coverage, lethal close-range',
    tacticalVi: 'Pháo chùm: Bắn quạt 3 tia, dồn sát thương cực mạnh ở cự ly gần',
    hotkey: '3',
  },
  PLASMA: {
    type: 'PLASMA',
    name: 'Hyper Plasma',
    vietnameseName: 'Laze Plasma Siêu Tốc',
    icon: '🔮',
    color: '#00f0ff',
    maxAmmo: 8,
    regenTimeSec: 1.6,
    tag: 'TỐC ĐỘ CAO & BẮN XA',
    description: 'Đạn bay nhanh x1.8, tầm bắn x1.35, thích hợp bắn tỉa cự ly xa.',
    tacticalInfo: 'Plasma: Hyper projectile velocity, extended sniper range',
    tacticalVi: 'Plasma: Vận tốc bay siêu tốc, tầm bắn xa vượt trội, tỉa mục tiêu từ xa',
    hotkey: '4',
  },
  CRYO: {
    type: 'CRYO',
    name: 'Cryo Freeze',
    vietnameseName: 'Băng Giá Làm Chậm',
    icon: '❄️',
    color: '#7dd3fc',
    maxAmmo: 6,
    regenTimeSec: 2.2,
    tag: 'KHỐNG CHẾ ĐỐI THỦ',
    description: 'Làm chậm tốc độ đối phương -48% trong 2.5s khi trúng đạn.',
    tacticalInfo: 'Cryo: Slows target movement',
    tacticalVi: 'Băng giá: Giảm 48% tốc độ di chuyển của địch trong 2.5s, khóa chân đối thủ',
    hotkey: '5',
  },
  INCENDIARY: {
    type: 'INCENDIARY',
    name: 'Incendiary Flame',
    vietnameseName: 'Lửa Thiêu Đốt Liên Tục',
    icon: '🔥',
    color: '#f97316',
    maxAmmo: 6,
    regenTimeSec: 2.2,
    tag: 'ĐỐT MÁU THEO GIÂY',
    description: 'Thiêu đốt xe địch, rút máu liên tục trong 3s bất kể giáp.',
    tacticalInfo: 'Incendiary: Burning damage over time, ignores heavy armor',
    tacticalVi: 'Thiêu đốt: Đốt máu liên tục trong 3s, bào mòn xe tăng bọc thép',
    hotkey: '6',
  },
  RICOCHET: {
    type: 'RICOCHET',
    name: 'Ricochet Kinetic',
    vietnameseName: 'Đạn Nảy Bật Tường',
    icon: '🪃',
    color: '#c084fc',
    maxAmmo: 7,
    regenTimeSec: 1.8,
    tag: 'NẢY 2 LẦN QUA VẬT CẢN',
    description: 'Bật nảy 2 lần trên tường kim loại/gạch, phục kích trong góc khuất.',
    tacticalInfo: 'Ricochet: Bounces twice off walls, bank shots around blind corners',
    tacticalVi: 'Đạn nảy: Bật nảy 2 lần qua tường, bắn tỉa đối thủ ẩn nấp sau góc cua',
    hotkey: '7',
  },
  PIERCING: {
    type: 'PIERCING',
    name: 'Armor Piercing',
    vietnameseName: 'Xuyên Phá Giáp Bê Tông',
    icon: '🎯',
    color: '#10b981',
    maxAmmo: 5,
    regenTimeSec: 2.8,
    tag: 'XUYÊN ĐỊCH (KHÔNG XUYÊN TƯỜNG)',
    description: 'Đạn nặng xuyên giáp, bắn xuyên qua nhiều xe tăng trên một đường thẳng (bị chặn bởi tường/chướng ngại vật).',
    tacticalInfo: 'Piercing: Penetrates multiple enemy tanks in line of fire (blocked by obstacles)',
    tacticalVi: 'Xuyên phá: Bắn xuyên thấu nhiều xe địch cùng lúc (bị cản bởi chướng ngại vật/tường)',
    hotkey: '8',
  },
};

export function createDefaultAmmoInventory(): Record<BulletModifier, number> {
  return {
    STANDARD: AMMO_CONFIGS.STANDARD.maxAmmo,
    EXPLOSIVE: AMMO_CONFIGS.EXPLOSIVE.maxAmmo,
    TRIPLE: AMMO_CONFIGS.TRIPLE.maxAmmo,
    PLASMA: AMMO_CONFIGS.PLASMA.maxAmmo,
    CRYO: AMMO_CONFIGS.CRYO.maxAmmo,
    INCENDIARY: AMMO_CONFIGS.INCENDIARY.maxAmmo,
    RICOCHET: AMMO_CONFIGS.RICOCHET.maxAmmo,
    PIERCING: AMMO_CONFIGS.PIERCING.maxAmmo,
  };
}

export function createDefaultAmmoRegenTimers(): Record<BulletModifier, number> {
  return {
    STANDARD: 0,
    EXPLOSIVE: 0,
    TRIPLE: 0,
    PLASMA: 0,
    CRYO: 0,
    INCENDIARY: 0,
    RICOCHET: 0,
    PIERCING: 0,
  };
}

export type AimMode = 'MOVEMENT' | 'MOUSE';

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

// ==========================================
// GARAGE / SKIN WORKSHOP & COSMETICS
// ==========================================
export type TankSkinId =
  | 'DEFAULT'
  | 'CAMO_WOODLAND'
  | 'ARCTIC_FROST'
  | 'VOLCANIC_MAGMA'
  | 'NEON_CYBERPUNK'
  | 'ROYAL_GOLD';

export interface TankSkinInfo {
  id: TankSkinId;
  name: string;
  vietnameseName: string;
  description: string;
  badge: string;
  primaryColor: string;
  secondaryColor: string;
  pattern: 'solid' | 'camo' | 'frost' | 'magma' | 'cyber' | 'gold';
  previewGradient: string;
}

export const TANK_SKINS: Record<TankSkinId, TankSkinInfo> = {
  DEFAULT: {
    id: 'DEFAULT',
    name: 'Classic Armor',
    vietnameseName: 'Sơn Tiêu Chuẩn',
    description: 'Lớp sơn quân sự nguyên bản theo màu sắc chiến xa chỉ huy đã chọn.',
    badge: 'MẶC ĐỊNH',
    primaryColor: '#2563eb',
    secondaryColor: '#1d4ed8',
    pattern: 'solid',
    previewGradient: 'from-blue-600 via-sky-700 to-slate-900 border-sky-400',
  },
  CAMO_WOODLAND: {
    id: 'CAMO_WOODLAND',
    name: 'Woodland Camo',
    vietnameseName: 'Rừng Rậm Rằn Ri (Camo)',
    description: 'Họa tiết rằn ri ngụy trang tác chiến rừng rậm, lẩn khuất giữa lùm cây.',
    badge: 'NGỤY TRANG',
    primaryColor: '#2d4a22',
    secondaryColor: '#4d7c0f',
    pattern: 'camo',
    previewGradient: 'from-lime-800 via-emerald-900 to-stone-900 border-lime-500',
  },
  ARCTIC_FROST: {
    id: 'ARCTIC_FROST',
    name: 'Arctic Frost',
    vietnameseName: 'Băng Tuyết Bắc Cực',
    description: 'Sơn phủ tinh thể băng giá vĩnh cửu phản quang ánh kim cương xanh lơ.',
    badge: 'BĂNG GIÁ',
    primaryColor: '#0ea5e9',
    secondaryColor: '#38bdf8',
    pattern: 'frost',
    previewGradient: 'from-sky-500 via-cyan-800 to-slate-900 border-cyan-400',
  },
  VOLCANIC_MAGMA: {
    id: 'VOLCANIC_MAGMA',
    name: 'Volcanic Magma',
    vietnameseName: 'Dung Nham Núi Lửa',
    description: 'Đá magma nứt nẻ rực cháy dung nham đỏ lửa từ lòng đất địa ngục.',
    badge: 'NHAM THẠCH',
    primaryColor: '#dc2626',
    secondaryColor: '#f97316',
    pattern: 'magma',
    previewGradient: 'from-red-600 via-orange-900 to-stone-950 border-orange-500',
  },
  NEON_CYBERPUNK: {
    id: 'NEON_CYBERPUNK',
    name: 'Cyberpunk Neon',
    vietnameseName: 'Neon Cyberpunk 2077',
    description: 'Đèn LED huỳnh quang tím hồng phát sáng phong cách tương lai viễn tưởng.',
    badge: 'CYBERPUNK',
    primaryColor: '#d946ef',
    secondaryColor: '#06b6d4',
    pattern: 'cyber',
    previewGradient: 'from-fuchsia-600 via-purple-900 to-cyan-950 border-fuchsia-400',
  },
  ROYAL_GOLD: {
    id: 'ROYAL_GOLD',
    name: 'Royal Gold Plated',
    vietnameseName: 'Mạ Vàng Hoàng Gia',
    description: 'Vỏ xe bọc vàng 24K khắc chạm phù điêu hoàng tộc bóng loáng chói lóa.',
    badge: 'HOÀNG GIA',
    primaryColor: '#eab308',
    secondaryColor: '#ca8a04',
    pattern: 'gold',
    previewGradient: 'from-yellow-400 via-amber-700 to-stone-950 border-yellow-300',
  },
};

export type BulletTrailId =
  | 'STANDARD'
  | 'PURPLE_LIGHTNING'
  | 'DRAGON_FIRE'
  | 'FROST_SNOW'
  | 'CYAN_LASER';

export interface BulletTrailInfo {
  id: BulletTrailId;
  name: string;
  vietnameseName: string;
  description: string;
  color: string;
  secondaryColor: string;
  icon: string;
}

export const BULLET_TRAILS: Record<BulletTrailId, BulletTrailInfo> = {
  STANDARD: {
    id: 'STANDARD',
    name: 'Standard Tracer',
    vietnameseName: 'Vệt Đạn Tiêu Chuẩn',
    description: 'Khói nhiệt và ánh lửa đạn pháo kinh điển.',
    color: '#fbbf24',
    secondaryColor: '#f59e0b',
    icon: '⚡',
  },
  PURPLE_LIGHTNING: {
    id: 'PURPLE_LIGHTNING',
    name: 'Purple Lightning Arc',
    vietnameseName: 'Vệt Tia Chớp Tím',
    description: 'Tia sét điện trường màu tím phóng điện lách tách theo đường đạn.',
    color: '#c084fc',
    secondaryColor: '#9333ea',
    icon: '🌩️',
  },
  DRAGON_FIRE: {
    id: 'DRAGON_FIRE',
    name: 'Dragon Flame Trail',
    vietnameseName: 'Vệt Lửa Rồng Thiêu Đốt',
    description: 'Bụi tàn than hồng và ngọn lửa rồng rực đỏ cuồn cuộn.',
    color: '#f97316',
    secondaryColor: '#ef4444',
    icon: '🔥',
  },
  FROST_SNOW: {
    id: 'FROST_SNOW',
    name: 'Blizzard Snowflake Trail',
    vietnameseName: 'Hạt Tuyết Rơi Băng Giá',
    description: 'Bụi tuyết trắng xóa và hoa tuyết tỏa sáng lấp lánh theo nòng đạn.',
    color: '#e0f2fe',
    secondaryColor: '#38bdf8',
    icon: '❄️',
  },
  CYAN_LASER: {
    id: 'CYAN_LASER',
    name: 'Cyan Laser Pulse',
    vietnameseName: 'Tia Laze Xanh Neon',
    description: 'Vệt laze plasma công nghệ cao rực sáng trong không trung.',
    color: '#00f0ff',
    secondaryColor: '#0284c7',
    icon: '✨',
  },
};

export type RoofDecalId =
  | 'NONE'
  | 'FLAG_VIETNAM'
  | 'PIRATE_SKULL'
  | 'TIGER_BEAST'
  | 'MILITARY_STAR'
  | 'DRAGON_CREST'
  | 'ROYAL_SHIELD';

export interface RoofDecalInfo {
  id: RoofDecalId;
  name: string;
  vietnameseName: string;
  icon: string;
  description: string;
}

export const ROOF_DECALS: Record<RoofDecalId, RoofDecalInfo> = {
  NONE: {
    id: 'NONE',
    name: 'No Decal',
    vietnameseName: 'Không Gắn Decal',
    icon: '🚫',
    description: 'Tháp pháo trơn cổ điển.',
  },
  FLAG_VIETNAM: {
    id: 'FLAG_VIETNAM',
    name: 'Vietnam Flag',
    vietnameseName: 'Cờ Đỏ Sao Vàng Việt Nam',
    icon: '🇻🇳',
    description: 'Lá cờ Tổ quốc Việt Nam tung bay oai hùng trên tháp pháo.',
  },
  PIRATE_SKULL: {
    id: 'PIRATE_SKULL',
    name: 'Jolly Roger Skull',
    vietnameseName: 'Cờ Hải Tặc Đầu Lâu',
    icon: '🏴‍☠️',
    description: 'Biểu tượng đầu lâu xương chéo cướp biển dũng mãnh.',
  },
  TIGER_BEAST: {
    id: 'TIGER_BEAST',
    name: 'Tiger Beast Crest',
    vietnameseName: 'Icon Mãnh Hổ Chiến Trận',
    icon: '🐯',
    description: 'Huy hiệu chúa sơn lâm uy dũng gầm vang nơi chiến tuyến.',
  },
  MILITARY_STAR: {
    id: 'MILITARY_STAR',
    name: 'Military Star',
    vietnameseName: 'Ngôi Sao Quân Sự Vàng',
    icon: '⭐',
    description: 'Huy chương ngôi sao vàng vinh quang lục quân.',
  },
  DRAGON_CREST: {
    id: 'DRAGON_CREST',
    name: 'Dragon Crest',
    vietnameseName: 'Biểu Tượng Rồng Lửa',
    icon: '🐉',
    description: 'Linh vật rồng huyền thoại ban phước cho hỏa lực.',
  },
  ROYAL_SHIELD: {
    id: 'ROYAL_SHIELD',
    name: 'Royal Shield',
    vietnameseName: 'Khiên Hiệp Sĩ Hoàng Gia',
    icon: '🛡️',
    description: 'Biểu tượng khiên bạc hộ vệ hoàng gia kiên cố.',
  },
};

// ==========================================
// COMBAT MEDALS & ACCOLADES
// ==========================================
export type CombatMedalType =
  | 'FIRST_BLOOD'
  | 'DOUBLE_KILL'
  | 'TRIPLE_KILL'
  | 'RAMPAGE'
  | 'UNSTOPPABLE'
  | 'GODLIKE'
  | 'SNIPER'
  | 'REVENGE';

export interface CombatMedalInfo {
  type: CombatMedalType;
  title: string;
  vietnameseTitle: string;
  subtitle: string;
  icon: string;
  color: string;
  bgGradient: string;
  voiceText: string;
  viVoiceText: string;
}

export const COMBAT_MEDALS: Record<CombatMedalType, CombatMedalInfo> = {
  FIRST_BLOOD: {
    type: 'FIRST_BLOOD',
    title: 'FIRST BLOOD!',
    vietnameseTitle: 'CHIẾN CÔNG ĐẦU!',
    subtitle: 'Mở màn phát súng tiêu diệt đầu tiên của trận đấu!',
    icon: '🩸',
    color: '#ef4444',
    bgGradient: 'from-rose-600 via-red-900 to-slate-950 border-rose-400',
    voiceText: 'First Blood!',
    viVoiceText: 'Chiến công đầu!',
  },
  DOUBLE_KILL: {
    type: 'DOUBLE_KILL',
    title: 'DOUBLE KILL!',
    vietnameseTitle: 'HẠ GỤC KÉP!',
    subtitle: 'Tiêu diệt liên tiếp 2 kẻ địch nhanh như chớp!',
    icon: '⚔️',
    color: '#f59e0b',
    bgGradient: 'from-amber-600 via-orange-900 to-slate-950 border-amber-400',
    voiceText: 'Double Kill!',
    viVoiceText: 'Hạ gục kép!',
  },
  TRIPLE_KILL: {
    type: 'TRIPLE_KILL',
    title: 'TRIPLE KILL!',
    vietnameseTitle: 'HẠ GỤC LIÊN HOÀN!',
    subtitle: 'Càn quét 3 xe địch liên tiếp trên chiến trường!',
    icon: '🔥',
    color: '#f97316',
    bgGradient: 'from-orange-600 via-amber-900 to-slate-950 border-orange-400',
    voiceText: 'Triple Kill!',
    viVoiceText: 'Hạ gục liên hoàn!',
  },
  RAMPAGE: {
    type: 'RAMPAGE',
    title: 'RAMPAGE!',
    vietnameseTitle: 'CUỒNG NỘ CHIẾN TRẬN!',
    subtitle: 'Chuỗi 5 mạng hạ gục không thể cản phá!',
    icon: '⚡',
    color: '#a855f7',
    bgGradient: 'from-purple-600 via-violet-900 to-slate-950 border-purple-400',
    voiceText: 'Rampage!',
    viVoiceText: 'Cuồng nộ chiến trận!',
  },
  UNSTOPPABLE: {
    type: 'UNSTOPPABLE',
    title: 'UNSTOPPABLE!',
    vietnameseTitle: 'BẤT KHẢ CHIẾN BẠI!',
    subtitle: 'Chuỗi 8 mạng hạ gục áp đảo toàn cõi sa trường!',
    icon: '🌪️',
    color: '#ec4899',
    bgGradient: 'from-pink-600 via-rose-900 to-slate-950 border-pink-400',
    voiceText: 'Unstoppable!',
    viVoiceText: 'Bất khả chiến bại!',
  },
  GODLIKE: {
    type: 'GODLIKE',
    title: 'GODLIKE!',
    vietnameseTitle: 'THẦN THÁNH CHIẾN XA!',
    subtitle: 'Chuỗi 10 mạng hạ gục thần thánh vô song!',
    icon: '👑',
    color: '#fbbf24',
    bgGradient: 'from-yellow-500 via-amber-800 to-slate-950 border-yellow-300',
    voiceText: 'Godlike!',
    viVoiceText: 'Thần thánh chiến xa!',
  },
  SNIPER: {
    type: 'SNIPER',
    title: 'SNIPER KILL!',
    vietnameseTitle: 'XẠ THỦ BẮN TỈA TẦM XA!',
    subtitle: 'Bắn trúng kẻ địch từ cự ly siêu xa ngoài tầm nhìn!',
    icon: '🎯',
    color: '#06b6d4',
    bgGradient: 'from-cyan-600 via-teal-900 to-slate-950 border-cyan-400',
    voiceText: 'Sniper!',
    viVoiceText: 'Xạ thủ bắn tỉa!',
  },
  REVENGE: {
    type: 'REVENGE',
    title: 'REVENGE!',
    vietnameseTitle: 'PHỤC THÙ RỬA HẬN!',
    subtitle: 'Bắn hạ chính kẻ vừa tiêu diệt bạn ở mạng trước!',
    icon: '💀',
    color: '#e11d48',
    bgGradient: 'from-red-600 via-stone-900 to-slate-950 border-red-400',
    voiceText: 'Revenge!',
    viVoiceText: 'Phục thù thành công!',
  },
};

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
  selectedAmmo?: BulletModifier;
  ammoInventory?: Record<BulletModifier, number>;
  ammoRegenTimers?: Record<BulletModifier, number>;
  slowUntil?: number;
  burnUntil?: number;
  skills?: TankSkillState;
  skillPoints?: number;
  skillLevels?: Record<SkillType, number>;
  level: number;
  exp: number;
  maxExp: number;
  perks: PerkId[];
  pendingPerkChoices?: PerkCard[];
  lastDamagedTime?: number;
  team?: Team;
  inStorm?: boolean;
  inHealingBase?: boolean;
  skinId?: TankSkinId;
  bulletTrail?: BulletTrailId;
  roofDecal?: RoofDecalId;
  lastKilledById?: string;
  matchType?: MatchType;
  rankTier?: RankTier;
  rankRp?: number;
  vx?: number;
  vy?: number;
  isDrifting?: boolean;
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
  trailEffect?: BulletTrailId;
  originX?: number;
  originY?: number;
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
  streak?: number;
  medal?: CombatMedalType;
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
  rankTier?: RankTier;
}

export interface GameSnapshot {
  tanks: PlayerTank[];
  bullets: Bullet[];
  powerUps: PowerUpCrate[];
  obstacles?: Obstacle[];
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
  weather?: WeatherType;
  weatherSecondsLeft?: number;
  hasBoss?: boolean;
  hasAI?: boolean;
  botCount?: number;
  botDifficulty?: BotDifficulty;
  isCustomRoom?: boolean;
  customRoomName?: string;
  customRoomCode?: string;
  isRoomHost?: boolean;
}

export type BotDifficulty = 'EASY' | 'NORMAL' | 'HARD';

export interface CustomRoomSummary {
  id: string;
  name: string;
  mode: GameMode;
  playerCount: number;
  maxPlayers: number;
  hasBoss: boolean;
  hasAI: boolean;
  botCount: number;
  matchType?: MatchType;
  botDifficulty?: BotDifficulty;
  weather?: WeatherType;
  hasPassword?: boolean;
  hostName?: string;
  createdAt?: number;
}

export type GameMode = 'PUBLIC' | 'BATTLE_ROYALE' | 'TEAM_DEATHMATCH' | 'BOSS_RAID' | 'AI';

export interface PublicPlayerInfo {
  id: string;
  name: string;
  color: string;
  tankClass: TankClass;
  kills: number;
  score: number;
  rankTier?: RankTier;
  rankRp?: number;
}

export type ClientMessage =
  | {
      type: 'JOIN';
      name: string;
      color: string;
      tankClass: TankClass;
      mode?: GameMode;
      matchType?: MatchType;
      rankTier?: RankTier;
      rankRp?: number;
      roomId?: string;
      botCount?: number;
      isSpectator?: boolean;
      team?: Team;
      skinId?: TankSkinId;
      bulletTrail?: BulletTrailId;
      roofDecal?: RoofDecalId;
      enableBoss?: boolean;
      bossHp?: number;
      initialWeather?: WeatherType;
      initialAmmo?: BulletModifier;
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
      selectedAmmo?: BulletModifier;
    }
  | { type: 'SWITCH_AMMO'; ammoType: BulletModifier }
  | { type: 'USE_SKILL'; skill: SkillType }
  | { type: 'UPGRADE_SKILL'; skill: SkillType }
  | { type: 'RESPAWN'; ammoType?: BulletModifier }
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
  | { type: 'SELECT_PERK'; perkId: PerkId }
  | {
      type: 'UPDATE_COSMETICS';
      skinId?: TankSkinId;
      bulletTrail?: BulletTrailId;
      roofDecal?: RoofDecalId;
    }
  | { type: 'SET_WEATHER'; weather: WeatherType }
  | {
      type: 'QUEUE_JOIN';
      matchType: MatchType;
      name: string;
      color: string;
      tankClass: TankClass;
      skinId?: TankSkinId;
      bulletTrail?: BulletTrailId;
      roofDecal?: RoofDecalId;
      rankTier?: RankTier;
      rankRp?: number;
    }
  | {
      type: 'QUEUE_LEAVE';
    }
  | {
      type: 'QUEUE_AUTO_FILL_BOTS';
    }
  | {
      type: 'TEAM_PING';
      x: number;
      y: number;
      pingType?: 'ATTACK' | 'DEFEND' | 'GATHER';
    }
  | {
      type: 'REGISTER_PROFILE';
      friendCode: string;
      name: string;
      color: string;
      tankClass: TankClass;
      rankRp?: number;
      rankTier?: RankTier;
      currentMode?: GameMode;
    }
  | {
      type: 'FRIEND_REQUEST';
      targetFriendCode?: string;
      targetPlayerId?: string;
      sender: {
        id: string;
        friendCode: string;
        name: string;
        color: string;
        tankClass: TankClass;
        rankRp: number;
        rankTier?: RankTier;
      };
    }
  | {
      type: 'FRIEND_ACCEPT';
      targetPlayerId: string;
      targetFriendCode?: string;
      sender: {
        id: string;
        friendCode: string;
        name: string;
        color: string;
        tankClass: TankClass;
        rankRp: number;
        rankTier?: RankTier;
      };
    }
  | {
      type: 'FRIEND_INVITE';
      targetPlayerId?: string;
      targetFriendCode?: string;
      senderName: string;
      matchType: MatchType;
      roomId: string;
      mode: GameMode;
    };

export interface QueueMatchedPlayer {
  id: string;
  name: string;
  color: string;
  tankClass: TankClass;
  rankRp?: number;
  rankTier?: RankTier;
  team: Team;
  isBot?: boolean;
}

export interface CustomRoomSummary {
  id: string;
  name: string;
  playerCount: number;
  botCount: number;
  hasBoss: boolean;
  mode: GameMode;
  weather?: WeatherType;
}

export interface OnlinePlayerInfo {
  id: string;
  friendCode: string;
  name: string;
  color: string;
  tankClass: TankClass;
  rankTier?: RankTier;
  rankRp?: number;
  status: 'ONLINE' | 'IN_BATTLE';
  currentMode?: GameMode;
  roomId?: string;
  isMe?: boolean;
}

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
      customRooms?: CustomRoomSummary[];
      activeRooms?: CustomRoomSummary[];
      onlinePlayers?: OnlinePlayerInfo[];
    }
  | {
      type: 'ONLINE_PLAYERS_UPDATE';
      players: OnlinePlayerInfo[];
    }
  | {
      type: 'FRIEND_REQUEST_RECEIVED';
      from: {
        id: string;
        friendCode: string;
        name: string;
        color: string;
        tankClass: TankClass;
        rankRp: number;
        rankTier?: RankTier;
      };
    }
  | {
      type: 'FRIEND_REQUEST_ACCEPTED';
      from: {
        id: string;
        friendCode: string;
        name: string;
        color: string;
        tankClass: TankClass;
        rankRp: number;
        rankTier?: RankTier;
      };
    }
  | {
      type: 'FRIEND_INVITE_RECEIVED';
      from: {
        senderId: string;
        senderName: string;
        matchType: MatchType;
        roomId: string;
        mode: GameMode;
      };
    }
  | {
      type: 'QUEUE_STATUS';
      matchType: MatchType;
      inQueue: boolean;
      currentCount: number; // 1 to 6
      targetCount: 6;
      elapsedSeconds: number;
      estimatedSeconds: number;
      players: QueueMatchedPlayer[];
    }
  | {
      type: 'QUEUE_MATCH_FOUND';
      matchType: MatchType;
      roomId: string;
      myTeam: Team;
      redTeam: QueueMatchedPlayer[];
      blueTeam: QueueMatchedPlayer[];
      countdown: number;
    }
  | {
      type: 'TEAM_BEACON';
      x: number;
      y: number;
      timestamp: number;
      pingType?: 'ATTACK' | 'DEFEND' | 'GATHER';
      senderName: string;
      senderId: string;
      team: Team;
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
  tacticalEffectTitle: string;
  tacticalEffectDesc: string;
  frictionFactor: number;
  radarVisibilityRange?: number; // In world units: e.g. 520 for desert sandstorm
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
    tacticalEffectTitle: 'TẦM NHÌN QUANG ĐÃNG',
    tacticalEffectDesc: 'Độ bám đường hoàn hảo, tầm quét radar Minimap tối đa không giới hạn.',
    frictionFactor: 1.0,
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
    tacticalEffectTitle: 'BÃO CÁT MÙ MINIMAP',
    tacticalEffectDesc: 'Bão cát làm nhiễu sóng radar Minimap, che khuất đối thủ ngoài 520m; gió cát cản trở cơ động nhẹ.',
    frictionFactor: 0.96,
    radarVisibilityRange: 520,
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
    tacticalEffectTitle: 'ĐƯỜNG ƯỚT TRƠN MƯA',
    tacticalEffectDesc: 'Mặt sân ướt sũng tạo tia nước bắn tung tóe, độ bám bánh xe giảm nhẹ 6%.',
    frictionFactor: 0.94,
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
    tacticalEffectTitle: 'CƠ ĐỘNG TIÊU CHUẨN',
    tacticalEffectDesc: 'Gió chiều êm ả, động cơ vận hành ổn định và bám đường bình thường.',
    frictionFactor: 1.0,
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
    tacticalEffectTitle: 'MẶT BĂNG TRƠN TRƯỢT',
    tacticalEffectDesc: 'Băng tuyết làm xe trơn trượt nhẹ khi bẻ lái hoặc phanh gấp, quán tính trượt vệt bánh trên tuyết.',
    frictionFactor: 0.84,
  },
};

export const WEATHER_CYCLE: WeatherType[] = ['RAIN', 'DAWN', 'DESERT', 'SUNSET', 'SNOW'];

// ==========================================
// MATCH TYPE & COMPETITIVE RANK SYSTEM
// ==========================================
export type MatchType = 'CASUAL' | 'RANKED';

export type RankTier =
  | 'BRONZE'
  | 'SILVER'
  | 'GOLD'
  | 'PLATINUM'
  | 'DIAMOND'
  | 'MASTER'
  | 'CHALLENGER';

export interface RankInfo {
  tier: RankTier;
  division: number; // 1 (highest) to 4
  rp: number;
  name: string;
  vietnameseName: string;
  badge: string;
  icon: string;
  color: string;
  borderColor: string;
  bgGradient: string;
  minRp: number;
  maxRp: number;
}

export const RANK_TIERS: Record<RankTier, {
  tier: RankTier;
  name: string;
  vietnameseName: string;
  icon: string;
  color: string;
  borderColor: string;
  bgGradient: string;
  minRp: number;
  maxRp: number;
}> = {
  BRONZE: {
    tier: 'BRONZE',
    name: 'Bronze',
    vietnameseName: 'Đồng Thiết Giáp',
    icon: '🥉',
    color: '#cd7f32',
    borderColor: 'border-amber-700/60',
    bgGradient: 'from-amber-950 via-stone-900 to-slate-950',
    minRp: 0,
    maxRp: 399,
  },
  SILVER: {
    tier: 'SILVER',
    name: 'Silver',
    vietnameseName: 'Bạc Chiến Tuyến',
    icon: '🥈',
    color: '#cbd5e1',
    borderColor: 'border-slate-400/60',
    bgGradient: 'from-slate-800 via-slate-900 to-slate-950',
    minRp: 400,
    maxRp: 799,
  },
  GOLD: {
    tier: 'GOLD',
    name: 'Gold',
    vietnameseName: 'Vàng Hoàng Kim',
    icon: '🥇',
    color: '#eab308',
    borderColor: 'border-yellow-500/70',
    bgGradient: 'from-amber-900/90 via-yellow-950/80 to-slate-950',
    minRp: 800,
    maxRp: 1199,
  },
  PLATINUM: {
    tier: 'PLATINUM',
    name: 'Platinum',
    vietnameseName: 'Bạch Kim Tinh Anh',
    icon: '💠',
    color: '#38bdf8',
    borderColor: 'border-sky-400/70',
    bgGradient: 'from-cyan-950 via-sky-950 to-slate-950',
    minRp: 1200,
    maxRp: 1599,
  },
  DIAMOND: {
    tier: 'DIAMOND',
    name: 'Diamond',
    vietnameseName: 'Kim Cương Bất Bại',
    icon: '💎',
    color: '#a855f7',
    borderColor: 'border-purple-500/80',
    bgGradient: 'from-purple-950 via-fuchsia-950 to-slate-950',
    minRp: 1600,
    maxRp: 1999,
  },
  MASTER: {
    tier: 'MASTER',
    name: 'Master',
    vietnameseName: 'Cao Thủ Chiến Trường',
    icon: '👑',
    color: '#f43f5e',
    borderColor: 'border-rose-500/90',
    bgGradient: 'from-rose-950 via-red-950 to-slate-950',
    minRp: 2000,
    maxRp: 2499,
  },
  CHALLENGER: {
    tier: 'CHALLENGER',
    name: 'Challenger',
    vietnameseName: 'Thách Đấu Huyền Thoại',
    icon: '⚡',
    color: '#f59e0b',
    borderColor: 'border-amber-400 ring-2 ring-amber-400/40',
    bgGradient: 'from-amber-900 via-orange-950 to-slate-950',
    minRp: 2500,
    maxRp: 99999,
  },
};

export function getRankFromRp(rp: number): RankInfo & {
  progressToNext: number;
  nextTierRp: number;
} {
  const safeRp = Math.max(0, Math.round(rp));
  let tier: RankTier = 'BRONZE';
  if (safeRp >= 2500) tier = 'CHALLENGER';
  else if (safeRp >= 2000) tier = 'MASTER';
  else if (safeRp >= 1600) tier = 'DIAMOND';
  else if (safeRp >= 1200) tier = 'PLATINUM';
  else if (safeRp >= 800) tier = 'GOLD';
  else if (safeRp >= 400) tier = 'SILVER';
  else tier = 'BRONZE';

  const cfg = RANK_TIERS[tier];
  const tierRange = Math.max(1, cfg.maxRp - cfg.minRp + 1);
  const rpInTier = safeRp - cfg.minRp;

  // Calculate division (IV -> I)
  let division = 4;
  if (tier === 'CHALLENGER') {
    division = 1;
  } else if (tier === 'MASTER') {
    division = rpInTier >= 250 ? 1 : 2;
  } else {
    const step = tierRange / 4;
    division = Math.max(1, 4 - Math.floor(rpInTier / step));
  }

  const divisionRoman = ['I', 'II', 'III', 'IV'][division - 1] || 'IV';
  const badge = tier === 'CHALLENGER' ? 'THÁCH ĐẤU' : `${cfg.name.toUpperCase()} ${divisionRoman}`;
  const nextTierRp = cfg.maxRp + 1;
  const progressToNext = tier === 'CHALLENGER' ? 100 : Math.min(100, Math.max(0, Math.round((rpInTier / tierRange) * 100)));

  return {
    tier,
    division,
    rp: safeRp,
    name: `${cfg.name} ${divisionRoman}`,
    vietnameseName: `${cfg.vietnameseName} ${divisionRoman}`,
    badge,
    icon: cfg.icon,
    color: cfg.color,
    borderColor: cfg.borderColor,
    bgGradient: cfg.bgGradient,
    minRp: cfg.minRp,
    maxRp: cfg.maxRp,
    progressToNext,
    nextTierRp,
  };
}

// ==========================================
// FRIENDS & PARTY SYSTEM
// ==========================================
export interface FriendUser {
  id: string;
  friendCode: string;
  name: string;
  color: string;
  tankClass: TankClass;
  rankTier: RankTier;
  rankRp: number;
  status: 'ONLINE' | 'IN_BATTLE' | 'OFFLINE';
  currentMode?: GameMode;
  roomId?: string;
  lastActive: string;
}

export const DEFAULT_SAMPLE_FRIENDS: FriendUser[] = [];


