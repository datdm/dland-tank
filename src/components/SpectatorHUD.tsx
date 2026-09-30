import React from 'react';
import { PlayerTank } from '../types/game';
import { Eye, ChevronLeft, ChevronRight, Video, Swords, Shield, Zap, Crosshair } from 'lucide-react';

interface SpectatorHUDProps {
  tanks: PlayerTank[];
  spectatorTargetId: string | 'free';
  onSelectTarget: (id: string | 'free') => void;
  onJoinBattle: () => void;
}

export const SpectatorHUD: React.FC<SpectatorHUDProps> = ({
  tanks,
  spectatorTargetId,
  onSelectTarget,
  onJoinBattle,
}) => {
  const aliveTanks = tanks.filter((t) => !t.isDead);
  const currentTargetTank = aliveTanks.find((t) => t.id === spectatorTargetId);

  const handleNextTarget = () => {
    if (aliveTanks.length === 0) {
      onSelectTarget('free');
      return;
    }
    if (spectatorTargetId === 'free' || !currentTargetTank) {
      onSelectTarget(aliveTanks[0].id);
      return;
    }
    const currentIndex = aliveTanks.findIndex((t) => t.id === spectatorTargetId);
    const nextIndex = (currentIndex + 1) % aliveTanks.length;
    onSelectTarget(aliveTanks[nextIndex].id);
  };

  const handlePrevTarget = () => {
    if (aliveTanks.length === 0) {
      onSelectTarget('free');
      return;
    }
    if (spectatorTargetId === 'free' || !currentTargetTank) {
      onSelectTarget(aliveTanks[aliveTanks.length - 1].id);
      return;
    }
    const currentIndex = aliveTanks.findIndex((t) => t.id === spectatorTargetId);
    const prevIndex = (currentIndex - 1 + aliveTanks.length) % aliveTanks.length;
    onSelectTarget(aliveTanks[prevIndex].id);
  };

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex flex-col items-center gap-2 max-w-2xl w-[94%] sm:w-auto">
      {/* Spectator Top Badge & Mode Indicator */}
      <div className="flex items-center gap-2 bg-slate-950/90 border border-sky-500/50 px-3.5 py-1 rounded-full shadow-2xl backdrop-blur-md text-xs">
        <div className="flex items-center gap-1.5 text-sky-400 font-bold font-mono">
          <Eye className="w-4 h-4 text-sky-400 animate-pulse" />
          <span>CHẾ ĐỘ KHÁN GIẢ (XEM TRẬN)</span>
        </div>
        <span className="text-slate-600">•</span>
        <span className="text-slate-300 font-mono text-[11px]">
          {aliveTanks.length} Xe Đang Chiến Đấu
        </span>
      </div>

      {/* Main Spectator Control Box */}
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 shadow-2xl backdrop-blur-md flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 w-full">
        {/* Navigation / Target Selector */}
        <div className="flex items-center gap-1.5 flex-1 min-w-[240px]">
          <button
            type="button"
            onClick={handlePrevTarget}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700 shadow-sm shrink-0"
            title="Xem xe tăng phía trước (Phím Q / Mũi tên trái)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Target Info Plate */}
          <div className="flex-1 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl min-w-0">
            {spectatorTargetId === 'free' || !currentTargetTank ? (
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="truncate">
                  <div className="font-bold text-xs text-amber-300">Camera Tự Do</div>
                  <div className="text-[10px] text-slate-400 truncate">Dùng phím WASD / Mũi tên để di chuyển góc nhìn</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 border border-white/40 shadow-sm"
                    style={{ backgroundColor: currentTargetTank.color }}
                  />
                  <div className="truncate">
                    <div className="font-bold text-xs text-white truncate flex items-center gap-1.5">
                      <span>{currentTargetTank.name}</span>
                      {currentTargetTank.isBot && (
                        <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1 rounded font-mono">
                          BOT
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 font-mono">
                      <span>{currentTargetTank.kills} Kills</span>
                      <span>•</span>
                      <span>{currentTargetTank.score} Điểm</span>
                    </div>
                  </div>
                </div>

                {/* Health Bar */}
                <div className="w-20 shrink-0 text-right">
                  <div className="text-[10px] font-mono text-emerald-400 font-bold">
                    {Math.ceil(currentTargetTank.hp)} HP
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-0.5">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-200"
                      style={{ width: `${Math.max(0, Math.min(100, (currentTargetTank.hp / currentTargetTank.maxHp) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleNextTarget}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700 shadow-sm shrink-0"
            title="Xem xe tăng kế tiếp (Phím E / Mũi tên phải)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Free-Roam Toggle & Join Battle CTA */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => onSelectTarget(spectatorTargetId === 'free' ? (aliveTanks[0]?.id || 'free') : 'free')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              spectatorTargetId === 'free'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>{spectatorTargetId === 'free' ? 'Khóa Camera' : 'Camera Tự Do'}</span>
          </button>

          <button
            type="button"
            onClick={onJoinBattle}
            className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-sky-600/30 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <Swords className="w-3.5 h-3.5" />
            <span>THAM CHIẾN NGAY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
