import React, { useState, useEffect } from 'react';
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
} from '../types/game';
import {
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
  Swords,
  HelpCircle,
  CloudRain,
  Skull,
  Crown,
  Palette,
  Music,
  Sliders,
  Radio,
  X,
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { TankVisual } from './TankVisual';
import { HelpModal } from './HelpModal';
import { GarageModal } from './GarageModal';

interface LobbyModalProps {
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
  { count: 1, label: '1 Bot (Đấu 1v1)' },
  { count: 3, label: '3 Bot (Nhẹ Nhàng)' },
  { count: 5, label: '5 Bot (Tiêu Chuẩn)' },
  { count: 7, label: '7 Bot (Thử Thách)' },
  { count: 10, label: '10 Bot (Khốc Liệt)' },
  { count: 14, label: '14 Bot (Đại Chiến)' },
];

export const LobbyModal: React.FC<LobbyModalProps> = ({
  onJoin,
  onlineCount,
  isSocketConnected,
  publicPlayers = [],
  initialMode = 'PUBLIC',
  initialRoomId = 'public',
  currentWeather = 'RAIN',
}) => {
  const [mode, setMode] = useState<GameMode>(initialMode);
  const [botCount, setBotCount] = useState<number>(5);
  const [roomId, setRoomId] = useState<string>(initialRoomId);
  const [name, setName] = useState(() => {
    return 'Người Chơi ' + Math.floor(100 + Math.random() * 900);
  });
  const [tankClass, setTankClass] = useState<TankClass>('STRIKER');
  const [color, setColor] = useState('#2563eb');
  const [isMuted, setIsMuted] = useState(sounds.getIsMuted());
  const [copiedLink, setCopiedLink] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team>('RED');

  // Cosmetics & Workshop state
  const [skinId, setSkinId] = useState<TankSkinId>(() => (localStorage.getItem('tank_skin') as TankSkinId) || 'DEFAULT');
  const [bulletTrail, setBulletTrail] = useState<BulletTrailId>(() => (localStorage.getItem('tank_trail') as BulletTrailId) || 'STANDARD');
  const [roofDecal, setRoofDecal] = useState<RoofDecalId>(() => (localStorage.getItem('tank_decal') as RoofDecalId) || 'FLAG_VIETNAM');
  const [isGarageOpen, setIsGarageOpen] = useState(false);

  // Audio Settings & Tactical Announcer state
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [musicVol, setMusicVol] = useState(Math.round(sounds.getMusicVolume() * 100));
  const [sfxVol, setSfxVol] = useState(Math.round(sounds.getSfxVolume() * 100));
  const [voiceEnabled, setVoiceEnabled] = useState(sounds.getVoiceEnabled());
  const [isMusicPlaying, setIsMusicPlaying] = useState(sounds.getIsMusicPlaying());

  const activeWeatherCfg = WEATHER_CONFIGS[currentWeather || 'RAIN'] || WEATHER_CONFIGS.RAIN;

  // Mobile Maintenance Dialog State
  const [showMobileMaintenance, setShowMobileMaintenance] = useState(false);
  const [copiedPcLink, setCopiedPcLink] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || '';
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

      if ((isMobileUA || (isTouch && isSmallScreen)) && !sessionStorage.getItem('dismissed_mobile_notice')) {
        setShowMobileMaintenance(true);
      }
    };
    checkMobile();
  }, []);

  const currentStats = TANK_CLASSES[tankClass];

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleMusic = () => {
    const isPlaying = sounds.toggleMusic();
    setIsMusicPlaying(isPlaying);
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

  const handleCopyPcLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopiedPcLink(true);
      setTimeout(() => setCopiedPcLink(false), 2500);
    });
  };

  const handleDismissMobileNotice = () => {
    sessionStorage.setItem('dismissed_mobile_notice', 'true');
    setShowMobileMaintenance(false);
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

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || (mode === 'AI' ? 'Tập Sự AI' : 'Chiến Binh');
    sounds.playShoot();
    // Auto start BGM on entering game if not muted
    sounds.startBgm();
    const finalBots = mode === 'AI' ? botCount : 0;
    onJoin(
      finalName,
      color,
      tankClass,
      mode,
      finalBots,
      roomId,
      false,
      selectedTeam,
      skinId,
      bulletTrail,
      roofDecal
    );
  };

  return (
    <>
      {/* Mobile Maintenance Dialog */}
      {showMobileMaintenance && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl space-y-4 text-center">
            {/* Maintenance Icon */}
            <div className="relative mx-auto w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Smartphone className="w-8 h-8 text-amber-400" />
              <div className="absolute -bottom-1 -right-1 p-1 bg-amber-500 text-slate-950 rounded-full">
                <AlertTriangle className="w-4 h-4 stroke-[3]" />
              </div>
            </div>

            {/* Title & Tag */}
            <div className="space-y-1">
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                Bảo Trì & Tối Ưu Hóa Mobile
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight pt-1">
                CHẾ ĐỘ MOBILE ĐANG BẢO TRÌ
              </h2>
            </div>

            {/* Content Message */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed text-left bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              🎮 <strong>DLAND TANK</strong> đòi hỏi hệ thống phím di chuyển 8 hướng (<strong>WASD / Mũi tên</strong>) và chuột xoay nòng pháo 360° độc lập.
              <br /><br />
              🛠️ Phiên bản cảm ứng dành cho điện thoại / tablet hiện <strong>đang được nâng cấp và bảo trì</strong>. Vui lòng chuyển sang <strong>Máy Tính (PC / Laptop)</strong> để có trải nghiệm điều khiển mượt mà và chuẩn xác nhất!
            </p>

            {/* PC Recommendation Box */}
            <div className="flex items-center gap-3 bg-sky-950/40 border border-sky-500/30 p-3 rounded-2xl text-left">
              <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl shrink-0">
                <Monitor className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-sky-300">Khuyên dùng thiết bị PC / Laptop</div>
                <div className="text-slate-400 text-[11px]">Hỗ trợ chuột, bàn phím và màn hình rộng sắc nét.</div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleCopyPcLink}
                className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-sky-600/20 cursor-pointer text-xs uppercase tracking-wider"
              >
                {copiedPcLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPcLink ? 'Đã sao chép link game!' : 'Sao chép link mở trên PC / Laptop'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Lobby Modal with Translucent Atmospheric Weather Backdrop */}
      <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 overflow-y-auto transition-colors duration-500">
        <div
          className="border rounded-2xl w-full max-w-xl p-4 sm:p-6 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200 transition-all duration-300 backdrop-blur-xl"
          style={{
            backgroundColor: 'rgba(10, 16, 30, 0.92)',
            borderColor: `${activeWeatherCfg.themeColor}55`,
            boxShadow: `0 25px 60px -15px ${activeWeatherCfg.themeColor}33, 0 0 25px ${activeWeatherCfg.themeColor}15`,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isSocketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  {isSocketConnected ? 'Trực Tuyến: Đã Kết Nối' : 'Đang kết nối...'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
                  DLAND TANK
                </h1>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border flex items-center gap-1 shadow-sm"
                  style={{
                    backgroundColor: `${activeWeatherCfg.themeColor}22`,
                    borderColor: `${activeWeatherCfg.themeColor}55`,
                    color: activeWeatherCfg.themeColor,
                  }}
                >
                  <span>{activeWeatherCfg.icon}</span>
                  <span className="hidden sm:inline">{activeWeatherCfg.vietnameseName}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setIsGarageOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white transition-all cursor-pointer text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95"
                title="Mở Gara tùy biến sơn xe, vệt đạn và cờ tháp pháo"
              >
                <Palette className="w-4 h-4" />
                <span>Gara Skin</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAudioSettingsOpen(true)}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white transition-colors cursor-pointer border border-amber-500/30 text-xs font-bold shadow-sm"
                title="Cài đặt nhạc nền chiến trường và âm thanh"
              >
                <Music className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Nhạc & Mic</span>
              </button>

              <button
                type="button"
                onClick={() => setIsHelpOpen(true)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white transition-colors cursor-pointer border border-sky-500/30 text-xs font-bold shadow-sm"
                title="Xem hướng dẫn xe tăng, linh kiện và phím tắt"
              >
                <HelpCircle className="w-4 h-4 text-sky-400" />
              </button>

              <button
                type="button"
                onClick={handleToggleMute}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/60"
                title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
              </button>
            </div>
          </div>

          {/* 5 GAME MODES SELECTOR */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Chọn Chế Độ Chiến Đấu
              </label>
              <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">
                5 CHẾ ĐỘ ĐỈNH CAO
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* 1. PUBLIC FFA */}
              <button
                type="button"
                onClick={() => setMode('PUBLIC')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  mode === 'PUBLIC'
                    ? 'bg-sky-500/15 border-sky-500 ring-2 ring-sky-500/50 text-white shadow-lg shadow-sky-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-sky-400" />
                    <span className="font-extrabold text-xs text-white">Đấu Đơn FFA</span>
                  </div>
                  <span className="text-[9px] bg-sky-500/20 text-sky-300 px-1 py-0.2 rounded font-mono font-bold">
                    PVP
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug line-clamp-2">
                  Chiến trường tự do, hỗn chiến sinh tử không giới hạn.
                </p>
              </button>

              {/* 2. BATTLE ROYALE */}
              <button
                type="button"
                onClick={() => setMode('BATTLE_ROYALE')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  mode === 'BATTLE_ROYALE'
                    ? 'bg-purple-500/15 border-purple-500 ring-2 ring-purple-500/50 text-white shadow-lg shadow-purple-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="font-extrabold text-xs text-white">Vòng Bo Sinh Tồn</span>
                  </div>
                  <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1 py-0.2 rounded font-mono font-bold">
                    BATTLE ROYALE
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug line-clamp-2">
                  Bão điện từ co lại sau 60s, tìm người sống sót cuối cùng!
                </p>
              </button>

              {/* 3. TEAM DEATHMATCH */}
              <button
                type="button"
                onClick={() => setMode('TEAM_DEATHMATCH')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  mode === 'TEAM_DEATHMATCH'
                    ? 'bg-rose-500/15 border-rose-500 ring-2 ring-rose-500/50 text-white shadow-lg shadow-rose-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Swords className="w-4 h-4 text-rose-400" />
                    <span className="font-extrabold text-xs text-white">Đấu Đội 🔴 vs 🔵</span>
                  </div>
                  <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1 py-0.2 rounded font-mono font-bold">
                    30 KILLS
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug line-clamp-2">
                  Đội Đỏ vs Đội Xanh, căn cứ hồi máu riêng, chạm 30 kills thắng.
                </p>
              </button>

              {/* 4. BOSS RAID */}
              <button
                type="button"
                onClick={() => setMode('BOSS_RAID')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  mode === 'BOSS_RAID'
                    ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/50 text-white shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Skull className="w-4 h-4 text-amber-400" />
                    <span className="font-extrabold text-xs text-white">Săn Boss Leviathan</span>
                  </div>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-mono font-bold">
                    BOSS RAID
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug line-clamp-2">
                  Hợp lực diệt Siêu Boss Leviathan 1000 HP nhặt 4 rương báu.
                </p>
              </button>

              {/* 5. SOLO AI PRACTICE */}
              <button
                type="button"
                onClick={() => setMode('AI')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  mode === 'AI'
                    ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/50 text-white shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-emerald-400" />
                    <span className="font-extrabold text-xs text-white">Luyện Tập Bot AI</span>
                  </div>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded font-mono font-bold">
                    SOLO
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug line-clamp-2">
                  Tập luyện ngắm bắn, thử đạn và kỹ năng với bot AI.
                </p>
              </button>
            </div>
          </div>

          {/* Team Selection when TDM mode is selected */}
          {mode === 'TEAM_DEATHMATCH' && (
            <div className="mt-2.5 p-2.5 bg-slate-950/80 border border-rose-500/30 rounded-xl space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Chọn Phe Chiến Đấu (Team):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTeam('RED')}
                  className={`py-2 px-3 rounded-lg border font-mono font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    selectedTeam === 'RED'
                      ? 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-500/50 shadow-md shadow-rose-600/30'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
                  <span>🔴 ĐỘI ĐỎ (RED)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTeam('BLUE')}
                  className={`py-2 px-3 rounded-lg border font-mono font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    selectedTeam === 'BLUE'
                      ? 'bg-sky-600 text-white border-sky-400 ring-2 ring-sky-500/50 shadow-md shadow-sky-600/30'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
                  <span>🔵 ĐỘI XANH (BLUE)</span>
                </button>
              </div>
            </div>
          )}

          {/* Battle Royale Briefing */}
          {mode === 'BATTLE_ROYALE' && (
            <div className="mt-2.5 p-2.5 bg-slate-950/80 border border-purple-500/30 rounded-xl flex items-center gap-2 text-xs text-purple-300">
              <Zap className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Vòng bo bão điện từ bao trùm toàn bản đồ và co dần sau mỗi 60s. Xe đứng ngoài bo sẽ bị rút máu liên tục. Người sống sót cuối cùng chiến thắng!</span>
            </div>
          )}

          {/* Boss Raid Briefing */}
          {mode === 'BOSS_RAID' && (
            <div className="mt-2.5 p-2.5 bg-slate-950/80 border border-amber-500/30 rounded-xl flex items-center gap-2 text-xs text-amber-300">
              <Skull className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Siêu Xe Tăng Boss Leviathan (1000 HP, 4 nòng pháo, sóng EMP) xuất hiện tại Pháo Đài Trung Tâm. Tiêu diệt nhận ngay 4 Rương Huyền Thoại!</span>
            </div>
          )}

          {/* Live Online Roster & Invite Link (When Public mode is selected) */}
          {mode === 'PUBLIC' && (
            <div className="mt-2.5 p-2.5 bg-slate-950/80 border border-sky-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-sky-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  Người Chơi Đang Trực Tuyến:
                </span>
                <span className="font-mono text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px]">
                  {publicPlayers.length > 0 ? `${publicPlayers.length} Người Chơi` : 'Đang chờ người chơi...'}
                </span>
              </div>

              {publicPlayers.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {publicPlayers.map((p, idx) => (
                    <div
                      key={`${p.id}_${idx}`}
                      className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-2 py-0.5 rounded-lg text-[11px]"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-white font-semibold">{p.name}</span>
                      <span className="text-[10px] text-emerald-400 font-mono">({p.kills}K)</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Hãy là người đầu tiên vào chiến trường! Bạn có thể sao chép link để mời bạn bè cùng tham gia so tài.
                </p>
              )}

              {/* Invite link & PvP indicator */}
              <div className="pt-1.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 text-xs">
                <span className="text-[11px] text-sky-300 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Thuần PvP 100% (Không Bot AI)</span>
                </span>

                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-medium bg-sky-950/60 hover:bg-sky-900/60 border border-sky-500/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px]"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Đã sao chép link!' : 'Sao chép link mời bạn bè'}</span>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleJoin} className="mt-3 space-y-3">
            {/* If Mode AI: Choose Bot Count */}
            {mode === 'AI' && (
              <div className="p-2.5 bg-slate-950/70 border border-amber-500/30 rounded-xl space-y-1.5">
                <label className="flex items-center justify-between text-xs font-bold text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-amber-400" />
                    Số Lượng Xe Tăng Bot AI:
                  </span>
                  <span className="font-mono text-white bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded">
                    {botCount} Bots
                  </span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {BOT_OPTIONS.map((opt) => (
                    <button
                      key={opt.count}
                      type="button"
                      onClick={() => setBotCount(opt.count)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        botCount === opt.count
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500 hover:text-white'
                      }`}
                    >
                      {opt.count} Bot
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Player Name Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                {mode === 'PUBLIC' ? 'Tên Người Chơi' : 'Tên Chỉ Huy Xe Tăng'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                placeholder="Nhập biệt danh tác chiến..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-all font-mono"
              />
            </div>

            {/* Tank Class Selection with Illustrated Vehicle Images */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Chọn Lớp Xe Tăng & Xem Mô Hình
                </label>
                <span className="text-[10px] text-sky-400 font-mono flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Mô hình cập nhật theo màu sơn
                </span>
              </div>

              {/* 3 Tank Class Cards with Visual Images */}
              <div className="grid grid-cols-3 gap-2">
                {(['STRIKER', 'SCOUT', 'JUGGERNAUT'] as TankClass[]).map((cls) => {
                  const isSelected = tankClass === cls;
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setTankClass(cls)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer relative overflow-hidden flex flex-col items-center ${
                        isSelected
                          ? 'bg-sky-500/15 border-sky-500 ring-2 ring-sky-500/60 text-white shadow-lg shadow-sky-500/15'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {/* Tank Visual Illustration */}
                      <div className="w-full h-16 flex items-center justify-center">
                        <TankVisual tankClass={cls} color={color} size={62} />
                      </div>

                      <div className="font-bold text-xs text-white truncate mt-1">
                        {cls === 'STRIKER' ? 'Chiến Binh' : cls === 'SCOUT' ? 'Trinh Sát' : 'Thiết Giáp'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        {cls === 'STRIKER' ? 'Cân bằng' : cls === 'SCOUT' ? 'Tốc độ cao' : 'Giáp & Máu'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Detailed Tank Showcase Specs Bar */}
              <div className="mt-2 p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center gap-3">
                <div className="shrink-0 flex items-center justify-center p-1 bg-slate-900 rounded-lg border border-slate-800">
                  <TankVisual tankClass={tankClass} color={color} size={70} animated turretAngle={-15} />
                </div>

                <div className="flex-1 w-full space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-white">
                      {tankClass === 'STRIKER'
                        ? 'Chiến Binh Đa Năng'
                        : tankClass === 'SCOUT'
                        ? 'Trinh Sát Cơ Động'
                        : 'Thiết Giáp Pháo Đài'}
                    </span>
                    <span className="text-sky-400 font-mono">{currentStats.maxHp} HP · {Math.round(currentStats.speed * 20)} km/h</span>
                  </div>

                  {/* Stat Progress Bars */}
                  <div className="grid grid-cols-3 gap-2 pt-0.5">
                    <div>
                      <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
                        <span className="flex items-center gap-0.5"><Shield className="w-2.5 h-2.5 text-sky-400" /> Máu</span>
                        <span className="text-white font-mono">{currentStats.maxHp}</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full transition-all duration-300"
                          style={{ width: `${(currentStats.maxHp / 160) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
                        <span className="flex items-center gap-0.5"><Zap className="w-2.5 h-2.5 text-amber-400" /> Tốc độ</span>
                        <span className="text-white font-mono">{Math.round(currentStats.speed * 20)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-300"
                          style={{ width: `${(currentStats.speed / 5.2) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
                        <span className="flex items-center gap-0.5"><Crosshair className="w-2.5 h-2.5 text-rose-400" /> Đạn</span>
                        <span className="text-white font-mono">{currentStats.bulletDamage}</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full transition-all duration-300"
                          style={{ width: `${(currentStats.bulletDamage / 40) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Garage & Skin Customization Workshop Showcase */}
            <div className="p-3 bg-gradient-to-r from-sky-950/80 via-slate-900 to-indigo-950/80 border border-sky-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
                  <Palette className="w-5 h-5" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-white">XƯỞNG SKIN & GARA NGOẠI TRANG</span>
                    <span className="text-[10px] bg-sky-500/25 text-sky-300 border border-sky-400/40 px-1.5 py-0.2 rounded font-mono font-bold">
                      TÙY CHỌN
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 flex flex-wrap items-center gap-2">
                    <span>Sơn: <strong className="text-white font-semibold">{TANK_SKINS[skinId]?.vietnameseName}</strong></span>
                    <span>•</span>
                    <span className="text-amber-300">Vệt đạn: <strong>{BULLET_TRAILS[bulletTrail]?.icon} {BULLET_TRAILS[bulletTrail]?.vietnameseName}</strong></span>
                    <span>•</span>
                    <span className="text-sky-300">Cờ: <strong>{ROOF_DECALS[roofDecal]?.icon} {ROOF_DECALS[roofDecal]?.vietnameseName}</strong></span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsGarageOpen(true)}
                className="w-full sm:w-auto py-2 px-3.5 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider shrink-0 transition-all shadow-md shadow-sky-600/30 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>MỞ GARA TÙY BIẾN</span>
              </button>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Màu Sơn Xe Tăng
              </label>
              <div className="flex items-center gap-2.5">
                {COLOR_PRESETS.map((preset) => {
                  const isSelected = color === preset.hex;
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setColor(preset.hex)}
                      title={preset.name}
                      className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                        isSelected
                          ? 'scale-115 border-white ring-2 ring-sky-400'
                          : 'border-transparent hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: preset.hex }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Join CTAs for Online / Spectator */}
            {mode === 'PUBLIC' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="submit"
                  className="font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-[0.99] cursor-pointer text-xs sm:text-sm uppercase tracking-wider bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-sky-600/30 flex items-center justify-center gap-1.5"
                >
                  <Swords className="w-4 h-4" />
                  <span>VÀO CHIẾN ĐẤU</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const finalName = name.trim() || 'Khán Giả';
                    sounds.playShoot();
                    onJoin(finalName, color, tankClass, 'PUBLIC', 0, roomId, true);
                  }}
                  className="font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-[0.99] cursor-pointer text-xs sm:text-sm uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white border border-sky-500/40 hover:border-sky-400 flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-4 h-4 text-sky-400" />
                  <span>XEM TRẬN (KHÁN GIẢ)</span>
                </button>
              </div>
            ) : (
              <button
                type="submit"
                className="w-full font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-[0.99] cursor-pointer text-sm uppercase tracking-wider bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-black shadow-amber-600/30"
              >
                VÀO ĐẤU LUYỆN TẬP VỚI {botCount} BOT AI
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Garage / Skin Workshop Modal */}
      <GarageModal
        isOpen={isGarageOpen}
        onClose={() => setIsGarageOpen(false)}
        tankClass={tankClass}
        currentSkin={skinId}
        currentTrail={bulletTrail}
        currentDecal={roofDecal}
        tankColor={color}
        onSaveCosmetics={handleSaveCosmetics}
      />

      {/* Audio & Battlefield Announcer Settings Modal */}
      {isAudioSettingsOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">ÂM THANH & PHÁT THANH VIÊN</h3>
                  <p className="text-[11px] text-slate-400">Tùy chỉnh nhạc nền chiến trận & giọng đọc chiến sự</p>
                </div>
              </div>
              <button
                onClick={() => setIsAudioSettingsOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 1. Epic Military Battle BGM Slider */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-amber-400" />
                    <span>Nhạc Nền Chiến Trận (BGM)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleMusic}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
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
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Im lặng</span>
                  <span className="text-amber-300 font-bold">{musicVol}%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* 2. Sound Effects (SFX) Slider */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-sky-400" />
                    <span>Hiệu Ứng Bắn & Đạn Pháo (SFX)</span>
                  </span>
                  <span className="font-mono text-sky-300 text-xs font-bold">{sfxVol}%</span>
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
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              {/* 3. Tactical Voice Announcer Toggle */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Giọng Phát Thanh Viên (Voice)</div>
                    <div className="text-[10px] text-slate-400">Đọc chuỗi hạ gục, thời tiết, boss xuất hiện</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !voiceEnabled;
                    setVoiceEnabled(next);
                    sounds.setVoiceEnabled(next);
                    if (next) {
                      sounds.announce('Tactical Announcer Activated', 'Đã kích hoạt giọng phát thanh viên chiến trường!');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                    voiceEnabled
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {voiceEnabled ? 'BẬT' : 'TẮT'}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAudioSettingsOpen(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Đóng Cài Đặt
            </button>
          </div>
        </div>
      )}

      {/* Help Modal inside Lobby */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
};
