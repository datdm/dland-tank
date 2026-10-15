import React, { useState, useEffect } from 'react';
import { BulletModifier, AMMO_TYPES, AMMO_CONFIGS, PlayerTank } from '../types/game';
import { sounds } from '../utils/audio';
import { haptics } from '../utils/haptics';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Zap,
  AlertCircle,
  Crosshair,
  Info,
  Clock,
  Layers,
  Lock,
} from 'lucide-react';

interface BulletModeSelectorProps {
  myTank: PlayerTank | null | undefined;
  onSwitchAmmo?: (type: BulletModifier) => void;
  isMobile?: boolean;
}

export const BulletModeSelector: React.FC<BulletModeSelectorProps> = ({
  myTank,
  onSwitchAmmo,
  isMobile = false,
}) => {
  const [, setTick] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredAmmo, setHoveredAmmo] = useState<BulletModifier | null>(null);
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  // High-frequency UI tick for smooth ammo reload progress ring
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60);
    return () => clearInterval(interval);
  }, []);

  if (!myTank || myTank.isDead) return null;

  const currentAmmoType: BulletModifier = myTank.selectedAmmo || 'STANDARD';
  const ammoInventory = myTank.ammoInventory || {
    STANDARD: 15,
    EXPLOSIVE: 5,
    TRIPLE: 6,
    PLASMA: 8,
    CRYO: 6,
    INCENDIARY: 6,
    RICOCHET: 7,
    PIERCING: 5,
  };
  const ammoRegenTimers = myTank.ammoRegenTimers || {
    STANDARD: 0,
    EXPLOSIVE: 0,
    TRIPLE: 0,
    PLASMA: 0,
    CRYO: 0,
    INCENDIARY: 0,
    RICOCHET: 0,
    PIERCING: 0,
  };

  const perkCdMult = myTank.perks?.includes('RAPID_RELOAD') ? 0.8 : 1.0;
  const levelCdMult = Math.max(0.75, 1 - ((myTank.level || 1) - 1) * 0.025);
  const regenCdMult = perkCdMult * levelCdMult;

  const currentCfg = AMMO_CONFIGS[currentAmmoType];
  const currentCount = ammoInventory[currentAmmoType] ?? 0;
  const currentMax = currentCfg.maxAmmo;
  const isOutOfAmmo = currentCount <= 0;

  // Calculate current reload time left for active ammo
  const currentRegenInterval = currentCfg.regenTimeSec * 1000 * regenCdMult;
  const currentTimerAccum = ammoRegenTimers[currentAmmoType] || 0;
  const currentReloadProgress = Math.min(1, Math.max(0, currentTimerAccum / currentRegenInterval));
  const currentSecLeft = Math.max(0, (currentRegenInterval - currentTimerAccum) / 1000);

  const handleSelect = (mod: BulletModifier) => {
    if (mod === currentAmmoType) return;
    // User Requirement: During play, only 1 bullet type is selected. Re-select when respawning!
    haptics.medium();
    sounds.playRadioBeep();
    const cfg = AMMO_CONFIGS[mod];
    setLockedNotice(`🔒 Trong trận chỉ dùng 1 đạn đã chọn (${currentCfg.vietnameseName})! Đổi sang ${cfg.vietnameseName} khi xe tăng hồi sinh.`);
    setTimeout(() => setLockedNotice(null), 3200);
  };

  return (
    <div className="flex flex-col items-center pointer-events-auto select-none gap-1 max-w-[95vw] sm:max-w-xl md:max-w-2xl w-full">
      {/* Locked ammo switch notice banner */}
      {lockedNotice && (
        <div className="bg-slate-950/95 border-2 border-amber-400 text-amber-300 px-3 py-1 rounded-full text-[10.5px] font-mono font-bold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150 flex items-center gap-1.5 z-40">
          <Lock className="w-3 h-3 text-amber-400 shrink-0" />
          <span>{lockedNotice}</span>
        </div>
      )}

      {/* 1. Main Active Ammo Banner with Live Reload Countdown & Tactical Summary */}
      <div className="w-full bg-slate-950/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1.5 sm:p-2 shadow-2xl flex items-center justify-between gap-2">
        {/* Left: Ammo Badge & Info */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-lg sm:text-xl font-black shrink-0 border shadow-lg transition-transform"
            style={{
              backgroundColor: `${currentCfg.color}20`,
              borderColor: currentCfg.color,
              boxShadow: `0 0 12px ${currentCfg.color}40`,
            }}
          >
            <span>{currentCfg.icon}</span>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap leading-tight">
              <span className="font-mono font-black text-xs sm:text-sm text-white truncate">
                {currentCfg.vietnameseName}
              </span>
              <span
                className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border hidden sm:inline"
                style={{
                  color: currentCfg.color,
                  borderColor: `${currentCfg.color}60`,
                  backgroundColor: `${currentCfg.color}15`,
                }}
              >
                {currentCfg.tag}
              </span>
              <span className="text-[8.5px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                🔒 ĐẠN CỐ ĐỊNH HIỆP NÀY
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-300 font-mono mt-0.5">
              {currentCount < currentMax ? (
                <span className="flex items-center gap-1 text-sky-400 font-bold">
                  <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                  <span>
                    Hồi +1 viên: <strong className="text-white">{currentSecLeft.toFixed(1)}s</strong>
                  </span>
                </span>
              ) : (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span>✓</span>
                  <span>Băng đạn đầy ({currentMax} viên)</span>
                </span>
              )}
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-slate-400 text-[10px] hidden sm:inline">
                Đổi loại đạn khi xe tăng hồi sinh
              </span>
            </div>
          </div>
        </div>

        {/* Right: Magazine Count Display & Status */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex flex-col items-end font-mono">
            <div className="flex items-baseline gap-1">
              <span
                className={`text-base sm:text-xl font-black ${
                  isOutOfAmmo
                    ? 'text-rose-500 animate-pulse'
                    : currentCount <= 2
                    ? 'text-amber-400'
                    : 'text-white'
                }`}
              >
                {currentCount}
              </span>
              <span className="text-xs text-slate-500 font-bold">/</span>
              <span className="text-xs text-slate-400 font-bold">{currentMax}</span>
            </div>
            {/* Visual Reload Progress Mini-Bar */}
            <div className="w-16 sm:w-20 h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800 mt-0.5">
              <div
                className={`h-full rounded-full transition-all duration-100 ${
                  isOutOfAmmo ? 'bg-rose-500' : 'bg-gradient-to-r from-sky-400 to-emerald-400'
                }`}
                style={{
                  width: `${currentCount === currentMax ? 100 : currentReloadProgress * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Toggle Dock Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white cursor-pointer active:scale-90 transition-transform"
            title={isCollapsed ? 'Mở danh sách loại đạn' : 'Thu gọn danh sách loại đạn'}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5 rotate-90" />}
          </button>
        </div>
      </div>

      {/* 2. Dock of All 8 Ammo Modes with Live Hover Tooltips & Locked State */}
      {!isCollapsed && (
        <div className="w-full grid grid-cols-4 sm:grid-cols-8 gap-1 sm:gap-1.5 p-1 bg-slate-950/80 backdrop-blur-md border border-slate-800/90 rounded-xl shadow-xl">
          {AMMO_TYPES.map((type, idx) => {
            const cfg = AMMO_CONFIGS[type];
            const isSelected = type === currentAmmoType;
            const isHovered = hoveredAmmo === type;
            const count = ammoInventory[type] ?? 0;
            const max = cfg.maxAmmo;
            const isEmpty = count <= 0;
            const timerAccum = ammoRegenTimers[type] || 0;
            const regenInterval = cfg.regenTimeSec * 1000 * regenCdMult;
            const regenProgress = Math.min(1, Math.max(0, timerAccum / regenInterval));

            // Tooltip alignment relative to column index to avoid viewport clipping
            let alignClass = 'left-1/2 -translate-x-1/2';
            let arrowAlignClass = 'left-1/2 -translate-x-1/2';
            if (idx <= 1) {
              alignClass = 'left-0 translate-x-0';
              arrowAlignClass = 'left-6 -translate-x-1/2';
            } else if (idx >= 6) {
              alignClass = 'right-0 translate-x-0';
              arrowAlignClass = 'right-6 translate-x-1/2';
            }

            return (
              <div
                key={type}
                className="relative group"
                onMouseEnter={() => setHoveredAmmo(type)}
                onMouseLeave={() => setHoveredAmmo(null)}
              >
                {/* Tactical Hover Tooltip */}
                <div
                  className={`absolute pointer-events-none transition-all duration-200 z-50 ${alignClass} ${
                    isMobile ? 'top-full mt-2' : 'bottom-full mb-2.5'
                  } ${
                    isHovered
                      ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                      : 'opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto'
                  }`}
                  style={{ minWidth: '16rem', maxWidth: '19rem', width: 'max-content' }}
                >
                  <div
                    className="relative bg-slate-950/95 backdrop-blur-xl border rounded-xl p-3 shadow-2xl text-left"
                    style={{
                      borderColor: `${cfg.color}90`,
                      boxShadow: `0 12px 36px rgba(0,0,0,0.85), 0 0 20px ${cfg.color}35`,
                    }}
                  >
                    {/* Header: Icon, Name, Badge */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-base shrink-0 border"
                          style={{
                            backgroundColor: `${cfg.color}25`,
                            borderColor: cfg.color,
                          }}
                        >
                          <span>{cfg.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-white truncate flex items-center gap-1">
                            <span>{cfg.vietnameseName}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium truncate">
                            {cfg.name}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span
                          className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border"
                          style={{
                            color: cfg.color,
                            borderColor: `${cfg.color}60`,
                            backgroundColor: `${cfg.color}15`,
                          }}
                        >
                          {isSelected ? 'Đang dùng' : 'Khóa'}
                        </span>
                      </div>
                    </div>

                    {/* Tactical Highlight Callout Box */}
                    <div
                      className="my-2 p-2 rounded-lg border text-left"
                      style={{
                        backgroundColor: `${cfg.color}12`,
                        borderColor: `${cfg.color}45`,
                      }}
                    >
                      <div className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: cfg.color }}>
                        <Crosshair className="w-3.5 h-3.5 shrink-0" />
                        <span>{cfg.tacticalInfo}</span>
                      </div>
                      <div className="text-[10px] text-slate-300 font-medium mt-1 leading-snug">
                        {cfg.tacticalVi}
                      </div>
                    </div>

                    {/* Detailed Stats Row */}
                    <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-800/80 text-[10px] font-mono">
                      <div className="bg-slate-900/80 rounded-md p-1 border border-slate-800 flex flex-col items-center">
                        <span className="text-slate-400 flex items-center gap-0.5 text-[9px]">
                          <Layers className="w-2.5 h-2.5 text-sky-400" /> Băng đạn
                        </span>
                        <span className="font-bold text-white mt-0.5">{max} viên</span>
                      </div>

                      <div className="bg-slate-900/80 rounded-md p-1 border border-slate-800 flex flex-col items-center">
                        <span className="text-slate-400 flex items-center gap-0.5 text-[9px]">
                          <Clock className="w-2.5 h-2.5 text-amber-400" /> Hồi/viên
                        </span>
                        <span className="font-bold text-white mt-0.5">{cfg.regenTimeSec}s</span>
                      </div>

                      <div className="bg-slate-900/80 rounded-md p-1 border border-slate-800 flex flex-col items-center">
                        <span className="text-slate-400 flex items-center gap-0.5 text-[9px]">
                          <Zap className="w-2.5 h-2.5 text-emerald-400" /> Còn lại
                        </span>
                        <span
                          className={`font-bold mt-0.5 ${
                            isEmpty ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {count}/{max}
                        </span>
                      </div>
                    </div>

                    {/* Status note */}
                    <div className="mt-2 pt-1 border-t border-slate-800 flex items-center justify-between text-[9.5px] font-mono">
                      {isSelected ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span>✓</span>
                          <span>Đang sử dụng trong lượt đấu này</span>
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Được chọn lại khi xe tăng hồi sinh</span>
                        </span>
                      )}
                    </div>

                    {/* Tooltip Arrow pointing down (or up on mobile) */}
                    <div
                      className={`absolute w-2.5 h-2.5 bg-slate-950 border transform rotate-45 ${arrowAlignClass} ${
                        isMobile
                          ? '-top-1.5 border-t border-l border-b-0 border-r-0'
                          : '-bottom-1.5 border-b border-r border-t-0 border-l-0'
                      }`}
                      style={{ borderColor: `${cfg.color}90` }}
                    />
                  </div>
                </div>

                {/* The Ammo Button */}
                <button
                  type="button"
                  onClick={() => handleSelect(type)}
                  className={`w-full relative flex flex-col items-center justify-between p-1 sm:p-1.5 rounded-lg border cursor-pointer transition-all active:scale-95 text-left ${
                    isSelected
                      ? 'border-2 shadow-lg -translate-y-0.5'
                      : 'bg-slate-900/50 hover:bg-slate-800/80 border-slate-800 text-slate-400 hover:border-slate-700 opacity-80'
                  }`}
                  style={{
                    backgroundColor: isSelected ? `${cfg.color}22` : undefined,
                    borderColor: isSelected ? cfg.color : undefined,
                    boxShadow: isSelected ? `0 0 14px ${cfg.color}45` : undefined,
                  }}
                  aria-label={`${cfg.vietnameseName}: ${cfg.tacticalInfo}`}
                >
                  {/* Top indicator: Check if selected, Lock if not */}
                  <div className="w-full flex items-center justify-between leading-none mb-0.5">
                    {isSelected ? (
                      <span
                        className="text-[8px] font-mono font-bold px-1 py-0.2 rounded text-slate-950"
                        style={{ backgroundColor: cfg.color }}
                      >
                        ✓ DÙNG
                      </span>
                    ) : (
                      <span className="text-[8px] text-slate-500 font-mono flex items-center gap-0.5">
                        <Lock className="w-2 h-2 text-slate-500" />
                      </span>
                    )}

                    <span
                      className={`text-[9px] font-mono font-black ${
                        isEmpty
                          ? 'text-rose-400 animate-pulse'
                          : isSelected
                          ? 'text-white'
                          : 'text-slate-400'
                      }`}
                    >
                      {count}/{max}
                    </span>
                  </div>

                  {/* Ammo Icon & Visual Active Glow */}
                  <div className="relative my-0.5 flex items-center justify-center">
                    <span className={`text-base sm:text-lg select-none filter drop-shadow ${!isSelected ? 'grayscale-[0.35]' : ''}`}>
                      {cfg.icon}
                    </span>
                    {/* Active Selection Glow Ring */}
                    {isSelected && (
                      <div
                        className="absolute inset-0 rounded-full animate-ping opacity-25"
                        style={{ backgroundColor: cfg.color }}
                      />
                    )}
                  </div>

                  {/* Bullet Name (Short) */}
                  <span
                    className={`text-[8px] sm:text-[9.5px] font-bold text-center truncate w-full leading-tight ${
                      isSelected ? 'text-white font-black' : 'text-slate-400'
                    }`}
                  >
                    {cfg.vietnameseName.replace('Đạn ', '').replace('Laze ', '').replace('Đại Bác ', '')}
                  </span>

                  {/* Progress bar under button for reload feedback */}
                  <div className="w-full h-0.5 sm:h-1 bg-slate-950 rounded-full overflow-hidden mt-1 border border-slate-800/80">
                    <div
                      className={`h-full transition-all duration-100 ${
                        count === max
                          ? 'bg-emerald-400'
                          : isEmpty
                          ? 'bg-rose-500 animate-pulse'
                          : 'bg-sky-400'
                      }`}
                      style={{
                        width: `${count === max ? 100 : regenProgress * 100}%`,
                      }}
                    />
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
