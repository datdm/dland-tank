import React from 'react';
import { RotateCcw, Skull, Eye } from 'lucide-react';

interface RespawnOverlayProps {
  countdown: number;
  onRespawn: () => void;
  kills: number;
  score: number;
  onSwitchToSpectator?: () => void;
}

export const RespawnOverlay: React.FC<RespawnOverlayProps> = ({
  countdown,
  onRespawn,
  kills,
  score,
  onSwitchToSpectator,
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-red-950/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300 pointer-events-auto">
      <div className="bg-slate-900/95 border border-rose-500/50 rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl shadow-rose-950/50">
        <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-4">
          <Skull className="w-7 h-7 text-rose-500" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          XE TĂNG ĐÃ BỊ PHÁ HỦY
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Đang chuẩn bị xe tăng mới để tái xuất chiến trường...
        </p>

        <div className="flex justify-center gap-6 my-4 py-3 bg-slate-950/60 rounded-xl border border-slate-800">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500">Hạ Gục</div>
            <div className="text-lg font-mono font-bold text-emerald-400 tabular-nums">{kills}</div>
          </div>
          <div className="w-px bg-slate-800" />
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500">Tổng Điểm</div>
            <div className="text-lg font-mono font-bold text-white tabular-nums">{score}</div>
          </div>
        </div>

        <div className="mb-4 text-sm font-mono text-amber-400">
          Hồi sinh tự động sau: <strong className="text-lg font-bold">{Math.max(1, Math.ceil(countdown))}s</strong>
        </div>

        <div className="space-y-2">
          <button
            onClick={onRespawn}
            className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer text-sm uppercase tracking-wider"
          >
            <RotateCcw className="w-4 h-4" />
            Hồi Sinh Ngay
          </button>

          {onSwitchToSpectator && (
            <button
              onClick={onSwitchToSpectator}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white font-semibold py-2.5 px-4 rounded-xl border border-sky-500/30 transition-colors cursor-pointer text-xs uppercase tracking-wider"
            >
              <Eye className="w-4 h-4 text-sky-400" />
              Chuyển Sang Xem Trận (Khán Giả)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
