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
} from '../types/game';
import { sounds } from '../utils/audio';
import { TankVisual } from './TankVisual';
import { HelpModal } from './HelpModal';
import { GarageModal } from './GarageModal';
import { WeatherBackgroundCanvas } from './WeatherBackgroundCanvas';
import {
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
    roofDecal?: RoofDecalId
  ) => void;
  onlineCount: number;
  isSocketConnected: boolean;
  publicPlayers?: PublicPlayerInfo[];
  initialMode?: GameMode;
  initialRoomId?: string;
  currentWeather?: WeatherType;
  ping?: number;
  aimMode?: AimMode;
  onAimModeChange?: (mode: AimMode) => void;
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
  initialMode = 'PUBLIC',
  initialRoomId = 'public',
  currentWeather = 'RAIN',
  ping = 18,
  aimMode,
  onAimModeChange,
}) => {
  // Navigation Tabs: 'home' | 'arsenal' | 'garage' | 'medals' | 'settings'
  const [activeTab, setActiveTab] = useState<'home' | 'arsenal' | 'garage' | 'medals' | 'settings'>('home');

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
    return RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
  });
  const [tankClass, setTankClass] = useState<TankClass>('STRIKER');
  const [color, setColor] = useState('#2563eb');
  const [mode, setMode] = useState<GameMode>(initialMode);
  const [selectedTeam, setSelectedTeam] = useState<Team>('RED');
  const [botCount, setBotCount] = useState<number>(5);
  const [roomId, setRoomId] = useState<string>(initialRoomId);

  // Cosmetics
  const [skinId, setSkinId] = useState<TankSkinId>(() => (localStorage.getItem('tank_skin') as TankSkinId) || 'DEFAULT');
  const [bulletTrail, setBulletTrail] = useState<BulletTrailId>(() => (localStorage.getItem('tank_trail') as BulletTrailId) || 'STANDARD');
  const [roofDecal, setRoofDecal] = useState<RoofDecalId>(() => (localStorage.getItem('tank_decal') as RoofDecalId) || 'FLAG_VIETNAM');
  const [isGarageModalOpen, setIsGarageModalOpen] = useState(false);
  const [arsenalSubTab, setArsenalSubTab] = useState<'classes' | 'skins'>('classes');

  // Weather Simulation state (Rain, Desert, Snow, etc.)
  const [activeWeather, setActiveWeather] = useState<WeatherType>(currentWeather || 'RAIN');

  // Short Landscape Mobile Viewport State
  const [isShortLandscape, setIsShortLandscape] = useState(() => {
    return typeof window !== 'undefined' && window.innerHeight <= 560 && window.innerWidth > window.innerHeight;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsShortLandscape(window.innerHeight <= 560 && window.innerWidth > window.innerHeight);
    };
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

  const handleCopyInviteLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', mode);
    if (roomId && roomId !== 'public') {
      url.searchParams.set('room', roomId);
    } else {
      url.searchParams.delete('room');
    }

    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleSaveCosmetics = (cosmetics: {
    skinId: TankSkinId;
    bulletTrail: BulletTrailId;
    roofDecal: RoofDecalId;
  }) => {
    setSkinId(cosmetics.skinId);
    setBulletTrail(cosmetics.bulletTrail);
    setRoofDecal(cosmetics.roofDecal);
    localStorage.setItem('tank_skin', cosmetics.skinId);
    localStorage.setItem('tank_trail', cosmetics.bulletTrail);
    localStorage.setItem('tank_decal', cosmetics.roofDecal);
  };

  const handleStartBattle = (asSpectator: boolean = false) => {
    const finalName = name.trim() || 'Chỉ Huy Xe Tăng';
    sounds.playShoot(tankClass === 'JUGGERNAUT');
    sounds.startBgm();
    const finalBots = mode === 'AI' ? botCount : 0;
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
      roofDecal
    );
  };

  return (
    <div className="w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 relative overflow-y-auto overflow-x-hidden font-sans">
      {/* Dynamic Battlefield Weather Atmospheric Background (Rainstorm, Sandstorm, Snow, Sunset, Dawn) */}
      <WeatherBackgroundCanvas weather={activeWeather} />

      {/* Mobile Landscape Tips Banner */}
      {showMobileNotice && (
        <div className="relative z-50 bg-emerald-500/15 border-b border-emerald-500/30 px-3 py-1.5 text-xs flex items-center justify-between gap-2 text-emerald-200">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              <strong>Chế độ Di Động Ngang:</strong> Điều khiển xe bằng Cần gạt ảo & nút bấm cảm ứng.
            </span>
          </div>
          <button
            onClick={() => {
              sessionStorage.setItem('dismissed_mobile_notice', 'true');
              setShowMobileNotice(false);
            }}
            className="text-emerald-400 hover:text-white px-2 py-0.5 rounded bg-emerald-500/20 text-[10px] font-bold cursor-pointer shrink-0"
          >
            Đã hiểu
          </button>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <header className={`relative z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md px-3 sm:px-8 ${isShortLandscape ? 'py-1.5' : 'py-3'} flex items-center justify-between`}>
        {/* Brand Logo & Server Badge */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className={`${isShortLandscape ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl'} bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-black shrink-0`}>
              <Shield className={`${isShortLandscape ? 'w-4 h-4' : 'w-6 h-6'} fill-current stroke-[2.5]`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`${isShortLandscape ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'} font-black tracking-wider text-white font-mono leading-none`}>
                  DLAND TANK
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  v2.5 BATTLE ARENA
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                <span className="flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSocketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span className={isSocketConnected ? 'text-emerald-400' : 'text-amber-400'}>
                    {isSocketConnected ? 'Máy chủ trực tuyến' : 'Đang kết nối...'}
                  </span>
                </span>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Users className="w-3 h-3 text-sky-400" />
                  <span>{onlineCount} Xe Đang Đấu</span>
                </span>
                <span className="text-slate-600 hidden md:inline">·</span>
                <button
                  type="button"
                  onClick={handleCycleWeather}
                  className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-amber-500/80 transition-all cursor-pointer group text-[11px]"
                  title="Nhấn để đổi khí hậu chiến trường (Mưa rào sấm sét, Sa mạc bão cát, Tuyết rơi, Hoàng hôn, Bình minh)"
                >
                  <span>{activeWeatherCfg.icon}</span>
                  <span className="font-bold group-hover:text-amber-300 transition-colors" style={{ color: activeWeatherCfg.themeColor }}>
                    {activeWeatherCfg.vietnameseName}
                  </span>
                  <span className="text-[9px] text-slate-500 group-hover:text-amber-400 font-bold ml-0.5">↻ Đổi</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons: Audio, Help, Settings, Share */}
        <div className="flex items-center gap-2">
          {/* Music Toggle */}
          <button
            type="button"
            onClick={handleToggleMusic}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              isMusicPlaying
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title={isMusicPlaying ? 'Tạm dừng nhạc nền chiến trường' : 'Bật nhạc nền chiến trận'}
          >
            <Music className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{isMusicPlaying ? 'Nhạc: BẬT' : 'Nhạc: TẮT'}</span>
          </button>

          {/* Master Mute Toggle */}
          <button
            type="button"
            onClick={handleToggleMute}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Bật âm thanh loa' : 'Tắt tiếng'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('settings');
              sounds.playRadioBeep();
            }}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md'
                : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Cài đặt âm thanh, hệ thống & thông tin trò chơi"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="text-xs font-mono font-bold hidden sm:inline">Cài Đặt</span>
          </button>

          {/* Help Button */}
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-sky-400 hover:text-white transition-colors cursor-pointer"
            title="Hướng dẫn điều khiển & tính năng"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopyInviteLink}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
            title="Sao chép liên kết mời bạn bè"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copiedLink ? 'Đã sao chép' : 'Mời Bạn'}</span>
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT CONTENT */}
      <main className={`flex-1 relative z-10 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 ${isShortLandscape ? 'pb-16 pt-2' : 'pb-28'} flex flex-col justify-center`}>
        {/* =========================================================================
            TAB 1: TRANG CHỦ / CHIẾN TRƯỜNG COMMAND HUB (The Primary Play Experience)
           ========================================================================= */}
        {activeTab === 'home' && (
          <div className={`grid gap-3 sm:gap-6 items-stretch my-auto ${isShortLandscape ? 'grid-cols-2 max-w-5xl' : 'grid-cols-1 lg:grid-cols-12'}`}>
            {/* LEFT COLUMN: COMMANDER'S HANGAR & 3D TANK SHOWCASE */}
            <div className={`${isShortLandscape ? 'p-3 rounded-2xl' : 'lg:col-span-5 p-5 sm:p-6 rounded-3xl'} flex flex-col justify-between bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl relative overflow-hidden`}>
              {/* Top Banner Tag */}
              <div className={`flex items-center justify-between ${isShortLandscape ? 'pb-1.5' : 'pb-3'} border-b border-slate-800`}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs uppercase font-mono tracking-wider text-amber-300 font-bold">
                    Hangar Chỉ Huy
                  </span>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('arsenal');
                    setArsenalSubTab('skins');
                    sounds.playRadioBeep();
                  }}
                  className="flex items-center gap-1 text-[11px] font-mono text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Gara Skin</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Tank Visual Center Stage with Turret Follow / Rotate */}
              <div className={`relative flex flex-col items-center justify-center ${isShortLandscape ? 'py-1 min-h-[90px]' : 'py-8 min-h-[220px]'}`}>
                {/* Visual Ambient Rings */}
                <div
                  className={`absolute rounded-full blur-2xl opacity-25 pointer-events-none ${isShortLandscape ? 'w-24 h-24' : 'w-48 h-48'}`}
                  style={{ backgroundColor: color }}
                />
                <div className={`absolute border border-slate-800/80 rounded-full pointer-events-none stroke-dasharray animate-spin [animation-duration:40s] ${isShortLandscape ? 'w-32 h-32' : 'w-64 h-64'}`} />

                {/* Tank Model Render */}
                <div className={`relative z-10 transition-transform ${isShortLandscape ? 'scale-100 hover:scale-105' : 'scale-125 hover:scale-130'} duration-300`}>
                  <TankVisual
                    tankClass={tankClass}
                    color={color}
                    size={isShortLandscape ? 75 : 130}
                    animated={true}
                    turretAngle={turretAngle}
                  />
                </div>

                {/* Decal Flag on Turret Badge */}
                {roofDecal !== 'NONE' && (
                  <div className={`absolute bg-slate-950/80 border border-slate-800 rounded-xl flex items-center gap-1 shadow-md ${isShortLandscape ? 'top-1 right-1 px-2 py-0.5 text-[10px]' : 'top-4 right-4 px-2.5 py-1 text-xs'}`}>
                    <span>{activeDecal.icon}</span>
                    <span className="font-mono text-slate-300 font-bold">{activeDecal.vietnameseName}</span>
                  </div>
                )}
              </div>

              {/* Active Tank Specs & Customization Details */}
              <div className={`space-y-2 pt-2 border-t border-slate-800`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`${isShortLandscape ? 'text-sm' : 'text-lg'} font-black text-white font-mono flex items-center gap-2`}>
                      <span>{currentStats.name}</span>
                    </h3>
                    {!isShortLandscape && <p className="text-xs text-slate-400">{currentStats.description}</p>}
                  </div>
                  <button
                    onClick={() => setActiveTab('arsenal')}
                    className="px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-colors cursor-pointer"
                  >
                    Đổi Lớp Xe
                  </button>
                </div>

                {/* Stat Gauges (HP, Speed, Damage, Reload) */}
                <div className={`grid grid-cols-2 gap-1.5 font-mono bg-slate-950/60 rounded-xl border border-slate-800/80 ${isShortLandscape ? 'p-1.5 text-[10px]' : 'p-3 text-xs'}`}>
                  <div>
                    <div className="text-[10px] text-slate-400 flex justify-between">
                      <span>HP:</span>
                      <strong className="text-emerald-400">{currentStats.maxHp}</strong>
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-0.5">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${(currentStats.maxHp / 150) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 flex justify-between">
                      <span>TỐC:</span>
                      <strong className="text-sky-400">{currentStats.speed}</strong>
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-0.5">
                      <div
                        className="bg-sky-500 h-full rounded-full"
                        style={{ width: `${(currentStats.speed / 6.0) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 flex justify-between">
                      <span>SÁT THƯƠNG:</span>
                      <strong className="text-amber-400">{currentStats.bulletDamage}</strong>
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-0.5">
                      <div
                        className="bg-amber-500 h-full rounded-full"
                        style={{ width: `${(currentStats.bulletDamage / 45) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 flex justify-between">
                      <span>VẬN TỐC ĐẠN:</span>
                      <strong className="text-purple-400">{currentStats.bulletSpeed}</strong>
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-0.5">
                      <div
                        className="bg-purple-500 h-full rounded-full"
                        style={{ width: `${(currentStats.bulletSpeed / 13) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Equipped Cosmetics Badge Row */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <div
                    onClick={() => {
                      setActiveTab('arsenal');
                      setArsenalSubTab('skins');
                      sounds.playRadioBeep();
                    }}
                    className={`flex-1 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center gap-1.5 transition-colors ${isShortLandscape ? 'p-1 text-[10px]' : 'p-2 text-xs'}`}
                    title="Click để đổi màu sơn ngoại trang"
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: activeSkin.primaryColor }} />
                    <div className="truncate">
                      <div className="font-bold text-white truncate text-[10px] leading-tight">{activeSkin.vietnameseName}</div>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      setActiveTab('arsenal');
                      setArsenalSubTab('skins');
                      sounds.playRadioBeep();
                    }}
                    className={`flex-1 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center gap-1.5 transition-colors ${isShortLandscape ? 'p-1 text-[10px]' : 'p-2 text-xs'}`}
                    title="Click để đổi vệt đạn"
                  >
                    <span className="text-[10px] shrink-0">{activeTrail.icon}</span>
                    <div className="truncate">
                      <div className="font-bold text-white truncate text-[10px] leading-tight">{activeTrail.vietnameseName}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: BATTLE COMMAND CENTER */}
            <div className={`${isShortLandscape ? 'p-3 rounded-2xl space-y-2' : 'lg:col-span-7 p-5 sm:p-7 rounded-3xl space-y-5'} flex flex-col justify-between bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl`}>
              {/* 1. Commander Name & Color Selection */}
              <div className={`${isShortLandscape ? 'space-y-1.5' : 'space-y-3'}`}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tên Chỉ Huy Xe Tăng</span>
                  </label>
                  {!isShortLandscape && <span className="text-[11px] text-slate-400 font-mono">Chiến binh tác chiến</span>}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={20}
                    placeholder="Nhập tên xe tăng..."
                    className={`flex-1 bg-slate-950/90 border border-slate-800 focus:border-amber-500 rounded-xl px-3 text-white font-mono text-xs sm:text-sm font-bold focus:outline-none transition-colors shadow-inner ${
                      isShortLandscape ? 'py-1.5' : 'py-2.5'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleRandomizeName}
                    className={`px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      isShortLandscape ? 'py-1.5' : 'py-2.5'
                    }`}
                    title="Tạo tên ngẫu nhiên"
                  >
                    <Dices className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Ngẫu Nhiên</span>
                  </button>
                </div>

                {/* Color presets */}
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 shrink-0">Màu Xe:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => setColor(preset.hex)}
                        className={`rounded-full transition-all cursor-pointer relative ${isShortLandscape ? 'w-5 h-5' : 'w-6 h-6'} ${
                          color === preset.hex ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: preset.hex }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Game Mode Selection (5 Clean Cards) */}
              <div className={`${isShortLandscape ? 'space-y-1' : 'space-y-2.5'}`}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                    <Swords className="w-3.5 h-3.5 text-sky-400" />
                    <span>Chọn Chế Độ Chiến Đấu</span>
                  </label>
                  {!isShortLandscape && (
                    <span className="text-[10px] font-mono text-sky-300 bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 rounded font-bold">
                      5 CHẾ ĐỘ THỜI GIAN THỰC
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {/* Public FFA */}
                  <button
                    type="button"
                    onClick={() => setMode('PUBLIC')}
                    className={`rounded-xl border text-left transition-all cursor-pointer relative ${isShortLandscape ? 'p-1.5' : 'p-3 rounded-2xl'} ${
                      mode === 'PUBLIC'
                        ? 'bg-sky-500/15 border-sky-500 ring-2 ring-sky-500/40 text-white shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="truncate">Đấu Trường Tự Do</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">
                      Hỗn chiến 4200m, Boss thế giới
                    </div>
                  </button>

                  {/* Battle Royale */}
                  <button
                    type="button"
                    onClick={() => setMode('BATTLE_ROYALE')}
                    className={`rounded-xl border text-left transition-all cursor-pointer relative ${isShortLandscape ? 'p-1.5' : 'p-3 rounded-2xl'} ${
                      mode === 'BATTLE_ROYALE'
                        ? 'bg-purple-500/15 border-purple-500 ring-2 ring-purple-500/40 text-white shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">Sinh Tồn Bo Độc</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">
                      Vòng bo thu hẹp, 1 xe sống sót
                    </div>
                  </button>

                  {/* Team Deathmatch */}
                  <button
                    type="button"
                    onClick={() => setMode('TEAM_DEATHMATCH')}
                    className={`rounded-xl border text-left transition-all cursor-pointer relative ${isShortLandscape ? 'p-1.5' : 'p-3 rounded-2xl'} ${
                      mode === 'TEAM_DEATHMATCH'
                        ? 'bg-rose-500/15 border-rose-500 ring-2 ring-rose-500/40 text-white shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Users className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="truncate">Đấu Đội 5v5</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">
                      Đỏ vs Xanh, căn cứ hồi máu
                    </div>
                  </button>

                  {/* Boss Raid */}
                  <button
                    type="button"
                    onClick={() => setMode('BOSS_RAID')}
                    className={`rounded-xl border text-left transition-all cursor-pointer relative ${isShortLandscape ? 'p-1.5' : 'p-3 rounded-2xl'} ${
                      mode === 'BOSS_RAID'
                        ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/40 text-white shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Skull className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">Săn Boss Thế Giới</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">
                      Hợp sức hạ Leviathan
                    </div>
                  </button>

                  {/* AI Bots */}
                  <button
                    type="button"
                    onClick={() => setMode('AI')}
                    className={`rounded-xl border text-left transition-all cursor-pointer relative col-span-2 sm:col-span-2 ${isShortLandscape ? 'p-1.5' : 'p-3 rounded-2xl'} ${
                      mode === 'AI'
                        ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/40 text-white shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Bot className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">Tập Trận Luyện Tập (Offline Bots)</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">
                      Luyện tập ngắm bắn và né đạn với máy thông minh
                    </div>
                  </button>
                </div>

                {/* Conditional Sub-settings for Team or AI */}
                {mode === 'TEAM_DEATHMATCH' && (
                  <div className={`p-2 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between animate-in fade-in duration-200 text-xs`}>
                    <span className="font-mono text-slate-300 font-bold">Chọn Phe:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTeam('RED')}
                        className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer border ${
                          selectedTeam === 'RED'
                            ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        🔴 Phe Đỏ
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTeam('BLUE')}
                        className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer border ${
                          selectedTeam === 'BLUE'
                            ? 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-600/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        🔵 Phe Xanh
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'AI' && (
                  <div className={`p-2 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between animate-in fade-in duration-200 text-xs`}>
                    <span className="font-mono text-slate-300 font-bold">Số lượng Bot:</span>
                    <select
                      value={botCount}
                      onChange={(e) => setBotCount(Number(e.target.value))}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-amber-300 focus:outline-none cursor-pointer"
                    >
                      {BOT_OPTIONS.map((opt) => (
                        <option key={opt.count} value={opt.count}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* 3. Primary Play & Spectate Action CTAs */}
              <div className={`${isShortLandscape ? 'pt-1 space-y-1.5' : 'pt-2 space-y-3'}`}>
                <div className="flex items-center gap-2">
                  {/* Big Play CTA Button */}
                  <button
                    type="button"
                    onClick={() => handleStartBattle(false)}
                    className={`flex-1 w-full rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-400 hover:via-yellow-400 hover:to-orange-400 text-slate-950 font-black tracking-wider uppercase font-mono shadow-xl shadow-amber-500/25 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2 ${
                      isShortLandscape ? 'py-2.5 px-4 text-sm' : 'py-4 px-6 text-base sm:text-lg rounded-2xl'
                    }`}
                  >
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                    <span>Xung Trận Ngay (Vào Đấu)</span>
                  </button>

                  {/* Spectate Button */}
                  <button
                    type="button"
                    onClick={() => handleStartBattle(true)}
                    className={`rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-sky-300 hover:text-white font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 shrink-0 ${
                      isShortLandscape ? 'py-2.5 px-3' : 'py-4 px-5 rounded-2xl'
                    }`}
                    title="Quan sát diễn biến trận đấu không tham gia bắn"
                  >
                    <Eye className="w-4 h-4" />
                    <span className={isShortLandscape ? 'hidden sm:inline' : ''}>Xem Trận</span>
                  </button>
                </div>

                {/* Hotkeys footer quick cue */}
                {!isShortLandscape && (
                  <div className="text-center text-[11px] text-slate-500 font-mono">
                    <span>Điều khiển: <strong>WASD / Mũi tên</strong> (Di chuyển) · <strong>C</strong> (Đổi ngắm bắn) · <strong>Space / J / Chuột</strong> (Bắn) · <strong>Shift / Q / E / R</strong> (Kỹ năng)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: KHO XE TĂNG (Tank Arsenal & Specs Comparison)
           ========================================================================= */}
        {(activeTab === 'arsenal' || activeTab === 'garage') && (
          <div className={`${isShortLandscape ? 'space-y-3' : 'space-y-6'} my-auto`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${isShortLandscape ? 'pb-1.5' : 'pb-3'} border-b border-slate-800`}>
              <div>
                <h2 className={`${isShortLandscape ? 'text-base sm:text-lg' : 'text-2xl'} font-black text-white font-mono flex items-center gap-2`}>
                  <Shield className={`${isShortLandscape ? 'w-4 h-4' : 'w-6 h-6'} text-amber-400`} />
                  <span>KHO XE TĂNG CHIẾN THUẬT & GARA SKINS</span>
                </h2>
                {!isShortLandscape && (
                  <p className="text-xs text-slate-400 mt-1">
                    Chọn 3 lớp xe thiết giáp chiến đấu và tùy biến sơn ngụy trang, vệt đạn rực lửa, cờ nóc pháo.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsGarageModalOpen(true)}
                  className={`bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-xl font-bold font-mono transition-all shadow-md shadow-fuchsia-600/20 flex items-center gap-1.5 cursor-pointer ${
                    isShortLandscape ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-2 text-xs'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Phòng Thử Nghiệm 3D</span>
                  <span className="sm:hidden">Thử 3D</span>
                </button>
                <button
                  onClick={() => setActiveTab('home')}
                  className={`bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold font-mono transition-colors cursor-pointer ${
                    isShortLandscape ? 'px-3 py-1 text-[11px]' : 'px-4 py-2 text-xs'
                  }`}
                >
                  Quay Lại Sảnh
                </button>
              </div>
            </div>

            {/* Sub-Tabs: 3 Dòng Thiết Giáp vs Gara Ngoại Trang */}
            <div className={`flex items-center gap-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 w-fit ${
              isShortLandscape ? 'p-1' : 'p-1.5'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setArsenalSubTab('classes');
                  sounds.playRadioBeep();
                }}
                className={`rounded-xl font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isShortLandscape ? 'px-2.5 py-1 text-[10px]' : 'px-4 py-2 text-xs'
                } ${
                  arsenalSubTab === 'classes' && activeTab !== 'garage'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>3 DÒNG THIẾT GIÁP</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setArsenalSubTab('skins');
                  sounds.playRadioBeep();
                }}
                className={`rounded-xl font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isShortLandscape ? 'px-2.5 py-1 text-[10px]' : 'px-4 py-2 text-xs'
                } ${
                  arsenalSubTab === 'skins' || activeTab === 'garage'
                    ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>GARA NGOẠI TRANG & SKINS</span>
              </button>
            </div>

            {arsenalSubTab === 'classes' && activeTab !== 'garage' && (
              <div className={`grid ${isShortLandscape ? 'grid-cols-3 gap-2.5' : 'grid-cols-1 md:grid-cols-3 gap-6'}`}>
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
                      isShortLandscape ? 'p-2.5 rounded-2xl' : 'p-6 rounded-3xl'
                    } ${
                      isSelected
                        ? 'bg-slate-900/90 border-amber-500 ring-2 ring-amber-500/40 shadow-2xl shadow-amber-500/10'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      {/* Badge */}
                      <div className={`flex items-center justify-between ${isShortLandscape ? 'mb-1' : 'mb-4'}`}>
                        <span
                          className={`font-mono font-bold border uppercase tracking-wider ${
                            isShortLandscape ? 'px-1.5 py-0.2 text-[8px] rounded' : 'px-3 py-1 rounded-full text-[10px]'
                          } ${
                            isSelected
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {isSelected ? 'ĐÃ CHỌN ⚡' : 'SẴN SÀNG'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{tClass}</span>
                      </div>

                      {/* Visual 3D SVG */}
                      <div className={`flex items-center justify-center ${isShortLandscape ? 'py-1' : 'py-6'}`}>
                        <TankVisual
                          tankClass={tClass}
                          color={color}
                          size={isShortLandscape ? 65 : 110}
                          animated={isSelected}
                          turretAngle={isSelected ? turretAngle : 0}
                        />
                      </div>

                      <h3 className={`${isShortLandscape ? 'text-xs' : 'text-xl'} font-black text-white font-mono`}>{stats.name}</h3>
                      {!isShortLandscape && <p className="text-xs text-slate-400 mt-1 min-h-[36px]">{stats.description}</p>}

                      {/* Specification bars */}
                      <div className={`bg-slate-950/60 rounded-xl border border-slate-800/80 font-mono ${
                        isShortLandscape ? 'mt-1.5 space-y-1 p-1.5 text-[9px]' : 'mt-5 space-y-2.5 p-4 rounded-2xl text-xs'
                      }`}>
                        <div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">HP:</span>
                            <span className="text-emerald-400 font-bold">{stats.maxHp}</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-0.5">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(stats.maxHp / 150) * 100}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Tốc Độ:</span>
                            <span className="text-sky-400 font-bold">{stats.speed}</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-0.5">
                            <div className="bg-sky-500 h-full rounded-full" style={{ width: `${(stats.speed / 6.0) * 100}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Sát Thương:</span>
                            <span className="text-amber-400 font-bold">{stats.bulletDamage}</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-0.5">
                            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(stats.bulletDamage / 45) * 100}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Nạp Đạn:</span>
                            <span className="text-purple-400 font-bold">{stats.fireCooldown}ms</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-0.5">
                            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${((600 - stats.fireCooldown) / 400) * 100}%` }} />
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
                        isShortLandscape ? 'mt-2 py-1 text-[10px] rounded-lg' : 'mt-5 py-2.5 rounded-xl text-xs'
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
            <div className={`${isShortLandscape ? 'space-y-3' : 'space-y-6'}`}>

            {/* Quick Skins Cards Grid */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-2 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>1. Bộ Sưu Tập Sơn Xe (Paint Skins)</span>
              </h3>
              <div className={`grid ${isShortLandscape ? 'grid-cols-3 sm:grid-cols-6 gap-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3'}`}>
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
                        isShortLandscape ? 'p-2 rounded-xl' : 'p-3.5 rounded-2xl'
                      } ${
                        isSelected
                          ? 'bg-slate-900 border-amber-500 ring-2 ring-amber-500/40 shadow-xl'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div
                          className={`w-full rounded-xl bg-gradient-to-br ${s.previewGradient} border flex items-center justify-center shadow-inner relative ${
                            isShortLandscape ? 'h-9' : 'h-14'
                          }`}
                        >
                          <span className="w-3.5 h-3.5 rounded-full border border-white/50" style={{ backgroundColor: s.primaryColor }} />
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[9px] font-bold">
                              ✓
                            </div>
                          )}
                        </div>
                        <h4 className={`font-bold text-white truncate font-mono mt-1.5 ${isShortLandscape ? 'text-[10px]' : 'text-xs'}`}>{s.vietnameseName}</h4>
                        {!isShortLandscape && <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{s.description}</p>}
                      </div>
                      <span className="mt-1 text-[8px] sm:text-[9px] font-mono text-amber-300 font-bold">{s.badge}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Bullet Trails Grid */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-2 flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>2. Vệt Đạn & Nòng Pháo (Bullet Trails)</span>
              </h3>
              <div className={`grid ${isShortLandscape ? 'grid-cols-3 sm:grid-cols-5 gap-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3'}`}>
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
                        isShortLandscape ? 'p-2 rounded-xl' : 'p-3.5 rounded-2xl'
                      } ${
                        isSelected
                          ? 'bg-slate-900 border-amber-500 ring-2 ring-amber-500/40 shadow-xl'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className={`w-full rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner ${
                          isShortLandscape ? 'h-8 text-xl' : 'h-12 text-2xl'
                        }`}>
                          {tr.icon}
                        </div>
                        <h4 className={`font-bold text-white truncate font-mono mt-1 ${isShortLandscape ? 'text-[10px]' : 'text-xs'}`}>{tr.vietnameseName}</h4>
                        {!isShortLandscape && <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{tr.description}</p>}
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tr.color }} />
                        <span className="text-[9px] font-mono text-slate-300">{tr.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Roof Decals Grid */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-2 flex items-center gap-2">
                <Flag className="w-3.5 h-3.5 text-rose-400" />
                <span>3. Lá Cờ & Biểu Tượng Nóc Tháp Pháo (Decals)</span>
              </h3>
              <div className={`grid ${isShortLandscape ? 'grid-cols-4 sm:grid-cols-7 gap-1.5' : 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3'}`}>
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
                        isShortLandscape ? 'p-1.5 rounded-xl' : 'p-3 rounded-2xl'
                      } ${
                        isSelected
                          ? 'bg-slate-900 border-amber-500 ring-2 ring-amber-500/40 shadow-xl'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className={`${isShortLandscape ? 'text-2xl py-0.5' : 'text-3xl py-2'}`}>{d.icon}</div>
                      <h4 className="font-bold text-white text-[9px] sm:text-[11px] truncate font-mono w-full">{d.vietnameseName}</h4>
                      {!isShortLandscape && <span className="text-[9px] text-slate-400 mt-1 line-clamp-1">{d.description}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    )}

        {/* =========================================================================
            TAB 4: HUÂN CHƯƠNG CHIẾN CÔNG (Medals & Accolades Showcase)
           ========================================================================= */}
        {activeTab === 'medals' && (
          <div className={`${isShortLandscape ? 'space-y-3' : 'space-y-6'} my-auto`}>
            <div className={`flex items-center justify-between ${isShortLandscape ? 'pb-1.5' : 'pb-3'} border-b border-slate-800`}>
              <div>
                <h2 className={`${isShortLandscape ? 'text-base sm:text-lg' : 'text-2xl'} font-black text-white font-mono flex items-center gap-2`}>
                  <Trophy className={`${isShortLandscape ? 'w-4 h-4' : 'w-6 h-6'} text-yellow-400`} />
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
                className={`bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold font-mono transition-colors cursor-pointer ${
                  isShortLandscape ? 'px-3 py-1 text-[11px]' : 'px-4 py-2 text-xs'
                }`}
              >
                Quay Lại Sảnh
              </button>
            </div>

            <div className={`grid ${isShortLandscape ? 'grid-cols-2 sm:grid-cols-4 gap-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'}`}>
              {(Object.keys(COMBAT_MEDALS) as CombatMedalType[]).map((mKey) => {
                const m = COMBAT_MEDALS[mKey];

                return (
                  <div
                    key={mKey}
                    className={`bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl ${
                      isShortLandscape ? 'p-2.5 rounded-2xl' : 'p-5 rounded-3xl'
                    }`}
                  >
                    <div>
                      <div className={`flex items-center justify-between ${isShortLandscape ? 'mb-1.5' : 'mb-3'}`}>
                        <span className={`rounded-xl bg-slate-950 border border-slate-800 ${isShortLandscape ? 'text-xl p-1' : 'text-3xl p-2'}`}>{m.icon}</span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold border"
                          style={{ borderColor: `${m.color}66`, color: m.color, backgroundColor: `${m.color}15` }}
                        >
                          {m.title}
                        </span>
                      </div>

                      <h3 className={`${isShortLandscape ? 'text-xs' : 'text-base'} font-black text-white font-mono`}>{m.vietnameseTitle}</h3>
                      <p className={`text-slate-400 mt-0.5 ${isShortLandscape ? 'text-[9px] line-clamp-1' : 'text-xs'}`}>{m.subtitle}</p>

                      <div className={`rounded-lg bg-slate-950/80 border border-slate-800/80 font-mono text-slate-300 ${
                        isShortLandscape ? 'mt-1.5 p-1.5 text-[9px]' : 'mt-4 p-2.5 text-[11px]'
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
                      className={`w-full rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isShortLandscape ? 'mt-2 py-1 text-[10px]' : 'mt-4 py-2 text-xs'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
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
          <div className={`max-w-2xl w-full mx-auto ${isShortLandscape ? 'space-y-3' : 'space-y-6'} my-auto`}>
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
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Giọng Phát Thanh Viên Chiến Trường</div>
                    <div className="text-xs text-slate-400">
                      Tự động xướng chuỗi hạ gục (First Blood, Double Kill), thời tiết, boss xuất hiện, kỹ năng
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
                    className={`px-4 py-2 rounded-xl font-bold text-xs font-mono border transition-all cursor-pointer ${
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
                    v2.5 RELEASE
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

      {/* FLUSH BOTTOM-LEFT TACTICAL COMMAND CONSOLE (To vuông vức, zero margin ngoài, HUD chuẩn thiết giáp) */}
      <nav className={`fixed bottom-0 left-0 z-40 m-0 p-0 rounded-none bg-slate-950/95 border-t-2 border-r-2 border-slate-700/90 shadow-2xl backdrop-blur-2xl flex items-stretch divide-x-2 divide-slate-800/90 shadow-black/95 select-none overflow-x-auto max-w-full ${
        isShortLandscape ? 'h-11 sm:h-12' : 'h-16 sm:h-20'
      }`}>
        {/* 1. Chiến Trường */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('home');
            sounds.playRadioBeep();
          }}
          className={`${
            isShortLandscape ? 'px-3 sm:px-5 py-1.5' : 'h-16 sm:h-20 px-6 sm:px-8 py-3 sm:py-4'
          } transition-all cursor-pointer flex items-center gap-2 sm:gap-4 relative select-none shrink-0 ${
            activeTab === 'home'
              ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.35)]'
              : 'text-slate-300 hover:text-white hover:bg-slate-900/90'
          }`}
        >
          {activeTab === 'home' && (
            <div className="absolute top-0 left-0 right-0 h-1 sm:h-1.5 bg-yellow-300 shadow-[0_0_10px_#fde047]" />
          )}
          <Swords className={`${isShortLandscape ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-6 h-6 sm:w-7 sm:h-7'} shrink-0 ${activeTab === 'home' ? 'text-slate-950 stroke-[2.5]' : 'text-amber-400'}`} />
          <div className="text-left font-mono">
            <div className={`${isShortLandscape ? 'text-xs' : 'text-sm sm:text-base'} font-black tracking-wider uppercase leading-none`}>
              Chiến Trường
            </div>
            {!isShortLandscape && (
              <div className={`text-[10px] sm:text-xs mt-1.5 font-bold ${activeTab === 'home' ? 'text-slate-900' : 'text-slate-400'}`}>
                Xuất Trận Ngay
              </div>
            )}
          </div>
        </button>

        {/* 2. Kho Xe Tăng */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('arsenal');
            setArsenalSubTab('classes');
            sounds.playRadioBeep();
          }}
          className={`${
            isShortLandscape ? 'px-3 sm:px-5 py-1.5' : 'h-16 sm:h-20 px-6 sm:px-8 py-3 sm:py-4'
          } transition-all cursor-pointer flex items-center gap-2 sm:gap-4 relative select-none shrink-0 ${
            activeTab === 'arsenal' || activeTab === 'garage'
              ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.35)]'
              : 'text-slate-300 hover:text-white hover:bg-slate-900/90'
          }`}
        >
          {(activeTab === 'arsenal' || activeTab === 'garage') && (
            <div className="absolute top-0 left-0 right-0 h-1 sm:h-1.5 bg-yellow-300 shadow-[0_0_10px_#fde047]" />
          )}
          <Shield className={`${isShortLandscape ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-6 h-6 sm:w-7 sm:h-7'} shrink-0 ${activeTab === 'arsenal' || activeTab === 'garage' ? 'text-slate-950 stroke-[2.5]' : 'text-sky-400'}`} />
          <div className="text-left font-mono">
            <div className={`${isShortLandscape ? 'text-xs' : 'text-sm sm:text-base'} font-black tracking-wider uppercase leading-none`}>
              Kho Xe Tăng
            </div>
            {!isShortLandscape && (
              <div className={`text-[10px] sm:text-xs mt-1.5 font-bold ${activeTab === 'arsenal' || activeTab === 'garage' ? 'text-slate-900' : 'text-slate-400'}`}>
                3 Lớp Xe & Gara
              </div>
            )}
          </div>
        </button>

        {/* 3. Huân Chương */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('medals');
            sounds.playRadioBeep();
          }}
          className={`${
            isShortLandscape ? 'px-3 sm:px-5 py-1.5' : 'h-16 sm:h-20 px-6 sm:px-8 py-3 sm:py-4'
          } transition-all cursor-pointer flex items-center gap-2 sm:gap-4 relative select-none shrink-0 ${
            activeTab === 'medals'
              ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.35)]'
              : 'text-slate-300 hover:text-white hover:bg-slate-900/90'
          }`}
        >
          {activeTab === 'medals' && (
            <div className="absolute top-0 left-0 right-0 h-1 sm:h-1.5 bg-yellow-300 shadow-[0_0_10px_#fde047]" />
          )}
          <Trophy className={`${isShortLandscape ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-6 h-6 sm:w-7 sm:h-7'} shrink-0 ${activeTab === 'medals' ? 'text-slate-950 stroke-[2.5]' : 'text-yellow-400'}`} />
          <div className="text-left font-mono">
            <div className={`${isShortLandscape ? 'text-xs' : 'text-sm sm:text-base'} font-black tracking-wider uppercase leading-none`}>
              Huân Chương
            </div>
            {!isShortLandscape && (
              <div className={`text-[10px] sm:text-xs mt-1.5 font-bold ${activeTab === 'medals' ? 'text-slate-900' : 'text-slate-400'}`}>
                Vinh Danh Chiến Công
              </div>
            )}
          </div>
        </button>
      </nav>

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
    </div>
  );
};
