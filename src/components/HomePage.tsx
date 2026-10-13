import { getPlayerStats, PlayerRecordStats } from '../utils/playerStats';
import { UserAccount, updateUserName } from '../utils/auth';
import React, { useState, useEffect, useRef } from 'react';
import {
  TankClass,
  TANK_CLASSES,
  GameMode,
  Team,
  PublicPlayerInfo,
  WeatherType,
  WEATHER_CONFIGS,
  WEATHER_CYCLE,
  TankSkinId,
  TANK_SKINS,
  BulletTrailId,
  BULLET_TRAILS,
  RoofDecalId,
  ROOF_DECALS,
  COMBAT_MEDALS,
  CombatMedalType,
  AimMode,
  MatchType,
  RankTier,
  getRankFromRp,
  CustomRoomSummary,
} from '../types/game';
import { sounds } from '../utils/audio';
import { TankVisual } from './TankVisual';
import { DecalBadge } from './DecalBadge';
import { HelpModal } from './HelpModal';
import { GarageModal } from './GarageModal';
import { FriendsModal } from './FriendsModal';
import { BattleSelectModal } from './BattleSelectModal';
import { CustomRoomModal } from './CustomRoomModal';
import { WeatherBackgroundCanvas } from './WeatherBackgroundCanvas';
import { ProfilePage } from './ProfilePage';
import {
  User,
  Swords,
  Shield,
  Zap,
  Crosshair,
  Users,
  Bot,
  Globe,
  Volume2,
  VolumeX,
  Check,
  Wifi,
  Copy,
  Smartphone,
  Monitor,
  AlertTriangle,
  Sparkles,
  Eye,
  HelpCircle,
  Skull,
  Crown,
  Flame,
  Palette,
  Music,
  Sliders,
  Radio,
  Trophy,
  Dices,
  Play,
  RotateCw,
  Award,
  Layers,
  Flag,
  Share2,
  ChevronRight,
  Target,
  Gamepad2,
  Mouse,
  UserPlus,
} from 'lucide-react';

interface HomePageProps {
  onJoin: (
    name: string,
    color: string,
    tankClass: TankClass,
    mode: GameMode,
    botCount: number,
    customRoomId?: string,
    isSpectator?: boolean,
    team?: Team,
    skinId?: TankSkinId,
    bulletTrail?: BulletTrailId,
    roofDecal?: RoofDecalId,
    matchType?: MatchType,
    enableBoss?: boolean,
    bossHp?: number,
    initialWeather?: WeatherType
  ) => void;
  onlineCount: number;
  isSocketConnected: boolean;
  publicPlayers?: PublicPlayerInfo[];
  customRooms?: CustomRoomSummary[];
  initialMode?: GameMode;
  initialRoomId?: string;
  currentWeather?: WeatherType;
  ping?: number;
  aimMode?: AimMode;
  onAimModeChange?: (mode: AimMode) => void;
  playerRankRp?: number;
  onUpdateRankRp?: (rp: number) => void;
  onStartQueue?: (
    matchType: MatchType,
    name: string,
    color: string,
    tankClass: TankClass,
    skinId?: TankSkinId,
    bulletTrail?: BulletTrailId,
    roofDecal?: RoofDecalId
  ) => void;
  userSkin?: TankSkinId;
  userTrail?: BulletTrailId;
  userDecal?: RoofDecalId;
  onSaveCosmetics?: (cosmetics: {
    skinId: TankSkinId;
    bulletTrail: BulletTrailId;
    roofDecal: RoofDecalId;
  }) => void;
  currentUser?: UserAccount;
  onOpenAccountModal?: () => void;
  onUserChange?: (user: UserAccount) => void;
  initialTab?: 'home' | 'profile' | 'modes' | 'arsenal' | 'garage' | 'medals' | 'settings';
}

const COLOR_PRESETS = [
  { name: 'Xanh Chiến Thuật', hex: '#2563eb' },
  { name: 'Rừng Rậm Camo', hex: '#16a34a' },
  { name: 'Sa Mạc Hoàng Kim', hex: '#d97706' },
  { name: 'Hỏa Ngục Đỏ', hex: '#dc2626' },
  { name: 'Bóng Đêm Onyx', hex: '#475569' },
  { name: 'Tím Không Gian', hex: '#7c3aed' },
];

const BOT_OPTIONS = [
  { count: 1, label: '1 Bot (1v1)' },
  { count: 3, label: '3 Bot (Nhẹ Nhàng)' },
  { count: 5, label: '5 Bot (Tiêu Chuẩn)' },
  { count: 7, label: '7 Bot (Thử Thách)' },
  { count: 10, label: '10 Bot (Khốc Liệt)' },
  { count: 14, label: '14 Bot (Đại Chiến)' },
];

const RANDOM_NAMES = [
  'Chiến Thần T90',
  'Hắc Báo Sấm Sét',
  'Bão Lửa Sa Mạc',
  'Pháo Kích Tầm Xa',
  'Thiết Giáp Thép',
  'Đại Bàng Biển Đông',
  'Sát Thủ Vô Ảnh',
  'Quang Trung Đại Phá',
  'Cương Lĩnh Tác Chiến',
  'Thần Sấm 72',
  'Phục Thù Chiến Hạm',
  'Mãnh Hổ Trường Sơn',
];

export const HomePage: React.FC<HomePageProps> = ({
  onJoin,
  onlineCount,
  isSocketConnected,
  publicPlayers = [],
  customRooms = [],
  initialMode = 'PUBLIC',
  initialRoomId = 'public',
  currentWeather = 'RAIN',
  ping = 18,
  aimMode,
  onAimModeChange,
  playerRankRp,
  onUpdateRankRp,
  onStartQueue,
  userSkin: propUserSkin,
  userTrail: propUserTrail,
  userDecal: propUserDecal,
  onSaveCosmetics: propOnSaveCosmetics,
  currentUser,
  onOpenAccountModal,
  onUserChange,
  initialTab,
}) => {
  // Navigation Tabs: 'home' | 'profile' | 'modes' | 'arsenal' | 'garage' | 'medals' | 'settings'
  const [activeTab, setActiveTab] = useState<'home' | 'profile' | 'modes' | 'arsenal' | 'garage' | 'medals' | 'settings'>(
    initialTab || 'home'
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [playerStats, setPlayerStats] = useState<PlayerRecordStats>(() => getPlayerStats());
  useEffect(() => {
    setPlayerStats(getPlayerStats());
  }, [activeTab]);

  // Competitive Match Type State: 'CASUAL' (Đấu Thường) vs 'RANKED' (Đấu Rank RP)
  const [matchType, setMatchType] = useState<MatchType>('CASUAL');
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [isCustomRoomModalOpen, setIsCustomRoomModalOpen] = useState(false);
  const [rankRp, setRankRp] = useState<number>(() => {
    if (typeof playerRankRp === 'number') return playerRankRp;
    const saved = localStorage.getItem('tank_player_rp');
    return saved ? Number(saved) : 850;
  });

  useEffect(() => {
    if (typeof playerRankRp === 'number') {
      setRankRp(playerRankRp);
    }
  }, [playerRankRp]);

  const myRank = getRankFromRp(rankRp);

  // Aim Mode State
  const [localAimMode, setLocalAimMode] = useState<AimMode>(() => {
    return (localStorage.getItem('tank_aim_mode') as AimMode) || 'MOVEMENT';
  });
  const currentAimMode = aimMode || localAimMode;
  const handleSelectAimMode = (mode: AimMode) => {
    setLocalAimMode(mode);
    localStorage.setItem('tank_aim_mode', mode);
    if (onAimModeChange) {
      onAimModeChange(mode);
    }
    sounds.playPowerUp();
  };

  // Player Setup
  const [name, setName] = useState(() => {
    return currentUser?.name || localStorage.getItem('tank_player_name') || RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
  });

  // Automatically keep player display name synchronized when logged in account changes
  useEffect(() => {
    if (currentUser?.name && currentUser.name !== name) {
      setName(currentUser.name);
    }
  }, [currentUser?.name]);
  const [tankClass, setTankClass] = useState<TankClass>('STRIKER');
  const [color, setColor] = useState('#2563eb');
  const [mode, setMode] = useState<GameMode>(initialMode);
  const [selectedTeam, setSelectedTeam] = useState<Team>('RED');
  const [botCount, setBotCount] = useState<number>(5);
  const [roomId, setRoomId] = useState<string>(initialRoomId);

  // Cosmetics (Synchronized with Props & LocalStorage)
  const [skinId, setSkinId] = useState<TankSkinId>(
    () => propUserSkin || (localStorage.getItem('tank_skin') as TankSkinId) || 'DEFAULT'
  );
  const [bulletTrail, setBulletTrail] = useState<BulletTrailId>(
    () => propUserTrail || (localStorage.getItem('tank_trail') as BulletTrailId) || 'STANDARD'
  );
  const [roofDecal, setRoofDecal] = useState<RoofDecalId>(
    () => propUserDecal || (localStorage.getItem('tank_decal') as RoofDecalId) || 'FLAG_VIETNAM'
  );
  const [cosmeticsToast, setCosmeticsToast] = useState<{ show: boolean; text: string } | null>(null);

  useEffect(() => {
    if (propUserSkin && propUserSkin !== skinId) setSkinId(propUserSkin);
  }, [propUserSkin]);

  useEffect(() => {
    if (propUserTrail && propUserTrail !== bulletTrail) setBulletTrail(propUserTrail);
  }, [propUserTrail]);

  useEffect(() => {
    if (propUserDecal && propUserDecal !== roofDecal) setRoofDecal(propUserDecal);
  }, [propUserDecal]);
  const [isGarageModalOpen, setIsGarageModalOpen] = useState(false);
  const [arsenalSubTab, setArsenalSubTab] = useState<'classes' | 'skins'>('classes');

  // Weather Simulation state (Rain, Desert, Snow, etc.)
  const [activeWeather, setActiveWeather] = useState<WeatherType>(currentWeather || 'RAIN');

  // Short Landscape & Mobile Portrait Viewport States
  const [isMobilePortrait, setIsMobilePortrait] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isPortrait = window.innerHeight > window.innerWidth;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmall = window.innerWidth <= 768;
    return isPortrait && (isSmall || isTouch);
  });
  const [isShortLandscape, setIsShortLandscape] = useState(() => {
    return typeof window !== 'undefined' && window.innerHeight <= 620 && window.innerWidth > window.innerHeight;
  });
  const [isMobileScreen, setIsMobileScreen] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth < 640;
  });
  // User can toggle small car image vs enlarged on mobile (default compact/small as requested)
  const [isMobileTankEnlarged, setIsMobileTankEnlarged] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmall = window.innerWidth <= 768;
      setIsMobilePortrait(isPortrait && (isSmall || isTouch));
      setIsShortLandscape(window.innerHeight <= 620 && window.innerWidth > window.innerHeight);
      setIsMobileScreen(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Sync when parent changes weather
  useEffect(() => {
    if (currentWeather) {
      setActiveWeather(currentWeather);
    }
  }, [currentWeather]);

  // Audio state
  const [isMuted, setIsMuted] = useState(sounds.getIsMuted());
  const [musicVol, setMusicVol] = useState(Math.round(sounds.getMusicVolume() * 100));
  const [sfxVol, setSfxVol] = useState(Math.round(sounds.getSfxVolume() * 100));
  const [voiceEnabled, setVoiceEnabled] = useState(sounds.getVoiceEnabled());
  const [isMusicPlaying, setIsMusicPlaying] = useState(sounds.getIsMusicPlaying());

  // Interactive Turret Angle in Hero Showcase
  const [turretAngle, setTurretAngle] = useState(0);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isBattleModalOpen, setIsBattleModalOpen] = useState(false);

  // Mobile Notice Dialog
  const [showMobileNotice, setShowMobileNotice] = useState(false);

  const activeWeatherCfg = WEATHER_CONFIGS[activeWeather] || WEATHER_CONFIGS.RAIN;
  const currentStats = TANK_CLASSES[tankClass];
  const activeSkin = TANK_SKINS[skinId] || TANK_SKINS.DEFAULT;
  const activeTrail = BULLET_TRAILS[bulletTrail] || BULLET_TRAILS.STANDARD;
  const activeDecal = ROOF_DECALS[roofDecal] || ROOF_DECALS.FLAG_VIETNAM;

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || '';
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

      if ((isMobileUA || (isTouch && isSmallScreen)) && !sessionStorage.getItem('dismissed_mobile_notice')) {
        setShowMobileNotice(true);
      }
    };
    checkMobile();
  }, []);

  // Idle turret rotation animation in hero showcase
  useEffect(() => {
    const interval = setInterval(() => {
      setTurretAngle((prev) => (prev + 0.8) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const handleRandomizeName = () => {
    sounds.playRadioBeep();
    const chosen = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    setName(chosen);
    updateUserName(chosen);
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleMusic = () => {
    const isPlaying = sounds.toggleMusic();
    setIsMusicPlaying(isPlaying);
  };

  const handleCycleWeather = () => {
    const cycle: WeatherType[] = ['RAIN', 'DESERT', 'SNOW', 'SUNSET', 'DAWN'];
    const nextIdx = (cycle.indexOf(activeWeather) + 1) % cycle.length;
    const nextWeather = cycle[nextIdx];
    setActiveWeather(nextWeather);
    sounds.playRadioBeep();
  };

  const handleCopyInviteLink = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', mode);
    if (roomId && roomId !== 'public') {
      url.searchParams.set('room', roomId);
    } else {
      url.searchParams.delete('room');
    }

    const shareUrl = url.toString();
    const shareTitle = 'DLAND TANK - Đại Chiến Xe Tăng 3D';
    const shareText = `Vào chiến trường DLAND TANK ngay cùng mình! Chế độ: ${
      mode === 'TEAM_DEATHMATCH' ? (matchType === 'RANKED' ? 'Đấu Rank 3v3' : 'Đấu Thường 3v3') : 'Chiến Trường Sinh Tử'
    }`;

    // Try Web Share API on mobile (Zalo, Messenger, SMS, etc.)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setCopiedLink(true);
        sounds.playRadioBeep();
        setTimeout(() => setCopiedLink(false), 2500);
        return;
      } catch {
        // User cancelled or share failed, fallback to clipboard
      }
    }

    // Fallback to Clipboard copy
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedLink(true);
        sounds.playRadioBeep();
        setTimeout(() => setCopiedLink(false), 2500);
      });
    }
  };

  const handleSaveCosmetics = (cosmetics: {
    skinId: TankSkinId;
    bulletTrail: BulletTrailId;
    roofDecal: RoofDecalId;
  }) => {
    setSkinId(cosmetics.skinId);
    setBulletTrail(cosmetics.bulletTrail);
    setRoofDecal(cosmetics.roofDecal);
    try {
      localStorage.setItem('tank_skin', cosmetics.skinId);
      localStorage.setItem('tank_trail', cosmetics.bulletTrail);
      localStorage.setItem('tank_decal', cosmetics.roofDecal);
    } catch (err) {
      console.warn('Failed to save cosmetics to localStorage:', err);
    }
    if (propOnSaveCosmetics) {
      propOnSaveCosmetics(cosmetics);
    }
    const skinName = TANK_SKINS[cosmetics.skinId]?.vietnameseName || cosmetics.skinId;
    const trailName = BULLET_TRAILS[cosmetics.bulletTrail]?.vietnameseName || cosmetics.bulletTrail;
    const decalName = ROOF_DECALS[cosmetics.roofDecal]?.vietnameseName || cosmetics.roofDecal;
    setCosmeticsToast({
      show: true,
      text: `✓ ĐÃ TRANG BỊ & LƯU: ${skinName} • Vệt ${trailName} • Decal ${decalName}`,
    });
    setTimeout(() => {
      setCosmeticsToast(null);
    }, 3200);
  };

  const handleStartBattle = (asSpectator: boolean = false) => {
    const finalName = name.trim() || 'Chỉ Huy Xe Tăng';
    sounds.playShoot(tankClass === 'JUGGERNAUT');
    sounds.startBgm();

    const isCustomNamedRoom = roomId && (roomId.startsWith('custom_') || roomId.startsWith('phong_') || roomId !== 'public' && roomId !== 'public_user' && roomId !== 'public_ai');

    // Spectator, or Public FFA arena, or AI Bot practice, or Boss Raid, or Custom Room -> Instant join
    if (asSpectator || mode === 'PUBLIC' || mode === 'AI' || mode === 'BOSS_RAID' || mode === 'BATTLE_ROYALE' || isCustomNamedRoom) {
      const finalBots = (mode === 'AI' || isCustomNamedRoom) ? botCount : 0;
      onJoin(
        finalName,
        color,
        tankClass,
        mode,
        finalBots,
        roomId,
        asSpectator,
        selectedTeam,
        skinId,
        bulletTrail,
        roofDecal,
        matchType,
        mode === 'BOSS_RAID'
      );
      return;
    }

    // User requirement: Ranked or Casual 3v3 requires 6 players at same time, 2 teams, waiting screen with cancel
    if (onStartQueue) {
      onStartQueue(matchType, finalName, color, tankClass, skinId, bulletTrail, roofDecal);
    } else {
      onJoin(
        finalName,
        color,
        tankClass,
        mode,
        0,
        roomId,
        asSpectator,
        selectedTeam,
        skinId,
        bulletTrail,
        roofDecal,
        matchType
      );
    }
  };

  const handleJoinFriendRoom = (friendRoomId: string, friendMode: GameMode) => {
    setMode(friendMode);
    setRoomId(friendRoomId);
    const finalName = name.trim() || 'Chỉ Huy Xe Tăng';
    sounds.playShoot(tankClass === 'JUGGERNAUT');
    sounds.startBgm();
    onJoin(
      finalName,
      color,
      tankClass,
      friendMode,
      0,
      friendRoomId,
      false,
      selectedTeam,
      skinId,
      bulletTrail,
      roofDecal,
      matchType
    );
  };

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
      {/* Floating Cosmetics Equip & Save Success Toast */}
      {cosmeticsToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-60 animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-none max-w-md w-[92%]">
          <div className="bg-slate-950/95 border-2 border-emerald-400 text-white px-4 py-2.5 rounded-2xl shadow-2xl shadow-emerald-500/30 backdrop-blur-md flex items-center justify-center gap-2 text-xs sm:text-sm font-mono font-black">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[3]" />
            <span className="truncate">{cosmeticsToast.text}</span>
          </div>
        </div>
      )}
      {/* Dynamic Battlefield Weather Atmospheric Background (Rainstorm, Sandstorm, Snow, Sunset, Dawn) */}
      <WeatherBackgroundCanvas weather={activeWeather} />

      {/* Floating Toast Notification when Equipping & Saving Cosmetics */}
      {cosmeticsToast && cosmeticsToast.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-60 animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-auto">
          <div className="bg-slate-900/95 border-2 border-emerald-400 text-white px-4 py-2.5 rounded-2xl shadow-2xl shadow-emerald-500/30 backdrop-blur-md flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div className="text-xs font-mono font-black text-emerald-300 tracking-wide">
              {cosmeticsToast.text}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Landscape Tips Dialog: Frosted Glassmorphism Modal */}
      {showMobileNotice && !isMobilePortrait && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="relative max-w-[280px] sm:max-w-xs w-full bg-slate-900/95 border border-emerald-500/40 rounded-2xl p-3.5 sm:p-4 shadow-2xl text-center space-y-2 sm:space-y-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 mx-auto rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-mono font-black text-white text-[11px] sm:text-xs uppercase tracking-wide">
                Chế Độ Di Động Ngang
              </h3>
              <p className="text-[9px] sm:text-[10px] text-slate-300 font-mono mt-0.5 leading-relaxed">
                Điều khiển xe tăng bằng Cần gạt ảo & Nút bắn cảm ứng ở hai bên màn hình.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem('dismissed_mobile_notice', 'true');
                setShowMobileNotice(false);
                sounds.playRadioBeep();
              }}
              className="w-full py-1.5 sm:py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-mono font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* TOP NAVIGATION BAR - LIÊN QUÂN MOBILE STYLE */}
      <header className={`relative z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-2 sm:px-4 md:px-6 lg:px-8 ${isShortLandscape ? 'h-9 py-0' : 'h-11 sm:h-12 md:h-14 lg:h-16 py-1 md:py-2'} flex items-center justify-between shrink-0 shadow-lg`}>
        {/* Left: Player Profile Card (Avatar with Rank Frame, Name, Level Bar) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3.5 lg:gap-4">
          {/* Avatar with Rank Frame */}
          <div
            onClick={() => {
              setActiveTab('profile');
              sounds.playRadioBeep();
            }}
            className="relative cursor-pointer group shrink-0"
            title="Nhấn để xem Hồ Sơ & Thông tin chỉ huy"
          >
            <div className={`${isShortLandscape ? 'w-7 h-7 text-xs' : 'w-8 sm:w-9 md:w-11 lg:w-12 h-8 sm:h-9 md:h-11 lg:h-12 text-sm md:text-base lg:text-lg'} rounded-full border-2 border-amber-400 bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center font-bold text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform`}>
              <span>{myRank.icon}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 text-[7px] md:text-[9px] lg:text-[10px] font-black bg-amber-500 text-slate-950 px-1 lg:px-1.5 py-0.2 rounded-full border border-slate-900">
              {myRank.tier}
            </div>
          </div>

          {/* Player Name & Quick Randomize & Rank */}
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-1 md:gap-1.5">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setName(newName);
                  updateUserName(newName);
                }}
                maxLength={20}
                placeholder="Tên xe..."
                className={`bg-slate-900/80 border border-slate-700/60 hover:border-amber-400/60 focus:border-amber-400 rounded-md md:rounded-lg px-1.5 md:px-2.5 text-white font-mono font-bold focus:outline-none transition-colors ${
                  isShortLandscape ? 'text-[8.5px] h-5 w-24 sm:w-28' : 'text-[9.5px] sm:text-xs md:text-sm h-6 sm:h-7 md:h-8 w-28 sm:w-36 md:w-40'
                }`}
                title="Chạm để đổi tên chỉ huy"
              />
              <button
                type="button"
                onClick={handleRandomizeName}
                className="p-1 md:p-1.5 rounded-md md:rounded-lg bg-slate-900 border border-slate-700 text-amber-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Tạo tên ngẫu nhiên"
              >
                <Dices className={`${isShortLandscape ? 'w-2.5 h-2.5' : 'w-3 h-3 md:w-3.5 md:h-3.5'}`} />
              </button>
            </div>

            {/* Sub info: Rank Title with RP & Active Color dot */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <div
                onClick={() => {
                  setActiveTab('profile');
                  sounds.playRadioBeep();
                }}
                className="text-[7.5px] sm:text-[8.5px] md:text-xs font-mono font-bold text-amber-300 truncate cursor-pointer hover:underline flex items-center gap-1"
                title="Hạng Rank & Điểm RP (Nhấn để xem Hồ Sơ)"
              >
                <span>{myRank.badge}</span>
                <span className="text-slate-400 font-normal">({myRank.rp} RP)</span>
              </div>
              <div
                onClick={() => setIsGarageModalOpen(true)}
                className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border border-white/60 cursor-pointer shadow-sm hover:scale-125 transition-transform shrink-0"
                style={{ backgroundColor: color }}
                title="Màu xe hiện tại (Nhấn để mở Gara)"
              />
            </div>
          </div>
        </div>

        {/* Center: Brand Title & Live Online Status (Clean & Responsive) */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-3.5 font-mono shrink-0">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-amber-400 fill-current" />
            <span className="font-black text-sm lg:text-base tracking-wider text-white">DLAND TANK</span>
            
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-300 bg-slate-900/80 border border-slate-800 px-2 py-0.5 rounded-lg shadow-sm">
            <span className={`w-1.5 h-1.5 rounded-full ${isSocketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className={isSocketConnected ? 'text-emerald-400 font-bold' : 'text-amber-400'}>{onlineCount} Trực Tuyến</span>
          </div>
          <button
            type="button"
            onClick={handleCycleWeather}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-400 text-xs font-bold text-slate-300 cursor-pointer transition-colors shadow-sm"
            title={`Thời tiết: ${activeWeatherCfg.vietnameseName} | Hiệu ứng cơ động: ${activeWeatherCfg.tacticalEffectTitle} - ${activeWeatherCfg.tacticalEffectDesc} (Click để đổi)`}
          >
            <span>{activeWeatherCfg.icon}</span>
            <span className="hidden xl:inline text-[11px]" style={{ color: activeWeatherCfg.themeColor }}>{activeWeatherCfg.vietnameseName}</span>
            <span className="hidden 2xl:inline text-[9.5px] px-1 py-0.2 rounded bg-slate-800 text-amber-300 font-mono font-bold">
              {activeWeatherCfg.tacticalEffectTitle.split(' ')[0]}
            </span>
          </button>
        </div>

        {/* Right: Consolidated Action Hub (Share, Friends, Audio Pill, System Pill) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

          {/* 2. Bạn Bè (Friends Modal) */}
          <button
            type="button"
            onClick={() => {
              setIsFriendsOpen(true);
              sounds.playRadioBeep();
            }}
            className={`hidden sm:flex rounded-xl border bg-sky-950/60 border-sky-500/40 hover:bg-sky-900/80 text-sky-300 hover:text-white transition-all cursor-pointer items-center gap-1.5 shadow-sm ${
              isShortLandscape ? 'h-7 px-1.5 text-[8.5px]' : 'h-8 sm:h-8.5 md:h-9 px-2.5 text-xs'
            }`}
            title="Hệ thống bạn bè & lập phòng"
          >
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-mono font-bold hidden md:inline">Bạn Bè</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* 3. Audio Toggle Pill */}
          <div className={`flex items-center rounded-xl bg-slate-900 border border-slate-800 p-0.5 shadow-sm ${
            isShortLandscape ? 'h-7' : 'h-8 sm:h-8.5 md:h-9'
          }`}>
            {/* Sound FX */}
            <button
              type="button"
              onClick={handleToggleMute}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isMuted ? 'text-rose-400 hover:bg-rose-500/20' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title={isMuted ? 'Bật hiệu ứng âm thanh' : 'Tắt hiệu ứng âm thanh'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-sky-400" />}
            </button>

            {/* Music (Desktop/Landscape) */}
            <button
              type="button"
              onClick={handleToggleMusic}
              className={`hidden sm:block p-1.5 rounded-lg transition-colors cursor-pointer ${
                isMusicPlaying ? 'text-amber-400 hover:bg-amber-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
              title={isMusicPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
            >
              <Music className={`w-3.5 h-3.5 ${isMusicPlaying ? 'text-amber-400' : 'text-slate-500'}`} />
            </button>
          </div>

          {/* 4. Utility Pill (Help & Settings) */}
          <div className={`hidden sm:flex items-center rounded-xl bg-slate-900 border border-slate-800 p-0.5 shadow-sm ${
            isShortLandscape ? 'h-7' : 'h-8 sm:h-8.5 md:h-9'
          }`}>
            {/* Help */}
            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Hướng dẫn phím tắt & kỹ năng"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('settings');
                sounds.playRadioBeep();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cài đặt hệ thống & độ nhạy"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN VIEWPORT CONTENT */}
      <main className={`flex-1 min-h-0 relative z-10 w-full mx-auto ${
        activeTab === 'home'
          ? 'overflow-hidden flex flex-col justify-between'
          : (isShortLandscape
              ? 'px-2.5 sm:px-6 pt-2 pb-24 overflow-y-auto overscroll-contain flex flex-col'
              : 'px-2.5 sm:px-6 lg:px-8 pt-2.5 sm:pt-4 pb-32 sm:pb-36 overflow-y-auto overscroll-contain flex flex-col')
      }`}>
        {/* =========================================================================
            TAB 1: SẢNH CHÍNH LIÊN QUÂN MOBILE (ARENA OF VALOR HERO LOBBY STYLE)
           ========================================================================= */}
        {activeTab === 'home' && (
          <div className="relative w-full h-full flex flex-col justify-between overflow-hidden select-none px-2 sm:px-4 md:px-6 py-0.5 sm:py-1">
            {/* 1. TOP-CENTER TANK TITLE & ACTIVE COSMETICS BADGE */}
            <div className="relative z-20 flex items-center justify-between w-full pt-0.5 lg:pt-2 shrink-0">
              {/* Tank Name & Class Badge */}
              <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
                <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-mono font-black text-white text-[10.5px] sm:text-sm lg:text-lg tracking-wide uppercase">
                  {currentStats.name}
                </span>
                <span className="text-[7.5px] sm:text-[9px] lg:text-xs font-mono font-bold px-1.5 lg:px-2.5 py-0.2 lg:py-0.5 rounded-full bg-slate-900/90 text-amber-300 border border-amber-500/40">
                  {tankClass}
                </span>
              </div>

              {/* Equipped Decal / Flag & Skin Badge */}
              <div className="flex items-center gap-1 lg:gap-2">
                {roofDecal !== 'NONE' && (
                  <div className="hidden sm:flex bg-slate-950/80 border border-slate-700/80 rounded lg:rounded-lg px-1.5 lg:px-2.5 py-0.2 lg:py-1 text-[8px] sm:text-[9px] lg:text-xs items-center gap-1.5">
                    <DecalBadge decalId={roofDecal} size="sm" showWavingAnimation={true} />
                    <span className="text-slate-300 font-bold">{activeDecal.vietnameseName}</span>
                  </div>
                )}
                <div
                  onClick={() => setIsGarageModalOpen(true)}
                  className="bg-slate-950/80 border border-slate-700/80 hover:border-amber-400 rounded lg:rounded-lg px-1.5 lg:px-2.5 py-0.2 lg:py-1 text-[8px] sm:text-[9px] lg:text-xs text-sky-300 cursor-pointer flex items-center gap-1 transition-colors"
                  title="Mở Gara Ngoại Trang"
                >
                  <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full" style={{ backgroundColor: activeSkin.primaryColor }} />
                  <span className="text-white font-bold">{activeSkin.vietnameseName}</span>
                </div>
              </div>
            </div>

            {/* 2. MIDDLE VIEWPORT: HERO TANK PEDESTAL & LEFT FLOATING TACTICAL DOCK */}
            <div className="flex-1 min-h-0 relative flex items-center justify-center my-auto">
              {/* LEFT FLOATING TACTICAL DOCK (LIÊN QUÂN SIDEBAR BUTTONS) */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col gap-1 sm:gap-1.5 lg:gap-2.5">
                {/* 0. Hồ Sơ Chỉ Huy (Profile) */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('profile');
                    sounds.playRadioBeep();
                  }}
                  className="group flex items-center gap-1 sm:gap-1.5 lg:gap-2.5 px-2 sm:px-2.5 lg:px-3.5 py-1 lg:py-2 rounded-xl lg:rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400 text-slate-200 transition-all cursor-pointer shadow-lg active:scale-95"
                  title="Hồ Sơ Chỉ Huy & Chiến Tích"
                >
                  <div className="w-5 h-5 lg:w-8 lg:h-8 rounded-lg lg:rounded-xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                    <User className="w-3 h-3 lg:w-4 lg:h-4" />
                  </div>
                  <div className="text-left font-mono">
                    <div className="text-[8.5px] sm:text-[10px] lg:text-xs font-bold text-white group-hover:text-amber-300 leading-tight">Hồ Sơ</div>
                    <div className="text-[6.5px] sm:text-[7.5px] lg:text-[10px] text-slate-400">{myRank.tier}</div>
                  </div>
                </button>

                {/* 0.5. Chế Độ Đấu (4 Chế Độ Liên Quân) */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('modes');
                    sounds.playRadioBeep();
                  }}
                  className="group flex items-center gap-1 sm:gap-1.5 lg:gap-2.5 px-2 sm:px-2.5 lg:px-3.5 py-1 lg:py-2 rounded-xl lg:rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border-2 border-amber-400 text-slate-200 transition-all cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95"
                  title="Mở Màn Hình Chọn 4 Chế Độ Đấu"
                >
                  <div className="w-5 h-5 lg:w-8 lg:h-8 rounded-lg lg:rounded-xl bg-amber-500/30 border border-amber-400/60 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                    <Swords className="w-3 h-3 lg:w-4 lg:h-4 text-amber-300 stroke-[2.5]" />
                  </div>
                  <div className="text-left font-mono">
                    <div className="text-[8.5px] sm:text-[10px] lg:text-xs font-black text-amber-300 leading-tight">Chế Độ Đấu</div>
                    <div className="text-[6.5px] sm:text-[7.5px] lg:text-[10px] text-amber-200/80 font-bold">4 Chế Độ ▾</div>
                  </div>
                </button>

                {/* 1. Kho Xe (Arsenal) */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('arsenal');
                    setArsenalSubTab('classes');
                    sounds.playRadioBeep();
                  }}
                  className="group flex items-center gap-1 sm:gap-1.5 lg:gap-2.5 px-2 sm:px-2.5 lg:px-3.5 py-1 lg:py-2 rounded-xl lg:rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400 text-slate-200 transition-all cursor-pointer shadow-lg active:scale-95"
                  title="Kho 5 Dòng Xe Tăng"
                >
                  <div className="w-5 h-5 lg:w-8 lg:h-8 rounded-lg lg:rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                    <Shield className="w-3 h-3 lg:w-4 lg:h-4" />
                  </div>
                  <div className="text-left font-mono">
                    <div className="text-[8.5px] sm:text-[10px] lg:text-xs font-bold text-white group-hover:text-amber-300 leading-tight">Kho Xe</div>
                    <div className="text-[6.5px] sm:text-[7.5px] lg:text-[10px] text-slate-400">5 Thiết Giáp</div>
                  </div>
                </button>

                {/* 2. Gara 3D Ngoại Trang */}
                <button
                  type="button"
                  onClick={() => {
                    setIsGarageModalOpen(true);
                    sounds.playRadioBeep();
                  }}
                  className="group flex items-center gap-1 sm:gap-1.5 lg:gap-2.5 px-2 sm:px-2.5 lg:px-3.5 py-1 lg:py-2 rounded-xl lg:rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-fuchsia-400 text-slate-200 transition-all cursor-pointer shadow-lg active:scale-95"
                  title="Tùy biến Màu Sơn, Vệt Đạn, Cờ"
                >
                  <div className="w-5 h-5 lg:w-8 lg:h-8 rounded-lg lg:rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-300 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-3 h-3 lg:w-4 lg:h-4" />
                  </div>
                  <div className="text-left font-mono">
                    <div className="text-[8.5px] sm:text-[10px] lg:text-xs font-bold text-white group-hover:text-fuchsia-300 leading-tight">Gara 3D</div>
                    <div className="text-[6.5px] sm:text-[7.5px] lg:text-[10px] text-slate-400">Skins & Cờ</div>
                  </div>
                </button>

                {/* 3. Huân Chương (Medals & Rank) */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('medals');
                    sounds.playRadioBeep();
                  }}
                  className="group flex items-center gap-1 sm:gap-1.5 lg:gap-2.5 px-2 sm:px-2.5 lg:px-3.5 py-1 lg:py-2 rounded-xl lg:rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-yellow-400 text-slate-200 transition-all cursor-pointer shadow-lg active:scale-95"
                  title="Bảng Huân Chương Chiến Công"
                >
                  <div className="w-5 h-5 lg:w-8 lg:h-8 rounded-lg lg:rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-300 group-hover:scale-110 transition-transform">
                    <Trophy className="w-3 h-3 lg:w-4 lg:h-4" />
                  </div>
                  <div className="text-left font-mono">
                    <div className="text-[8.5px] sm:text-[10px] lg:text-xs font-bold text-white group-hover:text-yellow-300 leading-tight">Chiến Tích</div>
                    <div className="text-[6.5px] sm:text-[7.5px] lg:text-[10px] text-slate-400">Huân Chương</div>
                  </div>
                </button>

                {/* 4. Aim Mode Quick Switcher */}
                <button
                  type="button"
                  onClick={() => {
                    handleSelectAimMode(currentAimMode === 'MOVEMENT' ? 'MOUSE' : 'MOVEMENT');
                  }}
                  className="group flex items-center gap-1 sm:gap-1.5 lg:gap-2.5 px-2 sm:px-2.5 lg:px-3.5 py-1 lg:py-2 rounded-xl lg:rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-400 text-slate-200 transition-all cursor-pointer shadow-lg active:scale-95"
                  title="Chuyển cơ chế ngắm bắn (Phím tắt C)"
                >
                  <div className="w-5 h-5 lg:w-8 lg:h-8 rounded-lg lg:rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
                    {currentAimMode === 'MOVEMENT' ? <Smartphone className="w-3 h-3 lg:w-4 lg:h-4" /> : <Mouse className="w-3 h-3 lg:w-4 lg:h-4" />}
                  </div>
                  <div className="text-left font-mono">
                    <div className="text-[8.5px] sm:text-[10px] lg:text-xs font-bold text-white group-hover:text-emerald-300 leading-tight truncate max-w-[65px] sm:max-w-none">
                      {currentAimMode === 'MOVEMENT' ? 'Hướng Xe' : 'Chuột 360°'}
                    </div>
                    <div className="text-[6.5px] sm:text-[7.5px] lg:text-[10px] text-slate-400">Phím tắt C</div>
                  </div>
                </button>
              </div>

              {/* CENTER 3D TANK ARENA & ROTATING PEDESTAL */}
              <div
                onTouchStart={(e) => {
                  const t = e.touches[0];
                  if (t) (window as unknown as { __tankDragX?: number }).__tankDragX = t.clientX;
                }}
                onTouchMove={(e) => {
                  const t = e.touches[0];
                  const lastX = (window as unknown as { __tankDragX?: number }).__tankDragX;
                  if (t && typeof lastX === 'number') {
                    const deltaX = t.clientX - lastX;
                    setTurretAngle((prev) => (prev + deltaX * 1.5) % 360);
                    (window as unknown as { __tankDragX?: number }).__tankDragX = t.clientX;
                  }
                }}
                onTouchEnd={() => {
                  delete (window as unknown as { __tankDragX?: number }).__tankDragX;
                }}
                onMouseDown={(e) => {
                  (window as unknown as { __tankDragX?: number }).__tankDragX = e.clientX;
                }}
                onMouseMove={(e) => {
                  const lastX = (window as unknown as { __tankDragX?: number }).__tankDragX;
                  if (typeof lastX === 'number' && e.buttons === 1) {
                    const deltaX = e.clientX - lastX;
                    setTurretAngle((prev) => (prev + deltaX * 1.5) % 360);
                    (window as unknown as { __tankDragX?: number }).__tankDragX = e.clientX;
                  }
                }}
                onMouseUp={() => {
                  delete (window as unknown as { __tankDragX?: number }).__tankDragX;
                }}
                className="relative flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none group w-full max-w-md py-1"
                title="Vuốt hoặc rê chuột để xoay xe tăng 360°"
              >
                {/* Visual Ambient Light Rings (Platform) */}
                <div
                  className={`absolute rounded-full blur-2xl opacity-35 pointer-events-none transition-all ${
                    isShortLandscape ? 'w-28 h-28' : 'w-36 sm:w-48 h-36 sm:h-48'
                  }`}
                  style={{ backgroundColor: color }}
                />
                <div
                  className={`absolute border border-slate-700/80 rounded-full pointer-events-none stroke-dasharray animate-spin [animation-duration:35s] ${
                    isShortLandscape ? 'w-32 h-32' : 'w-40 sm:w-52 h-40 sm:h-52'
                  }`}
                />
                <div
                  className={`absolute border border-dashed border-amber-500/30 rounded-full pointer-events-none ${
                    isShortLandscape ? 'w-24 h-24' : 'w-32 sm:w-44 h-32 sm:h-44'
                  }`}
                />

                {/* 3D Tank Model with equipped skin and decal */}
                <div className={`relative z-10 transition-transform ${isShortLandscape ? 'scale-100 hover:scale-105' : 'scale-105 sm:scale-115 hover:scale-120'} duration-300`}>
                  <TankVisual
                    tankClass={tankClass}
                    color={color}
                    skinId={skinId}
                    roofDecal={roofDecal}
                    size={isShortLandscape ? 68 : isMobileScreen ? 80 : 124}
                    animated={true}
                    turretAngle={turretAngle}
                  />
                </div>

                {/* 360 Hint & Quick Change Tank Button */}
                <div className="relative z-20 flex items-center gap-1.5 lg:gap-3 mt-0.5 sm:mt-1 lg:mt-3">
                  <div className="font-mono text-[7px] sm:text-[8px] lg:text-xs text-slate-400 bg-slate-950/80 px-1.5 lg:px-3 py-0.5 lg:py-1 rounded-full border border-slate-800 flex items-center gap-1 shadow-sm">
                    <RotateCw className="w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 text-amber-400" />
                    <span>Vuốt xoay 360°</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('arsenal');
                      sounds.playRadioBeep();
                    }}
                    className="font-mono text-[7px] sm:text-[8px] lg:text-xs font-bold text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-2 lg:px-3 py-0.5 lg:py-1 rounded-full cursor-pointer transition-colors shadow-sm"
                  >
                    Đổi Lớp Xe
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsGarageModalOpen(true);
                      sounds.playRadioBeep();
                    }}
                    className="font-mono text-[7px] sm:text-[8px] lg:text-xs font-bold text-sky-300 hover:text-white bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 px-2 lg:px-3 py-0.5 lg:py-1 rounded-full cursor-pointer transition-colors shadow-sm flex items-center gap-1"
                    title="Mở Gara 3D để đổi Sơn, Vệt đạn & Cờ"
                  >
                    <Palette className="w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 text-sky-400" />
                    <span>Ngoại Trang</span>
                    {roofDecal && roofDecal !== 'NONE' && (
                      <span className="text-[9px]">{ROOF_DECALS[roofDecal]?.icon}</span>
                    )}
                  </button>
                </div>

                {/* Floating Specs Bar (HP, Speed, Damage, Bullet Speed) */}
                <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-4 mt-0.5 lg:mt-2 bg-slate-950/85 backdrop-blur-md px-2 lg:px-4 py-0.5 lg:py-1.5 rounded-lg lg:rounded-2xl border border-slate-800 shadow-md font-mono text-[7px] sm:text-[8px] lg:text-xs">
                  <div className="flex items-center gap-1 text-slate-300">
                    <span className="text-emerald-400 font-bold">HP</span>
                    <strong className="text-white">{currentStats.maxHp}</strong>
                  </div>
                  <span className="text-slate-700">·</span>
                  <div className="flex items-center gap-1 text-slate-300">
                    <span className="text-sky-400 font-bold">TỐC</span>
                    <strong className="text-white">{currentStats.speed}</strong>
                  </div>
                  <span className="text-slate-700">·</span>
                  <div className="flex items-center gap-1 text-slate-300">
                    <span className="text-amber-400 font-bold">ST</span>
                    <strong className="text-white">{currentStats.bulletDamage}</strong>
                  </div>
                  <span className="text-slate-700">·</span>
                  <div className="flex items-center gap-1 text-slate-300">
                    <span className="text-purple-400 font-bold">ĐẠN</span>
                    <strong className="text-white">{currentStats.bulletSpeed}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. BOTTOM CONTROL BAR - LIÊN QUÂN MOBILE SIGNATURE STYLE */}
            <div className="relative z-30 w-full flex items-center justify-between gap-1.5 sm:gap-3 lg:gap-4 pt-0.5 pb-[max(0.35rem,env(safe-area-inset-bottom))] shrink-0 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-lg px-1 sm:px-2 lg:px-4 rounded-t-xl lg:rounded-t-3xl shadow-2xl">
              {/* Bottom Left: Tactical World Chat Ticker & Spectate (Hidden on mobile portrait) */}
              <div className="hidden md:flex items-center gap-1 sm:gap-2 lg:gap-3 min-w-0 flex-1 max-w-[28%] sm:max-w-[32%] lg:max-w-[34%]">
                <div
                  onClick={() => {
                    setIsFriendsOpen(true);
                    sounds.playRadioBeep();
                  }}
                  className="flex items-center gap-1.5 lg:gap-2 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/60 rounded-xl lg:rounded-2xl px-2 lg:px-3 py-1 lg:py-2.5 cursor-pointer transition-colors truncate w-full"
                  title="Nhấn để trò chuyện & mời đồng đội"
                >
                  <Radio className="w-3 h-3 lg:w-4 lg:h-4 text-sky-400 shrink-0 animate-pulse" />
                  <span className="text-[7.5px] sm:text-[9px] lg:text-xs font-mono text-slate-300 truncate">
                    <strong className="text-sky-300">[Thế Giới]</strong> {name} sẵn sàng xuất kích!
                  </span>
                </div>

                {/* Spectate Button */}
                <button
                  type="button"
                  onClick={() => handleStartBattle(true)}
                  className="p-1 sm:px-2 sm:py-1 lg:px-3 lg:py-2.5 rounded-xl lg:rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-sky-300 hover:text-white transition-colors cursor-pointer shrink-0 flex items-center gap-1 lg:gap-1.5"
                  title="Quan sát diễn biến trận đấu"
                >
                  <Eye className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                  <span className="text-[8px] lg:text-xs font-mono font-bold hidden md:inline">Xem Trận</span>
                </button>
              </div>

              {/* Bottom Center: Mode Selection Widget (Full width flex on mobile portrait) */}
              <div
                onClick={() => {
                  setActiveTab('modes');
                  sounds.playRadioBeep();
                }}
                className={`flex items-center justify-between gap-1.5 sm:gap-2.5 lg:gap-3 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 hover:border-amber-500/80 rounded-xl lg:rounded-2xl cursor-pointer transition-all shadow-md px-2 lg:px-3.5 py-1 lg:py-1.5 flex-1 min-w-0 md:max-w-[38%] group active:scale-98 ${
                  isShortLandscape ? 'h-9' : 'h-10 sm:h-11 lg:h-14'
                }`}
                title="Nhấn để chọn chế độ chiến đấu & bản đồ"
              >
                <div className="flex items-center gap-1.5 lg:gap-2.5 min-w-0">
                  <div className={`w-6 h-6 lg:w-9 lg:h-9 rounded-lg lg:rounded-xl flex items-center justify-center shrink-0 ${
                    mode === 'TEAM_DEATHMATCH' && matchType === 'RANKED'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : mode === 'TEAM_DEATHMATCH'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                      : mode === 'PUBLIC'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                      : mode === 'AI'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                  }`}>
                    {mode === 'TEAM_DEATHMATCH' && matchType === 'RANKED' ? (
                      <span className="text-xs lg:text-base">{myRank.icon}</span>
                    ) : mode === 'TEAM_DEATHMATCH' ? (
                      <Users className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    ) : mode === 'PUBLIC' ? (
                      <Globe className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    ) : mode === 'AI' ? (
                      <Bot className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="text-[8.5px] sm:text-[10px] lg:text-sm font-black font-mono text-white flex items-center gap-1 truncate">
                      <span className="truncate">
                        {mode === 'TEAM_DEATHMATCH'
                          ? matchType === 'RANKED'
                            ? 'ĐẤU RANK (3v3 PvP)'
                            : 'ĐẤU THƯỜNG (3v3 PvP)'
                          : mode === 'PUBLIC'
                          ? 'PUBLIC ONLINE (PvP)'
                          : mode === 'AI'
                          ? `TÙY CHỌN BOT AI (${botCount} Bot)`
                          : mode === 'BATTLE_ROYALE'
                          ? 'SINH TỒN BO (Bot AI)'
                          : 'SĂN BOSS (Bot AI)'}
                      </span>
                    </div>
                    <div className="text-[6.5px] sm:text-[7.5px] lg:text-[10px] text-slate-400 font-mono truncate">
                      {mode === 'TEAM_DEATHMATCH'
                        ? '100% Người chơi • 2 phe'
                        : mode === 'PUBLIC'
                        ? 'PvP Người chơi thực • Nhấn đổi'
                        : mode === 'AI' || mode === 'BATTLE_ROYALE' || mode === 'BOSS_RAID'
                        ? 'Chế độ Tùy chọn • 100% Bot AI'
                        : 'Chiến trường mở • Nhấn đổi'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 lg:gap-1.5 shrink-0">
                  {mode === 'TEAM_DEATHMATCH' && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTeam(selectedTeam === 'RED' ? 'BLUE' : 'RED');
                        sounds.playRadioBeep();
                      }}
                      className="px-1 lg:px-1.5 py-0.2 lg:py-0.5 rounded text-[7px] lg:text-[10px] font-mono font-bold border border-slate-700 cursor-pointer"
                      style={{ color: selectedTeam === 'RED' ? '#f43f5e' : '#38bdf8' }}
                      title="Chạm đổi Phe Đỏ / Xanh"
                    >
                      {selectedTeam === 'RED' ? '🔴 Đỏ' : '🔵 Xanh'}
                    </div>
                  )}
                  <span className="text-[7.5px] sm:text-[8.5px] lg:text-xs font-mono text-amber-400 group-hover:text-amber-300 font-bold">
                    Đổi ▾
                  </span>
                </div>
              </div>

              {/* Bottom Right: THE GIANT ICONIC LIÊN QUÂN "ĐẤU" BUTTON */}
              <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 shrink-0">
                {/* Custom Party / Room Button (Hidden on mobile portrait) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomRoomModalOpen(true);
                    sounds.playRadioBeep();
                  }}
                  className={`hidden sm:flex rounded-xl lg:rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-sky-300 hover:text-white font-mono font-bold transition-all cursor-pointer flex-col items-center justify-center shadow-md active:scale-95 ${
                    isShortLandscape ? 'px-1.5 py-0.5 h-9' : 'px-2.5 py-1 lg:px-3.5 lg:py-1.5 h-10 sm:h-11 lg:h-14'
                  }`}
                  title="Tạo phòng đấu bạn bè hoặc tham gia phòng"
                >
                  <UserPlus className={`${isShortLandscape ? 'w-3 h-3' : 'w-3.5 h-3.5 lg:w-4 lg:h-4'} text-sky-400`} />
                  <span className="text-[6.5px] sm:text-[7.5px] lg:text-[10px] mt-0.2">Tạo Phòng</span>
                </button>

                {/* THE GIANT LIÊN QUÂN "ĐẤU" (PLAY / BATTLE) BUTTON */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('modes');
                    sounds.playRadioBeep();
                  }}
                  className={`relative group overflow-hidden rounded-xl lg:rounded-2xl font-mono font-black tracking-wider uppercase transition-all cursor-pointer active:scale-95 shadow-xl shadow-amber-500/25 border-2 border-amber-300 flex items-center justify-center gap-1.5 sm:gap-2 lg:gap-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 hover:from-amber-400 hover:via-yellow-300 hover:to-orange-400 text-slate-950 ${
                    isShortLandscape ? 'px-3 py-1 h-9 min-w-[90px]' : 'px-4 sm:px-6 lg:px-8 py-1.5 lg:py-2 h-10 sm:h-11 lg:h-14 min-w-[110px] sm:min-w-[130px] lg:min-w-[170px]'
                  }`}
                  title="Chạm để bắt đầu tìm trận / Vào chiến trường"
                >
                  {/* Glowing energy flare */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-white/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <Swords className={`${isShortLandscape ? 'w-3.5 h-3.5' : 'w-4 sm:w-5 lg:w-6 h-4 sm:h-5 lg:h-6'} shrink-0 stroke-[2.5]`} />
                  <div className="flex flex-col text-left leading-none">
                    <span className={`${isShortLandscape ? 'text-[11px]' : 'text-xs sm:text-sm lg:text-lg'} font-black tracking-widest`}>
                      ĐẤU
                    </span>
                    <span className="text-[6px] sm:text-[7px] lg:text-[9px] text-slate-900/80 font-bold tracking-tight">
                      VÀO TRẬN
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: KHO XE TĂNG (Tank Arsenal & Specs Comparison)
           ========================================================================= */}
        {(activeTab === 'arsenal' || activeTab === 'garage') && (
          <div className={`w-full max-w-7xl mx-auto ${isShortLandscape ? 'space-y-2' : 'space-y-5'} py-1 sm:py-3 pb-24`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 ${isShortLandscape ? 'pb-1' : 'pb-3'} border-b border-slate-800`}>
              <div>
                <h2 className={`${isShortLandscape ? 'text-xs sm:text-sm' : 'text-2xl'} font-black text-white font-mono flex items-center gap-1.5`}>
                  <Shield className={`${isShortLandscape ? 'w-3.5 h-3.5' : 'w-6 h-6'} text-amber-400`} />
                  <span>KHO XE TĂNG CHIẾN THUẬT & GARA SKINS</span>
                </h2>
                {!isShortLandscape && (
                  <p className="text-xs text-slate-400 mt-1">
                    Chọn 3 lớp xe thiết giáp chiến đấu và tùy biến sơn ngụy trang, vệt đạn rực lửa, cờ nóc pháo.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsGarageModalOpen(true)}
                  className={`bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-lg font-bold font-mono transition-all shadow-md shadow-fuchsia-600/20 flex items-center gap-1 cursor-pointer ${
                    isShortLandscape ? 'px-2 py-0.5 text-[10px]' : 'px-3.5 py-2 text-xs rounded-xl'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span className="hidden sm:inline">Phòng Thử Nghiệm 3D</span>
                  <span className="sm:hidden">Thử 3D</span>
                </button>
                <button
                  onClick={() => setActiveTab('home')}
                  className={`bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold font-mono transition-colors cursor-pointer ${
                    isShortLandscape ? 'px-2.5 py-0.5 text-[10px]' : 'px-4 py-2 text-xs rounded-xl'
                  }`}
                >
                  Quay Lại Sảnh
                </button>
              </div>
            </div>

            {/* Sub-Tabs: 3 Dòng Thiết Giáp vs Gara Ngoại Trang */}
            <div className={`flex items-center gap-1 bg-slate-950/80 rounded-xl border border-slate-800 w-fit ${
              isShortLandscape ? 'p-0.5' : 'p-1.5'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setArsenalSubTab('classes');
                  sounds.playRadioBeep();
                }}
                className={`rounded-lg font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  isShortLandscape ? 'px-2 py-0.5 text-[9.5px]' : 'px-4 py-2 text-xs rounded-xl'
                } ${
                  arsenalSubTab === 'classes' && activeTab !== 'garage'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-3 h-3" />
                <span>3 DÒNG THIẾT GIÁP</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setArsenalSubTab('skins');
                  sounds.playRadioBeep();
                }}
                className={`rounded-lg font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  isShortLandscape ? 'px-2 py-0.5 text-[9.5px]' : 'px-4 py-2 text-xs rounded-xl'
                } ${
                  arsenalSubTab === 'skins' || activeTab === 'garage'
                    ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Palette className="w-3 h-3 text-fuchsia-400" />
                <span>GARA NGOẠI TRANG & SKINS</span>
              </button>
            </div>

            {arsenalSubTab === 'classes' && activeTab !== 'garage' && (
              <div className={`grid ${isShortLandscape ? 'grid-cols-3 gap-1.5' : 'grid-cols-1 md:grid-cols-3 gap-6'}`}>
              {(Object.keys(TANK_CLASSES) as TankClass[]).map((tClass) => {
                const stats = TANK_CLASSES[tClass];
                const isSelected = tankClass === tClass;

                return (
                  <div
                    key={tClass}
                    onClick={() => {
                      setTankClass(tClass);
                      sounds.playRadioBeep();
                    }}
                    className={`border transition-all cursor-pointer relative flex flex-col justify-between ${
                      isShortLandscape ? 'p-1.5 rounded-xl' : 'p-3.5 sm:p-5 md:p-6 rounded-2xl md:rounded-3xl'
                    } ${
                      isSelected
                        ? 'bg-slate-900/90 border-amber-500 ring-1 ring-amber-500/40 shadow-2xl shadow-amber-500/10'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      {/* Badge */}
                      <div className={`flex items-center justify-between ${isShortLandscape ? 'mb-0.5' : 'mb-2 sm:mb-4'}`}>
                        <span
                          className={`font-mono font-bold border uppercase tracking-wider ${
                            isShortLandscape ? 'px-1 py-0 text-[7px] rounded' : 'px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px]'
                          } ${
                            isSelected
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {isSelected ? 'ĐÃ CHỌN ⚡' : 'SẴN SÀNG'}
                        </span>
                        <span className="text-[8.5px] sm:text-[9px] font-mono text-slate-400">{tClass}</span>
                      </div>

                      {/* Visual 3D SVG */}
                      <div className={`flex items-center justify-center ${isShortLandscape ? 'py-0.5' : 'py-2 sm:py-4 md:py-6'}`}>
                        <TankVisual
                          tankClass={tClass}
                          color={color}
                          skinId={skinId}
                          roofDecal={roofDecal}
                          size={isShortLandscape ? 68 : 110}
                          animated={isSelected}
                          turretAngle={isSelected ? turretAngle : 0}
                        />
                      </div>

                      <h3 className={`${isShortLandscape ? 'text-[10px]' : 'text-base sm:text-lg font-black'} text-white font-mono`}>{stats.name}</h3>
                      {!isShortLandscape && <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 min-h-[30px] hidden sm:block">{stats.description}</p>}

                      {/* Specification bars */}
                      <div className={`bg-slate-950/60 rounded-lg border border-slate-800/80 font-mono ${
                        isShortLandscape ? 'mt-1 space-y-0.5 p-1 text-[7.5px]' : 'mt-2.5 sm:mt-4 space-y-1.5 sm:space-y-2 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl text-[9.5px] sm:text-xs'
                      }`}>
                        <div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">HP:</span>
                            <span className="text-emerald-400 font-bold">{stats.maxHp}</span>
                          </div>
                          <div className="w-full bg-slate-800 h-0.5 rounded-full overflow-hidden mt-0.2">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(stats.maxHp / 150) * 100}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Tốc Độ:</span>
                            <span className="text-sky-400 font-bold">{stats.speed}</span>
                          </div>
                          <div className="w-full bg-slate-800 h-0.5 rounded-full overflow-hidden mt-0.2">
                            <div className="bg-sky-500 h-full rounded-full" style={{ width: `${(stats.speed / 6.0) * 100}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Sát Thương:</span>
                            <span className="text-amber-400 font-bold">{stats.bulletDamage}</span>
                          </div>
                          <div className="w-full bg-slate-800 h-0.5 rounded-full overflow-hidden mt-0.2">
                            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(stats.bulletDamage / 45) * 100}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Nạp Đạn:</span>
                            <span className="text-purple-400 font-bold">{stats.fireCooldown}ms</span>
                          </div>
                          <div className="w-full bg-slate-800 h-0.5 rounded-full overflow-hidden mt-0.2">
                            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${((600 - stats.fireCooldown) / 400) * 100}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Tầm Bắn:</span>
                            <span className="text-cyan-400 font-bold">{stats.firingRange || 750}m</span>
                          </div>
                          <div className="w-full bg-slate-800 h-0.5 rounded-full overflow-hidden mt-0.2">
                            <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${((stats.firingRange || 750) / 1000) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setTankClass(tClass);
                        sounds.playRadioBeep();
                        setActiveTab('home');
                      }}
                      className={`w-full font-bold font-mono transition-all cursor-pointer ${
                        isShortLandscape ? 'mt-1 py-0.5 text-[8.5px] rounded' : 'mt-5 py-2.5 rounded-xl text-xs'
                      } ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {isSelected ? 'ĐÃ CHỌN XE' : 'CHỌN XE NÀY'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. GARA NGOẠI TRANG & SKINS */}
          {(arsenalSubTab === 'skins' || activeTab === 'garage') && (
            <div className={`${isShortLandscape ? 'space-y-1.5' : 'space-y-4'}`}>
              {/* Active Equipped Status Banner & Quick Action Buttons */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-amber-500/30 rounded-2xl p-2.5 sm:p-3.5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 shrink-0">
                    <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="text-[9.5px] sm:text-xs text-slate-400 font-mono font-bold uppercase tracking-wider">
                      Ngoại Trang Đang Trang Bị
                    </div>
                    <div className="text-[11px] sm:text-xs font-black text-white font-mono flex items-center gap-1.5 flex-wrap">
                      <span className="text-amber-300">Sơn: {TANK_SKINS[skinId]?.vietnameseName || 'Mặc định'}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-sky-300">Vệt: {BULLET_TRAILS[bulletTrail]?.vietnameseName}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-rose-300">Decal: {ROOF_DECALS[roofDecal]?.vietnameseName} {ROOF_DECALS[roofDecal]?.icon}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsGarageModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white border border-sky-500/30 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-md"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-sky-400" />
                    <span>Xưởng 3D & Bắn Thử</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPowerUp();
                      handleSaveCosmetics({ skinId, bulletTrail, roofDecal });
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-mono font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-lg shadow-emerald-600/30"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>TRANG BỊ & LƯU LẠI</span>
                  </button>
                </div>
              </div>

            {/* Quick Skins Cards Grid */}
            <div>
              <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-1 flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-fuchsia-400" />
                <span>1. Bộ Sưu Tập Sơn Xe</span>
              </h3>
              <div className={`grid ${isShortLandscape ? 'grid-cols-6 gap-1' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3'}`}>
                {(Object.keys(TANK_SKINS) as TankSkinId[]).map((sId) => {
                  const s = TANK_SKINS[sId];
                  const isSelected = skinId === sId;

                  return (
                    <div
                      key={sId}
                      onClick={() => {
                        setSkinId(sId);
                        sounds.playRadioBeep();
                        handleSaveCosmetics({ skinId: sId, bulletTrail, roofDecal });
                      }}
                      className={`border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isShortLandscape ? 'p-1 rounded-lg' : 'p-3.5 rounded-2xl'
                      } ${
                        isSelected
                          ? 'bg-slate-900 border-amber-500 ring-1 ring-amber-500/40 shadow-xl'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div
                          className={`w-full rounded bg-gradient-to-br ${s.previewGradient} border flex items-center justify-center shadow-inner relative ${
                            isShortLandscape ? 'h-6' : 'h-14 rounded-xl'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full border border-white/50" style={{ backgroundColor: s.primaryColor }} />
                          {isSelected && (
                            <div className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[7px] font-bold">
                              ✓
                            </div>
                          )}
                        </div>
                        <h4 className={`font-bold text-white truncate font-mono mt-0.5 ${isShortLandscape ? 'text-[8.5px]' : 'text-xs'}`}>{s.vietnameseName}</h4>
                      </div>
                      <span className="mt-0.5 text-[7px] sm:text-[9px] font-mono text-amber-300 font-bold truncate">{s.badge}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Bullet Trails Grid */}
            <div>
              <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-1 flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-orange-400" />
                <span>2. Vệt Đạn & Nòng Pháo</span>
              </h3>
              <div className={`grid ${isShortLandscape ? 'grid-cols-5 gap-1' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3'}`}>
                {(Object.keys(BULLET_TRAILS) as BulletTrailId[]).map((tId) => {
                  const tr = BULLET_TRAILS[tId];
                  const isSelected = bulletTrail === tId;

                  return (
                    <div
                      key={tId}
                      onClick={() => {
                        setBulletTrail(tId);
                        sounds.playShoot();
                        handleSaveCosmetics({ skinId, bulletTrail: tId, roofDecal });
                      }}
                      className={`border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isShortLandscape ? 'p-1 rounded-lg' : 'p-3.5 rounded-2xl'
                      } ${
                        isSelected
                          ? 'bg-slate-900 border-amber-500 ring-1 ring-amber-500/40 shadow-xl'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className={`w-full rounded bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner ${
                          isShortLandscape ? 'h-6 text-sm' : 'h-12 text-2xl rounded-xl'
                        }`}>
                          {tr.icon}
                        </div>
                        <h4 className={`font-bold text-white truncate font-mono mt-0.5 ${isShortLandscape ? 'text-[8.5px]' : 'text-xs'}`}>{tr.vietnameseName}</h4>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tr.color }} />
                        <span className="text-[8px] font-mono text-slate-300 truncate">{tr.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Roof Decals Grid */}
            <div>
              <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-1 flex items-center gap-1.5">
                <Flag className="w-3 h-3 text-rose-400" />
                <span>3. Cờ & Biểu Tượng Nóc Tháp Pháo</span>
              </h3>
              <div className={`grid ${isShortLandscape ? 'grid-cols-7 gap-1' : 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3'}`}>
                {(Object.keys(ROOF_DECALS) as RoofDecalId[]).map((dId) => {
                  const d = ROOF_DECALS[dId];
                  const isSelected = roofDecal === dId;

                  return (
                    <div
                      key={dId}
                      onClick={() => {
                        setRoofDecal(dId);
                        sounds.playRadioBeep();
                        handleSaveCosmetics({ skinId, bulletTrail, roofDecal: dId });
                      }}
                      className={`border transition-all cursor-pointer relative flex flex-col items-center text-center justify-between ${
                        isShortLandscape ? 'p-1 rounded-lg' : 'p-3 rounded-2xl'
                      } ${
                        isSelected
                          ? 'bg-slate-900 border-amber-500 ring-1 ring-amber-500/40 shadow-xl'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className={`flex items-center justify-center ${isShortLandscape ? 'py-0.5' : 'py-2'}`}>
                        <DecalBadge decalId={dId} size={isShortLandscape ? 'sm' : 'md'} showWavingAnimation={isSelected} />
                      </div>
                      <h4 className="font-bold text-white text-[8px] sm:text-[11px] truncate font-mono w-full">{d.vietnameseName}</h4>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sticky Action Footer for Gara Skins */}
            <div className="sticky bottom-0 bg-slate-950/95 border border-slate-800 p-2.5 sm:p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2 shadow-2xl backdrop-blur-md mt-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-300">
                <span className="text-amber-400 font-bold">Đang chọn:</span>
                <span className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-white flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeSkin.primaryColor }} />
                  {activeSkin.vietnameseName}
                </span>
                <span className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-amber-300 flex items-center gap-1">
                  <span>{activeTrail.icon}</span>
                  <span>{activeTrail.vietnameseName}</span>
                </span>
                <span className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-indigo-300 flex items-center gap-1.5">
                  <DecalBadge decalId={roofDecal} size="sm" showWavingAnimation={true} />
                  <span>{activeDecal.vietnameseName}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsGarageModalOpen(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/40 px-3 py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>Phòng Thử 3D</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveCosmetics({ skinId, bulletTrail, roofDecal })}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white px-4 py-1.5 rounded-xl text-xs font-mono font-black shadow-lg shadow-emerald-600/30 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>TRANG BỊ & LƯU LẠI</span>
                </button>
              </div>
            </div>

            </div>
          )}
          </div>
        )}

        {/* =========================================================================
            TAB: HỒ SƠ CHỈ HUY & CHIẾN TÍCH (Player Profile & Career Stats)
           ========================================================================= */}
        {activeTab === 'profile' && (
          <ProfilePage
            currentUser={currentUser}
            onUserChange={onUserChange}
            onOpenAccountModal={onOpenAccountModal}
            onOpenGarage={() => setIsGarageModalOpen(true)}
            onBackToLobby={() => {
              setActiveTab('home');
              sounds.playRadioBeep();
            }}
            playerRankRp={rankRp}
            tankClass={tankClass}
            tankColor={color}
            skinId={skinId}
            bulletTrail={bulletTrail}
            roofDecal={roofDecal}
            isShortLandscape={isShortLandscape}
            onToast={(text) => {
              setCosmeticsToast({ show: true, text });
              setTimeout(() => setCosmeticsToast(null), 3000);
            }}
          />
        )}

        {/* =========================================================================
            TAB 4: HUÂN CHƯƠNG CHIẾN CÔNG (Medals & Accolades Showcase)
           ========================================================================= */}
        {activeTab === 'medals' && (
          <div className={`w-full max-w-7xl mx-auto ${isShortLandscape ? 'space-y-2' : 'space-y-5'} py-1 sm:py-3 pb-24`}>
            <div className={`flex items-center justify-between ${isShortLandscape ? 'pb-1' : 'pb-3'} border-b border-slate-800`}>
              <div>
                <h2 className={`${isShortLandscape ? 'text-xs sm:text-sm' : 'text-2xl'} font-black text-white font-mono flex items-center gap-1.5`}>
                  <Trophy className={`${isShortLandscape ? 'w-3.5 h-3.5' : 'w-6 h-6'} text-yellow-400`} />
                  <span>BẢNG HUÂN CHƯƠNG CHIẾN CÔNG</span>
                </h2>
                {!isShortLandscape && (
                  <p className="text-xs text-slate-400 mt-1">
                    Đạt chuỗi mạng, bắn tỉa cự ly xa hoặc phục thù kẻ thù để mở khóa danh hiệu kèm tiếng kèn Fanfare và lời xướng của Phát thanh viên!
                  </p>
                )}
              </div>
              <button
                onClick={() => setActiveTab('home')}
                className={`bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold font-mono transition-colors cursor-pointer ${
                  isShortLandscape ? 'px-2.5 py-0.5 text-[10px]' : 'px-4 py-2 text-xs rounded-xl'
                }`}
              >
                Quay Lại Sảnh
              </button>
            </div>

            {/* THÀNH TÍCH NGƯỜI CHƠI LƯU TRỮ TRỌN ĐỜI */}
            <div className={`bg-slate-900/90 border border-amber-500/30 rounded-2xl ${isShortLandscape ? 'p-2' : 'p-4'} shadow-xl mb-3`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] sm:text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📊 HỒ SƠ LƯU TRỮ CHIẾN TÍCH (TỔNG KẾT HẾT TRẬN)</span>
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  Tỉ lệ thắng: {playerStats.totalMatches > 0 ? Math.round((playerStats.totalWins / playerStats.totalMatches) * 100) : 0}%
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center font-mono">
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-1.5">
                  <div className="text-[9px] text-slate-400">Tổng Trận</div>
                  <div className="text-sm sm:text-base font-black text-white">{playerStats.totalMatches}</div>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-1.5">
                  <div className="text-[9px] text-emerald-400">Thắng / Bại</div>
                  <div className="text-sm sm:text-base font-black text-emerald-300">{playerStats.totalWins} <span className="text-slate-500 text-xs">/</span> <span className="text-rose-400">{playerStats.totalLosses}</span></div>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-1.5">
                  <div className="text-[9px] text-amber-400">Hạ Gục (Kills)</div>
                  <div className="text-sm sm:text-base font-black text-amber-300">{playerStats.totalKills}</div>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-1.5">
                  <div className="text-[9px] text-rose-400">Bị Hạ (Deaths)</div>
                  <div className="text-sm sm:text-base font-black text-rose-300">{playerStats.totalDeaths}</div>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-1.5">
                  <div className="text-[9px] text-sky-400">Tổng Điểm</div>
                  <div className="text-sm sm:text-base font-black text-sky-300">{playerStats.totalScore}</div>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-1.5">
                  <div className="text-[9px] text-orange-400">Chuỗi Kỷ Lục</div>
                  <div className="text-sm sm:text-base font-black text-orange-300">{playerStats.highestStreak}🔥</div>
                </div>
              </div>
            </div>

            <div className={`grid ${isShortLandscape ? 'grid-cols-4 gap-1.5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'}`}>
              {(Object.keys(COMBAT_MEDALS) as CombatMedalType[]).map((mKey) => {
                const m = COMBAT_MEDALS[mKey];

                return (
                  <div
                    key={mKey}
                    className={`bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl ${
                      isShortLandscape ? 'p-1.5 rounded-xl' : 'p-5 rounded-3xl'
                    }`}
                  >
                    <div>
                      <div className={`flex items-center justify-between ${isShortLandscape ? 'mb-0.5' : 'mb-3'}`}>
                        <span className={`rounded-lg bg-slate-950 border border-slate-800 ${isShortLandscape ? 'text-base p-0.5' : 'text-3xl p-2 rounded-xl'}`}>{m.icon}</span>
                        <span
                          className="px-1.5 py-0.2 rounded-full text-[8px] sm:text-[10px] font-mono font-bold border"
                          style={{ borderColor: `${m.color}66`, color: m.color, backgroundColor: `${m.color}15` }}
                        >
                          {m.title}
                        </span>
                      </div>

                      <h3 className={`${isShortLandscape ? 'text-[10px]' : 'text-base'} font-black text-white font-mono`}>{m.vietnameseTitle}</h3>
                      <p className={`text-slate-400 mt-0.2 ${isShortLandscape ? 'text-[8px] line-clamp-1' : 'text-xs'}`}>{m.subtitle}</p>

                      <div className={`rounded bg-slate-950/80 border border-slate-800/80 font-mono text-slate-300 ${
                        isShortLandscape ? 'mt-1 p-1 text-[8px]' : 'mt-4 p-2.5 text-[11px] rounded-lg'
                      }`}>
                        <span>Xướng: </span>
                        <strong className="text-amber-300">"{m.viVoiceText}"</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playMedalFanfare(mKey);
                        sounds.announce(m.voiceText, m.viVoiceText);
                      }}
                      className={`w-full rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        isShortLandscape ? 'mt-1 py-0.5 text-[8.5px]' : 'mt-4 py-2 text-xs rounded-xl gap-1.5'
                      }`}
                    >
                      <Volume2 className="w-3 h-3 text-amber-400" />
                      <span>Nghe Fanfare</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: CÀI ĐẶT ÂM THANH & PHÁT THANH VIÊN (Audio Settings)
           ========================================================================= */}
        {activeTab === 'settings' && (
          <div className={`max-w-2xl w-full mx-auto ${isShortLandscape ? 'space-y-2.5' : 'space-y-5'} py-1 sm:py-3 pb-24`}>
            <div className={`flex items-center justify-between ${isShortLandscape ? 'pb-1.5' : 'pb-3'} border-b border-slate-800`}>
              <div>
                <h2 className={`${isShortLandscape ? 'text-base sm:text-lg' : 'text-2xl'} font-black text-white font-mono flex items-center gap-2`}>
                  <Sliders className={`${isShortLandscape ? 'w-4 h-4' : 'w-6 h-6'} text-amber-400`} />
                  <span>CÀI ĐẶT ÂM THANH & HỆ THỐNG</span>
                </h2>
                {!isShortLandscape && (
                  <p className="text-xs text-slate-400 mt-1">
                    Tùy chỉnh độ lớn Nhạc nền quân hành, âm thanh đạn pháo và giọng xướng chỉ huy chiến trường.
                  </p>
                )}
              </div>
              <button
                onClick={() => setActiveTab('home')}
                className={`bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold font-mono transition-colors cursor-pointer ${
                  isShortLandscape ? 'px-3 py-1 text-[11px]' : 'px-4 py-2 text-xs'
                }`}
              >
                Xác Nhận & Quay Lại
              </button>
            </div>

            <div className={`${isShortLandscape ? 'space-y-2' : 'space-y-4'}`}>
              {/* 1. Epic Military Battle BGM Slider */}
              <div className={`bg-slate-900/80 border border-slate-800 ${isShortLandscape ? 'p-3 rounded-2xl space-y-1.5' : 'p-5 rounded-3xl space-y-3'}`}>
                <div className={`flex items-center justify-between ${isShortLandscape ? 'text-xs' : 'text-sm'}`}>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Music className={`${isShortLandscape ? 'w-4 h-4' : 'w-5 h-5'} text-amber-400`} />
                    <span>Nhạc Nền Chiến Trận (BGM)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleMusic}
                    className={`rounded-xl font-mono font-bold border transition-colors cursor-pointer ${
                      isShortLandscape ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
                    } ${
                      isMusicPlaying
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {isMusicPlaying ? 'Đang Phát 🔊' : 'Đang Tắt 🔇'}
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={musicVol}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMusicVol(val);
                    sounds.setMusicVolume(val / 100);
                  }}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-950 rounded-lg"
                />
                <div className="flex justify-between text-[10px] sm:text-xs text-slate-400 font-mono">
                  <span>Im lặng (0%)</span>
                  <span className="text-amber-300 font-bold">{musicVol}%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* 2. Sound Effects (SFX) Slider */}
              <div className={`bg-slate-900/80 border border-slate-800 ${isShortLandscape ? 'p-3 rounded-2xl space-y-1.5' : 'p-5 rounded-3xl space-y-3'}`}>
                <div className={`flex items-center justify-between ${isShortLandscape ? 'text-xs' : 'text-sm'}`}>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Zap className={`${isShortLandscape ? 'w-4 h-4' : 'w-5 h-5'} text-sky-400`} />
                    <span>Hiệu Ứng Bắn & Đạn Pháo (SFX)</span>
                  </span>
                  <span className="font-mono text-sky-300 font-bold text-xs">{sfxVol}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sfxVol}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSfxVol(val);
                    sounds.setSfxVolume(val / 100);
                  }}
                  className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-950 rounded-lg"
                />
                <div className="flex justify-between text-[10px] sm:text-xs text-slate-400 font-mono">
                  <span>0%</span>
                  <button
                    type="button"
                    onClick={() => sounds.playShoot(true)}
                    className="text-[10px] text-sky-400 hover:text-white underline cursor-pointer"
                  >
                    Bắn thử pháo
                  </button>
                  <span>100%</span>
                </div>
              </div>

              {/* 3. Tactical Voice Announcer Toggle */}
              <div className={`${isShortLandscape ? 'p-3 rounded-2xl' : 'p-5 rounded-3xl'} bg-slate-900/80 border border-slate-800 flex items-center justify-between`}>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`${isShortLandscape ? 'w-7 h-7 rounded-lg' : 'w-10 h-10 rounded-2xl'} bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0`}>
                    <Radio className={`${isShortLandscape ? 'w-4 h-4' : 'w-5 h-5'}`} />
                  </div>
                  <div>
                    <div className={`${isShortLandscape ? 'text-xs' : 'text-sm'} font-bold text-white`}>Giọng Phát Thanh Viên Chiến Trường</div>
                    <div className={`${isShortLandscape ? 'text-[9.5px]' : 'text-xs'} text-slate-400`}>
                      Tự động xướng chuỗi hạ gục, thời tiết, boss, kỹ năng
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !voiceEnabled;
                      setVoiceEnabled(next);
                      sounds.setVoiceEnabled(next);
                      if (next) {
                        sounds.announce('Tactical Announcer Online', 'Đã kích hoạt giọng phát thanh viên chiến trường!');
                      }
                    }}
                    className={`rounded-xl font-bold font-mono border transition-all cursor-pointer ${
                      isShortLandscape ? 'px-2.5 py-1 text-[10px]' : 'px-4 py-2 text-xs'
                    } ${
                      voiceEnabled
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {voiceEnabled ? 'ĐANG BẬT' : 'ĐANG TẮT'}
                  </button>
                </div>
              </div>

              {/* 4. CHẾ ĐỘ ĐIỀU KHIỂN & HƯỚNG BẮN PHÁO (Aim Mode) */}
              <div className={`${isShortLandscape ? 'p-3 rounded-2xl space-y-2' : 'p-5 rounded-3xl space-y-4'} bg-slate-900/80 border border-slate-800`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className={`${isShortLandscape ? 'w-7 h-7 rounded-lg' : 'w-10 h-10 rounded-2xl'} bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0`}>
                      <Target className={`${isShortLandscape ? 'w-4 h-4' : 'w-5 h-5'}`} />
                    </div>
                    <div>
                      <div className={`${isShortLandscape ? 'text-xs' : 'text-sm'} font-bold text-white flex flex-wrap items-center gap-1.5`}>
                        <span>Cơ Chế Ngắm & Hướng Bắn Pháo</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/40">
                          HOTKEY: C
                        </span>
                      </div>
                      <div className={`${isShortLandscape ? 'text-[10px]' : 'text-xs'} text-slate-400`}>
                        Chọn hướng di chuyển (Tank 1990) hoặc Chuột 360°
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`grid grid-cols-1 sm:grid-cols-2 ${isShortLandscape ? 'gap-2 pt-0.5' : 'gap-3 pt-1'}`}>
                  {/* Option 1: MOVEMENT (Classic Tank 1990) */}
                  <div
                    onClick={() => handleSelectAimMode('MOVEMENT')}
                    className={`${isShortLandscape ? 'p-2.5 rounded-xl space-y-1.5' : 'p-4 rounded-2xl space-y-2.5'} border-2 transition-all cursor-pointer flex flex-col justify-between relative select-none ${
                      currentAimMode === 'MOVEMENT'
                        ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Gamepad2 className={`${isShortLandscape ? 'w-4 h-4' : 'w-5 h-5'} ${currentAimMode === 'MOVEMENT' ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <span className={`font-bold text-white ${isShortLandscape ? 'text-[11px]' : 'text-xs'} font-mono uppercase`}>
                          Theo Hướng Xe (Tank 1990)
                        </span>
                      </div>
                      {currentAimMode === 'MOVEMENT' ? (
                        <div className={`${isShortLandscape ? 'w-4 h-4' : 'w-5 h-5'} rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0`}>
                          <Check className={`${isShortLandscape ? 'w-3 h-3' : 'w-3.5 h-3.5'} stroke-[3]`} />
                        </div>
                      ) : (
                        <div className={`${isShortLandscape ? 'w-4 h-4' : 'w-5 h-5'} rounded-full border border-slate-700 shrink-0`} />
                      )}
                    </div>
                    <p className={`${isShortLandscape ? 'text-[9.5px]' : 'text-[11px]'} text-slate-400 leading-relaxed`}>
                      Xe chạy hướng nào, nòng pháo tự chĩa thẳng hướng đó. Dừng lại giữ nguyên góc ngắm. Bấm <strong className="text-white">Space / J / Chuột</strong> để bắn.
                    </p>
                    <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 font-bold">
                      <span>★ Chuẩn 4 nút NES cổ điển</span>
                    </div>
                  </div>

                  {/* Option 2: MOUSE (Modern 360) */}
                  <div
                    onClick={() => handleSelectAimMode('MOUSE')}
                    className={`${isShortLandscape ? 'p-2.5 rounded-xl space-y-1.5' : 'p-4 rounded-2xl space-y-2.5'} border-2 transition-all cursor-pointer flex flex-col justify-between relative select-none ${
                      currentAimMode === 'MOUSE'
                        ? 'bg-sky-950/40 border-sky-500 shadow-lg shadow-sky-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Mouse className={`${isShortLandscape ? 'w-4 h-4' : 'w-5 h-5'} ${currentAimMode === 'MOUSE' ? 'text-sky-400' : 'text-slate-400'}`} />
                        <span className={`font-bold text-white ${isShortLandscape ? 'text-[11px]' : 'text-xs'} font-mono uppercase`}>
                          Theo Chuột (Tự Do 360°)
                        </span>
                      </div>
                      {currentAimMode === 'MOUSE' ? (
                        <div className={`${isShortLandscape ? 'w-4 h-4' : 'w-5 h-5'} rounded-full bg-sky-500 text-slate-950 flex items-center justify-center shrink-0`}>
                          <Check className={`${isShortLandscape ? 'w-3 h-3' : 'w-3.5 h-3.5'} stroke-[3]`} />
                        </div>
                      ) : (
                        <div className={`${isShortLandscape ? 'w-4 h-4' : 'w-5 h-5'} rounded-full border border-slate-700 shrink-0`} />
                      )}
                    </div>
                    <p className={`${isShortLandscape ? 'text-[9.5px]' : 'text-[11px]'} text-slate-400 leading-relaxed`}>
                      Nòng pháo tự do xoay 360° theo con trỏ chuột độc lập với thân xe. Vừa lùi vừa bắn trả hoặc bắn tạt ngang sườn.
                    </p>
                    <div className="flex items-center gap-1 text-[9px] font-mono text-sky-400 font-bold">
                      <span>★ Phong cách Twin-Stick Shooter</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Thông Tin Hệ Thống & Nền Tảng */}
              <div className={`${isShortLandscape ? 'p-3 rounded-2xl space-y-2 text-[10px]' : 'p-5 rounded-3xl space-y-3 text-xs'} bg-slate-900/60 border border-slate-800 font-mono text-slate-400`}>
                <div className="flex items-center justify-between text-slate-200 font-bold border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <Monitor className={`${isShortLandscape ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-emerald-400`} />
                    <span>THÔNG TIN HỆ THỐNG CHIẾN TRƯỜNG</span>
                  </span>
                  <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                    
                  </span>
                </div>

                <div className={`grid grid-cols-1 sm:grid-cols-2 ${isShortLandscape ? 'gap-2 pt-0.5' : 'gap-3 pt-1'}`}>
                  <div className={`bg-slate-950/70 ${isShortLandscape ? 'p-2 rounded-xl' : 'p-3 rounded-2xl'} border border-slate-800/80`}>
                    <div className="text-[9px] text-slate-500 uppercase">Bản Quyền & Trò Chơi</div>
                    <div className="text-white font-bold mt-0.5">© 2026 DLAND TANK ARENA</div>
                  </div>

                  <div className={`bg-slate-950/70 ${isShortLandscape ? 'p-2 rounded-xl' : 'p-3 rounded-2xl'} border border-slate-800/80`}>
                    <div className="text-[9px] text-slate-500 uppercase">Hạ Tầng Mạng</div>
                    <div className="text-emerald-400 font-bold mt-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>WebSocket 30 Tick/s Server</span>
                    </div>
                  </div>

                  <div className={`bg-slate-950/70 ${isShortLandscape ? 'p-2 rounded-xl' : 'p-3 rounded-2xl'} border border-slate-800/80`}>
                    <div className="text-[9px] text-slate-500 uppercase">Hỗ Trợ Nền Tảng</div>
                    <div className="text-slate-300 font-bold mt-0.5">PC / Mobile / Tablet</div>
                  </div>

                  <div className={`bg-slate-950/70 ${isShortLandscape ? 'p-2 rounded-xl' : 'p-3 rounded-2xl'} border border-slate-800/80 flex items-center justify-between`}>
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase">Tài Liệu Hướng Dẫn</div>
                      <div className="text-sky-400 font-bold mt-0.5">Phím Tắt & Luật Chơi</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsHelpOpen(true)}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded text-[10px] font-bold border border-slate-700 cursor-pointer transition-colors"
                    >
                      Xem Ngay
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FLOATING NAVIGATION DOCK: Displayed only when browsing sub-screens (Kho Xe, Huân Chương, Cài Đặt) */}
      {activeTab !== 'home' && (
        <nav className={`fixed bottom-2 sm:bottom-4 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 rounded-full bg-slate-950/95 border border-slate-700/80 shadow-2xl backdrop-blur-2xl flex items-center p-1 sm:p-1.5 gap-0.5 sm:gap-1 shadow-black/90 select-none max-w-[98vw] sm:max-w-2xl lg:max-w-3xl w-auto overflow-x-auto no-scrollbar ${
          isShortLandscape ? 'h-8 py-0.5' : 'h-10 sm:h-12'
        }`}>
          {/* 1. Về Chiến Trường */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('home');
              sounds.playRadioBeep();
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-1.5 ${
              isShortLandscape ? 'px-2 py-0.5 text-[8.5px]' : 'px-1.5 sm:px-3 lg:px-4 py-1 text-[8.5px] min-[360px]:text-[9.5px] sm:text-xs'
            } rounded-full font-mono font-bold transition-all cursor-pointer relative select-none whitespace-nowrap text-slate-300 hover:text-white hover:bg-slate-900/90 active:scale-95`}
          >
            <Swords className={`${isShortLandscape ? 'w-3 h-3' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} shrink-0 text-amber-400`} />
            <span className="uppercase tracking-wider">
              <span className="hidden min-[400px]:inline">Chiến </span>Trường
            </span>
          </button>

          {/* 1.2. Hồ Sơ Chỉ Huy */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              sounds.playRadioBeep();
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-1.5 ${
              isShortLandscape ? 'px-2 py-0.5 text-[8.5px]' : 'px-1.5 sm:px-3 lg:px-4 py-1 text-[8.5px] min-[360px]:text-[9.5px] sm:text-xs'
            } rounded-full font-mono font-bold transition-all cursor-pointer relative select-none whitespace-nowrap active:scale-95 ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black shadow-md shadow-amber-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/90'
            }`}
          >
            <User className={`${isShortLandscape ? 'w-3 h-3' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} shrink-0 ${activeTab === 'profile' ? 'text-slate-950' : 'text-amber-400'}`} />
            <span className="uppercase tracking-wider">Hồ Sơ</span>
          </button>

          {/* 1.5. Chế Độ Đấu (4 Chế Độ Liên Quân) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('modes');
              sounds.playRadioBeep();
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-1.5 ${
              isShortLandscape ? 'px-2 py-0.5 text-[8.5px]' : 'px-1.5 sm:px-3 lg:px-4 py-1 text-[8.5px] min-[360px]:text-[9.5px] sm:text-xs'
            } rounded-full font-mono font-bold transition-all cursor-pointer relative select-none whitespace-nowrap active:scale-95 ${
              activeTab === 'modes'
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black shadow-md shadow-amber-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/90'
            }`}
          >
            <Gamepad2 className={`${isShortLandscape ? 'w-3 h-3' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} shrink-0 ${activeTab === 'modes' ? 'text-slate-950' : 'text-amber-400'}`} />
            <span className="uppercase tracking-wider">Chế Độ</span>
          </button>

          {/* 2. Kho Xe Tăng */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('arsenal');
              setArsenalSubTab('classes');
              sounds.playRadioBeep();
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-1.5 ${
              isShortLandscape ? 'px-2 py-0.5 text-[8.5px]' : 'px-1.5 sm:px-3 lg:px-4 py-1 text-[8.5px] min-[360px]:text-[9.5px] sm:text-xs'
            } rounded-full font-mono font-bold transition-all cursor-pointer relative select-none whitespace-nowrap active:scale-95 ${
              activeTab === 'arsenal' || activeTab === 'garage'
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black shadow-md shadow-amber-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/90'
            }`}
          >
            <Shield className={`${isShortLandscape ? 'w-3 h-3' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} shrink-0 ${activeTab === 'arsenal' || activeTab === 'garage' ? 'text-slate-950' : 'text-sky-400'}`} />
            <span className="uppercase tracking-wider">Kho Xe</span>
          </button>

          {/* 3. Huân Chương */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('medals');
              sounds.playRadioBeep();
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-1.5 ${
              isShortLandscape ? 'px-2 py-0.5 text-[8.5px]' : 'px-1.5 sm:px-3 lg:px-4 py-1 text-[8.5px] min-[360px]:text-[9.5px] sm:text-xs'
            } rounded-full font-mono font-bold transition-all cursor-pointer relative select-none whitespace-nowrap active:scale-95 ${
              activeTab === 'medals'
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black shadow-md shadow-amber-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/90'
            }`}
          >
            <Trophy className={`${isShortLandscape ? 'w-3 h-3' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} shrink-0 ${activeTab === 'medals' ? 'text-slate-950' : 'text-yellow-400'}`} />
            <span className="uppercase tracking-wider">
              <span className="hidden min-[420px]:inline">Huân </span>Chương
            </span>
          </button>

          {/* 4. Cài Đặt */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('settings');
              sounds.playRadioBeep();
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-1.5 ${
              isShortLandscape ? 'px-2 py-0.5 text-[8.5px]' : 'px-1.5 sm:px-3 lg:px-4 py-1 text-[8.5px] min-[360px]:text-[9.5px] sm:text-xs'
            } rounded-full font-mono font-bold transition-all cursor-pointer relative select-none whitespace-nowrap active:scale-95 ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black shadow-md shadow-amber-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/90'
            }`}
          >
            <Sliders className={`${isShortLandscape ? 'w-3 h-3' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} shrink-0 ${activeTab === 'settings' ? 'text-slate-950' : 'text-emerald-400'}`} />
            <span className="uppercase tracking-wider">Cài Đặt</span>
          </button>
        </nav>
      )}

      {/* Modals */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <GarageModal
        isOpen={isGarageModalOpen}
        onClose={() => setIsGarageModalOpen(false)}
        tankClass={tankClass}
        currentSkin={skinId}
        currentTrail={bulletTrail}
        currentDecal={roofDecal}
        tankColor={color}
        onSaveCosmetics={handleSaveCosmetics}
      />

      {/* Custom Room Modal (Boss & AI Room Creation) */}
      <CustomRoomModal
        isOpen={isCustomRoomModalOpen}
        onClose={() => setIsCustomRoomModalOpen(false)}
        name={name}
        color={color}
        tankClass={tankClass}
        customRooms={customRooms}
        isShortLandscape={isShortLandscape}
        onJoinCustomRoom={({ mode: cMode, roomId: cRoomId, botCount: cBots, enableBoss: cBoss, bossHp: cHp, initialWeather: cWeather, team: cTeam }) => {
          setMode(cMode);
          setRoomId(cRoomId);
          setBotCount(cBots);
          if (cTeam) setSelectedTeam(cTeam);
          sounds.playShoot(tankClass === 'JUGGERNAUT');
          sounds.startBgm();

          onJoin(
            name.trim() || 'Chỉ Huy Xe Tăng',
            color,
            tankClass,
            cMode,
            cBots,
            cRoomId,
            false,
            cTeam || selectedTeam,
            skinId,
            bulletTrail,
            roofDecal,
            'CASUAL',
            cBoss,
            cHp,
            cWeather
          );
        }}
      />

      {/* Friends & Party Hub Modal */}
      <FriendsModal
        isOpen={isFriendsOpen}
        onClose={() => setIsFriendsOpen(false)}
        myPlayerName={name}
        myPlayerColor={color}
        myTankClass={tankClass}
        myRankRp={rankRp}
        onJoinFriendRoom={handleJoinFriendRoom}
      />

      {/* Battle Selection & Launch Screen (Màn chọn 4 chế độ như 1 màn hình ở ngoài Home) */}
      <BattleSelectModal
        isOpen={isBattleModalOpen || activeTab === 'modes'}
        onClose={() => {
          setIsBattleModalOpen(false);
          setActiveTab('home');
        }}
        name={name}
        setName={setName}
        color={color}
        setColor={setColor}
        tankClass={tankClass}
        matchType={matchType}
        setMatchType={setMatchType}
        mode={mode}
        setMode={setMode}
        selectedTeam={selectedTeam}
        setSelectedTeam={setSelectedTeam}
        botCount={botCount}
        setBotCount={setBotCount}
        rankRp={rankRp}
        onStartBattle={handleStartBattle}
        isShortLandscape={isShortLandscape}
        roomId={roomId}
        setRoomId={setRoomId}
        onOpenCustomRoomModal={() => setIsCustomRoomModalOpen(true)}
      />
    </div>
  );
};
