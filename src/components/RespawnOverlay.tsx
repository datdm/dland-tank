import React, { useState, useEffect } from 'react';
import { RotateCcw, Skull, Eye, Check, ShieldAlert } from 'lucide-react';
import { BulletModifier, AMMO_TYPES, AMMO_CONFIGS } from '../types/game';
import { sounds } from '../utils/audio';
import { haptics } from '../utils/haptics';

interface RespawnOverlayProps {
  countdown: number;
  onRespawn: (chosenAmmo: BulletModifier) => void;
  kills: number;
  score: number;
  currentAmmo?: BulletModifier;
  hasOtherAliveTanks?: boolean;
  onSwitchToSpectator?: () => void;
}

export const RespawnOverlay: React.FC<RespawnOverlayProps> = ({
  countdown,
  onRespawn,
  kills,
  score,
  currentAmmo = 'STANDARD',
  hasOtherAliveTanks = true,
  onSwitchToSpectator,
}) => {
  const [selectedAmmo, setSelectedAmmo] = useState<BulletModifier>(currentAmmo);
  const [isShortLandscape, setIsShortLandscape] = useState(
    () => typeof window !== 'undefined' && window.innerHeight <= 620 && window.innerWidth > window.innerHeight
  );

  useEffect(() => {
    if (currentAmmo) {
      setSelectedAmmo(currentAmmo);
    }
  }, [currentAmmo]);

  useEffect(() => {
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

  const handleSelectAmmo = (ammo: BulletModifier) => {
    setSelectedAmmo(ammo);
    sounds.playPowerUp();
    haptics.light();
  };

  const handleConfirmRespawn = () => {
    sounds.playShoot();
    haptics.medium();
    onRespawn(selectedAmmo);
  };

  const activeCfg = AMMO_CONFIGS[selectedAmmo] || AMMO_CONFIGS.STANDARD;

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 pointer-events-auto select-none overflow-y-auto">
      <div
        className={`bg-slate-900/95 border-2 border-rose-500/60 rounded-2xl md:rounded-3xl ${
          isShortLandscape
            ? 'p-2.5 max-w-lg space-y-1.5 max-h-[96dvh]'
            : 'p-4 sm:p-5 max-w-xl space-y-2.5 sm:space-y-3 max-h-[92dvh]'
        } w-full text-center shadow-2xl shadow-rose-950/80 my-auto overflow-y-auto custom-scrollbar flex flex-col`}
      >
        {/* Header: Skull, Notice & Stats */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
              <Skull className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-white font-mono tracking-wide uppercase">
                XE TĂNG BỊ HẠ GỤC
              </h2>
              <p className="text-[10px] text-slate-400">
                Hồi sinh sau: <strong className="text-amber-400 font-bold">{Math.max(1, Math.ceil(countdown))}s</strong>
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-3 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800 font-mono text-[10px] sm:text-xs">
            <div>
              <span className="text-slate-500 mr-1">Hạ gục:</span>
              <strong className="text-emerald-400">{kills}</strong>
            </div>
            <div className="w-px h-3 bg-slate-800" />
            <div>
              <span className="text-slate-500 mr-1">Điểm:</span>
              <strong className="text-amber-400">{score}</strong>
            </div>
          </div>
        </div>

        {/* Section: CHỌN 1 LOẠI ĐẠN DUY NHẤT CHO HIỆP ĐẤU TIẾP THEO */}
        <div className="space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            <div className="text-[11px] sm:text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
              <span>🎯</span>
              <span>CHỌN 1 LOẠI ĐẠN CHO LƯỢT ĐẤU NÀY:</span>
            </div>
            <span className="text-[9.5px] font-mono text-slate-400">
              (Trong trận chỉ dùng 1 đạn đã chọn)
            </span>
          </div>

          {/* Bullet Grid (8 bullet types) */}
          <div className={`grid ${isShortLandscape ? 'grid-cols-4 gap-1' : 'grid-cols-2 sm:grid-cols-4 gap-1.5'}`}>
            {AMMO_TYPES.map((type) => {
              const cfg = AMMO_CONFIGS[type];
              const isSelected = selectedAmmo === type;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleSelectAmmo(type)}
                  className={`relative p-1.5 sm:p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between active:scale-95 ${
                    isSelected
                      ? 'bg-slate-800/95 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                  style={{
                    boxShadow: isSelected ? `0 0 14px ${cfg.color}33` : undefined,
                  }}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-base sm:text-lg shrink-0">{cfg.icon}</span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[9px] font-black">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <div className="mt-1 min-w-0">
                    <div className="font-mono font-bold text-[10.5px] sm:text-xs text-white truncate">
                      {cfg.vietnameseName}
                    </div>
                    <div
                      className="text-[8px] font-mono font-bold uppercase truncate"
                      style={{ color: cfg.color }}
                    >
                      {cfg.tag}
                    </div>
                    {!isShortLandscape && (
                      <div className="text-[8.5px] text-slate-400 line-clamp-1 mt-0.5 leading-tight">
                        {cfg.tacticalVi || cfg.description}
                      </div>
                    )}
                  </div>

                  <div className="mt-1 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[8px] font-mono text-slate-400">
                    <span>Băng: <strong className="text-slate-200">{cfg.maxAmmo}v</strong></span>
                    <span>Hồi: <strong className="text-slate-200">{cfg.regenTimeSec}s</strong></span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Ammo Highlight Banner */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2 text-left flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">{activeCfg.icon}</span>
            <div className="min-w-0">
              <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5 truncate">
                <span>Đạn đã chọn:</span>
                <span style={{ color: activeCfg.color }}>{activeCfg.vietnameseName}</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 font-normal">
                  {activeCfg.maxAmmo} Viên / {activeCfg.regenTimeSec}s hồi
                </span>
              </div>
              <div className="text-[9.5px] text-slate-400 truncate">
                {activeCfg.tacticalVi || activeCfg.description}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons: Hồi sinh & Xem trận */}
        <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
          <button
            type="button"
            onClick={handleConfirmRespawn}
            className="flex-1 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-slate-950 font-black p-2.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider font-mono shadow-lg shadow-emerald-500/20 active:scale-98 cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>HỒI SINH VỚI {activeCfg.vietnameseName.toUpperCase()}</span>
          </button>

          {onSwitchToSpectator && (
            <button
              type="button"
              disabled={!hasOtherAliveTanks}
              onClick={() => {
                if (!hasOtherAliveTanks) {
                  sounds.playRadioBeep();
                  return;
                }
                onSwitchToSpectator();
              }}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                hasOtherAliveTanks
                  ? 'bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white border-sky-500/40 cursor-pointer active:scale-95'
                  : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-60'
              }`}
              title={hasOtherAliveTanks ? 'Chuyển sang quan sát trận đấu' : 'Không có người chơi nào để xem'}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{hasOtherAliveTanks ? 'Xem Trận' : 'Hết Người Để Xem'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
