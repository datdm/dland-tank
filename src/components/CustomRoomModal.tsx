import React, { useState } from 'react';
import {
  GameMode,
  TankClass,
  Team,
  WeatherType,
  CustomRoomSummary,
} from '../types/game';
import { sounds } from '../utils/audio';
import {
  X,
  Swords,
  Skull,
  Bot,
  Users,
  Copy,
  Check,
  Globe,
  Shuffle,
  Shield,
  Zap,
  Flame,
  CloudRain,
  Sun,
  Snowflake,
  Wind,
  PlusCircle,
  LogIn,
} from 'lucide-react';

interface CustomRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  color: string;
  tankClass: TankClass;
  onJoinCustomRoom: (params: {
    mode: GameMode;
    roomId: string;
    botCount: number;
    enableBoss: boolean;
    bossHp?: number;
    initialWeather?: WeatherType;
    team?: Team;
  }) => void;
  customRooms?: CustomRoomSummary[];
  isShortLandscape: boolean;
}

const MAP_PRESETS = [
  { id: 'ARENA', name: 'Đấu Trường Pháo Đài', icon: '🏟️', desc: 'Bản đồ 3v3 tiêu chuẩn cân bằng' },
  { id: 'DESERT', name: 'Sa Mạc Hoàng Kim', icon: '🏜️', desc: 'Bão cát mù mịt, giảm tầm quan sát' },
  { id: 'SNOW', name: 'Vùng Băng Tuyết', icon: '❄️', desc: 'Mặt băng trơn trượt, lướt drift bánh xích' },
  { id: 'JUNGLE', name: 'Rừng Rậm Nhiệt Đới', icon: '🌲', desc: 'Nhiều bụi cỏ nấp kích phục kích' },
  { id: 'VOLCANO', name: 'Núi Lửa Dung Nham', icon: '🌋', desc: 'Bẫy magma gây sát thương đốt cháy' },
];

const WEATHER_OPTIONS: Array<{ type: WeatherType; name: string; icon: string; desc: string }> = [
  { type: 'RAIN', name: 'Mưa Giông', icon: '🌧️', desc: 'Tăng tốc độ di chuyển, bùn đất' },
  { type: 'SUNSET', name: 'Hoàng Hôn', icon: '🌅', desc: 'Tầm nhìn cực nét, góc bắn rộng' },
  { type: 'SNOW', name: 'Bão Tuyết', icon: '❄️', desc: 'Mặt băng trơn trượt, hiệu ứng drift' },
  { type: 'DESERT', name: 'Bão Cát', icon: '🏜️', desc: 'Mù cát, giảm tầm quét Radar Minimap' },
];

export const CustomRoomModal: React.FC<CustomRoomModalProps> = ({
  isOpen,
  onClose,
  name,
  color,
  tankClass,
  onJoinCustomRoom,
  customRooms = [],
  isShortLandscape,
}) => {
  const [activeTab, setActiveTab] = useState<'CREATE' | 'JOIN'>('CREATE');

  // Create Form State
  const [roomCode, setRoomCode] = useState(() => `PHONG-${Math.floor(1000 + Math.random() * 9000)}`);
  const [mode, setMode] = useState<GameMode>('AI');
  const [enableBoss, setEnableBoss] = useState(true);
  const [bossHp, setBossHp] = useState<number>(1000);
  const [botCount, setBotCount] = useState<number>(5);
  const [initialWeather, setInitialWeather] = useState<WeatherType>('RAIN');
  const [selectedTeam, setSelectedTeam] = useState<Team>('RED');
  const [copiedCode, setCopiedCode] = useState(false);

  // Join Form State
  const [joinInputCode, setJoinInputCode] = useState('');

  if (!isOpen) return null;

  const handleRandomizeCode = () => {
    sounds.playRadioBeep();
    setRoomCode(`PHONG-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handleCopyCode = () => {
    sounds.playRadioBeep();
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCreateAndLaunch = () => {
    sounds.playPowerUp();
    const cleanId = (roomCode.trim() || `PHONG-${Math.floor(1000 + Math.random() * 9000)}`)
      .toLowerCase()
      .replace(/\s+/g, '-');

    onJoinCustomRoom({
      mode,
      roomId: cleanId,
      botCount,
      enableBoss,
      bossHp,
      initialWeather,
      team: mode === 'TEAM_DEATHMATCH' ? selectedTeam : undefined,
    });
    onClose();
  };

  const handleJoinByCode = (targetCode: string) => {
    sounds.playPowerUp();
    const cleanId = targetCode.trim().toLowerCase().replace(/\s+/g, '-');
    if (!cleanId) return;

    onJoinCustomRoom({
      mode: 'PUBLIC',
      roomId: cleanId,
      botCount: 0,
      enableBoss: false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050814]/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className={`relative bg-gradient-to-br from-[#0c122b] via-[#11193d] to-[#0a0f26] border-2 border-[#2b3a75] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col ${
        isShortLandscape ? 'max-h-[96vh]' : 'max-h-[90vh]'
      }`}>
        {/* Glow accent header lines */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-sky-400 to-purple-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-[#080d21]/90 border-b border-[#1f2c5e]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 p-[1.5px] flex items-center justify-center shadow-md shadow-amber-500/20">
              <div className="w-full h-full bg-[#0c122b] rounded-[6px] flex items-center justify-center">
                <Swords className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div>
              <h2 className="text-xs sm:text-base font-black font-mono text-white tracking-wider uppercase flex items-center gap-1.5">
                <span>TẠO PHÒNG TÙY CHỌN</span>
                <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  BOSS & AI
                </span>
              </h2>
              <p className="text-[9px] sm:text-[11px] text-slate-400 font-mono">
                Tự do thiết lập trận đấu với Boss Leviathan, Bot AI và bạn bè
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playRadioBeep();
              onClose();
            }}
            className="w-7 h-7 rounded-lg bg-[#141e42] hover:bg-rose-600/80 text-slate-300 hover:text-white transition-colors flex items-center justify-center cursor-pointer border border-[#273870]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-[#1f2c5e] bg-[#090e24] px-3 sm:px-5">
          <button
            type="button"
            onClick={() => {
              sounds.playRadioBeep();
              setActiveTab('CREATE');
            }}
            className={`px-3 sm:px-5 py-2 font-mono font-bold text-xs sm:text-sm flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'CREATE'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>TẠO PHÒNG MỚI</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playRadioBeep();
              setActiveTab('JOIN');
            }}
            className={`px-3 sm:px-5 py-2 font-mono font-bold text-xs sm:text-sm flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'JOIN'
                ? 'border-sky-400 text-sky-300 bg-sky-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>THAM GIA PHÒNG ({customRooms.length})</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-3.5 sm:space-y-4 custom-scrollbar flex-1">
          {activeTab === 'CREATE' ? (
            <>
              {/* 1. ROOM CODE & SHARE */}
              <div className="bg-[#080e26] border border-[#1e2d61] rounded-xl p-2.5 sm:p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] sm:text-xs font-mono font-bold text-slate-300 flex items-center gap-1">
                    <span>MÃ PHÒNG DÀNH CHO BẠN BÈ:</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleRandomizeCode}
                      className="px-2 py-0.5 rounded bg-[#17224d] hover:bg-[#20306e] text-slate-300 text-[10px] sm:text-xs font-mono font-bold cursor-pointer transition-colors flex items-center gap-1 border border-[#2b3c7d]"
                      title="Đổi mã ngẫu nhiên"
                    >
                      <Shuffle className="w-3 h-3 text-amber-400" />
                      <span>Đổi Mã</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] sm:text-xs font-mono font-bold cursor-pointer transition-colors flex items-center gap-1 border border-amber-500/40"
                    >
                      {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-amber-400" />}
                      <span>{copiedCode ? 'Đã Sao Chép!' : 'Sao Chép'}</span>
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 20))}
                  className="w-full bg-[#101738] border border-[#283873] rounded-lg px-3 py-1.5 text-amber-300 font-mono text-sm sm:text-base font-black uppercase tracking-wider focus:outline-none focus:border-amber-400"
                  placeholder="Ví dụ: PHONG-8888"
                />
              </div>

              {/* 2. CORE MODE SELECTOR */}
              <div>
                <label className="text-[10px] sm:text-xs font-mono font-bold text-slate-300 mb-1.5 block">
                  1. CHỌN CHẾ ĐỘ THI ĐẤU CƠ BẢN:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playRadioBeep();
                      setMode('BOSS_RAID');
                      setEnableBoss(true);
                    }}
                    className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                      mode === 'BOSS_RAID'
                        ? 'bg-rose-950/60 border-rose-500 text-white shadow-lg shadow-rose-600/20'
                        : 'bg-[#0f173b] border-[#223163] text-slate-300 hover:bg-[#162152]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Skull className="w-4 h-4 text-rose-400" />
                      <span className="font-mono font-black text-xs">Săn Boss</span>
                    </div>
                    <p className="text-[9.5px] text-slate-400 line-clamp-1 font-mono">Boss 20.000 HP 4 nòng</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playRadioBeep();
                      setMode('AI');
                    }}
                    className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                      mode === 'AI'
                        ? 'bg-sky-950/60 border-sky-400 text-white shadow-lg shadow-sky-600/20'
                        : 'bg-[#0f173b] border-[#223163] text-slate-300 hover:bg-[#162152]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Bot className="w-4 h-4 text-sky-400" />
                      <span className="font-mono font-black text-xs">Đấu Bot AI</span>
                    </div>
                    <p className="text-[9.5px] text-slate-400 line-clamp-1 font-mono">Luyện tập với Bot</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playRadioBeep();
                      setMode('TEAM_DEATHMATCH');
                    }}
                    className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                      mode === 'TEAM_DEATHMATCH'
                        ? 'bg-purple-950/60 border-purple-400 text-white shadow-lg shadow-purple-600/20'
                        : 'bg-[#0f173b] border-[#223163] text-slate-300 hover:bg-[#162152]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span className="font-mono font-black text-xs">Đấu Đội 3v3</span>
                    </div>
                    <p className="text-[9.5px] text-slate-400 line-clamp-1 font-mono">Chia 2 phe Đỏ/Xanh</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playRadioBeep();
                      setMode('PUBLIC');
                    }}
                    className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                      mode === 'PUBLIC'
                        ? 'bg-amber-950/60 border-amber-400 text-white shadow-lg shadow-amber-600/20'
                        : 'bg-[#0f173b] border-[#223163] text-slate-300 hover:bg-[#162152]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Globe className="w-4 h-4 text-amber-400" />
                      <span className="font-mono font-black text-xs">Hỗn Chiến</span>
                    </div>
                    <p className="text-[9.5px] text-slate-400 line-clamp-1 font-mono">Tự do cày điểm Top 1</p>
                  </button>
                </div>
              </div>

              {/* 3. BOSS LEVIATHAN CUSTOM OPTION (USER REQUESTED "với boss") */}
              <div className="bg-[#0b122e] border border-rose-500/40 rounded-xl p-2.5 sm:p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skull className="w-4 h-4 text-rose-400" />
                    <span className="font-mono font-bold text-xs text-rose-200">
                      TÙY CHỌN BOSS LEVIATHAN TRONG PHÒNG:
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playRadioBeep();
                      setEnableBoss(!enableBoss);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold cursor-pointer transition-all border ${
                      enableBoss
                        ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/30'
                        : 'bg-[#151f45] text-slate-400 border-[#2b3c78]'
                    }`}
                  >
                    {enableBoss ? 'BẬT BOSS 🐲' : 'TẮT BOSS 🚫'}
                  </button>
                </div>

                {enableBoss && (
                  <div className="space-y-1.5 pt-1 border-t border-rose-500/20">
                    <span className="text-[10px] text-slate-300 font-mono block">Chọn Mức Máu HP Cho Boss:</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { hp: 1000, label: '1.000 HP (Thường)' },
                        { hp: 2500, label: '2.500 HP (Khó)' },
                        { hp: 5000, label: '5.000 HP (Ác Mộng)' },
                        { hp: 10000, label: '10.000 HP (Siêu Boss)' },
                      ].map((item) => (
                        <button
                          key={item.hp}
                          type="button"
                          onClick={() => {
                            sounds.playRadioBeep();
                            setBossHp(item.hp);
                          }}
                          className={`px-2 py-1 rounded-lg text-[9.5px] sm:text-[10.5px] font-mono font-bold cursor-pointer transition-all border ${
                            bossHp === item.hp
                              ? 'bg-rose-600/80 text-white border-rose-300 font-black'
                              : 'bg-[#10183b] text-slate-300 border-[#25366c] hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. BOT AI CUSTOM OPTION (USER REQUESTED "hoặc ai") */}
              <div className="bg-[#0b122e] border border-sky-500/40 rounded-xl p-2.5 sm:p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-sky-400" />
                    <span className="font-mono font-bold text-xs text-sky-200">
                      SỐ LƯỢNG BOT AI TRONG PHÒNG:
                    </span>
                  </div>
                  <span className="text-xs font-mono font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    {botCount === 0 ? 'Không có Bot (0)' : `${botCount} Bot AI`}
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                  {[
                    { count: 0, label: '0 Bot (Chỉ Người)' },
                    { count: 1, label: '1 Bot (1v1 Solo)' },
                    { count: 3, label: '3 Bot (2v2)' },
                    { count: 5, label: '5 Bot (3v3 Standard)' },
                    { count: 8, label: '8 Bot (Đại Chiến)' },
                    { count: 10, label: '10 Bot (Khốc Liệt)' },
                    { count: 14, label: '14 Bot (Hỗn Loạn Max)' },
                  ].map((opt) => (
                    <button
                      key={opt.count}
                      type="button"
                      onClick={() => {
                        sounds.playRadioBeep();
                        setBotCount(opt.count);
                      }}
                      className={`p-1.5 rounded-lg text-center cursor-pointer transition-all border ${
                        botCount === opt.count
                          ? 'bg-sky-600/80 text-white border-sky-300 font-black shadow-md shadow-sky-600/30'
                          : 'bg-[#10183b] text-slate-300 border-[#25366c] hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-mono font-bold block">{opt.count} Bot</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. WEATHER SELECTION */}
              <div>
                <label className="text-[10px] sm:text-xs font-mono font-bold text-slate-300 mb-1 block">
                  3. THỜI TIẾT KHỞI ĐẦU BẢN ĐỒ:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {WEATHER_OPTIONS.map((w) => (
                    <button
                      key={w.type}
                      type="button"
                      onClick={() => {
                        sounds.playRadioBeep();
                        setInitialWeather(w.type);
                      }}
                      className={`p-1.5 sm:p-2 rounded-xl border text-left cursor-pointer transition-all ${
                        initialWeather === w.type
                          ? 'bg-amber-500/20 border-amber-400 text-white'
                          : 'bg-[#0f173b] border-[#223163] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{w.icon}</span>
                        <span className="font-mono font-bold text-xs text-amber-200">{w.name}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 line-clamp-1 font-mono">{w.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* TEAM SELECTION IF TDM */}
              {mode === 'TEAM_DEATHMATCH' && (
                <div className="flex items-center justify-between bg-[#080d24] border border-[#1f2e63] rounded-xl p-2.5">
                  <span className="text-xs font-mono font-bold text-slate-300">Chọn Phe Chiến Đấu:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTeam('RED')}
                      className={`px-3 py-1 rounded-lg font-mono text-xs font-bold cursor-pointer transition-all ${
                        selectedTeam === 'RED'
                          ? 'bg-rose-600 text-white border border-rose-400 shadow-md shadow-rose-600/30'
                          : 'bg-[#121a3d] text-slate-400 border border-[#25366c]'
                      }`}
                    >
                      🔴 Phe Đỏ
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTeam('BLUE')}
                      className={`px-3 py-1 rounded-lg font-mono text-xs font-bold cursor-pointer transition-all ${
                        selectedTeam === 'BLUE'
                          ? 'bg-sky-600 text-white border border-sky-400 shadow-md shadow-sky-600/30'
                          : 'bg-[#121a3d] text-slate-400 border border-[#25366c]'
                      }`}
                    >
                      🔵 Phe Xanh
                    </button>
                  </div>
                </div>
              )}

              {/* LAUNCH BUTTON */}
              <button
                type="button"
                onClick={handleCreateAndLaunch}
                className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black font-mono text-sm sm:text-base uppercase tracking-wider cursor-pointer shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 border border-amber-200"
              >
                <Swords className="w-5 h-5 stroke-[2.5]" />
                <span>TẠO PHÒNG VÀ BẮT ĐẦU CHIẾN ĐẤU</span>
              </button>
            </>
          ) : (
            /* TAB 2: JOIN EXISTING ROOM */
            <div className="space-y-4">
              {/* Manual Input Code */}
              <div className="bg-[#080e26] border border-[#1e2d61] rounded-xl p-3 space-y-2">
                <label className="text-xs font-mono font-bold text-slate-300 block">
                  NHẬP MÃ PHÒNG ĐỂ THAM GIA:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinInputCode}
                    onChange={(e) => setJoinInputCode(e.target.value.toUpperCase().slice(0, 24))}
                    className="flex-1 bg-[#101738] border border-[#283873] rounded-lg px-3 py-2 text-sky-300 font-mono text-sm font-bold uppercase focus:outline-none focus:border-sky-400"
                    placeholder="Nhập mã phòng (ví dụ: PHONG-8888)"
                  />
                  <button
                    type="button"
                    onClick={() => handleJoinByCode(joinInputCode)}
                    disabled={!joinInputCode.trim()}
                    className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-mono font-black text-xs uppercase cursor-pointer transition-all shadow-md shadow-sky-600/20 active:scale-95 flex items-center gap-1.5"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Vào Phòng</span>
                  </button>
                </div>
              </div>

              {/* Active Room List */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                  <span>DANH SÁCH PHÒNG TÙY CHỌN ĐANG MỞ TRÊN SERVER:</span>
                  <span className="text-amber-400 text-[10px]">{customRooms.length} Phòng Active</span>
                </h3>

                {customRooms.length === 0 ? (
                  <div className="bg-[#090f2b] border border-[#1d2a57] rounded-xl p-6 text-center space-y-2">
                    <Globe className="w-8 h-8 text-slate-500 mx-auto" />
                    <p className="text-xs font-mono text-slate-400">
                      Chưa có phòng tùy chọn nào đang mở.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('CREATE')}
                      className="px-4 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold cursor-pointer transition-colors"
                    >
                      Tạo phòng đầu tiên ngay!
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {customRooms.map((r) => (
                      <div
                        key={r.id}
                        className="bg-[#0a112e] border border-[#1f2d61] hover:border-sky-400/60 rounded-xl p-3 flex items-center justify-between transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-xs text-white">{r.name}</span>
                            {r.hasBoss && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-mono font-bold">
                                🐲 BOSS
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span>👥 {r.playerCount} Người</span>
                            <span>🤖 {r.botCount} Bot</span>
                            <span>🎮 {r.mode}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleJoinByCode(r.id)}
                          className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold cursor-pointer transition-all active:scale-95 shadow-md shadow-sky-600/20"
                        >
                          Vào
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
