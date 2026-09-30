import React, { useState } from 'react';
import { TankClass, TANK_CLASSES, GameMode, PublicPlayerInfo } from '../types/game';
import {
  Shield,
  Zap,
  Crosshair,
  Users,
  Bot,
  Globe,
  Volume2,
  VolumeX,
  Keyboard,
  Share2,
  Check,
  Wifi,
  Sparkles,
  Trophy,
  ExternalLink,
  Copy,
  Play,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface LobbyModalProps {
  onJoin: (
    name: string,
    color: string,
    tankClass: TankClass,
    mode: GameMode,
    botCount: number,
    customRoomId?: string
  ) => void;
  onlineCount: number;
  isSocketConnected: boolean;
  publicPlayers?: PublicPlayerInfo[];
  initialMode?: GameMode;
  initialRoomId?: string;
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
  const [enableOnlineTestBots, setEnableOnlineTestBots] = useState(false);

  const currentStats = TANK_CLASSES[tankClass];

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleOpenTestTab = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'PUBLIC');
    window.open(url.toString(), '_blank');
  };

  const handleCopyInviteLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'PUBLIC');
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

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || (mode === 'AI' ? 'Tập Sự AI' : 'Chiến Binh');
    sounds.playShoot();
    const finalBots = mode === 'AI' ? botCount : (enableOnlineTestBots ? 3 : 0);
    onJoin(finalName, color, tankClass, mode, finalBots, roomId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl p-5 sm:p-7 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
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
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 font-mono">
              DLAND TANK
            </h1>
          </div>

          <button
            type="button"
            onClick={handleToggleMute}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-sky-400" />}
          </button>
        </div>

        {/* 2 GAME MODES SELECTOR */}
        <div className="mt-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Chọn Chế Độ Chơi
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Mode 2: Public Online (Placed prominently) */}
            <button
              type="button"
              onClick={() => setMode('PUBLIC')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                mode === 'PUBLIC'
                  ? 'bg-sky-500/15 border-sky-500 ring-2 ring-sky-500/50 text-white shadow-lg shadow-sky-500/10'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-lg ${
                      mode === 'PUBLIC' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-sm text-white">Chế Độ Online</span>
                </div>
                {mode === 'PUBLIC' && (
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                    ONLINE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                Chiến đấu PvP trực tiếp giữa những người chơi thật với nhau theo thời gian thực.
              </p>
            </button>

            {/* Mode 1: Bot AI */}
            <button
              type="button"
              onClick={() => setMode('AI')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                mode === 'AI'
                  ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/50 text-white shadow-lg shadow-amber-500/10'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-lg ${
                      mode === 'AI' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Bot className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-sm text-white">Chế Độ Bot AI</span>
                </div>
                {mode === 'AI' && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                    TẬP LUYỆN
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                Tự do chọn số lượng Bot AI để luyện tập ngắm bắn, thử đạn và làm quen bản đồ chiến trường.
              </p>
            </button>
          </div>
        </div>

        {/* Live Online Roster & Invite Link (When Public mode is selected) */}
        {mode === 'PUBLIC' && (
          <div className="mt-3 p-3 bg-slate-950/80 border border-sky-500/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-sky-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                Người Chơi Đang Trực Tuyến:
              </span>
              <span className="font-mono text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded">
                {publicPlayers.length > 0 ? `${publicPlayers.length} Người Chơi` : 'Đang chờ người chơi...'}
              </span>
            </div>

            {publicPlayers.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
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

            {/* Invite link & Bot toggle */}
            <div className="pt-1.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 text-xs">
              <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableOnlineTestBots}
                  onChange={(e) => setEnableOnlineTestBots(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer"
                />
                <span>Bật 3 Bot AI hỗ trợ khi phòng chưa đủ người</span>
              </label>

              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-medium bg-sky-950/60 hover:bg-sky-900/60 border border-sky-500/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px]"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Đã sao chép link!' : 'Sao chép link mời'}</span>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleJoin} className="mt-3 space-y-3.5">
          {/* If Mode AI: Choose Bot Count */}
          {mode === 'AI' && (
            <div className="p-3 bg-slate-950/70 border border-amber-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-amber-400" />
                  Số Lượng Bot AI Xuất Trận
                </span>
                <span className="font-mono text-amber-400 font-bold bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">
                  {botCount} Bots
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {BOT_OPTIONS.map((opt) => (
                  <button
                    key={opt.count}
                    type="button"
                    onClick={() => setBotCount(opt.count)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${
                      botCount === opt.count
                        ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {opt.count} Bot
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nickname */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              {mode === 'PUBLIC' ? 'Tên Người Chơi (Hiển thị online qua Socket)' : 'Tên Chỉ Huy Xe Tăng'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              placeholder={mode === 'PUBLIC' ? 'Nhập tên của bạn để thi đấu online...' : 'Tên chỉ huy...'}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all placeholder-slate-500 font-medium"
              required
            />
          </div>

          {/* Tank Class Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Chọn Lớp Xe Tăng
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['STRIKER', 'SCOUT', 'JUGGERNAUT'] as TankClass[]).map((cls) => {
                const isSelected = tankClass === cls;
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setTankClass(cls)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-500 ring-1 ring-sky-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-xs sm:text-sm text-white truncate">
                      {cls === 'STRIKER'
                        ? 'Chiến Binh'
                        : cls === 'SCOUT'
                        ? 'Trinh Sát'
                        : 'Thiết Giáp'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                      {cls === 'STRIKER'
                        ? 'Cân bằng'
                        : cls === 'SCOUT'
                        ? 'Tốc độ cao'
                        : 'Giáp dày & Máu'}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Class Stats Specs */}
            <div className="mt-2 p-2 bg-slate-950/70 border border-slate-800 rounded-xl flex justify-around text-xs">
              <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                <span>Máu:</span>
                <span className="font-mono font-bold text-white tabular-nums">{currentStats.maxHp} HP</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Tốc độ:</span>
                <span className="font-mono font-bold text-white tabular-nums">{Math.round(currentStats.speed * 20)} km/h</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                <span>Sát thương:</span>
                <span className="font-mono font-bold text-white tabular-nums">{currentStats.bulletDamage}</span>
              </div>
            </div>
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

          {/* Quick Notice on Items and Speed */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Linh kiện nâng cấp</strong>: Mọi hộp linh kiện nhặt được đều <strong>tăng tốc độ chạy (+35% đến +85% Nitro Turbo)</strong>!
            </span>
          </div>

          {/* Join CTA */}
          <button
            type="submit"
            className={`w-full font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-[0.99] cursor-pointer text-sm uppercase tracking-wider ${
              mode === 'AI'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-black shadow-amber-600/30'
                : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-sky-600/30'
            }`}
          >
            {mode === 'AI'
              ? `VÀO ĐẤU LUYỆN TẬP VỚI ${botCount} BOT AI`
              : '🚀 VÀO CHIẾN ĐẤU ONLINE QUA SOCKET'}
          </button>
        </form>
      </div>
    </div>
  );
};
