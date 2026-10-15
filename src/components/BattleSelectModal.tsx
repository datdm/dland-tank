import React, { useState, useEffect } from 'react';
import {
  GameMode,
  MatchType,
  TankClass,
  Team,
  getRankFromRp,
  CustomRoomSummary,
} from '../types/game';
import { sounds } from '../utils/audio';
import {
  ChevronLeft,
  HelpCircle,
  Swords,
  Trophy,
  Globe,
  Sliders,
  Skull,
  Zap,
  Bot,
  Eye,
  Shield,
  MapPin,
  Check,
  Dices,
  Flame,
  Award,
  X,
  Radio,
} from 'lucide-react';

export type FourGameMode = 'RANKED_3V3' | 'CASUAL_3V3' | 'PUBLIC_FFA' | 'CUSTOM';
export type CustomSubMode = 'BOSS_RAID' | 'BATTLE_ROYALE' | 'CUSTOM_ROOM';

interface BattleSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  setName: (name: string) => void;
  color: string;
  setColor: (color: string) => void;
  tankClass: TankClass;
  matchType: MatchType;
  setMatchType: (type: MatchType) => void;
  mode: GameMode;
  setMode: (mode: GameMode) => void;
  selectedTeam: Team;
  setSelectedTeam: (team: Team) => void;
  botCount: number;
  setBotCount: (count: number) => void;
  rankRp: number;
  onStartBattle: (asSpectator?: boolean, targetRoomId?: string, targetMode?: GameMode) => void;
  isShortLandscape: boolean;
  roomId?: string;
  setRoomId?: (id: string) => void;
  onOpenCustomRoomModal?: () => void;
  activeRooms?: CustomRoomSummary[];
  initialFourMode?: FourGameMode;
}

const RANDOM_NAMES = [
  'MinhDat_VN',
  'BáoĐen_Pro99',
  'HoangLong_Tank',
  'SátThủ_SấmSét',
  'BaoKhang_Pro',
  'ChiDung_Sniper',
  'TuanKiet_No1',
  'VietAnh_T90',
  'Trần_Hoàng_Tank',
  'QuangHuy_Chief',
  'ThanhTung_Pro',
  'ThầnSấm_72',
];

const BOT_OPTIONS = [
  { count: 1, label: '1 Bot (1v1 Solo)' },
  { count: 3, label: '3 Bot (2v2 Nhẹ Nhàng)' },
  { count: 5, label: '5 Bot (3v3 Tiêu Chuẩn)' },
  { count: 7, label: '7 Bot (4v4 Thử Thách)' },
  { count: 9, label: '9 Bot (5v5 Đại Chiến)' },
  { count: 13, label: '13 Bot (Hỗn Loạn Toàn Map)' },
];

const PUBLIC_RANKING_SAMPLE = [
  { rank: 1, name: 'BáoĐen_Pro99', kills: 42, score: 840, badge: '👑' },
  { rank: 2, name: 'SátThủ_SấmSét', kills: 36, score: 710, badge: '🥈' },
  { rank: 3, name: 'Trần_Hoàng_Tank', kills: 29, score: 580, badge: '🥉' },
  { rank: 4, name: 'GiaBảo_T90', kills: 24, score: 480, badge: '⭐' },
  { rank: 5, name: 'MinhDat_VN', kills: 19, score: 390, badge: '⭐' },
];

export const BattleSelectModal: React.FC<BattleSelectModalProps> = ({
  isOpen,
  onClose,
  name,
  setName,
  tankClass,
  matchType,
  setMatchType,
  mode,
  setMode,
  selectedTeam,
  setSelectedTeam,
  botCount,
  setBotCount,
  rankRp,
  onStartBattle,
  isShortLandscape,
  roomId = 'public',
  setRoomId,
  onOpenCustomRoomModal,
  activeRooms = [],
  initialFourMode,
}) => {
  // 4 Core Modes: RANKED_3V3, CASUAL_3V3, PUBLIC_FFA, CUSTOM
  const [selectedFourMode, setSelectedFourMode] = useState<FourGameMode>(() => {
    if (initialFourMode) return initialFourMode;
    if (mode === 'PUBLIC') return 'PUBLIC_FFA';
    if (mode === 'TEAM_DEATHMATCH') {
      return matchType === 'RANKED' ? 'RANKED_3V3' : 'CASUAL_3V3';
    }
    return 'CUSTOM';
  });

  // Submode for PUBLIC: USER (Người chơi online) vs AI (Bot luyện tập)
  const [publicSubMode, setPublicSubMode] = useState<'USER' | 'AI'>('USER');

  // Submode for CUSTOM: BOSS_RAID, BATTLE_ROYALE, CUSTOM_ROOM
  const [customSubMode, setCustomSubMode] = useState<CustomSubMode>(() => {
    if (mode === 'BOSS_RAID') return 'BOSS_RAID';
    if (mode === 'BATTLE_ROYALE') return 'BATTLE_ROYALE';
    return 'CUSTOM_ROOM';
  });

  const [customRoomCode] = useState(() => `PHONG-${Math.floor(1000 + Math.random() * 9000)}`);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Helper to compute live player counts for each of the 4 modes
  const getPlayerCountForMode = (fMode: FourGameMode): number => {
    if (!activeRooms || activeRooms.length === 0) return 0;
    if (fMode === 'RANKED_3V3') {
      const matchRooms = activeRooms.filter(
        (r) =>
          r.id === 'ranked_tdm' ||
          r.id.startsWith('match_ranked_') ||
          (r.mode === 'TEAM_DEATHMATCH' && r.matchType === 'RANKED')
      );
      return matchRooms.reduce((sum, r) => sum + (r.playerCount || 0), 0);
    }
    if (fMode === 'CASUAL_3V3') {
      const matchRooms = activeRooms.filter(
        (r) =>
          r.id === 'tdm' ||
          r.id.startsWith('match_casual_') ||
          (r.mode === 'TEAM_DEATHMATCH' && r.matchType !== 'RANKED')
      );
      return matchRooms.reduce((sum, r) => sum + (r.playerCount || 0), 0);
    }
    if (fMode === 'PUBLIC_FFA') {
      if (publicSubMode === 'USER') {
        const matchRooms = activeRooms.filter((r) => r.id === 'public' || r.id === 'public_user');
        return matchRooms.reduce((sum, r) => sum + (r.playerCount || 0), 0);
      }
      return 0;
    }
    if (fMode === 'CUSTOM') {
      if (customSubMode === 'BOSS_RAID') {
        const matchRooms = activeRooms.filter((r) => r.id === 'boss' || r.id.includes('boss'));
        return matchRooms.reduce((sum, r) => sum + (r.playerCount || 0), 0);
      }
      if (customSubMode === 'BATTLE_ROYALE') {
        const matchRooms = activeRooms.filter((r) => r.id === 'br' || r.id.includes('br'));
        return matchRooms.reduce((sum, r) => sum + (r.playerCount || 0), 0);
      }
      const matchRooms = activeRooms.filter(
        (r) =>
          r.id.includes(customRoomCode) ||
          r.id.startsWith('custom_') ||
          r.id.startsWith('phong_')
      );
      return matchRooms.reduce((sum, r) => sum + (r.playerCount || 0), 0);
    }
    return 0;
  };

  const currentPlayerCount = getPlayerCountForMode(selectedFourMode);

  // Find if there is another room with active players playing right now
  const otherLiveRoom = activeRooms.find((r) => {
    if ((r.playerCount || 0) <= 0) return false;
    if (
      selectedFourMode === 'RANKED_3V3' &&
      (r.id === 'ranked_tdm' || r.id.startsWith('match_ranked_'))
    )
      return false;
    if (
      selectedFourMode === 'CASUAL_3V3' &&
      (r.id === 'tdm' || r.id.startsWith('match_casual_'))
    )
      return false;
    if (
      selectedFourMode === 'PUBLIC_FFA' &&
      (r.id === 'public' || r.id === 'public_user')
    )
      return false;
    if (
      selectedFourMode === 'CUSTOM' &&
      (r.id === 'boss' || r.id === 'br' || r.id.includes(customRoomCode))
    )
      return false;
    return true;
  });

  // Compact Height & Mobile Viewport Detection (Landscape phones usually have height <= 520px)
  const [isCompactHeight, setIsCompactHeight] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight <= 520 || (window.innerWidth > window.innerHeight && window.innerHeight <= 620) || isShortLandscape;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsCompactHeight(
        window.innerHeight <= 520 ||
        (window.innerWidth > window.innerHeight && window.innerHeight <= 620) ||
        isShortLandscape
      );
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [isShortLandscape]);

  // Sync mode whenever props change or modal opens
  useEffect(() => {
    if (isOpen) {
      setShowHelpModal(false);
      if (initialFourMode) {
        handleSelectFourMode(initialFourMode);
        return;
      }
    }
    if (mode === 'PUBLIC') {
      setSelectedFourMode('PUBLIC_FFA');
      setPublicSubMode('USER');
    } else if (mode === 'AI') {
      setSelectedFourMode('PUBLIC_FFA');
      setPublicSubMode('AI');
    } else if (mode === 'TEAM_DEATHMATCH') {
      if (matchType === 'RANKED') {
        setSelectedFourMode('RANKED_3V3');
      } else {
        setSelectedFourMode('CASUAL_3V3');
      }
    } else if (mode === 'BOSS_RAID') {
      setSelectedFourMode('CUSTOM');
      setCustomSubMode('BOSS_RAID');
    } else if (mode === 'BATTLE_ROYALE') {
      setSelectedFourMode('CUSTOM');
      setCustomSubMode('BATTLE_ROYALE');
    }
  }, [mode, matchType, isOpen, initialFourMode]);

  if (!isOpen) return null;

  const myRank = getRankFromRp(rankRp);

  const applyPublicSubMode = (sub: 'USER' | 'AI') => {
    sounds.playRadioBeep();
    setPublicSubMode(sub);
    if (sub === 'USER') {
      setMode('PUBLIC');
      setMatchType('CASUAL');
      setBotCount(0);
      if (setRoomId) setRoomId('public_user');
    } else {
      setMode('AI');
      setMatchType('CASUAL');
      setBotCount(8);
      if (setRoomId) setRoomId('public_ai');
    }
  };

  const handleSelectFourMode = (fMode: FourGameMode) => {
    sounds.playRadioBeep();
    setSelectedFourMode(fMode);

    if (fMode === 'RANKED_3V3') {
      setMode('TEAM_DEATHMATCH');
      setMatchType('RANKED');
      setBotCount(0); // Pure 100% human vs human (no bots)
      if (setRoomId) setRoomId('ranked_tdm');
    } else if (fMode === 'CASUAL_3V3') {
      setMode('TEAM_DEATHMATCH');
      setMatchType('CASUAL');
      setBotCount(0); // Pure 100% human vs human (no bots)
      if (setRoomId) setRoomId('tdm');
    } else if (fMode === 'PUBLIC_FFA') {
      applyPublicSubMode(publicSubMode);
    } else if (fMode === 'CUSTOM') {
      applyCustomSubMode(customSubMode);
    }
  };

  const applyCustomSubMode = (sub: CustomSubMode) => {
    sounds.playRadioBeep();
    setCustomSubMode(sub);
    if (sub === 'BOSS_RAID') {
      setMode('BOSS_RAID');
      setMatchType('CASUAL');
      setBotCount(0); // 100% Người chơi thật hiệp lực săn Boss
      if (setRoomId) setRoomId(`custom_boss_${customRoomCode}`);
    } else if (sub === 'BATTLE_ROYALE') {
      setMode('BATTLE_ROYALE');
      setMatchType('CASUAL');
      setBotCount(0); // 100% Người chơi thật sinh tồn vòng bo
      if (setRoomId) setRoomId(`custom_br_${customRoomCode}`);
    } else {
      setMode('AI');
      setMatchType('CASUAL');
      setBotCount(botCount > 0 ? botCount : 5); // Chế độ luyện tập với Bot AI
      if (setRoomId) setRoomId(`custom_ai_${customRoomCode}`);
    }
  };

  const handleLaunchBattle = (asSpectator: boolean = false, targetRoomId?: string, targetMode?: GameMode) => {
    sounds.playPowerUp();
    onClose();
    onStartBattle(asSpectator, targetRoomId, targetMode);
  };

  const handleRandomizeName = () => {
    sounds.playRadioBeep();
    const chosen = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    setName(chosen);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#080d1e] text-slate-100 font-sans select-none overflow-hidden flex flex-col w-screen h-[100dvh] max-h-[100dvh] animate-in fade-in duration-200">
      {/* Background Atmosphere: Mystic Indigo glow and battlefield artwork effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#070b1a] via-[#0d1533] to-[#141b3d] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* =========================================================================
          1. TOP BAR (LIÊN QUÂN STYLE): "‹ Chọn chế độ" + Player Name & Rank Badge + "?"
         ========================================================================= */}
      <header className={`relative z-30 flex items-center justify-between px-2.5 sm:px-4 lg:px-6 bg-[#0a0f26]/90 backdrop-blur-md border-b border-[#1f2b56] shrink-0 ${
        isCompactHeight ? 'h-8 sm:h-9' : 'h-9 sm:h-11 lg:h-12'
      }`}>
        {/* Left: Back button "Chọn chế độ" */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              sounds.playRadioBeep();
              onClose();
            }}
            className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-transform active:scale-95 cursor-pointer font-bold font-mono tracking-wider"
          >
            <div className={`${isCompactHeight ? 'w-5 h-5' : 'w-6 h-6 sm:w-7 sm:h-7'} rounded-full bg-gradient-to-br from-amber-400 to-amber-600 p-[1.5px] flex items-center justify-center shadow-md shadow-amber-500/30 shrink-0`}>
              <div className="w-full h-full bg-[#0a0f26] rounded-full flex items-center justify-center">
                <ChevronLeft className={`${isCompactHeight ? 'w-3 h-3' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} text-amber-400 stroke-[3]`} />
              </div>
            </div>
            <span className={`${isCompactHeight ? 'text-xs' : 'text-xs sm:text-sm'} font-black text-amber-300 drop-shadow-sm`}>
              Trang Chủ
            </span>
          </button>

          {/* Commander Name Input */}
          <div className="hidden sm:flex items-center gap-1 bg-[#121938] border border-[#233160] rounded-md px-2 py-0.5 ml-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={18}
              className="bg-transparent text-white font-mono text-xs font-bold w-24 sm:w-32 focus:outline-none"
              placeholder="Tên chỉ huy..."
            />
            <button
              type="button"
              onClick={handleRandomizeName}
              className="text-amber-400 hover:text-white transition-colors cursor-pointer"
              title="Đổi tên ngẫu nhiên"
            >
              <Dices className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Rank Badge + Help "?" */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Rank Badge */}
          <div className={`flex items-center gap-1 ${isCompactHeight ? 'text-[9.5px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5'} font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-md`}>
            <span>{myRank.icon}</span>
            <span>{myRank.badge}</span>
            <span className="text-slate-400 hidden xs:inline">({myRank.rp} RP)</span>
          </div>

          {/* Help button "?" */}
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className={`${isCompactHeight ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'} rounded-full border border-slate-600/80 hover:border-slate-400 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer`}
            title="Luật chơi & Hướng dẫn"
          >
            <HelpCircle className={`${isCompactHeight ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. MAIN BODY: 4 CORE MODES (LEFT COLUMN) + DETAIL & LAUNCH (RIGHT STAGE)
         ========================================================================= */}
      <div className="relative z-20 flex-1 flex min-h-0 overflow-hidden">
        {/* -------------------------------------------------------------
            LEFT LIST: EXACTLY 4 GAME MODES
           ------------------------------------------------------------- */}
        <aside className={`${
          isCompactHeight
            ? 'w-32 xs:w-36 sm:w-44 md:w-52 p-1 sm:p-1.5 gap-1'
            : 'w-36 xs:w-40 sm:w-56 md:w-64 lg:w-72 p-1.5 sm:p-2.5 gap-1.5 sm:gap-2'
        } shrink-0 bg-[#0c122e]/90 border-r border-[#19244d] flex flex-col select-none overflow-y-auto overscroll-contain`}>
          {/* Mode 1: Đấu Rank 3x3 */}
          {(() => {
            const rankedCount = getPlayerCountForMode('RANKED_3V3');
            return (
              <button
                type="button"
                onClick={() => handleSelectFourMode('RANKED_3V3')}
                className={`w-full text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-center border ${
                  isCompactHeight ? 'p-1.5 sm:p-2 rounded-lg' : 'p-2 sm:p-2.5 rounded-xl'
                } ${
                  selectedFourMode === 'RANKED_3V3'
                    ? 'bg-gradient-to-r from-amber-950/80 via-[#2a2412] to-[#1c180d] border-amber-500/80 text-white shadow-lg shadow-amber-500/20'
                    : 'bg-[#141d3d]/80 hover:bg-[#1a254d] border-transparent text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <div className={`rounded-md flex items-center justify-center font-bold ${
                      isCompactHeight ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-xs'
                    } ${
                      selectedFourMode === 'RANKED_3V3' ? 'bg-amber-500 text-slate-950' : 'bg-[#1e2952] text-amber-400'
                    }`}>
                      <Trophy className={`${isCompactHeight ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                    </div>
                    <span className={`font-black tracking-tight ${
                      isCompactHeight ? 'text-[9px] xs:text-[9.5px] sm:text-[11px]' : 'text-[10px] sm:text-xs md:text-sm'
                    } ${
                      selectedFourMode === 'RANKED_3V3' ? 'text-amber-300' : 'text-white'
                    }`}>
                      1. Đấu Rank (3x3)
                    </span>
                  </div>
                  <span className={`${
                    isCompactHeight ? 'text-[6.5px] sm:text-[7.5px] px-1 py-0' : 'text-[7.5px] sm:text-[9px] px-1 sm:px-1.5 py-0.5'
                  } rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold shrink-0`}>
                    RANK RP
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`${
                    isCompactHeight ? 'text-[7px] xs:text-[7.5px] sm:text-[8.5px]' : 'text-[8px] sm:text-[9.5px]'
                  } text-slate-400 font-mono line-clamp-1`}>
                    Ghép trận 3v3 • Leo hạng
                  </span>
                  <span className={`text-[8px] sm:text-[9px] font-mono font-bold ${
                    rankedCount > 0 ? 'text-emerald-400 animate-pulse' : 'text-slate-500'
                  }`}>
                    {rankedCount > 0 ? `🟢 ${rankedCount} người` : '⚪ 0/6 người'}
                  </span>
                </div>
              </button>
            );
          })()}

          {/* Mode 2: Đấu Thường 3x3 */}
          {(() => {
            const casualCount = getPlayerCountForMode('CASUAL_3V3');
            return (
              <button
                type="button"
                onClick={() => handleSelectFourMode('CASUAL_3V3')}
                className={`w-full text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-center border ${
                  isCompactHeight ? 'p-1.5 sm:p-2 rounded-lg' : 'p-2 sm:p-2.5 rounded-xl'
                } ${
                  selectedFourMode === 'CASUAL_3V3'
                    ? 'bg-gradient-to-r from-[#172b5c] via-[#1b3472] to-[#12224d] border-sky-400 text-white shadow-lg shadow-sky-500/20'
                    : 'bg-[#141d3d]/80 hover:bg-[#1a254d] border-transparent text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <div className={`rounded-md flex items-center justify-center font-bold ${
                      isCompactHeight ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-xs'
                    } ${
                      selectedFourMode === 'CASUAL_3V3' ? 'bg-sky-500 text-slate-950' : 'bg-[#1e2952] text-sky-400'
                    }`}>
                      <Swords className={`${isCompactHeight ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                    </div>
                    <span className={`font-black tracking-tight ${
                      isCompactHeight ? 'text-[9px] xs:text-[9.5px] sm:text-[11px]' : 'text-[10px] sm:text-xs md:text-sm'
                    } ${
                      selectedFourMode === 'CASUAL_3V3' ? 'text-sky-300' : 'text-white'
                    }`}>
                      2. Đấu Thường (3x3)
                    </span>
                  </div>
                  <span className={`${
                    isCompactHeight ? 'text-[6.5px] sm:text-[7.5px] px-1 py-0' : 'text-[7.5px] sm:text-[9px] px-1 sm:px-1.5 py-0.5'
                  } rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono font-bold shrink-0`}>
                    3 VS 3
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`${
                    isCompactHeight ? 'text-[7px] xs:text-[7.5px] sm:text-[8.5px]' : 'text-[8px] sm:text-[9.5px]'
                  } text-slate-400 font-mono line-clamp-1`}>
                    Tác chiến 3v3 giải trí
                  </span>
                  <span className={`text-[8px] sm:text-[9px] font-mono font-bold ${
                    casualCount > 0 ? 'text-emerald-400 animate-pulse' : 'text-slate-500'
                  }`}>
                    {casualCount > 0 ? `🟢 ${casualCount} người` : '⚪ 0/6 người'}
                  </span>
                </div>
              </button>
            );
          })()}

          {/* Mode 3: Phòng Public (Hỗn Chiến Tự Do) */}
          {(() => {
            const publicCount = getPlayerCountForMode('PUBLIC_FFA');
            return (
              <button
                type="button"
                onClick={() => handleSelectFourMode('PUBLIC_FFA')}
                className={`w-full text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-center border ${
                  isCompactHeight ? 'p-1.5 sm:p-2 rounded-lg' : 'p-2 sm:p-2.5 rounded-xl'
                } ${
                  selectedFourMode === 'PUBLIC_FFA'
                    ? 'bg-gradient-to-r from-[#0d3b36] via-[#104842] to-[#0c2f2b] border-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-[#141d3d]/80 hover:bg-[#1a254d] border-transparent text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <div className={`rounded-md flex items-center justify-center font-bold ${
                      isCompactHeight ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-xs'
                    } ${
                      selectedFourMode === 'PUBLIC_FFA' ? 'bg-emerald-500 text-slate-950' : 'bg-[#1e2952] text-emerald-400'
                    }`}>
                      <Globe className={`${isCompactHeight ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                    </div>
                    <span className={`font-black tracking-tight ${
                      isCompactHeight ? 'text-[9px] xs:text-[9.5px] sm:text-[11px]' : 'text-[10px] sm:text-xs md:text-sm'
                    } ${
                      selectedFourMode === 'PUBLIC_FFA' ? 'text-emerald-300' : 'text-white'
                    }`}>
                      3. Phòng Public
                    </span>
                  </div>
                  <span className={`${
                    isCompactHeight ? 'text-[6.5px] sm:text-[7.5px] px-1 py-0' : 'text-[7.5px] sm:text-[9px] px-1 sm:px-1.5 py-0.5'
                  } rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold shrink-0`}>
                    RANKING
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`${
                    isCompactHeight ? 'text-[7px] xs:text-[7.5px] sm:text-[8.5px]' : 'text-[8px] sm:text-[9.5px]'
                  } text-slate-400 font-mono line-clamp-1`}>
                    Map mở 4200M tự do
                  </span>
                  <span className={`text-[8px] sm:text-[9px] font-mono font-bold ${
                    publicCount > 0 ? 'text-emerald-400 animate-pulse' : 'text-slate-500'
                  }`}>
                    {publicCount > 0 ? `🟢 ${publicCount} người` : '⚪ 0 người'}
                  </span>
                </div>
              </button>
            );
          })()}

          {/* Mode 4: Chế Độ Tùy Chọn */}
          {(() => {
            const customCount = getPlayerCountForMode('CUSTOM');
            return (
              <button
                type="button"
                onClick={() => handleSelectFourMode('CUSTOM')}
                className={`w-full text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-center border ${
                  isCompactHeight ? 'p-1.5 sm:p-2 rounded-lg' : 'p-2 sm:p-2.5 rounded-xl'
                } ${
                  selectedFourMode === 'CUSTOM'
                    ? 'bg-gradient-to-r from-[#3c1752] via-[#4d1d69] to-[#2c0f3d] border-purple-400 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-[#141d3d]/80 hover:bg-[#1a254d] border-transparent text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <div className={`rounded-md flex items-center justify-center font-bold ${
                      isCompactHeight ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-xs'
                    } ${
                      selectedFourMode === 'CUSTOM' ? 'bg-purple-500 text-slate-950' : 'bg-[#1e2952] text-purple-400'
                    }`}>
                      <Sliders className={`${isCompactHeight ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                    </div>
                    <span className={`font-black tracking-tight ${
                      isCompactHeight ? 'text-[9px] xs:text-[9.5px] sm:text-[11px]' : 'text-[10px] sm:text-xs md:text-sm'
                    } ${
                      selectedFourMode === 'CUSTOM' ? 'text-purple-300' : 'text-white'
                    }`}>
                      4. Tùy Chọn
                    </span>
                  </div>
                  <span className={`${
                    isCompactHeight ? 'text-[6.5px] sm:text-[7.5px] px-1 py-0' : 'text-[7.5px] sm:text-[9px] px-1 sm:px-1.5 py-0.5'
                  } rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono font-bold shrink-0`}>
                    BOSS/BO
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`${
                    isCompactHeight ? 'text-[7px] xs:text-[7.5px] sm:text-[8.5px]' : 'text-[8px] sm:text-[9.5px]'
                  } text-slate-400 font-mono line-clamp-1`}>
                    Boss • Bo Sinh Tồn
                  </span>
                  <span className={`text-[8px] sm:text-[9px] font-mono font-bold ${
                    customCount > 0 ? 'text-emerald-400 animate-pulse' : 'text-slate-500'
                  }`}>
                    {customCount > 0 ? `🟢 ${customCount} người` : '⚪ 0 người'}
                  </span>
                </div>
              </button>
            );
          })()}
        </aside>

        {/* -------------------------------------------------------------
            RIGHT STAGE: MODE CONFIGURATION, DETAILS & LAUNCH BUTTON
           ------------------------------------------------------------- */}
        <main className={`flex-1 relative flex flex-col justify-between ${
          isCompactHeight ? 'p-2 sm:p-3' : 'p-2.5 sm:p-4 md:p-5'
        } overflow-y-auto select-none custom-scrollbar`}>
          {/* Backdrop Silhouette Icon */}
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${
            isCompactHeight ? 'w-28 sm:w-40 h-28 sm:h-40 opacity-10' : 'w-48 sm:w-64 md:w-80 h-48 sm:h-64 md:h-80 opacity-20 md:opacity-35'
          } pointer-events-none flex items-center justify-center`}>
            <div className={`${isCompactHeight ? 'text-[60px] sm:text-[90px]' : 'text-[80px] sm:text-[120px] md:text-[160px]'} select-none filter drop-shadow-[0_0_30px_rgba(234,179,8,0.4)] animate-pulse`}>
              {selectedFourMode === 'RANKED_3V3' && '🏆'}
              {selectedFourMode === 'CASUAL_3V3' && '⚔️'}
              {selectedFourMode === 'PUBLIC_FFA' && '🌐'}
              {selectedFourMode === 'CUSTOM' &&
                (customSubMode === 'BOSS_RAID' ? '🐲' : customSubMode === 'BATTLE_ROYALE' ? '🌪️' : '⚙️')}
            </div>
          </div>

          {/* Mode Detail Content */}
          <div className={`relative z-10 max-w-xl ${isCompactHeight ? 'space-y-1 sm:space-y-1.5' : 'space-y-2 sm:space-y-3'}`}>
            {/* Tag Badge */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className={`px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono ${
                isCompactHeight ? 'text-[7.5px] sm:text-[8.5px]' : 'text-[9px] sm:text-[10px]'
              } font-bold uppercase`}>
                {selectedFourMode === 'RANKED_3V3' && '🏆 ĐẤU HẠNG RP (3 VS 3)'}
                {selectedFourMode === 'CASUAL_3V3' && '⚔️ ĐẤU THƯỜNG GIẢI TRÍ (3 VS 3)'}
                {selectedFourMode === 'PUBLIC_FFA' && '🌐 PHÒNG PUBLIC CÓ BẢNG XẾP HẠNG'}
                {selectedFourMode === 'CUSTOM' && '⚙️ TÙY CHỌN CHIẾN TRƯỜNG ĐẶC BIỆT'}
              </span>
              <span className={`text-slate-400 font-mono ${isCompactHeight ? 'text-[8px] sm:text-[9px]' : 'text-[10px]'}`}>
                Chiến Xa: {tankClass}
              </span>
            </div>

            {/* Title */}
            <h2 className={`${
              isCompactHeight ? 'text-xs sm:text-sm' : 'text-xs sm:text-sm md:text-base'
            } font-bold text-white font-mono uppercase tracking-wide drop-shadow-md`}>
              {selectedFourMode === 'RANKED_3V3' && 'ĐẤU HẠNG 3X3 - LEO RANK RP'}
              {selectedFourMode === 'CASUAL_3V3' && 'ĐẤU THƯỜNG 3X3 - 2 PHE ĐỎ/XANH'}
              {selectedFourMode === 'PUBLIC_FFA' && 'HỖN CHIẾN PUBLIC - RANKING ĐIỂM SỐ'}
              {selectedFourMode === 'CUSTOM' &&
                (customSubMode === 'BOSS_RAID'
                  ? 'SĂN BOSS LEVIATHAN 20.000 HP'
                  : customSubMode === 'BATTLE_ROYALE'
                  ? 'SINH TỒN VÒNG BO ĐIỆN TỪ'
                  : 'LUYỆN TẬP VỚI BOT AI')}
            </h2>

            {/* Description */}
            <p className={`text-slate-300 ${
              isCompactHeight ? 'text-[8.5px] sm:text-[9.5px] md:text-xs leading-snug line-clamp-2 sm:line-clamp-none' : 'text-[10px] sm:text-xs md:text-sm leading-relaxed'
            }`}>
              {selectedFourMode === 'RANKED_3V3' &&
                'Trận chiến 3v3 tính điểm Rank RP nghiêm túc! Phối hợp 3 người chơi cùng phe, chiếm cứ điểm và đạt 20 mạng để chiến thắng.'}
              {selectedFourMode === 'CASUAL_3V3' &&
                'Đấu trường 3v3 tiêu chuẩn để giải trí, rèn luyện kỹ năng bắn pháo và thử nghiệm chiến thuật. Không bị trừ điểm khi thất bại.'}
              {selectedFourMode === 'PUBLIC_FFA' &&
                'Chiến trường mở 4200M không giới hạn người chơi. Bắn hạ kẻ địch, tích lũy killstreak và leo lên Top 1 Bảng Xếp Hạng!'}
              {selectedFourMode === 'CUSTOM' &&
                'Chế độ tùy chỉnh đa dạng: Săn Boss Leviathan, Sinh tồn vòng bo điện từ hoặc luyện tập bắn pháo với Bot AI (địa hình ngẫu nhiên).'}
            </p>

            {/* Sub-selectors for 3v3 Modes: Team Picker */}
            {(selectedFourMode === 'RANKED_3V3' || selectedFourMode === 'CASUAL_3V3') && (
              <div className={`${isCompactHeight ? 'pt-0.5' : 'pt-1'} flex items-center gap-1.5 sm:gap-2`}>
                <span className={`${isCompactHeight ? 'text-[9.5px]' : 'text-xs'} text-slate-400 font-mono`}>Chọn Phe:</span>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playRadioBeep();
                    setSelectedTeam('RED');
                  }}
                  className={`${isCompactHeight ? 'px-2 py-0.5 text-[9.5px]' : 'px-3 py-1 text-xs'} rounded-md font-bold font-mono cursor-pointer transition-all ${
                    selectedTeam === 'RED'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 border border-rose-400'
                      : 'bg-[#141d3d] text-slate-400 hover:text-white border border-[#233160]'
                  }`}
                >
                  🔴 Phe Đỏ (Team 1)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playRadioBeep();
                    setSelectedTeam('BLUE');
                  }}
                  className={`${isCompactHeight ? 'px-2 py-0.5 text-[9.5px]' : 'px-3 py-1 text-xs'} rounded-md font-bold font-mono cursor-pointer transition-all ${
                    selectedTeam === 'BLUE'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 border border-sky-400'
                      : 'bg-[#141d3d] text-slate-400 hover:text-white border border-[#233160]'
                  }`}
                >
                  🔵 Phe Xanh (Team 2)
                </button>
              </div>
            )}

            {/* Mode 3: Public FFA Submodes Choice (2 mục: Online User vs AI Bot) */}
            {selectedFourMode === 'PUBLIC_FFA' && (
              <div className={`${isCompactHeight ? 'mt-1 space-y-1.5' : 'mt-2 space-y-2.5'} max-w-md`}>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className={`${isCompactHeight ? 'text-[9.5px]' : 'text-xs'} text-slate-300 font-mono font-bold`}>Mục Đấu Public:</span>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyPublicSubMode('USER')}
                      className={`${isCompactHeight ? 'px-2 py-1 text-[9px] sm:text-[10px]' : 'px-3 py-1.5 text-xs'} rounded-lg font-mono font-bold cursor-pointer transition-all flex items-center gap-1 sm:gap-1.5 ${
                        publicSubMode === 'USER'
                          ? 'bg-emerald-600 text-white border border-emerald-400 shadow-md shadow-emerald-600/30 font-black'
                          : 'bg-[#141d3d] text-slate-400 hover:text-white border border-[#233160]'
                      }`}
                    >
                      <Globe className={`${isCompactHeight ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-emerald-300`} />
                      <span>👥 Người Chơi (PvP)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPublicSubMode('AI')}
                      className={`${isCompactHeight ? 'px-2 py-1 text-[9px] sm:text-[10px]' : 'px-3 py-1.5 text-xs'} rounded-lg font-mono font-bold cursor-pointer transition-all flex items-center gap-1 sm:gap-1.5 ${
                        publicSubMode === 'AI'
                          ? 'bg-sky-600 text-white border border-sky-400 shadow-md shadow-sky-600/30 font-black'
                          : 'bg-[#141d3d] text-slate-400 hover:text-white border border-[#233160]'
                      }`}
                    >
                      <Bot className={`${isCompactHeight ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-sky-300`} />
                      <span>🤖 Bot AI (Luyện Tập)</span>
                    </button>
                  </div>
                </div>

                <div className={`bg-[#0a0f26]/80 border border-[#1f2b56] rounded-xl ${isCompactHeight ? 'p-1.5' : 'p-2.5'}`}>
                  <div className={`flex items-center justify-between border-b border-[#1f2b56] ${isCompactHeight ? 'pb-1 mb-1' : 'pb-1.5 mb-1.5'}`}>
                    <div className={`flex items-center gap-1 sm:gap-1.5 ${isCompactHeight ? 'text-[9.5px]' : 'text-xs'} font-mono font-bold text-emerald-400`}>
                      <Award className={`${isCompactHeight ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                      <span>
                        {publicSubMode === 'USER'
                          ? 'BẢNG XẾP HẠNG PHÒNG ONLINE'
                          : 'BẢNG XẾP HẠNG PHÒNG BOT AI'}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">Real-time</span>
                  </div>
                  <div className={`space-y-0.5 ${isCompactHeight ? 'text-[9px]' : 'text-xs'} font-mono`}>
                    {PUBLIC_RANKING_SAMPLE.slice(0, isCompactHeight ? 3 : 5).map((p) => (
                      <div key={p.rank} className="flex items-center justify-between text-slate-300 py-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3.5 text-center font-bold text-amber-400">{p.badge}</span>
                          <span className="truncate max-w-[120px] sm:max-w-none">{p.name}</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 text-slate-400">
                          <span className="text-rose-400">{p.kills} Hạ</span>
                          <span className="text-amber-300 font-bold">{p.score} Điểm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mode 4: Custom Submodes Tabs */}
            {selectedFourMode === 'CUSTOM' && (
              <div className={`${isCompactHeight ? 'space-y-1.5 pt-0.5' : 'space-y-2.5 pt-1'}`}>
                <div className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300 font-mono ${
                  isCompactHeight ? 'text-[9px]' : 'text-[11px]'
                } font-bold max-w-md`}>
                  <Bot className={`${isCompactHeight ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-sky-400 shrink-0`} />
                  <span>TÙY CHỌN: BOSS LEVIATHAN • VÒNG BO • LUYỆN TẬP BOT</span>
                </div>

                <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyCustomSubMode('BOSS_RAID')}
                    className={`${isCompactHeight ? 'px-2 py-1 text-[9px] sm:text-[10px]' : 'px-3 py-1.5 text-xs'} rounded-lg font-mono font-bold cursor-pointer transition-all flex items-center gap-1 sm:gap-1.5 ${
                      customSubMode === 'BOSS_RAID'
                        ? 'bg-rose-600 text-white border border-rose-400 shadow-md shadow-rose-600/30'
                        : 'bg-[#141d3d] text-slate-300 hover:text-white border border-[#233160]'
                    }`}
                  >
                    <Skull className={`${isCompactHeight ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-300`} />
                    <span>Đại Chiến Boss Leviathan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyCustomSubMode('BATTLE_ROYALE')}
                    className={`${isCompactHeight ? 'px-2 py-1 text-[9px] sm:text-[10px]' : 'px-3 py-1.5 text-xs'} rounded-lg font-mono font-bold cursor-pointer transition-all flex items-center gap-1 sm:gap-1.5 ${
                      customSubMode === 'BATTLE_ROYALE'
                        ? 'bg-purple-600 text-white border border-purple-400 shadow-md shadow-purple-600/30'
                        : 'bg-[#141d3d] text-slate-300 hover:text-white border border-[#233160]'
                    }`}
                  >
                    <Zap className={`${isCompactHeight ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-300`} />
                    <span>Sinh Tồn Vòng Bo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyCustomSubMode('CUSTOM_ROOM')}
                    className={`${isCompactHeight ? 'px-2 py-1 text-[9px] sm:text-[10px]' : 'px-3 py-1.5 text-xs'} rounded-lg font-mono font-bold cursor-pointer transition-all flex items-center gap-1 sm:gap-1.5 ${
                      customSubMode === 'CUSTOM_ROOM'
                        ? 'bg-sky-600 text-white border border-sky-400 shadow-md shadow-sky-600/30'
                        : 'bg-[#141d3d] text-slate-300 hover:text-white border border-[#233160]'
                    }`}
                  >
                    <Bot className={`${isCompactHeight ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-300`} />
                    <span>Luyện Tập Bot AI</span>
                  </button>

                  {onOpenCustomRoomModal && (
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playRadioBeep();
                        onOpenCustomRoomModal();
                      }}
                      className={`${isCompactHeight ? 'px-2 py-1 text-[9px] sm:text-[10px]' : 'px-3 py-1.5 text-xs'} rounded-lg font-mono font-bold cursor-pointer transition-all flex items-center gap-1 sm:gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-500/20`}
                    >
                      <Sliders className={`${isCompactHeight ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-400`} />
                      <span>🛠️ Bảng Tạo Phòng Chi Tiết</span>
                    </button>
                  )}
                </div>

                {/* Sub-config for Custom Room (Bot selector & Random Map notice) */}
                {customSubMode === 'CUSTOM_ROOM' && (
                  <div className={`bg-[#0a0f26]/80 border border-[#1f2b56] rounded-xl ${isCompactHeight ? 'p-1.5 space-y-1.5' : 'p-2.5 space-y-2'} max-w-lg`}>
                    {/* Bot count picker */}
                    <div className="flex items-center justify-between gap-1.5">
                      <span className={`${isCompactHeight ? 'text-[9.5px]' : 'text-xs'} text-slate-300 font-mono font-bold`}>Số Lượng Bot AI:</span>
                      <div className="flex flex-wrap gap-1">
                        {BOT_OPTIONS.map((opt) => (
                          <button
                            key={opt.count}
                            type="button"
                            onClick={() => {
                              sounds.playRadioBeep();
                              setBotCount(opt.count);
                            }}
                            className={`px-1.5 sm:px-2 py-0.5 rounded ${isCompactHeight ? 'text-[8.5px]' : 'text-[10px]'} font-mono font-bold cursor-pointer transition-colors ${
                              botCount === opt.count
                                ? 'bg-sky-500 text-slate-950 font-black'
                                : 'bg-[#141d3d] text-slate-400 hover:text-white border border-[#233160]'
                            }`}
                          >
                            {opt.label.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Random Map Notification (No map selection needed) */}
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-[#121b3d]/90 border border-[#203063] text-slate-300 font-mono">
                      <span className="text-amber-400 text-sm">🎲</span>
                      <span className={`${isCompactHeight ? 'text-[8px] sm:text-[9px]' : 'text-[10px] sm:text-[11px]'} leading-snug`}>
                        Bản đồ & chướng ngại vật sinh ngẫu nhiên tự động cho mỗi hiệp đấu.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Right: Action Cluster ("Bắt đầu" + "Xem Trận") */}
          <div className={`relative z-10 w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 ${isCompactHeight ? 'pt-1.5' : 'pt-2.5'} pb-[max(0.35rem,env(safe-area-inset-bottom))] shrink-0 border-t border-[#1a2652] sm:border-t-0`}>
            <button
              type="button"
              onClick={() => handleLaunchBattle(true)}
              className={`flex items-center justify-center gap-1.5 bg-[#172247] hover:bg-[#203063] border border-[#2d3e75] text-sky-300 hover:text-white ${
                isCompactHeight ? 'px-2.5 py-1 text-[10px]' : 'px-3 sm:px-4 py-2 text-xs'
              } rounded-xl font-bold cursor-pointer active:scale-95 transition-all shadow-md shrink-0`}
              title="Khán giả theo dõi trận đấu"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem Trận</span>
            </button>

            {/* The Signature "Bắt đầu" Button */}
            <button
              type="button"
              onClick={() => handleLaunchBattle(false)}
              className={`flex-1 sm:flex-initial bg-gradient-to-r from-[#2962ff] to-[#3d5afe] hover:from-[#1e4bd8] hover:to-[#2d4fe0] text-white font-black tracking-wider ${
                isCompactHeight ? 'text-xs sm:text-sm px-4 sm:px-6 py-1.5' : 'text-xs sm:text-sm md:text-base px-5 sm:px-8 py-2 sm:py-2.5'
              } rounded-xl shadow-xl shadow-blue-600/35 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2 min-w-[120px]`}
            >
              <Swords className={`${isCompactHeight ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
              <span>BẮT ĐẦU</span>
            </button>
          </div>
        </main>
      </div>

      {/* Help Modal Popup */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
          <div className={`relative bg-[#0f1738] border border-[#273870] rounded-xl sm:rounded-2xl ${
            isCompactHeight ? 'p-3 max-h-[88vh] space-y-2 text-[10.5px]' : 'p-4 sm:p-5 max-h-[82vh] space-y-3 text-xs'
          } max-w-md w-full overflow-y-auto my-auto shadow-2xl custom-scrollbar`}>
            <div className="flex items-center justify-between border-b border-[#212f60] pb-1.5 sticky top-0 bg-[#0f1738] z-10">
              <h3 className={`font-bold text-white ${isCompactHeight ? 'text-xs' : 'text-sm'} font-mono flex items-center gap-1.5`}>
                <HelpCircle className={`${isCompactHeight ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-sky-400`} />
                4 CHẾ ĐỘ CHIẾN ĐẤU CHÍNH
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1.5 text-slate-300">
              <p>• <strong>1. Đấu Rank (3x3):</strong> Thi đấu leo hạng RP, 2 phe Đỏ / Xanh, đạt 20 điểm hạ gục để chiến thắng.</p>
              <p>• <strong>2. Đấu Thường (3x3):</strong> Tác chiến 3v3 tiêu chuẩn, luyện tập kỹ năng và giải trí mà không bị trừ Rank.</p>
              <p>• <strong>3. Phòng Public:</strong> Map mở 4200M không giới hạn người chơi, tự do cày điểm và tranh đua Top 1 Bảng Xếp Hạng.</p>
              <p>• <strong>4. Chế Độ Tùy Chọn:</strong> Bao gồm Đại Chiến Boss Leviathan 20.000 HP, Sinh Tồn Bo Bão điện từ và Tự do chọn map / số bot.</p>
            </div>
            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 sm:py-2 rounded-lg cursor-pointer transition-colors active:scale-95 text-xs"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
