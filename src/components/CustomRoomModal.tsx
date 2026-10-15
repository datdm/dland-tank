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
  Eye,
  Radio,
  Sparkles,
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
  onSpectateRoom?: (roomId: string, mode?: GameMode) => void;
  customRooms?: CustomRoomSummary[];
  isShortLandscape: boolean;
  initialTab?: 'CREATE' | 'JOIN';
}

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
  onSpectateRoom,
  customRooms = [],
  isShortLandscape,
  initialTab = 'CREATE',
}) => {
  const [activeTab, setActiveTab] = useState<'CREATE' | 'JOIN'>(initialTab);
  const [roomFilter, setRoomFilter] = useState<'ALL' | 'ACTIVE_WITH_PLAYERS'>('ALL');

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

  const handleSpectateByCode = (targetCode: string, targetMode?: GameMode) => {
    sounds.playRadioBeep();
    const cleanId = targetCode.trim().toLowerCase().replace(/\s+/g, '-');
    if (!cleanId) return;

    if (onSpectateRoom) {
      onSpectateRoom(cleanId, targetMode || 'PUBLIC');
    } else {
      onJoinCustomRoom({
        mode: targetMode || 'PUBLIC',
        roomId: cleanId,
        botCount: 0,
        enableBoss: false,
      });
    }
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
            /* TAB 2: JOIN EXISTING ROOM & SPECTATE MATCH */
            <div className="space-y-3.5">
              {/* Manual Input Code with BOTH Join Battle and Spectate Match */}
              <div className="bg-[#080e26] border border-[#1e2d61] rounded-xl p-3 space-y-2">
                <label className="text-xs font-mono font-bold text-slate-300 block flex items-center justify-between">
                  <span>NHẬP MÃ PHÒNG ĐỂ THAM GIA HOẶC XEM TRẬN:</span>
                  <span className="text-slate-400 text-[10px] font-normal">Ví dụ: PHONG-8888</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={joinInputCode}
                    onChange={(e) => setJoinInputCode(e.target.value.toUpperCase().slice(0, 24))}
                    className="flex-1 bg-[#101738] border border-[#283873] rounded-lg px-3 py-2 text-sky-300 font-mono text-sm font-bold uppercase focus:outline-none focus:border-sky-400 placeholder:text-slate-600"
                    placeholder="Nhập mã phòng (ví dụ: PHONG-8888)"
                  />
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSpectateByCode(joinInputCode)}
                      disabled={!joinInputCode.trim()}
                      className="px-3.5 py-2 rounded-lg bg-cyan-700/80 hover:bg-cyan-600 disabled:opacity-40 text-cyan-100 font-mono font-black text-xs uppercase cursor-pointer transition-all shadow-md active:scale-95 flex items-center gap-1.5 border border-cyan-400/50"
                      title="Xem trận trong phòng này (Khán giả)"
                    >
                      <Eye className="w-4 h-4 text-cyan-300" />
                      <span>Xem Trận</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleJoinByCode(joinInputCode)}
                      disabled={!joinInputCode.trim()}
                      className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-mono font-black text-xs uppercase cursor-pointer transition-all shadow-md shadow-sky-600/20 active:scale-95 flex items-center gap-1.5"
                      title="Điều khiển xe tăng vào tham chiến"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Vào Chơi</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Room List with Filter */}
              {(() => {
                const roomsWithPlayers = customRooms.filter((r) => r.playerCount > 0);
                const displayedRooms = roomFilter === 'ACTIVE_WITH_PLAYERS'
                  ? roomsWithPlayers
                  : customRooms;

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                        <span>DANH SÁCH PHÒNG CHIẾN ĐẤU TRÊN SERVER:</span>
                        <span className="text-amber-400 text-[10px]">({customRooms.length} Phòng)</span>
                      </h3>

                      {/* Filter pills */}
                      <div className="flex gap-1.5 text-[10px] font-mono font-bold">
                        <button
                          type="button"
                          onClick={() => setRoomFilter('ALL')}
                          className={`px-2.5 py-0.5 rounded-lg border transition-all cursor-pointer ${
                            roomFilter === 'ALL'
                              ? 'bg-sky-600/40 border-sky-400 text-sky-200'
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Tất Cả ({customRooms.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setRoomFilter('ACTIVE_WITH_PLAYERS')}
                          className={`px-2.5 py-0.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                            roomFilter === 'ACTIVE_WITH_PLAYERS'
                              ? 'bg-emerald-600/40 border-emerald-400 text-emerald-200 shadow-sm'
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${roomsWithPlayers.length > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                          <span>Có Người Chơi ({roomsWithPlayers.length})</span>
                        </button>
                      </div>
                    </div>

                    {displayedRooms.length === 0 ? (
                      <div className="bg-[#090f2b] border border-[#1d2a57] rounded-xl p-6 text-center space-y-2">
                        <Globe className="w-8 h-8 text-slate-500 mx-auto" />
                        <p className="text-xs font-mono text-slate-400">
                          {roomFilter === 'ACTIVE_WITH_PLAYERS'
                            ? 'Hiện chưa có phòng nào đang có người chơi thực. Bạn có thể chọn xem các phòng khác hoặc tạo phòng mới!'
                            : 'Chưa có phòng tùy chọn nào đang mở.'}
                        </p>
                        <div className="flex justify-center gap-2 pt-1">
                          {roomFilter === 'ACTIVE_WITH_PLAYERS' && (
                            <button
                              type="button"
                              onClick={() => setRoomFilter('ALL')}
                              className="px-3 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 text-xs font-mono font-bold cursor-pointer transition-colors"
                            >
                              Hiện tất cả phòng
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setActiveTab('CREATE')}
                            className="px-4 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold cursor-pointer transition-colors"
                          >
                            Tạo phòng mới ngay!
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                        {displayedRooms.map((r) => {
                          const hasRealPlayers = r.playerCount > 0;

                          return (
                            <div
                              key={r.id}
                              className={`rounded-xl p-2.5 sm:p-3 flex flex-col justify-between gap-2 transition-all border ${
                                hasRealPlayers
                                  ? 'bg-gradient-to-br from-[#0c193b] to-[#09152e] border-emerald-500/60 shadow-lg shadow-emerald-500/10 hover:border-emerald-400'
                                  : 'bg-[#0a112e] border-[#1f2d61] hover:border-sky-400/60'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-mono font-black text-xs text-white truncate">{r.name}</span>
                                  {hasRealPlayers && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-bold flex items-center gap-1 shrink-0 animate-pulse">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                      <span>ĐANG ĐẤU</span>
                                    </span>
                                  )}
                                  {r.hasBoss && (
                                    <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-mono font-bold shrink-0">
                                      🐲 BOSS
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 text-[10px] font-mono">
                                  <span className={hasRealPlayers ? 'text-emerald-300 font-bold' : 'text-slate-400'}>
                                    👥 {r.playerCount} Người{hasRealPlayers ? ' thực' : ''}
                                  </span>
                                  <span className="text-slate-400">🤖 {r.botCount} Bot</span>
                                  <span className="text-sky-300">🎮 {r.mode}</span>
                                </div>
                              </div>

                              {/* Action buttons: XEM TRẬN (Spectate) & VÀO CHƠI (Play) */}
                              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
                                <button
                                  type="button"
                                  onClick={() => handleSpectateByCode(r.id, r.mode)}
                                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1 border shadow-sm ${
                                    hasRealPlayers
                                      ? 'bg-cyan-500/25 hover:bg-cyan-500/40 text-cyan-200 border-cyan-400/60 font-black'
                                      : 'bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border-cyan-500/30'
                                  }`}
                                  title="Xem trận đấu diễn ra trong phòng này (Chế độ Khán giả)"
                                >
                                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Xem Trận</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleJoinByCode(r.id)}
                                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1 shadow-md ${
                                    hasRealPlayers
                                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                                      : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20'
                                  }`}
                                  title="Điều khiển xe tăng vào tham chiến phòng này"
                                >
                                  <Swords className="w-3.5 h-3.5" />
                                  <span>{hasRealPlayers ? 'Tham Chiến' : 'Vào Chơi'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
