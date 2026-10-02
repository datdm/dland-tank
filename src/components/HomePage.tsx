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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 relative overflow-x-hidden font-sans">
      {/* Dynamic Battlefield Weather Atmospheric Background (Rainstorm, Sandstorm, Snow, Sunset, Dawn) */}
      <WeatherBackgroundCanvas weather={activeWeather} />

      {/* Mobile Notice Banner */}
      {showMobileNotice && (
        <div className="relative z-50 bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-xs flex items-center justify-between gap-3 text-amber-200">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Gợi ý:</strong> DLAND TANK tối ưu nhất khi điều khiển bằng Bàn phím & Chuột trên PC / Laptop.
            </span>
          </div>
          <button
            onClick={() => {
              sessionStorage.setItem('dismissed_mobile_notice', 'true');
              setShowMobileNotice(false);
            }}
            className="text-amber-400 hover:text-white px-2 py-0.5 rounded bg-amber-500/20 font-bold"
          >
            Đã hiểu
          </button>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <header className="relative z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between">
        {/* Brand Logo & Server Badge */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-black">
              <Shield className="w-6 h-6 fill-current stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-white font-mono leading-none">
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
      <main className="flex-1 relative z-10 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-28 flex flex-col justify-center">
        {/* =========================================================================
            TAB 1: TRANG CHỦ / CHIẾN TRƯỜNG COMMAND HUB (The Primary Play Experience)
           ========================================================================= */}
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch my-auto">
            {/* LEFT COLUMN: COMMANDER'S HANGAR & 3D TANK SHOWCASE (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              {/* Top Banner Tag */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs uppercase font-mono tracking-wider text-amber-300 font-bold">
                    Hangar Chiến Xa Chỉ Huy
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
                  <span>Mở Gara Skin</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Tank Visual Center Stage with Turret Follow / Rotate */}
              <div className="relative py-8 flex flex-col items-center justify-center min-h-[220px]">
                {/* Visual Ambient Rings */}
                <div
                  className="absolute w-48 h-48 rounded-full blur-2xl opacity-25 pointer-events-none"
                  style={{ backgroundColor: color }}
                />
                <div className="absolute w-64 h-64 border border-slate-800/80 rounded-full pointer-events-none stroke-dasharray animate-spin [animation-duration:40s]" />

                {/* Tank Model Render */}
                <div className="relative z-10 scale-125 transition-transform hover:scale-130 duration-300">
                  <TankVisual
                    tankClass={tankClass}
                    color={color}
                    size={130}
                    animated={true}
                    turretAngle={turretAngle}
                  />
                </div>

                {/* Decal Flag on Turret Badge */}
                {roofDecal !== 'NONE' && (
                  <div className="absolute top-4 right-4 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 shadow-md">
                    <span>{activeDecal.icon}</span>
                    <span className="text-[11px] font-mono text-slate-300 font-bold">{activeDecal.vietnameseName}</span>
                  </div>
                )}
              </div>

              {/* Active Tank Specs & Customization Details */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white font-mono flex items-center gap-2">
                      <span>{currentStats.name}</span>
                    </h3>
                    <p className="text-xs text-slate-400">{currentStats.description}</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('arsenal')}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-colors"
                  >
                    Đổi Lớp Xe
                  </button>
                </div>

                {/* Stat Gauges (HP, Speed, Damage, Reload) */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                  <div>
                    <div className="text-[10px] text-slate-400 flex justify-between">
                      <span>GIÁP / HP:</span>
                      <strong className="text-emerald-400">{currentStats.maxHp} HP</strong>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${(currentStats.maxHp / 150) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 flex justify-between">
                      <span>TỐC ĐỘ:</span>
                      <strong className="text-sky-400">{currentStats.speed} m/s</strong>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-sky-500 h-full rounded-full"
                        style={{ width: `${(currentStats.speed / 6.0) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 flex justify-between">
                      <span>SÁT THƯƠNG:</span>
                      <strong className="text-amber-400">{currentStats.bulletDamage} DMG</strong>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
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
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-purple-500 h-full rounded-full"
                        style={{ width: `${(currentStats.bulletSpeed / 13) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Equipped Cosmetics Badge Row */}
                <div className="flex items-center gap-2 pt-1">
                  <div
                    onClick={() => {
                      setActiveTab('arsenal');
                      setArsenalSubTab('skins');
                      sounds.playRadioBeep();
                    }}
                    className="flex-1 p-2 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center gap-2 text-xs transition-colors"
                    title="Click để đổi màu sơn ngoại trang"
                  >
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: activeSkin.primaryColor }} />
                    <div className="truncate">
                      <div className="text-[9px] text-slate-400 font-mono">SƠN XE</div>
                      <div className="font-bold text-white truncate text-[11px]">{activeSkin.vietnameseName}</div>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      setActiveTab('arsenal');
                      setArsenalSubTab('skins');
                      sounds.playRadioBeep();
                    }}
                    className="flex-1 p-2 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center gap-2 text-xs transition-colors"
                    title="Click để đổi vệt đạn"
                  >
                    <span className="text-xs shrink-0">{activeTrail.icon}</span>
                    <div className="truncate">
                      <div className="text-[9px] text-slate-400 font-mono">VỆT ĐẠN</div>
                      <div className="font-bold text-white truncate text-[11px]">{activeTrail.vietnameseName}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: BATTLE COMMAND CENTER (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl space-y-5">
              {/* 1. Commander Name & Color Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-amber-400" />
                    <span>Tên Chỉ Huy Xe Tăng</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">Chiến binh tác chiến</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={20}
                    placeholder="Nhập tên xe tăng..."
                    className="flex-1 bg-slate-950/90 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-white font-mono text-sm font-bold focus:outline-none transition-colors shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={handleRandomizeName}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    title="Tạo tên ngẫu nhiên"
                  >
                    <Dices className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline">Ngẫu Nhiên</span>
                  </button>
                </div>

                {/* Color presets */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">Màu Xe:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => setColor(preset.hex)}
                        className={`w-6 h-6 rounded-full transition-all cursor-pointer relative ${
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
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                    <Swords className="w-4 h-4 text-sky-400" />
                    <span>Chọn Chế Độ Chiến Đấu</span>
                  </label>
                  <span className="text-[10px] font-mono text-sky-300 bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 rounded font-bold">
                    5 CHẾ ĐỘ THỜI GIAN THỰC
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {/* Public FFA */}
                  <button
                    type="button"
                    onClick={() => setMode('PUBLIC')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      mode === 'PUBLIC'
                        ? 'bg-sky-500/15 border-sky-500 ring-2 ring-sky-500/40 text-white shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Globe className="w-3.5 h-3.5 text-sky-400" />
                      <span>Đấu Trường Tự Do</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                      Hỗn chiến 4200m, Boss thế giới
                    </div>
                  </button>

                  {/* Battle Royale */}
                  <button
                    type="button"
                    onClick={() => setMode('BATTLE_ROYALE')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      mode === 'BATTLE_ROYALE'
                        ? 'bg-purple-500/15 border-purple-500 ring-2 ring-purple-500/40 text-white shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Zap className="w-3.5 h-3.5 text-purple-400" />
                      <span>Sinh Tồn Bo Độc</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                      Vòng bo thu hẹp, 1 xe sống sót
                    </div>
                  </button>

                  {/* Team Deathmatch */}
                  <button
                    type="button"
                    onClick={() => setMode('TEAM_DEATHMATCH')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      mode === 'TEAM_DEATHMATCH'
                        ? 'bg-rose-500/15 border-rose-500 ring-2 ring-rose-500/40 text-white shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Users className="w-3.5 h-3.5 text-rose-400" />
                      <span>Đấu Đội 5v5</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                      Đỏ vs Xanh, căn cứ hồi máu
                    </div>
                  </button>

                  {/* Boss Raid */}
                  <button
                    type="button"
                    onClick={() => setMode('BOSS_RAID')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      mode === 'BOSS_RAID'
                        ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/40 text-white shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Skull className="w-3.5 h-3.5 text-amber-400" />
                      <span>Săn Boss Thế Giới</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                      Hợp sức hạ gục Leviathan
                    </div>
                  </button>

                  {/* AI Bots */}
                  <button
                    type="button"
                    onClick={() => setMode('AI')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative col-span-2 sm:col-span-2 ${
                      mode === 'AI'
                        ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/40 text-white shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Bot className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tập Trận Luyện Tập (Offline Bots)</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Luyện tập ngắm bắn và né đạn với máy thông minh
                    </div>
                  </button>
                </div>

                {/* Conditional Sub-settings for Team or AI */}
                {mode === 'TEAM_DEATHMATCH' && (
                  <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between animate-in fade-in duration-200">
                    <span className="text-xs font-mono text-slate-300 font-bold">Chọn Phe Xuất Trận:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTeam('RED')}
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
                          selectedTeam === 'RED'
                            ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        🔴 Phe Đỏ (RED)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTeam('BLUE')}
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
                          selectedTeam === 'BLUE'
                            ? 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-600/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        🔵 Phe Xanh (BLUE)
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'AI' && (
                  <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between animate-in fade-in duration-200">
                    <span className="text-xs font-mono text-slate-300 font-bold">Số lượng Bot tham chiến:</span>
                    <select
                      value={botCount}
                      onChange={(e) => setBotCount(Number(e.target.value))}
                      className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 text-xs font-mono font-bold text-amber-300 focus:outline-none cursor-pointer"
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
              <div className="pt-2 space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* Big Play CTA Button */}
                  <button
                    type="button"
                    onClick={() => handleStartBattle(false)}
                    className="flex-1 w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-400 hover:via-yellow-400 hover:to-orange-400 text-slate-950 font-black text-base sm:text-lg tracking-wider uppercase font-mono shadow-xl shadow-amber-500/25 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-3"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Xung Trận Ngay (Vào Đấu)</span>
                  </button>

                  {/* Spectate Button */}
                  <button
                    type="button"
                    onClick={() => handleStartBattle(true)}
                    className="w-full sm:w-auto py-4 px-5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-sky-300 hover:text-white font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                    title="Quan sát diễn biến trận đấu không tham gia bắn"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Xem Trận Đấu (Khán Giả)</span>
                  </button>
                </div>

                {/* Hotkeys footer quick cue */}
                <div className="text-center text-[11px] text-slate-500 font-mono">
                  <span>Điều khiển: <strong>WASD / Mũi tên</strong> (Di chuyển) · <strong>Chuột</strong> (Xoay nòng & Bắn) · <strong>Shift / Space / E / R</strong> (Kỹ năng)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: KHO XE TĂNG (Tank Arsenal & Specs Comparison)
           ========================================================================= */}
        {(activeTab === 'arsenal' || activeTab === 'garage') && (
          <div className="space-y-6 my-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-2xl font-black text-white font-mono flex items-center gap-2.5">
                  <Shield className="w-6 h-6 text-amber-400" />
                  <span>KHO XE TĂNG CHIẾN THUẬT & GARA SKINS</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Chọn 3 lớp xe thiết giáp chiến đấu và tùy biến sơn ngụy trang, vệt đạn rực lửa, cờ nóc pháo.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsGarageModalOpen(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold font-mono transition-all shadow-md shadow-fuchsia-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Phòng Thử Nghiệm 3D</span>
                  <span className="sm:hidden">Thử 3D</span>
                </button>
                <button
                  onClick={() => setActiveTab('home')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer"
                >
                  Quay Lại Sảnh
                </button>
              </div>
            </div>

            {/* Sub-Tabs: 3 Dòng Thiết Giáp vs Gara Ngoại Trang */}
            <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 w-fit">
              <button
                type="button"
                onClick={() => {
                  setArsenalSubTab('classes');
                  sounds.playRadioBeep();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  arsenalSubTab === 'classes' && activeTab !== 'garage'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>3 DÒNG THIẾT GIÁP (LỚP XE)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setArsenalSubTab('skins');
                  sounds.playRadioBeep();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  arsenalSubTab === 'skins' || activeTab === 'garage'
                    ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Palette className="w-4 h-4 text-fuchsia-400" />
                <span>GARA NGOẠI TRANG & SKINS</span>
              </button>
            </div>

            {arsenalSubTab === 'classes' && activeTab !== 'garage' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    className={`p-6 rounded-3xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900/90 border-amber-500 ring-2 ring-amber-500/40 shadow-2xl shadow-amber-500/10'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      {/* Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold border uppercase tracking-wider ${
                            isSelected
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {isSelected ? 'ĐANG CHỌN ⚡' : 'SẴN SÀNG'}
                        </span>
                        <span className="text-xs font-mono text-slate-400">Class: {tClass}</span>
                      </div>

                      {/* Visual 3D SVG */}
                      <div className="py-6 flex items-center justify-center">
                        <TankVisual
                          tankClass={tClass}
                          color={color}
                          size={110}
                          animated={isSelected}
                          turretAngle={isSelected ? turretAngle : 0}
                        />
                      </div>

                      <h3 className="text-xl font-black text-white font-mono">{stats.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 min-h-[36px]">{stats.description}</p>

                      {/* Specification bars */}
                      <div className="mt-5 space-y-2.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 font-mono text-xs">
                        <div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">Độ Bền (HP):</span>
                            <span className="text-emerald-400 font-bold">{stats.maxHp} HP</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(stats.maxHp / 150) * 100}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">Tốc Độ Di Chuyển:</span>
                            <span className="text-sky-400 font-bold">{stats.speed} m/s</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="bg-sky-500 h-full rounded-full" style={{ width: `${(stats.speed / 6.0) * 100}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">Sát Thương Pháo:</span>
                            <span className="text-amber-400 font-bold">{stats.bulletDamage} DMG</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(stats.bulletDamage / 45) * 100}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">Tốc Độ Nạp Đạn:</span>
                            <span className="text-purple-400 font-bold">{stats.fireCooldown} ms</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
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
                      className={`mt-5 w-full py-2.5 rounded-xl font-bold font-mono text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {isSelected ? 'ĐÃ CHỌN CHIẾN XA NÀY' : 'CHỌN XE NÀY'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. GARA NGOẠI TRANG & SKINS */}
          {(arsenalSubTab === 'skins' || activeTab === 'garage') && (
            <div className="space-y-6">

            {/* Quick Skins Cards Grid */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-fuchsia-400" />
                <span>1. Bộ Sưu Tập Sơn Xe (Paint Skins)</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-slate-900 border-amber-500 ring-2 ring-amber-500/40 shadow-xl'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div
                          className={`w-full h-14 rounded-xl bg-gradient-to-br ${s.previewGradient} border flex items-center justify-center shadow-inner relative`}
                        >
                          <span className="w-4 h-4 rounded-full border border-white/50" style={{ backgroundColor: s.primaryColor }} />
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                              ✓
                            </div>
                          )}
                        </div>
                        <h4 className="font-bold text-white text-xs mt-2 truncate font-mono">{s.vietnameseName}</h4>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{s.description}</p>
                      </div>
                      <span className="mt-2 text-[9px] font-mono text-amber-300 font-bold">{s.badge}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Bullet Trails Grid */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-3 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>2. Vệt Đạn & Hiệu Ứng Nòng Pháo (Bullet Trails)</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-slate-900 border-amber-500 ring-2 ring-amber-500/40 shadow-xl'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="w-full h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl shadow-inner">
                          {tr.icon}
                        </div>
                        <h4 className="font-bold text-white text-xs mt-2 truncate font-mono">{tr.vietnameseName}</h4>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{tr.description}</p>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tr.color }} />
                        <span className="text-[10px] font-mono text-slate-300">{tr.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Roof Decals Grid */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-3 flex items-center gap-2">
                <Flag className="w-4 h-4 text-rose-400" />
                <span>3. Lá Cờ & Decal Biểu Tượng Nóc Tháp Pháo (Roof Decals)</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
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
                      className={`p-3 rounded-2xl border transition-all cursor-pointer relative flex flex-col items-center text-center justify-between ${
                        isSelected
                          ? 'bg-slate-900 border-amber-500 ring-2 ring-amber-500/40 shadow-xl'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-3xl py-2">{d.icon}</div>
                      <h4 className="font-bold text-white text-[11px] truncate font-mono w-full">{d.vietnameseName}</h4>
                      <span className="text-[9px] text-slate-400 mt-1 line-clamp-1">{d.description}</span>
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
          <div className="space-y-6 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-2xl font-black text-white font-mono flex items-center gap-2.5">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                  <span>BẢNG HUÂN CHƯƠNG & DANH HIỆU CHIẾN CÔNG</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Đạt chuỗi mạng, bắn tỉa cự ly xa hoặc phục thù kẻ thù để mở khóa danh hiệu kèm tiếng kèn Fanfare và lời xướng của Phát thanh viên!
                </p>
              </div>
              <button
                onClick={() => setActiveTab('home')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold font-mono transition-colors"
              >
                Quay Lại Sảnh
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(Object.keys(COMBAT_MEDALS) as CombatMedalType[]).map((mKey) => {
                const m = COMBAT_MEDALS[mKey];

                return (
                  <div
                    key={mKey}
                    className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-3xl p-2 rounded-2xl bg-slate-950 border border-slate-800">{m.icon}</span>
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border"
                          style={{ borderColor: `${m.color}66`, color: m.color, backgroundColor: `${m.color}15` }}
                        >
                          {m.title}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-white font-mono">{m.vietnameseTitle}</h3>
                      <p className="text-xs text-slate-400 mt-1">{m.subtitle}</p>

                      <div className="mt-4 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 font-mono text-[11px] text-slate-300">
                        <span>Giọng xướng: </span>
                        <strong className="text-amber-300">"{m.viVoiceText}"</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playMedalFanfare(mKey);
                        sounds.announce(m.voiceText, m.viVoiceText);
                      }}
                      className="mt-4 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Nghe Thử Fanfare</span>
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
          <div className="max-w-2xl w-full mx-auto space-y-6 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-2xl font-black text-white font-mono flex items-center gap-2.5">
                  <Sliders className="w-6 h-6 text-amber-400" />
                  <span>CÀI ĐẶT ÂM THANH & PHÁT THANH VIÊN</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Tùy chỉnh độ lớn Nhạc nền quân hành, âm thanh đạn pháo và giọng xướng chỉ huy chiến trường.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('home')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold font-mono transition-colors"
              >
                Xác Nhận & Quay Lại
              </button>
            </div>

            <div className="space-y-4">
              {/* 1. Epic Military Battle BGM Slider */}
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Music className="w-5 h-5 text-amber-400" />
                    <span>Nhạc Nền Chiến Trận Hùng Tráng (BGM)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleMusic}
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
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
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
                />
                <div className="flex justify-between text-xs text-slate-400 font-mono">
                  <span>Im lặng (0%)</span>
                  <span className="text-amber-300 font-bold">{musicVol}%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* 2. Sound Effects (SFX) Slider */}
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-sky-400" />
                    <span>Hiệu Ứng Bắn & Đạn Pháo Nổ (SFX)</span>
                  </span>
                  <span className="font-mono text-sky-300 text-sm font-bold">{sfxVol}%</span>
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
                  className="w-full accent-sky-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
                />
                <div className="flex justify-between text-xs text-slate-400 font-mono">
                  <span>0%</span>
                  <button
                    type="button"
                    onClick={() => sounds.playShoot(true)}
                    className="text-xs text-sky-400 hover:text-white underline cursor-pointer"
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
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Cơ Chế Ngắm & Hướng Bắn Pháo</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/40">
                          HOTKEY TRONG TRẬN: PHÍM C
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Chọn phương thức khai hỏa pháo: Theo hướng di chuyển (Tank 1990) hoặc Theo con trỏ chuột 360°
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Option 1: MOVEMENT (Classic Tank 1990) */}
                  <div
                    onClick={() => handleSelectAimMode('MOVEMENT')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2.5 relative select-none ${
                      currentAimMode === 'MOVEMENT'
                        ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gamepad2 className={`w-5 h-5 ${currentAimMode === 'MOVEMENT' ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <span className="font-bold text-white text-xs font-mono uppercase">
                          Theo Hướng Xe (Tank 1990)
                        </span>
                      </div>
                      {currentAimMode === 'MOVEMENT' ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-700" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Xe chạy hướng nào (WASD/Mũi tên), nòng pháo tự chĩa thẳng hướng đó. Dừng lại giữ nguyên góc ngắm. Bấm <strong className="text-white">Space / J / Chuột</strong> để bắn. Thuần bàn phím, không sợ lệch chuột!
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 font-bold">
                      <span>★ Chuẩn phong cách điện tử 4 nút NES</span>
                    </div>
                  </div>

                  {/* Option 2: MOUSE (Modern 360) */}
                  <div
                    onClick={() => handleSelectAimMode('MOUSE')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2.5 relative select-none ${
                      currentAimMode === 'MOUSE'
                        ? 'bg-sky-950/40 border-sky-500 shadow-lg shadow-sky-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mouse className={`w-5 h-5 ${currentAimMode === 'MOUSE' ? 'text-sky-400' : 'text-slate-400'}`} />
                        <span className="font-bold text-white text-xs font-mono uppercase">
                          Theo Chuột (Tự Do 360°)
                        </span>
                      </div>
                      {currentAimMode === 'MOUSE' ? (
                        <div className="w-5 h-5 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-700" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Nòng pháo tự do xoay 360° theo con trỏ chuột độc lập với thân xe. Cho phép vừa lùi xe vừa bắn trả sau lưng (kiting) hoặc bắn tạt ngang sườn.
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-sky-400 font-bold">
                      <span>★ Phong cách Twin-Stick Shooter</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Thông Tin Hệ Thống & Nền Tảng (Chuyển từ footer vào màn Cài Đặt) */}
              <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3 font-mono text-xs text-slate-400">
                <div className="flex items-center justify-between text-slate-200 font-bold border-b border-slate-800 pb-2.5">
                  <span className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-emerald-400" />
                    <span>THÔNG TIN HỆ THỐNG CHIẾN TRƯỜNG</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                    v2.5 RELEASE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 uppercase">Bản Quyền & Trò Chơi</div>
                    <div className="text-white font-bold mt-0.5">© 2026 DLAND TANK ARENA</div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 uppercase">Hạ Tầng Mạng</div>
                    <div className="text-emerald-400 font-bold mt-0.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>WebSocket 30 Tick/s Authoritative</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 uppercase">Hỗ Trợ Nền Tảng</div>
                    <div className="text-slate-300 font-bold mt-0.5">PC / Mac / Chrome / Edge</div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Tài Liệu Hướng Dẫn</div>
                      <div className="text-sky-400 font-bold mt-0.5">Phím Tắt & Luật Chơi</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsHelpOpen(true)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-xs font-bold border border-slate-700 cursor-pointer transition-colors"
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
      <nav className="fixed bottom-0 left-0 z-40 m-0 p-0 rounded-none bg-slate-950/95 border-t-2 border-r-2 border-slate-700/90 shadow-2xl backdrop-blur-2xl flex items-stretch divide-x-2 divide-slate-800/90 shadow-black/95 select-none overflow-x-auto max-w-full">
        {/* 1. Chiến Trường */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('home');
            sounds.playRadioBeep();
          }}
          className={`h-16 sm:h-20 px-6 sm:px-8 py-3 sm:py-4 transition-all cursor-pointer flex items-center gap-3 sm:gap-4 relative select-none shrink-0 ${
            activeTab === 'home'
              ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.35)]'
              : 'text-slate-300 hover:text-white hover:bg-slate-900/90'
          }`}
        >
          {activeTab === 'home' && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-yellow-300 shadow-[0_0_10px_#fde047]" />
          )}
          <Swords className={`w-6 h-6 sm:w-7 sm:h-7 shrink-0 ${activeTab === 'home' ? 'text-slate-950 stroke-[2.5]' : 'text-amber-400'}`} />
          <div className="text-left font-mono">
            <div className="text-sm sm:text-base font-black tracking-wider uppercase leading-none">
              Chiến Trường
            </div>
            <div className={`text-[10px] sm:text-xs mt-1.5 font-bold ${activeTab === 'home' ? 'text-slate-900' : 'text-slate-400'}`}>
              Xuất Trận Ngay
            </div>
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
          className={`h-16 sm:h-20 px-6 sm:px-8 py-3 sm:py-4 transition-all cursor-pointer flex items-center gap-3 sm:gap-4 relative select-none shrink-0 ${
            activeTab === 'arsenal' || activeTab === 'garage'
              ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.35)]'
              : 'text-slate-300 hover:text-white hover:bg-slate-900/90'
          }`}
        >
          {(activeTab === 'arsenal' || activeTab === 'garage') && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-yellow-300 shadow-[0_0_10px_#fde047]" />
          )}
          <Shield className={`w-6 h-6 sm:w-7 sm:h-7 shrink-0 ${activeTab === 'arsenal' || activeTab === 'garage' ? 'text-slate-950 stroke-[2.5]' : 'text-sky-400'}`} />
          <div className="text-left font-mono">
            <div className="text-sm sm:text-base font-black tracking-wider uppercase leading-none">
              Kho Xe Tăng
            </div>
            <div className={`text-[10px] sm:text-xs mt-1.5 font-bold ${activeTab === 'arsenal' || activeTab === 'garage' ? 'text-slate-900' : 'text-slate-400'}`}>
              3 Lớp Xe & Gara
            </div>
          </div>
        </button>

        {/* 3. Huân Chương */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('medals');
            sounds.playRadioBeep();
          }}
          className={`h-16 sm:h-20 px-6 sm:px-8 py-3 sm:py-4 transition-all cursor-pointer flex items-center gap-3 sm:gap-4 relative select-none shrink-0 ${
            activeTab === 'medals'
              ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.35)]'
              : 'text-slate-300 hover:text-white hover:bg-slate-900/90'
          }`}
        >
          {activeTab === 'medals' && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-yellow-300 shadow-[0_0_10px_#fde047]" />
          )}
          <Trophy className={`w-6 h-6 sm:w-7 sm:h-7 shrink-0 ${activeTab === 'medals' ? 'text-slate-950 stroke-[2.5]' : 'text-yellow-400'}`} />
          <div className="text-left font-mono">
            <div className="text-sm sm:text-base font-black tracking-wider uppercase leading-none">
              Huân Chương
            </div>
            <div className={`text-[10px] sm:text-xs mt-1.5 font-bold ${activeTab === 'medals' ? 'text-slate-900' : 'text-slate-400'}`}>
              Vinh Danh Chiến Công
            </div>
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
