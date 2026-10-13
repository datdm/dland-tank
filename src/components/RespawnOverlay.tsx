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
  const [isShortLandscape, setIsShortLandscape] = React.useState(
    () => typeof window !== 'undefined' && window.innerHeight <= 620 && window.innerWidth > window.innerHeight
  );

  React.useEffect(() => {
    const handleResize = () => {
      setIsShortLandscape(window.innerHeight <= 620 && window.innerWidth > window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40 bg-red-950/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-300 pointer-events-auto select-none overflow-y-auto">
      <div className={`bg-slate-900/95 border border-rose-500/50 rounded-2xl md:rounded-3xl ${
        isShortLandscape ? 'p-3 max-w-xs space-y-1.5 max-h-[82vh]' : 'p-4 sm:p-6 md:p-8 max-w-sm md:max-w-md space-y-3 max-h-[85vh]'
      } w-full text-center shadow-2xl shadow-rose-950/50 my-auto overflow-y-auto custom-scrollbar`}>
        <div className={`${
          isShortLandscape ? 'w-8 h-8' : 'w-10 h-10 sm:w-12 md:w-16 sm:h-12 md:h-16 mb-2 sm:mb-3'
        } mx-auto rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center`}>
          <Skull className={`${isShortLandscape ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 md:w-8 sm:h-6 md:h-8'} text-rose-500`} />
        </div>

        <div>
          <h2 className={`${isShortLandscape ? 'text-sm' : 'text-base sm:text-2xl md:text-3xl'} font-black text-white tracking-tight`}>
            XE TĂNG ĐÃ BỊ PHÁ HỦY
          </h2>
          <p className={`${isShortLandscape ? 'text-[9.5px]' : 'text-[11px] sm:text-xs md:text-sm'} text-slate-400 mt-0.5`}>
            Đang chuẩn bị xe tăng mới để tái xuất chiến trường...
          </p>
        </div>

        <div className={`flex justify-center gap-4 sm:gap-6 md:gap-8 ${
          isShortLandscape ? 'my-1.5 py-1 text-xs' : 'my-2.5 sm:my-3.5 md:my-5 py-2 sm:py-2.5 md:py-3.5'
        } bg-slate-950/60 rounded-xl md:rounded-2xl border border-slate-800`}>
          <div>
            <div className={`${isShortLandscape ? 'text-[8.5px]' : 'text-[10px] sm:text-xs md:text-sm'} uppercase tracking-wider text-slate-500`}>Hạ Gục</div>
            <div className={`${isShortLandscape ? 'text-sm' : 'text-base sm:text-lg md:text-2xl'} font-mono font-bold text-emerald-400 tabular-nums`}>{kills}</div>
          </div>
          <div className="w-px bg-slate-800" />
          <div>
            <div className={`${isShortLandscape ? 'text-[8.5px]' : 'text-[10px] sm:text-xs md:text-sm'} uppercase tracking-wider text-slate-500`}>Tổng Điểm</div>
            <div className={`${isShortLandscape ? 'text-sm' : 'text-base sm:text-lg md:text-2xl'} font-mono font-bold text-white tabular-nums`}>{score}</div>
          </div>
        </div>

        <div className={`${isShortLandscape ? 'text-[10px] my-1' : 'mb-2.5 sm:mb-3.5 md:mb-5 text-xs sm:text-sm md:text-base'} font-mono text-amber-400`}>
          Hồi sinh sau: <strong className={`${isShortLandscape ? 'text-xs' : 'text-base sm:text-lg md:text-xl'} font-bold`}>{Math.max(1, Math.ceil(countdown))}s</strong>
        </div>

        <div className={`${isShortLandscape ? 'space-y-1' : 'space-y-1.5 sm:space-y-2 md:space-y-3'}`}>
          <button
            onClick={onRespawn}
            className={`w-full flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold ${
              isShortLandscape ? 'py-1.5 text-[10.5px] rounded-lg' : 'py-2 sm:py-2.5 md:py-3.5 px-3 sm:px-4 rounded-xl md:rounded-2xl text-xs sm:text-sm md:text-base'
            } shadow-lg transition-transform active:scale-95 cursor-pointer uppercase tracking-wider`}
          >
            <RotateCcw className={isShortLandscape ? 'w-3 h-3' : 'w-4 h-4 md:w-5 md:h-5'} />
            Hồi Sinh Ngay
          </button>

          {onSwitchToSpectator && (
            <button
              onClick={onSwitchToSpectator}
              className={`w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white font-semibold ${
                isShortLandscape ? 'py-1 text-[9.5px] rounded-lg' : 'py-1.5 sm:py-2 md:py-3 px-3 sm:px-4 rounded-xl md:rounded-2xl text-[10px] sm:text-xs md:text-sm'
              } border border-sky-500/30 transition-colors cursor-pointer uppercase tracking-wider`}
            >
              <Eye className={isShortLandscape ? 'w-3 h-3 text-sky-400' : 'w-3.5 h-3.5 md:w-4 md:h-4 text-sky-400'} />
              Xem Trận (Khán Giả)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
