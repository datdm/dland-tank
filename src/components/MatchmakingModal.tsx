import React, { useEffect, useState } from 'react';
import {
  MatchType,
  QueueMatchedPlayer,
  Team,
  getRankFromRp,
} from '../types/game';
import { TankVisual } from './TankVisual';
import { sounds } from '../utils/audio';
import {
  Trophy,
  Gamepad2,
  X,
  Users,
  Clock,
  Sparkles,
  Bot,
  Zap,
} from 'lucide-react';

interface MatchmakingModalProps {
  isOpen: boolean;
  matchType: MatchType;
  currentCount: number;
  targetCount?: number;
  elapsedSeconds: number;
  players: QueueMatchedPlayer[];
  matchFoundData: {
    matchType: MatchType;
    roomId: string;
    myTeam: Team;
    redTeam: QueueMatchedPlayer[];
    blueTeam: QueueMatchedPlayer[];
    countdown: number;
  } | null;
  onCancel: () => void;
  onAutoFillBots: () => void;
}

export const MatchmakingModal: React.FC<MatchmakingModalProps> = ({
  isOpen,
  matchType,
  currentCount,
  targetCount = 6,
  elapsedSeconds,
  players,
  matchFoundData,
  onCancel,
  onAutoFillBots,
}) => {
  const [countdown, setCountdown] = useState<number>(3);
  const [isShortLandscape, setIsShortLandscape] = useState(
    () => typeof window !== 'undefined' && (window.innerHeight <= 620 || (window.innerWidth < 768 && window.innerHeight > window.innerWidth))
  );

  useEffect(() => {
    const handleResize = () => {
      setIsShortLandscape(window.innerHeight <= 620 || (window.innerWidth < 768 && window.innerHeight > window.innerWidth));
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  useEffect(() => {
    if (matchFoundData) {
      setCountdown(matchFoundData.countdown || 3);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [matchFoundData]);

  if (!isOpen) return null;

  const isRanked = matchType === 'RANKED';

  // Format mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Divide current players into 2 teams for waiting display
  const redSlots: (QueueMatchedPlayer | null)[] = [null, null, null];
  const blueSlots: (QueueMatchedPlayer | null)[] = [null, null, null];

  if (matchFoundData) {
    matchFoundData.redTeam.forEach((p, idx) => {
      if (idx < 3) redSlots[idx] = p;
    });
    matchFoundData.blueTeam.forEach((p, idx) => {
      if (idx < 3) blueSlots[idx] = p;
    });
  } else {
    players.forEach((p, idx) => {
      if (idx % 2 === 0) {
        const slotIdx = Math.floor(idx / 2);
        if (slotIdx < 3) redSlots[slotIdx] = p;
      } else {
        const slotIdx = Math.floor(idx / 2);
        if (slotIdx < 3) blueSlots[slotIdx] = p;
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div
        className={`w-full max-w-2xl md:max-w-3xl lg:max-w-4xl rounded-2xl md:rounded-3xl border my-auto ${
          isRanked
            ? 'bg-slate-900/95 border-amber-500/50 shadow-2xl shadow-amber-500/20'
            : 'bg-slate-900/95 border-sky-500/50 shadow-2xl shadow-sky-500/20'
        } ${
          isShortLandscape ? 'p-2 sm:p-2.5' : 'p-3 sm:p-4 md:p-5'
        } flex flex-col justify-between relative text-slate-100 font-sans overflow-hidden shadow-2xl`}
      >
        {/* Animated Radar Sweep Background in Top Header */}
        <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 pointer-events-none opacity-15">
          <div
            className={`w-full h-full rounded-full border ${
              isRanked ? 'border-amber-400' : 'border-sky-400'
            } animate-ping [animation-duration:3s]`}
          />
        </div>

        {/* Modal Header: Title, Live Timer, and Close button in single compact bar */}
        <div className={`flex items-center justify-between border-b border-slate-800 relative z-10 ${
          isShortLandscape ? 'pb-1' : 'pb-2 sm:pb-2.5'
        }`}>
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div
              className={`rounded-xl flex items-center justify-center shrink-0 ${
                isShortLandscape ? 'w-6 h-6' : 'w-8 h-8 sm:w-9 sm:h-9'
              } ${
                isRanked
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                  : 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm'
              }`}
            >
              {isRanked ? <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Gamepad2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] sm:text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider text-slate-400 truncate">
                  Ghép Trận 6 Người
                </span>
                <span
                  className={`text-[7.5px] sm:text-[9px] font-mono font-black px-1.5 py-0 rounded-full border shrink-0 ${
                    isRanked
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  }`}
                >
                  {isRanked ? 'ĐẤU RANK 3v3' : 'ĐẤU THƯỜNG 3v3'}
                </span>
              </div>
              <h2 className={`font-black font-mono text-white flex items-center gap-1 truncate ${
                isShortLandscape ? 'text-[11px]' : 'text-xs sm:text-base md:text-lg'
              }`}>
                {matchFoundData ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 animate-spin text-emerald-400" />
                    ĐÃ TÌM THẤY TRẬN! ({countdown}s)
                  </span>
                ) : (
                  <span>ĐANG TÌM CHIẾN BINH (3v3)</span>
                )}
              </h2>
            </div>
          </div>

          {/* Timer & Count & Close in Header */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="flex items-center gap-1 font-mono text-[9px] sm:text-xs bg-slate-950/80 px-2 py-0.5 sm:py-1 rounded-lg border border-slate-800">
              <Clock className="w-3 h-3 text-amber-400 animate-spin [animation-duration:6s]" />
              <span className="text-white font-bold">{formatTime(elapsedSeconds)}</span>
              <span className="text-slate-500 hidden min-[480px]:inline">/ ~00:20</span>
            </div>

            <span
              className={`px-2 py-0.5 rounded-lg font-mono font-black text-[9px] sm:text-xs border ${
                currentCount >= 6
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
              }`}
            >
              {matchFoundData ? '6/6 ĐỦ' : `${currentCount}/${targetCount}`}
            </span>

            {!matchFoundData && (
              <button
                type="button"
                onClick={() => {
                  sounds.playRadioBeep();
                  onCancel();
                }}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700"
                title="Hủy tìm trận"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 6 Players Display: PHE ĐỎ BÊN TRÁI vs PHE XANH BÊN PHẢI (NO SCROLL) */}
        <div className={`grid grid-cols-2 gap-1.5 sm:gap-2.5 relative ${isShortLandscape ? 'my-1' : 'my-1.5 sm:my-2'}`}>
          {/* TEAM RED (Phe Đỏ - BÊN TRÁI) */}
          <div className={`${isShortLandscape ? 'p-1' : 'p-1.5 sm:p-2'} rounded-xl bg-rose-950/30 border border-rose-500/40 shadow-sm flex flex-col justify-between`}>
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-0.5 mb-1 px-0.5">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span className={`font-mono font-black text-rose-400 tracking-wider ${isShortLandscape ? 'text-[8.5px]' : 'text-[10px] sm:text-xs'}`}>
                  🔴 PHE ĐỎ (3 XE)
                </span>
              </div>
              <span className="text-[7.5px] sm:text-[9px] font-mono text-rose-300/80">Tây</span>
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              {redSlots.map((player, idx) => {
                if (player) {
                  const rank = getRankFromRp(player.rankRp || 800);
                  return (
                    <div
                      key={player.id || `red_${idx}`}
                      className={`flex items-center justify-between rounded-lg bg-slate-900/90 border border-rose-500/40 transition-all ${
                        isShortLandscape ? 'p-0.5 sm:p-1' : 'p-1 sm:p-1.5'
                      }`}
                    >
                      <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 truncate">
                        <div className={`${isShortLandscape ? 'w-5 h-5' : 'w-6 h-6 sm:w-7 sm:h-7'} rounded-md bg-rose-900/40 flex items-center justify-center shrink-0 border border-rose-500/30`}>
                          <TankVisual
                            tankClass={player.tankClass}
                            color="#ef4444"
                            size={isShortLandscape ? 16 : 22}
                          />
                        </div>
                        <div className="min-w-0 truncate text-left">
                          <div className={`font-bold text-white truncate flex items-center gap-1 font-mono ${
                            isShortLandscape ? 'text-[8.5px]' : 'text-[9.5px] sm:text-xs'
                          }`}>
                            <span className="truncate">{player.name}</span>
                            {player.isBot && (
                              <span className="text-[6.5px] sm:text-[7.5px] px-1 py-0 rounded bg-slate-800 text-slate-400 font-bold shrink-0">
                                BOT
                              </span>
                            )}
                          </div>
                          <div className="text-[7px] sm:text-[8px] font-mono text-rose-300 flex items-center gap-1">
                            <span>{rank.badge}</span>
                            {isRanked && <span>• {rank.rp} RP</span>}
                          </div>
                        </div>
                      </div>
                      <span className={`font-mono font-bold text-emerald-400 bg-emerald-950/60 px-1 sm:px-1.5 py-0.2 rounded border border-emerald-500/40 shrink-0 ${
                        isShortLandscape ? 'text-[6.5px]' : 'text-[7.5px] sm:text-[9px]'
                      }`}>
                        SẴN SÀNG
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={`red_empty_${idx}`}
                    className={`flex items-center justify-between rounded-lg bg-slate-950/40 border border-slate-800/80 border-dashed text-slate-500 font-mono ${
                      isShortLandscape ? 'p-0.5 sm:p-1' : 'p-1 sm:p-1.5'
                    }`}
                  >
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <div className={`${isShortLandscape ? 'w-5 h-5' : 'w-6 h-6 sm:w-7 sm:h-7'} rounded-md bg-slate-900/40 border border-slate-800 flex items-center justify-center text-slate-600`}>
                        <Users className={isShortLandscape ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                      </div>
                      <span className="text-[8px] sm:text-[9.5px] animate-pulse">Đang tìm...</span>
                    </div>
                    <span className="text-[7px] sm:text-[8px] text-slate-600">Trống</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* VS Centered Emblem Floating Badge */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <span className="font-mono font-black text-[9px] sm:text-[11px] px-2 py-0.5 rounded-full bg-slate-950 border border-amber-500/60 text-amber-300 shadow-xl">
              VS
            </span>
          </div>

          {/* TEAM BLUE (Phe Xanh - BÊN PHẢI) */}
          <div className={`${isShortLandscape ? 'p-1' : 'p-1.5 sm:p-2'} rounded-xl bg-sky-950/30 border border-sky-500/40 shadow-sm flex flex-col justify-between`}>
            <div className="flex items-center justify-between border-b border-sky-500/20 pb-0.5 mb-1 px-0.5">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                <span className={`font-mono font-black text-sky-400 tracking-wider ${isShortLandscape ? 'text-[8.5px]' : 'text-[10px] sm:text-xs'}`}>
                  🔵 PHE XANH (3 XE)
                </span>
              </div>
              <span className="text-[7.5px] sm:text-[9px] font-mono text-sky-300/80">Đông</span>
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              {blueSlots.map((player, idx) => {
                if (player) {
                  const rank = getRankFromRp(player.rankRp || 800);
                  return (
                    <div
                      key={player.id || `blue_${idx}`}
                      className={`flex items-center justify-between rounded-lg bg-slate-900/90 border border-sky-500/40 transition-all ${
                        isShortLandscape ? 'p-0.5 sm:p-1' : 'p-1 sm:p-1.5'
                      }`}
                    >
                      <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 truncate">
                        <div className={`${isShortLandscape ? 'w-5 h-5' : 'w-6 h-6 sm:w-7 sm:h-7'} rounded-md bg-sky-900/40 flex items-center justify-center shrink-0 border border-sky-500/30`}>
                          <TankVisual
                            tankClass={player.tankClass}
                            color="#3b82f6"
                            size={isShortLandscape ? 16 : 22}
                          />
                        </div>
                        <div className="min-w-0 truncate text-left">
                          <div className={`font-bold text-white truncate flex items-center gap-1 font-mono ${
                            isShortLandscape ? 'text-[8.5px]' : 'text-[9.5px] sm:text-xs'
                          }`}>
                            <span className="truncate">{player.name}</span>
                            {player.isBot && (
                              <span className="text-[6.5px] sm:text-[7.5px] px-1 py-0 rounded bg-slate-800 text-slate-400 font-bold shrink-0">
                                BOT
                              </span>
                            )}
                          </div>
                          <div className="text-[7px] sm:text-[8px] font-mono text-sky-300 flex items-center gap-1">
                            <span>{rank.badge}</span>
                            {isRanked && <span>• {rank.rp} RP</span>}
                          </div>
                        </div>
                      </div>
                      <span className={`font-mono font-bold text-emerald-400 bg-emerald-950/60 px-1 sm:px-1.5 py-0.2 rounded border border-emerald-500/40 shrink-0 ${
                        isShortLandscape ? 'text-[6.5px]' : 'text-[7.5px] sm:text-[9px]'
                      }`}>
                        SẴN SÀNG
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={`blue_empty_${idx}`}
                    className={`flex items-center justify-between rounded-lg bg-slate-950/40 border border-slate-800/80 border-dashed text-slate-500 font-mono ${
                      isShortLandscape ? 'p-0.5 sm:p-1' : 'p-1 sm:p-1.5'
                    }`}
                  >
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <div className={`${isShortLandscape ? 'w-5 h-5' : 'w-6 h-6 sm:w-7 sm:h-7'} rounded-md bg-slate-900/40 border border-slate-800 flex items-center justify-center text-slate-600`}>
                        <Users className={isShortLandscape ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                      </div>
                      <span className="text-[8px] sm:text-[9.5px] animate-pulse">Đang tìm...</span>
                    </div>
                    <span className="text-[7px] sm:text-[8px] text-slate-600">Trống</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions: Compact bottom bar */}
        <div className={`border-t border-slate-800 flex items-center justify-between gap-2 ${
          isShortLandscape ? 'pt-1' : 'pt-2 sm:pt-2.5'
        }`}>
          <div className="text-[8px] sm:text-[10px] md:text-xs text-slate-400 font-mono flex items-center gap-1 truncate">
            <Zap className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">Tự động xung trận khi đủ 6 người (3v3).</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!matchFoundData && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[9px] sm:text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>PvP 100% • Chỉ Người Chơi</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                sounds.playRadioBeep();
                onCancel();
              }}
              className={`rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-mono font-bold transition-all border border-rose-500/40 flex items-center justify-center gap-1 cursor-pointer shadow-md ${
                isShortLandscape ? 'px-2.5 py-0.5 text-[8.5px]' : 'px-3.5 py-1 sm:py-1.5 text-[10px] sm:text-xs'
              }`}
            >
              <X className="w-3 h-3" />
              <span>HỦY</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
