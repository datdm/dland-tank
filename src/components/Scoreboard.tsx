import React from 'react';
import { LeaderboardEntry } from '../types/game';
import { Trophy, Shield, Zap, Flame, X } from 'lucide-react';

interface ScoreboardProps {
  entries: LeaderboardEntry[];
  myPlayerId: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onHide?: () => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  entries,
  myPlayerId,
  isExpanded,
  onToggleExpand,
  onHide,
}) => {
  const top5 = entries.slice(0, 5);

  return (
    <>
      {/* Compact HUD View (Top Right) */}
      <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/70 rounded-xl p-3 text-white shadow-xl min-w-[210px] select-none">
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Bảng Điểm
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleExpand}
              className="text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700"
              title="Nhấn phím TAB để mở toàn bộ"
            >
              {isExpanded ? 'Đóng' : 'TAB'}
            </button>
            {onHide && (
              <button
                onClick={onHide}
                className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors cursor-pointer p-0.5 rounded hover:bg-slate-800"
                title="Ẩn bảng điểm (Phím L)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-2 space-y-1.5 text-xs">
          {top5.map((entry, index) => {
            const isMe = entry.id === myPlayerId;
            return (
              <div
                key={`${entry.id}_${index}`}
                className={`flex items-center justify-between px-2 py-1 rounded transition-colors ${
                  isMe
                    ? 'bg-sky-500/20 border border-sky-500/40 text-sky-200 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span
                    className={`w-4 text-center font-mono font-bold text-[11px] ${
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
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="truncate max-w-[95px] flex items-center gap-1">
                    {entry.isBot ? (
                      <span className="text-slate-400">[AI] {entry.name}</span>
                    ) : (
                      <span className="text-emerald-300 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        {entry.name}
                      </span>
                    )}
                  </span>
                  {entry.streak >= 3 && (
                    <span className="flex items-center text-[10px] text-orange-400 font-bold">
                      <Flame className="w-2.5 h-2.5" />
                      {entry.streak}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums shrink-0">
                  <span className="text-emerald-400 font-bold">{entry.kills}K</span>
                  <span className="text-slate-500">/</span>
                  <span className="text-slate-400 font-medium">{entry.score}đ</span>
                </div>
              </div>
            );
          })}
          {top5.length === 0 && (
            <div className="text-slate-500 text-center py-2 italic text-[11px]">
              Đang kết nối chiến trường...
            </div>
          )}
        </div>
      </div>

      {/* Expanded Modal (Press TAB or click button) */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white">
                <Trophy className="w-6 h-6 text-amber-400" />
                <h2 className="text-lg font-bold tracking-tight">Bảng Xếp Hạng Phòng Công Cộng</h2>
                <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {entries.length} người chơi
                </span>
              </div>
              <button
                onClick={onToggleExpand}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3">Hạng</th>
                    <th className="py-2.5 px-3">Chỉ Huy</th>
                    <th className="py-2.5 px-3">Lớp Xe</th>
                    <th className="py-2.5 px-3 text-center">Hạ Gục</th>
                    <th className="py-2.5 px-3 text-center">Bị Hạ</th>
                    <th className="py-2.5 px-3 text-center">Chuỗi</th>
                    <th className="py-2.5 px-3 text-right">Tổng Điểm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {entries.map((p, idx) => {
                    const isMe = p.id === myPlayerId;
                    return (
                      <tr
                        key={`${p.id}_${idx}`}
                        className={`transition-colors ${
                          isMe
                            ? 'bg-sky-500/15 text-sky-100 font-semibold'
                            : 'hover:bg-slate-800/30'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono font-bold">
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
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                              style={{ backgroundColor: p.color }}
                            />
                            <span className={!p.isBot ? 'font-bold text-white' : 'text-slate-300'}>
                              {p.isBot ? `[AI] ${p.name}` : p.name}
                            </span>
                            {!p.isBot && !isMe && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                ONLINE
                              </span>
                            )}
                            {isMe && (
                              <span className="text-[10px] bg-sky-500/20 text-sky-400 border border-sky-500/40 px-1.5 py-0.2 rounded font-bold">
                                BẠN
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-400">
                          {p.tankClass === 'STRIKER'
                            ? 'Chiến Binh'
                            : p.tankClass === 'SCOUT'
                            ? 'Trinh Sát'
                            : 'Thiết Giáp'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-emerald-400 font-bold tabular-nums">
                          {p.kills}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-rose-400 tabular-nums">
                          {p.deaths}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-amber-400 tabular-nums">
                          {p.streak > 0 ? `${p.streak}🔥` : '0'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white tabular-nums">
                          {p.score}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center">
              <span>Mẹo: Nhấn phím TAB để đóng / mở bảng điểm bất cứ lúc nào.</span>
              <button
                onClick={onToggleExpand}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer text-xs"
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
