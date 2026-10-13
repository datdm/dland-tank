import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types/game';
import { Trophy, Flame, X } from 'lucide-react';

interface ScoreboardProps {
  entries: LeaderboardEntry[];
  myPlayerId: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onHide?: () => void;
  isShortLandscape?: boolean;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  entries,
  myPlayerId,
  isExpanded,
  onToggleExpand,
  onHide,
  isShortLandscape: propShortLandscape,
}) => {
  const [internalShortLandscape, setInternalShortLandscape] = useState(
    () => typeof window !== 'undefined' && window.innerHeight <= 620 && window.innerWidth > window.innerHeight
  );

  useEffect(() => {
    const handleResize = () => {
      setInternalShortLandscape(window.innerHeight <= 620 && window.innerWidth > window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const isShortLandscape = propShortLandscape !== undefined ? propShortLandscape : internalShortLandscape;

  // On mobile landscape, show top 3 to keep screen clear
  const maxEntries = isShortLandscape ? 3 : 5;
  const topList = entries.slice(0, maxEntries);

  return (
    <>
      {/* Compact HUD View (Top Right) */}
      <div
        className={`bg-slate-900/85 backdrop-blur-md border border-slate-700/70 text-white shadow-xl select-none ${
          isShortLandscape
            ? 'p-1.5 rounded-lg min-w-[135px] max-w-[165px]'
            : 'p-2.5 sm:p-3 md:p-3.5 rounded-xl min-w-[200px] md:min-w-[260px]'
        }`}
      >
        <div className={`flex items-center justify-between gap-2 border-b border-slate-800 ${isShortLandscape ? 'pb-1' : 'pb-2 md:pb-2.5'}`}>
          <div
            className={`flex items-center gap-1 md:gap-1.5 font-bold uppercase tracking-wider text-amber-400 font-mono ${
              isShortLandscape ? 'text-[10px]' : 'text-xs md:text-sm'
            }`}
          >
            <Trophy className={isShortLandscape ? 'w-3 h-3 text-amber-400' : 'w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400'} />
            <span>Bảng Điểm</span>
          </div>
          <div className="flex items-center gap-1 md:gap-1.5">
            <button
              onClick={onToggleExpand}
              className={`${
                isShortLandscape ? 'text-[9px] px-1 py-0.2' : 'text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1'
              } text-slate-400 hover:text-white transition-colors cursor-pointer rounded bg-slate-800 hover:bg-slate-700 font-mono`}
              title="Nhấn phím TAB để mở toàn bộ"
            >
              {isExpanded ? 'Đóng' : 'TAB'}
            </button>
            {onHide && (
              <button
                onClick={onHide}
                className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer p-0.5 md:p-1 rounded hover:bg-slate-800"
                title="Ẩn bảng điểm (Phím L)"
              >
                <X className={isShortLandscape ? 'w-3 h-3' : 'w-3.5 h-3.5 md:w-4 md:h-4'} />
              </button>
            )}
          </div>
        </div>

        <div className={`mt-1 ${isShortLandscape ? 'space-y-0.5' : 'space-y-1 md:space-y-1.5 text-xs md:text-sm'}`}>
          {topList.map((entry, index) => {
            const isMe = entry.id === myPlayerId;
            return (
              <div
                key={`${entry.id}_${index}`}
                className={`flex items-center justify-between rounded transition-colors ${
                  isShortLandscape ? 'px-1 py-0.5 text-[9px]' : 'px-2 md:px-2.5 py-1 md:py-1.5 text-xs md:text-sm'
                } ${
                  isMe
                    ? 'bg-sky-500/20 border border-sky-500/40 text-sky-200 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-1.5 md:gap-2 truncate pr-1">
                  <span
                    className={`w-3.5 md:w-4 text-center font-mono font-bold ${
                      isShortLandscape ? 'text-[9px]' : 'text-[11px] md:text-xs'
                    } ${
                      index === 0
                        ? 'text-amber-400'
                        : index === 1
                        ? 'text-slate-300'
                        : index === 2
                        ? 'text-amber-600'
                        : 'text-slate-500'
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <span
                    className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className={`truncate ${isShortLandscape ? 'max-w-[65px]' : 'max-w-[95px] md:max-w-[130px]'} flex items-center gap-1`}>
                    {entry.isBot ? (
                      <span className="text-slate-400">{isShortLandscape ? entry.name : `[AI] ${entry.name}`}</span>
                    ) : (
                      <span className="text-emerald-300 font-semibold truncate">
                        {entry.name}
                      </span>
                    )}
                  </span>
                  {entry.streak >= 3 && !isShortLandscape && (
                    <span className="flex items-center text-[10px] md:text-xs text-orange-400 font-bold">
                      <Flame className="w-2.5 h-2.5 md:w-3 md:h-3" />
                      {entry.streak}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 font-mono tabular-nums shrink-0">
                  <span className="text-emerald-400 font-bold">{entry.kills}K</span>
                  {!isShortLandscape && (
                    <>
                      <span className="text-slate-500">/</span>
                      <span className="text-slate-400 font-medium">{entry.score}đ</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {topList.length === 0 && (
            <div className={`text-slate-500 text-center italic ${isShortLandscape ? 'py-1 text-[9px]' : 'py-2 text-[11px] md:text-xs'}`}>
              Đang kết nối...
            </div>
          )}
        </div>
      </div>

      {/* Expanded Modal (Press TAB or click button) */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150 select-none">
          <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl md:rounded-3xl w-full max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[82vh] sm:max-h-[85vh] shadow-2xl overflow-hidden flex flex-col my-auto">
            <div className={`shrink-0 flex items-center justify-between border-b border-slate-800 bg-slate-900/95 ${isShortLandscape ? 'p-2 sm:p-2.5' : 'p-3 sm:p-4 md:p-5'}`}>
              <div className="flex items-center gap-1.5 md:gap-3 text-white">
                <Trophy className={`${isShortLandscape ? 'w-3.5 h-3.5' : 'w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6'} text-amber-400`} />
                <h2 className={`font-black tracking-tight font-mono ${isShortLandscape ? 'text-[11px]' : 'text-xs sm:text-base md:text-lg'}`}>Bảng Xếp Hạng Phòng Đấu</h2>
                <span className="text-[8px] sm:text-[10px] md:text-xs text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded font-mono">
                  {entries.length} người chơi
                </span>
              </div>
              <button
                onClick={onToggleExpand}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className={isShortLandscape ? 'w-3.5 h-3.5' : 'w-4 h-4 sm:w-5 sm:h-5'} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 sm:p-4 custom-scrollbar">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-slate-300 font-sans">
                  <thead>
                    <tr className={`border-b border-slate-800 uppercase tracking-wider text-slate-400 font-mono ${
                    isShortLandscape ? 'text-[7.5px]' : 'text-[9px] sm:text-xs md:text-sm'
                  }`}>
                    <th className={isShortLandscape ? 'py-0.5 px-1' : 'py-1.5 md:py-2 px-2 md:px-3'}>Hạng</th>
                    <th className={isShortLandscape ? 'py-0.5 px-1' : 'py-1.5 md:py-2 px-2 md:px-3'}>Chỉ Huy</th>
                    <th className={isShortLandscape ? 'py-0.5 px-1' : 'py-1.5 md:py-2 px-2 md:px-3'}>Lớp Xe</th>
                    <th className={`${isShortLandscape ? 'py-0.5 px-1' : 'py-1.5 md:py-2 px-2 md:px-3'} text-center`}>Hạ Gục</th>
                    <th className={`${isShortLandscape ? 'py-0.5 px-1' : 'py-1.5 md:py-2 px-2 md:px-3'} text-center`}>Bị Hạ</th>
                    <th className={`${isShortLandscape ? 'py-0.5 px-1' : 'py-1.5 md:py-2 px-2 md:px-3'} text-center`}>Chuỗi</th>
                    <th className={`${isShortLandscape ? 'py-0.5 px-1' : 'py-1.5 md:py-2 px-2 md:px-3'} text-right`}>Tổng Điểm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {entries.map((p, idx) => {
                    const isMe = p.id === myPlayerId;
                    return (
                      <tr
                        key={`${p.id}_${idx}`}
                        className={`transition-colors ${
                          isShortLandscape ? 'text-[8.5px]' : 'text-[10px] sm:text-xs md:text-sm'
                        } ${
                          isMe
                            ? 'bg-sky-500/15 text-sky-100 font-semibold'
                            : 'hover:bg-slate-800/30'
                        }`}
                      >
                        <td className={`${isShortLandscape ? 'py-0.5 px-1' : 'py-1 sm:py-1.5 md:py-2 px-2 md:px-3'} font-mono font-bold`}>
                          <span
                            className={
                              idx === 0
                                ? 'text-amber-400'
                                : idx === 1
                                ? 'text-slate-200'
                                : idx === 2
                                ? 'text-amber-600'
                                : 'text-slate-500'
                            }
                          >
                            #{idx + 1}
                          </span>
                        </td>
                        <td className={isShortLandscape ? 'py-0.5 px-1' : 'py-1 sm:py-1.5 md:py-2 px-2 md:px-3'}>
                          <div className="flex items-center gap-1 md:gap-2">
                            <span
                              className={`${isShortLandscape ? 'w-1.5 h-1.5' : 'w-2 h-2 sm:w-2.5 sm:h-2.5'} rounded-full shrink-0 shadow-sm`}
                              style={{ backgroundColor: p.color }}
                            />
                            <span className={!p.isBot ? 'font-bold text-white truncate max-w-[80px] sm:max-w-none' : 'text-slate-300 truncate max-w-[80px] sm:max-w-none'}>
                              {p.isBot ? (isShortLandscape ? p.name : `[AI] ${p.name}`) : p.name}
                            </span>
                            {!p.isBot && !isMe && (
                              <span className="text-[7px] sm:text-[8px] md:text-[9.5px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1 py-0.1 rounded font-bold hidden sm:inline-flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                                ONLINE
                              </span>
                            )}
                            {isMe && (
                              <span className="text-[7px] sm:text-[8px] md:text-[9.5px] bg-sky-500/20 text-sky-400 border border-sky-500/40 px-1 py-0.1 rounded font-bold">
                                BẠN
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`${isShortLandscape ? 'py-0.5 px-1 text-[8px]' : 'py-1 sm:py-1.5 md:py-2 px-2 md:px-3 text-[9.5px] sm:text-xs'} text-slate-400`}>
                          {p.tankClass === 'STRIKER'
                            ? 'Chiến Binh'
                            : p.tankClass === 'SCOUT'
                            ? 'Trinh Sát'
                            : 'Thiết Giáp'}
                        </td>
                        <td className={`${isShortLandscape ? 'py-0.5 px-1' : 'py-1 sm:py-1.5 md:py-2 px-2 md:px-3'} text-center font-mono text-emerald-400 font-bold tabular-nums`}>
                          {p.kills}
                        </td>
                        <td className={`${isShortLandscape ? 'py-0.5 px-1' : 'py-1 sm:py-1.5 md:py-2 px-2 md:px-3'} text-center font-mono text-rose-400 tabular-nums`}>
                          {p.deaths}
                        </td>
                        <td className={`${isShortLandscape ? 'py-0.5 px-1' : 'py-1 sm:py-1.5 md:py-2 px-2 md:px-3'} text-center font-mono text-amber-400 tabular-nums`}>
                          {p.streak > 0 ? `${p.streak}🔥` : '0'}
                        </td>
                        <td className={`${isShortLandscape ? 'py-0.5 px-1' : 'py-1 sm:py-1.5 md:py-2 px-2 md:px-3'} text-right font-mono font-bold text-white tabular-nums`}>
                          {p.score}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

            <div className={`shrink-0 border-t border-slate-800 bg-slate-950/90 text-slate-400 flex justify-between items-center ${
              isShortLandscape ? 'p-2 text-[8.5px]' : 'p-3 sm:p-4 text-[10px] sm:text-xs'
            }`}>
              <span>Nhấn TAB để đóng / mở bảng điểm</span>
              <button
                onClick={onToggleExpand}
                className={`rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer font-bold font-mono ${
                  isShortLandscape ? 'px-2 py-0.5 text-[9.5px]' : 'px-3 py-1 text-xs md:text-sm'
                }`}
              >
                Trở lại trận đấu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
