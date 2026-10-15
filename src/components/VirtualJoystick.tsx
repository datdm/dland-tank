import React, { useState, useRef, useEffect } from 'react';
import { Crosshair, Zap, Shield, Disc, Flame, Target, RotateCcw, Heart, Plus } from 'lucide-react';
import { PlayerTank, SkillType, BulletModifier, AMMO_TYPES, AMMO_CONFIGS } from '../types/game';
import { haptics } from '../utils/haptics';
import { sounds } from '../utils/audio';

interface VirtualJoystickProps {
  onMoveChange: (move: { up: boolean; down: boolean; left: boolean; right: boolean }) => void;
  onFireChange: (isFiring: boolean) => void;
  onAimChange: (angle: number) => void;
  onUseSkill?: (skill: SkillType) => void;
  onUpgradeSkill?: (skill: SkillType) => void;
  myTank?: PlayerTank | null;
  aimMode?: 'MOVEMENT' | 'MOUSE';
  onToggleAimMode?: () => void;
  onSwitchAmmo?: (type: BulletModifier) => void;
  onRecall?: () => void;
  onQuickHeal?: () => void;
  onSignalPing?: (type: 'ATTACK' | 'RETREAT' | 'GATHER') => void;
  onOpenChat?: () => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onMoveChange,
  onFireChange,
  onAimChange,
  onUseSkill,
  onUpgradeSkill,
  myTank,
  aimMode = 'MOVEMENT',
  onToggleAimMode,
  onSwitchAmmo,
  onRecall,
  onQuickHeal,
}) => {
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);
  const [joystickCenter, setJoystickCenter] = useState<{ x: number; y: number } | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isShortLandscape, setIsShortLandscape] = useState(false);
  const [isFiringActive, setIsFiringActive] = useState(false);
  const [, setTick] = useState(0);

  const leftZoneRef = useRef<HTMLDivElement | null>(null);
  const isMovingRef = useRef(false);
  const activeTouchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const evaluateDevice = () => {
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(touch);
      setIsShortLandscape(window.innerHeight <= 620 && window.innerWidth > window.innerHeight);
    };
    evaluateDevice();
    window.addEventListener('resize', evaluateDevice);
    window.addEventListener('orientationchange', evaluateDevice);
    return () => {
      window.removeEventListener('resize', evaluateDevice);
      window.removeEventListener('orientationchange', evaluateDevice);
    };
  }, []);

  // Update cooldown timers at high frequency
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 50);
    return () => clearInterval(timer);
  }, []);

  const handleLeftTouchStart = (e: React.TouchEvent) => {
    if (activeTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;

    activeTouchIdRef.current = touch.identifier;
    isMovingRef.current = true;

    // Anchor floating joystick center at touch location
    const startX = touch.clientX;
    const startY = touch.clientY;
    setJoystickCenter({ x: startX, y: startY });
    setTouchPos({ x: 0, y: 0 });
    haptics.light();
  };

  const handleLeftTouchMove = (e: React.TouchEvent) => {
    if (!isMovingRef.current || !joystickCenter) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchIdRef.current) {
        const dx = touch.clientX - joystickCenter.x;
        const dy = touch.clientY - joystickCenter.y;
        updateJoystick(dx, dy);
        break;
      }
    }
  };

  const handleLeftTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchIdRef.current) {
        activeTouchIdRef.current = null;
        isMovingRef.current = false;
        setTouchPos(null);
        setJoystickCenter(null);
        onMoveChange({ up: false, down: false, left: false, right: false });
        break;
      }
    }
  };

  const updateJoystick = (dx: number, dy: number) => {
    const maxRadius = isShortLandscape ? 40 : 50;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const normX = Math.cos(angle) * clampedDist;
    const normY = Math.sin(angle) * clampedDist;

    setTouchPos({ x: normX, y: normY });
    onAimChange(angle);

    // Determine movement intent with deadzone
    const threshold = 10;
    if (dist > threshold) {
      const up = dy < -threshold * 0.7;
      const down = dy > threshold * 0.7;
      const left = dx < -threshold * 0.7;
      const right = dx > threshold * 0.7;
      onMoveChange({ up, down, left, right });
    } else {
      onMoveChange({ up: false, down: false, left: false, right: false });
    }
  };

  if (!isTouchDevice) return null;

  const now = Date.now();
  const skillsState = myTank?.skills;

  // Skill 1: Nitro Boost
  const boostCdMs = Math.max(0, (skillsState?.boostCooldownUntil || 0) - now);
  const isBoostReady = boostCdMs <= 0;
  const isBoostActive = (skillsState?.boostUntil || 0) > now;
  const boostSecLeft = (boostCdMs / 1000).toFixed(1);

  // Skill 2: Force Shield
  const shieldCdMs = Math.max(0, (skillsState?.shieldCooldownUntil || 0) - now);
  const isShieldReady = shieldCdMs <= 0;
  const isShieldActive = (skillsState?.shieldUntil || 0) > now;
  const shieldSecLeft = (shieldCdMs / 1000).toFixed(1);

  // Skill 3 / Ulti: Hyper Barrage
  const barrageCdMs = Math.max(0, (skillsState?.barrageCooldownUntil || 0) - now);
  const isBarrageReady = barrageCdMs <= 0;
  const isBarrageActive = (skillsState?.barrageUntil || 0) > now;
  const barrageSecLeft = (barrageCdMs / 1000).toFixed(1);

  const tankLevel = myTank?.level || 1;
  const tankExp = myTank?.exp || 0;
  const tankMaxExp = myTank?.maxExp || 75;
  const expPct = Math.min(100, Math.max(0, (tankExp / tankMaxExp) * 100));

  const skillPoints = myTank?.skillPoints || 0;
  const skill1Level = myTank?.skillLevels?.BOOST || 1;
  const skill2Level = myTank?.skillLevels?.SHIELD || 1;
  const barrageLevel = myTank?.skillLevels?.BARRAGE || 1;
  const mineLevel = myTank?.skillLevels?.MINE || 1;

  const canUpgradeBoost = skillPoints > 0 && skill1Level < 5;
  const canUpgradeShield = skillPoints > 0 && skill2Level < 5;
  const canUpgradeBarrage = skillPoints > 0 && barrageLevel < 5;
  const canUpgradeMine = skillPoints > 0 && mineLevel < 5;

  // Auxiliary Mine
  const mineCdMs = Math.max(0, (skillsState?.mineCooldownUntil || 0) - now);
  const isMineReady = mineCdMs <= 0;
  const mineSecLeft = (mineCdMs / 1000).toFixed(1);

  return (
    <>
      {/* 1. LEFT TOUCH ZONE: DYNAMIC FLOATING JOYSTICK */}
      <div
        ref={leftZoneRef}
        onTouchStart={handleLeftTouchStart}
        onTouchMove={handleLeftTouchMove}
        onTouchEnd={handleLeftTouchEnd}
        onTouchCancel={handleLeftTouchEnd}
        className="fixed top-12 left-0 bottom-0 w-1/2 z-30 pointer-events-auto select-none touch-none"
      >
        {/* Render floating joystick when active */}
        {joystickCenter && (
          <div
            className="fixed pointer-events-none -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-950/80 border-2 border-cyan-500/80 backdrop-blur-md flex items-center justify-center shadow-2xl shadow-cyan-500/20 animate-in zoom-in-75 duration-100"
            style={{
              left: joystickCenter.x,
              top: joystickCenter.y,
              width: isShortLandscape ? 84 : 100,
              height: isShortLandscape ? 84 : 100,
            }}
          >
            {/* Guide cross */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
              <div className="w-full h-0.5 bg-cyan-400" />
              <div className="h-full w-0.5 bg-cyan-400 absolute" />
            </div>

            {/* Inner thumbstick */}
            <div
              className="rounded-full bg-gradient-to-tr from-cyan-600 to-sky-400 border-2 border-white shadow-xl absolute transition-transform"
              style={{
                width: isShortLandscape ? 36 : 44,
                height: isShortLandscape ? 36 : 44,
                transform: touchPos
                  ? `translate(${touchPos.x}px, ${touchPos.y}px)`
                  : 'translate(0px, 0px)',
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-white/90 shadow-sm" />
              </div>
            </div>
          </div>
        )}

        {/* Resting joystick prompt when not touching */}
        {!joystickCenter && (
          <div
            className={`absolute pointer-events-none rounded-full border-2 border-dashed border-slate-600/50 flex flex-col items-center justify-center opacity-60 transition-opacity ${
              isShortLandscape ? 'bottom-4 left-6 w-20 h-20' : 'bottom-8 left-8 w-24 h-24'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-slate-800/80 border border-slate-600 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <span className="text-[8.5px] font-mono font-bold text-slate-400 mt-1 uppercase tracking-wider">
              Chạm Lái
            </span>
          </div>
        )}
      </div>

      {/* 4. BOTTOM-RIGHT: LIÊN QUÂN COMBAT SKILL ARC & BIG ATTACK BUTTON */}
      <div
        className={`fixed right-3 bottom-3 sm:right-5 sm:bottom-5 z-30 pointer-events-none select-none flex items-end justify-end ${
          isShortLandscape ? 'scale-85 origin-bottom-right' : ''
        }`}
      >
        <div className="relative pointer-events-auto flex items-center justify-center w-24 sm:w-28 h-24 sm:h-28">
          {/* =========================================================
              CHIÊU 1: NITRO BOOST (TĂNG TỐC) - Góc dưới-trái (Down-Left)
             ========================================================= */}
          {onUseSkill && (
            <div className="absolute -left-20 top-8 flex flex-col items-center">
              {/* Dấu '+' Nâng Cấp Chiêu (Liên Quân Mobile) */}
              {canUpgradeBoost && (
                <button
                  type="button"
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    haptics.celebrate();
                    onUpgradeSkill?.('BOOST');
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    haptics.celebrate();
                    onUpgradeSkill?.('BOOST');
                  }}
                  className="absolute -top-3.5 -right-2 z-40 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs px-2 py-0.5 rounded-full border-2 border-white shadow-[0_0_16px_rgba(250,204,21,0.95)] animate-bounce flex items-center gap-0.5 cursor-pointer active:scale-90"
                  title="Cộng chiêu 1"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3.5]" />
                  <span>+</span>
                </button>
              )}

              {/* Level Badge góc trên bên trái - luôn hiển thị đầy đủ, không bị nút + che */}
              <div className="absolute -top-2 -left-1.5 z-30 pointer-events-none">
                <span className="inline-flex items-center justify-center bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[10px] px-1.5 py-0.5 rounded-full border border-white shadow font-mono leading-none">
                  Lv.{skill1Level}
                </span>
              </div>

              <button
                type="button"
                onTouchStart={(e) => {
                  e.preventDefault();
                  if (isBoostReady) {
                    haptics.medium();
                    sounds.playPowerUp();
                    onUseSkill('BOOST');
                  }
                }}
                onClick={() => {
                  if (isBoostReady) {
                    haptics.medium();
                    sounds.playPowerUp();
                    onUseSkill('BOOST');
                  }
                }}
                disabled={!isBoostReady}
                className={`rounded-full border-2 transition-all cursor-pointer flex items-center justify-center shadow-2xl active:scale-90 relative overflow-visible w-14 h-14 sm:w-16 sm:h-16 ${
                  canUpgradeBoost
                    ? 'ring-4 ring-amber-400 border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.85)]'
                    : isBoostActive
                    ? 'bg-sky-500 text-slate-950 border-white ring-4 ring-sky-400/50 animate-pulse'
                    : isBoostReady
                    ? 'bg-gradient-to-tr from-sky-900 to-blue-600 hover:from-sky-800 hover:to-blue-500 text-white border-sky-300 shadow-sky-500/40 ring-1 ring-sky-400/30'
                    : 'bg-slate-950/95 text-slate-500 border-slate-700 opacity-80'
                }`}
                title="Chiêu 1: Tăng tốc Nitro (+85% Tốc độ)"
              >
                {!isBoostReady && (
                  <span className="text-xs font-mono font-black text-amber-300">{boostSecLeft}s</span>
                )}
                {isBoostReady && <Zap className="w-6 h-6 text-sky-100" />}
              </button>

              {/* MOBA Level Indicator Capsule & Pips */}
              <div className="flex items-center gap-1 mt-1 bg-slate-950/95 px-1.5 py-0.5 rounded-full border border-sky-500/40 shadow">
                <span className="text-[9px] font-mono font-black text-sky-300 leading-none">
                  Lv.{skill1Level}
                </span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <span
                      key={lvl}
                      className={`w-1 h-1 rounded-full ${
                        lvl <= skill1Level ? 'bg-sky-400 shadow-[0_0_3px_#38bdf8]' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              CHIÊU 2: KHIÊN LỰC TRƯỜNG (FORCE SHIELD) - Góc trên-trái (Up-Left)
             ========================================================= */}
          {onUseSkill && (
            <div className="absolute -left-14 -top-18 flex flex-col items-center">
              {/* Dấu '+' Nâng Cấp Chiêu */}
              {canUpgradeShield && (
                <button
                  type="button"
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    haptics.celebrate();
                    onUpgradeSkill?.('SHIELD');
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    haptics.celebrate();
                    onUpgradeSkill?.('SHIELD');
                  }}
                  className="absolute -top-3.5 -right-2 z-40 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs px-2 py-0.5 rounded-full border-2 border-white shadow-[0_0_16px_rgba(250,204,21,0.95)] animate-bounce flex items-center gap-0.5 cursor-pointer active:scale-90"
                  title="Cộng chiêu 2"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3.5]" />
                  <span>+</span>
                </button>
              )}

              {/* Level Badge góc trên bên trái */}
              <div className="absolute -top-2 -left-1.5 z-30 pointer-events-none">
                <span className="inline-flex items-center justify-center bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[10px] px-1.5 py-0.5 rounded-full border border-white shadow font-mono leading-none">
                  Lv.{skill2Level}
                </span>
              </div>

              <button
                type="button"
                onTouchStart={(e) => {
                  e.preventDefault();
                  if (isShieldReady) {
                    haptics.medium();
                    sounds.playPowerUp();
                    onUseSkill('SHIELD');
                  }
                }}
                onClick={() => {
                  if (isShieldReady) {
                    haptics.medium();
                    sounds.playPowerUp();
                    onUseSkill('SHIELD');
                  }
                }}
                disabled={!isShieldReady}
                className={`rounded-full border-2 transition-all cursor-pointer flex items-center justify-center shadow-2xl active:scale-90 relative overflow-visible w-14 h-14 sm:w-16 sm:h-16 ${
                  canUpgradeShield
                    ? 'ring-4 ring-amber-400 border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.85)]'
                    : isShieldActive
                    ? 'bg-cyan-400 text-slate-950 border-white ring-4 ring-cyan-400/50 animate-pulse'
                    : isShieldReady
                    ? 'bg-gradient-to-tr from-teal-900 to-cyan-600 hover:from-teal-800 hover:to-cyan-500 text-white border-cyan-300 shadow-cyan-500/40 ring-1 ring-cyan-400/30'
                    : 'bg-slate-950/95 text-slate-500 border-slate-700 opacity-80'
                }`}
                title="Chiêu 2: Khiên Từ Trường (Bảo vệ 100% sát thương)"
              >
                {!isShieldReady && (
                  <span className="text-xs font-mono font-black text-amber-300">{shieldSecLeft}s</span>
                )}
                {isShieldReady && <Shield className="w-6 h-6 text-cyan-100" />}
              </button>

              {/* MOBA Level Indicator Capsule & Pips */}
              <div className="flex items-center gap-1 mt-1 bg-slate-950/95 px-1.5 py-0.5 rounded-full border border-cyan-500/40 shadow">
                <span className="text-[9px] font-mono font-black text-cyan-300 leading-none">
                  Lv.{skill2Level}
                </span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <span
                      key={lvl}
                      className={`w-1 h-1 rounded-full ${
                        lvl <= skill2Level ? 'bg-cyan-400 shadow-[0_0_3px_#06b6d4]' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              CHIÊU 3: CHIÊU CUỐI ULTI - PHÁO SIÊU TỐC (HYPER BARRAGE) - Góc 90° (thẳng đứng)
             ========================================================= */}
          {onUseSkill && (
            <div className="absolute left-3 -top-22 flex flex-col items-center">
              {/* Dấu '+' Nâng Cấp Chiêu */}
              {canUpgradeBarrage && (
                <button
                  type="button"
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    haptics.celebrate();
                    onUpgradeSkill?.('BARRAGE');
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    haptics.celebrate();
                    onUpgradeSkill?.('BARRAGE');
                  }}
                  className="absolute -top-3.5 -right-2 z-40 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs px-2 py-0.5 rounded-full border-2 border-white shadow-[0_0_16px_rgba(250,204,21,0.95)] animate-bounce flex items-center gap-0.5 cursor-pointer active:scale-90"
                  title="Cộng chiêu cuối"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3.5]" />
                  <span>+</span>
                </button>
              )}

              {/* Level Badge góc trên bên trái */}
              <div className="absolute -top-2 -left-1.5 z-30 pointer-events-none">
                <span className="inline-flex items-center justify-center bg-gradient-to-r from-amber-500 to-orange-400 text-slate-950 font-black text-[10px] px-1.5 py-0.5 rounded-full border border-white shadow font-mono leading-none">
                  Lv.{barrageLevel}
                </span>
              </div>

              <button
                type="button"
                onTouchStart={(e) => {
                  e.preventDefault();
                  if (isBarrageReady) {
                    haptics.medium();
                    sounds.playPowerUp();
                    onUseSkill('BARRAGE');
                  }
                }}
                onClick={() => {
                  if (isBarrageReady) {
                    haptics.medium();
                    sounds.playPowerUp();
                    onUseSkill('BARRAGE');
                  }
                }}
                disabled={!isBarrageReady}
                className={`rounded-full border-2 transition-all cursor-pointer flex items-center justify-center shadow-2xl active:scale-90 relative overflow-visible w-16 h-16 sm:w-18 sm:h-18 ${
                  canUpgradeBarrage
                    ? 'ring-4 ring-amber-400 border-yellow-300 shadow-[0_0_22px_rgba(251,191,36,0.9)] animate-pulse'
                    : isBarrageActive
                    ? 'bg-rose-500 text-white border-yellow-300 ring-4 ring-orange-400/60 animate-pulse'
                    : isBarrageReady
                    ? 'bg-gradient-to-tr from-rose-900 via-red-600 to-amber-500 hover:from-rose-800 hover:to-amber-400 text-white border-amber-300 shadow-orange-500/50 ring-2 ring-amber-400/50'
                    : 'bg-slate-950/95 text-slate-500 border-slate-700 opacity-80'
                }`}
                title="Chiêu Cuối (Ulti): Pháo Siêu Tốc (Xả đạn x2)"
              >
                {!isBarrageReady && (
                  <span className="text-xs font-mono font-black text-amber-300">{barrageSecLeft}s</span>
                )}
                {isBarrageReady && <Flame className="w-7 h-7 sm:w-8 sm:h-8 text-amber-100 animate-pulse" />}
              </button>

              {/* MOBA Level Indicator Capsule & Pips */}
              <div className="flex items-center gap-1 mt-1 bg-slate-950/95 px-2 py-0.5 rounded-full border border-amber-500/50 shadow">
                <span className="text-[9.5px] font-mono font-black text-amber-300 leading-none">
                  Lv.{barrageLevel}
                </span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <span
                      key={lvl}
                      className={`w-1.5 h-1.5 rounded-full ${
                        lvl <= barrageLevel ? 'bg-amber-400 shadow-[0_0_3px_#fbbf24]' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              CHIÊU 4: MÌN BẪY PLASMA (PLASMA MINE) - Góc ngoài trên-trái (Far Left)
             ========================================================= */}
          {onUseSkill && (
            <div className="absolute -left-28 -top-10 flex flex-col items-center">
              {/* Dấu '+' Nâng Cấp Chiêu */}
              {canUpgradeMine && (
                <button
                  type="button"
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    haptics.celebrate();
                    onUpgradeSkill?.('MINE');
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    haptics.celebrate();
                    onUpgradeSkill?.('MINE');
                  }}
                  className="absolute -top-3.5 -right-2 z-40 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs px-2 py-0.5 rounded-full border-2 border-white shadow-[0_0_16px_rgba(250,204,21,0.95)] animate-bounce flex items-center gap-0.5 cursor-pointer active:scale-90"
                  title="Cộng chiêu 4"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3.5]" />
                  <span>+</span>
                </button>
              )}

              {/* Level Badge góc trên bên trái */}
              <div className="absolute -top-2 -left-1.5 z-30 pointer-events-none">
                <span className="inline-flex items-center justify-center bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[9.5px] px-1.5 py-0.5 rounded-full border border-white shadow font-mono leading-none">
                  Lv.{mineLevel}
                </span>
              </div>

              <button
                type="button"
                onTouchStart={(e) => {
                  e.preventDefault();
                  if (isMineReady) {
                    haptics.medium();
                    sounds.playHit();
                    onUseSkill('MINE');
                  }
                }}
                onClick={() => {
                  if (isMineReady) {
                    haptics.medium();
                    sounds.playHit();
                    onUseSkill('MINE');
                  }
                }}
                disabled={!isMineReady}
                className={`rounded-full border-2 transition-all cursor-pointer flex items-center justify-center shadow-xl active:scale-90 relative overflow-visible w-12 h-12 sm:w-14 sm:h-14 ${
                  canUpgradeMine
                    ? 'ring-4 ring-amber-400 border-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.85)]'
                    : isMineReady
                    ? 'bg-gradient-to-tr from-amber-950 to-yellow-600 hover:from-amber-800 hover:to-yellow-500 text-white border-amber-300 shadow-yellow-500/30 ring-1 ring-yellow-400/30'
                    : 'bg-slate-950/95 text-slate-500 border-slate-700 opacity-80'
                }`}
                title="Chiêu 4: Mìn Bẫy Plasma (Gài mìn điện từ)"
              >
                {!isMineReady && (
                  <span className="text-[10px] font-mono font-black text-amber-300">{mineSecLeft}s</span>
                )}
                {isMineReady && <Disc className="w-5 h-5 text-amber-200 animate-spin-slow" />}
              </button>

              {/* MOBA Level Indicator Capsule & Pips */}
              <div className="flex items-center gap-1 mt-1 bg-slate-950/95 px-1.5 py-0.5 rounded-full border border-yellow-500/40 shadow">
                <span className="text-[8.5px] font-mono font-black text-amber-300 leading-none">
                  Lv.{mineLevel}
                </span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <span
                      key={lvl}
                      className={`w-1 h-1 rounded-full ${
                        lvl <= mineLevel ? 'bg-yellow-400 shadow-[0_0_3px_#eab308]' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              NÚT CHUYỂN ĐỔI LOẠI ĐẠN (QUICK AMMO SWITCH) - CHO MOBILE
             ========================================================= */}
          {onSwitchAmmo && myTank && (
            <button
              type="button"
              onTouchStart={(e) => {
                e.preventDefault();
                const cur = myTank.selectedAmmo || 'STANDARD';
                const curIdx = AMMO_TYPES.indexOf(cur);
                const nextIdx = (curIdx + 1) % AMMO_TYPES.length;
                onSwitchAmmo(AMMO_TYPES[nextIdx]);
                haptics.light();
                sounds.playPowerUp();
              }}
              onClick={() => {
                const cur = myTank.selectedAmmo || 'STANDARD';
                const curIdx = AMMO_TYPES.indexOf(cur);
                const nextIdx = (curIdx + 1) % AMMO_TYPES.length;
                onSwitchAmmo(AMMO_TYPES[nextIdx]);
                haptics.light();
                sounds.playPowerUp();
              }}
              className="absolute -left-9 top-6 w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 transition-all cursor-pointer flex flex-col items-center justify-center shadow-xl active:scale-90 bg-slate-950/95"
              style={{
                borderColor: AMMO_CONFIGS[myTank.selectedAmmo || 'STANDARD'].color,
                boxShadow: `0 0 14px ${AMMO_CONFIGS[myTank.selectedAmmo || 'STANDARD'].color}50`,
              }}
              title="Chạm để đổi loại đạn pháo"
            >
              <span className="text-base leading-none">
                {AMMO_CONFIGS[myTank.selectedAmmo || 'STANDARD'].icon}
              </span>
              <span className="text-[8.5px] font-mono font-black text-white leading-none mt-0.5">
                {myTank.ammoInventory?.[myTank.selectedAmmo || 'STANDARD'] ?? 0}
              </span>
            </button>
          )}

          {/* =========================================================
              NÚT CHỌN MỤC TIÊU / ĐỔI GÓC NGẮM (🎯) - Góc dưới bên trái
             ========================================================= */}
          {onToggleAimMode && (
            <button
              type="button"
              onTouchStart={(e) => {
                e.preventDefault();
                haptics.light();
                onToggleAimMode();
              }}
              onClick={() => {
                haptics.light();
                onToggleAimMode();
              }}
              className={`absolute -left-8 top-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full border transition-all cursor-pointer flex items-center justify-center shadow-md active:scale-90 ${
                aimMode === 'MOVEMENT'
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/80'
                  : 'bg-sky-950/90 text-sky-300 border-sky-500/80'
              }`}
              title="Đổi chế độ bắn: Hướng xe / Chuột 360°"
            >
              <Target className="w-4 h-4" />
            </button>
          )}

          {/* =========================================================
              MAIN GIANT ATTACK / FIRE BUTTON (CHUẨN LIÊN QUÂN MOBILE)
             ========================================================= */}
          <button
            type="button"
            onTouchStart={(e) => {
              e.preventDefault();
              setIsFiringActive(true);
              haptics.medium();
              onFireChange(true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              setIsFiringActive(false);
              onFireChange(false);
            }}
            onMouseDown={() => {
              setIsFiringActive(true);
              haptics.medium();
              onFireChange(true);
            }}
            onMouseUp={() => {
              setIsFiringActive(false);
              onFireChange(false);
            }}
            className={`w-22 h-22 sm:w-26 sm:h-26 rounded-full border-4 text-white flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all cursor-pointer relative select-none ${
              isFiringActive
                ? 'bg-gradient-to-tr from-amber-600 via-orange-500 to-rose-600 border-white ring-4 ring-amber-400/60 scale-95'
                : 'bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-900 hover:from-slate-800 hover:to-blue-800 border-amber-400/90 shadow-indigo-900/50'
            }`}
          >
            {/* Metallic inner ring border */}
            <div className="absolute inset-1 rounded-full border border-amber-300/40 pointer-events-none" />
            <Crosshair
              className={`w-9 h-9 sm:w-11 sm:h-11 text-amber-300 stroke-[2.5] ${isFiringActive ? 'rotate-45 text-white transition-transform' : ''}`}
            />
            <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase font-mono text-amber-200 drop-shadow">
              BẮN
            </span>
          </button>
        </div>
      </div>

      {/* 5. BOTTOM-CENTER: MOBILE ROGUELIKE LEVEL & EXP PROGRESS CAPSULE */}
      {myTank && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 z-30 pointer-events-auto select-none flex flex-col items-center gap-1 ${
            isShortLandscape ? 'bottom-1 scale-90 origin-bottom' : 'bottom-2.5'
          }`}
        >

          <div className="bg-slate-950/92 border border-amber-500/50 rounded-xl px-2.5 py-1 shadow-2xl backdrop-blur-md flex items-center gap-2 max-w-xs sm:max-w-sm w-auto">
            {/* Level Badge */}
            <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 px-1.5 py-0.5 rounded-lg font-black font-mono text-[10px] sm:text-xs shadow">
              <span>LV.{tankLevel}</span>
            </div>

            {/* EXP Bar Track */}
            <div className="flex flex-col gap-0.5 min-w-[130px] sm:min-w-[170px]">
              <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-mono leading-none">
                <span className="text-amber-300 font-bold">EXP CHIẾN ĐẤU</span>
                <span className="text-slate-300 font-bold">
                  {tankLevel >= 10 ? 'MAX' : `${tankExp}/${tankMaxExp} EXP (${Math.round(expPct)}%)`}
                </span>
              </div>
              <div className="w-full h-1.5 sm:h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.2">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300 rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${tankLevel >= 10 ? 100 : expPct}%` }}
                />
              </div>
            </div>

            {/* Active Perks Count Badge */}
            {(myTank.perks || []).length > 0 && (
              <div className="text-[9px] font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1 py-0.5 rounded">
                +{myTank.perks.length} Skill
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
