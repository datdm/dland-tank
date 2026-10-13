import React, { useEffect, useState } from 'react';
import { PlayerTank, SkillType, ALL_PERK_CARDS } from '../types/game';
import { Zap, Shield, Disc, Flame, Sparkles, Plus } from 'lucide-react';
import { sounds } from '../utils/audio';

interface SkillBarHUDProps {
  myTank: PlayerTank | null | undefined;
  onUseSkill: (skill: SkillType) => void;
  onUpgradeSkill?: (skill: SkillType) => void;
}

interface SkillConfig {
  id: SkillType;
  name: string;
  vietnameseName: string;
  keyLabel: string;
  keySubLabel?: string;
  description: string;
  color: string;
  cooldownSec: number;
  durationSec?: number;
  icon: React.ReactNode;
}

const SKILLS: SkillConfig[] = [
  {
    id: 'BOOST',
    name: 'Nitro Boost',
    vietnameseName: 'Tăng Tốc Nitro',
    keyLabel: 'Shift',
    description: 'Tăng vọt +85% tốc độ di chuyển & drift né đạn trong 3.5s.',
    color: '#38bdf8',
    cooldownSec: 10,
    durationSec: 3.5,
    icon: <Zap className="w-5 h-5 text-sky-400" />,
  },
  {
    id: 'SHIELD',
    name: 'Force Shield',
    vietnameseName: 'Khiên Từ Trường',
    keyLabel: 'Q',
    keySubLabel: 'hoặc F',
    description: 'Tạo vòm từ trường hấp thụ 100% sát thương từ đạn trong 3.5s.',
    color: '#00f0ff',
    cooldownSec: 12,
    durationSec: 3.5,
    icon: <Shield className="w-5 h-5 text-cyan-300" />,
  },
  {
    id: 'MINE',
    name: 'Plasma Mine',
    vietnameseName: 'Mìn Bẫy Plasma',
    keyLabel: 'E',
    keySubLabel: 'hoặc F',
    description: 'Gài mìn điện từ phát nổ 70 sát thương và làm chậm kẻ địch 2.5s.',
    color: '#eab308',
    cooldownSec: 10,
    icon: <Disc className="w-5 h-5 text-amber-400 animate-spin-slow" />,
  },
  {
    id: 'BARRAGE',
    name: 'Hyper Barrage',
    vietnameseName: 'Pháo Siêu Tốc',
    keyLabel: 'R',
    description: 'Quá tải nòng pháo: Tốc độ xả đạn x2 và tầm bắn xa hơn trong 4s.',
    color: '#f43f5e',
    cooldownSec: 15,
    durationSec: 4.0,
    icon: <Flame className="w-5 h-5 text-rose-400" />,
  },
];

export const SkillBarHUD: React.FC<SkillBarHUDProps> = ({ myTank, onUseSkill, onUpgradeSkill }) => {
  const [, setNow] = useState(Date.now());

  // High-frequency UI tick for smooth cooldown countdown and active rings
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 50);
    return () => clearInterval(interval);
  }, []);

  if (!myTank || myTank.isDead) return null;

  const currentTime = Date.now();
  const skillsState = myTank.skills;
  const level = myTank.level || 1;
  const exp = myTank.exp || 0;
  const maxExp = myTank.maxExp || 100;
  const expPct = Math.min(100, Math.max(0, (exp / maxExp) * 100));
  const perks = myTank.perks || [];
  const skillPoints = myTank.skillPoints || 0;

  const getSkillTimeInfo = (skillId: SkillType) => {
    let cooldownUntil = 0;
    let activeUntil = 0;
    let maxCd = 10;

    if (skillId === 'BOOST') {
      cooldownUntil = skillsState?.boostCooldownUntil || 0;
      activeUntil = skillsState?.boostUntil || 0;
      maxCd = 10;
    } else if (skillId === 'SHIELD') {
      cooldownUntil = skillsState?.shieldCooldownUntil || 0;
      activeUntil = skillsState?.shieldUntil || 0;
      maxCd = 12;
    } else if (skillId === 'MINE') {
      cooldownUntil = skillsState?.mineCooldownUntil || 0;
      activeUntil = 0;
      maxCd = 10;
    } else if (skillId === 'BARRAGE') {
      cooldownUntil = skillsState?.barrageCooldownUntil || 0;
      activeUntil = skillsState?.barrageUntil || 0;
      maxCd = 15;
    }

    const cdLeftMs = Math.max(0, cooldownUntil - currentTime);
    const activeLeftMs = Math.max(0, activeUntil - currentTime);
    const isReady = cdLeftMs <= 0;
    const isActive = activeLeftMs > 0;

    return {
      cdSecLeft: cdLeftMs / 1000,
      activeSecLeft: activeLeftMs / 1000,
      isReady,
      isActive,
      cdRatio: cdLeftMs / (maxCd * 1000),
    };
  };

  return (
    <div className="flex flex-col items-center gap-2 pointer-events-auto select-none max-w-xs sm:max-w-sm md:max-w-md w-full">
      {/* 1. Level & EXP Bar Header */}
      <div className="w-full bg-slate-950/85 backdrop-blur-md border border-amber-500/40 rounded-xl p-1.5 md:p-2.5 shadow-xl space-y-1">
        <div className="flex items-center justify-between text-[10px] md:text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black px-1.5 md:px-2 py-0.5 rounded-md text-[11px] md:text-xs shadow-md">
              LV.{level}
            </span>
            <span className="font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>EXP CHIẾN ĐẤU</span>
            </span>
          </div>

          <span className="text-slate-300 font-bold tabular-nums">
            {level >= 10 ? 'CẤP TỐI ĐA (MAX)' : `${exp} / ${maxExp} EXP (${Math.round(expPct)}%)`}
          </span>
        </div>

        {/* EXP Progress Bar Track */}
        <div className="w-full h-1.5 md:h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300 rounded-full transition-all duration-300 shadow-sm"
            style={{ width: `${level >= 10 ? 100 : expPct}%` }}
          />
        </div>

        {/* Unlocked Perks Badges Row */}
        {perks.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-800/80">
            <span className="text-[9px] md:text-[11px] text-slate-400 font-mono font-bold mr-1">NÂNG CẤP:</span>
            {perks.map((pId) => {
              const card = ALL_PERK_CARDS[pId];
              if (!card) return null;
              return (
                <span
                  key={pId}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] md:text-xs font-bold border shadow-sm"
                  style={{
                    backgroundColor: `${card.color}20`,
                    color: card.color,
                    borderColor: `${card.color}50`,
                  }}
                  title={card.description}
                >
                  <span>{card.icon}</span>
                  <span>{card.vietnameseName}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Tactical Active Skill Buttons (Desktop Primary View) */}
      <div className="hidden md:flex items-center gap-2 sm:gap-3">
        {SKILLS.map((sk, idx) => {
          const { cdSecLeft, activeSecLeft, isReady, isActive, cdRatio } = getSkillTimeInfo(sk.id);
          const skillLvl = myTank.skillLevels?.[sk.id] || 1;
          const canUpgrade = skillPoints > 0 && skillLvl < 5;

          return (
            <div key={sk.id} className="relative group flex flex-col items-center">
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 sm:w-56 p-2.5 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 text-left scale-95 group-hover:scale-100 duration-150">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <span className="text-xs md:text-sm font-black flex items-center gap-1.5" style={{ color: sk.color }}>
                    <span>{sk.vietnameseName}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Lv.{skillLvl} {skillLvl >= 5 ? '(MAX)' : ''}
                    </span>
                  </span>
                  <span className="text-[10px] md:text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                    [{sk.keyLabel}]
                  </span>
                </div>
                <p className="text-[11px] md:text-xs text-slate-300 mt-1 leading-snug">{sk.description}</p>
                <div className="mt-1.5 flex items-center justify-between text-[10px] md:text-xs text-slate-400 font-mono">
                  <span>Hồi chiêu: {sk.cooldownSec}s</span>
                  {sk.durationSec && <span className="text-sky-300">Duy trì: {sk.durationSec}s</span>}
                </div>
                {canUpgrade && (
                  <div className="mt-1.5 pt-1 border-t border-yellow-500/30 text-[10px] text-amber-300 font-bold flex items-center gap-1">
                    <Plus className="w-3 h-3 text-yellow-300" />
                    <span>Bấm dấu [+] hoặc phím [{idx + 1}] để nâng cấp</span>
                  </div>
                )}
              </div>

              {/* Pulsing Golden '+' Upgrade Badge attached to skill */}
              {canUpgrade && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (onUpgradeSkill) {
                      onUpgradeSkill(sk.id);
                      sounds.playPowerUp();
                    }
                  }}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-[10px] shadow-[0_0_14px_rgba(250,204,21,0.95)] ring-2 ring-yellow-100 animate-bounce cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                  title={`Cộng chiêu: Nâng cấp ${sk.vietnameseName} lên Lv.${skillLvl + 1} (Phím [${idx + 1}])`}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3.5]" />
                  <span>+ [{idx + 1}]</span>
                </button>
              )}

              {/* Skill Button */}
              <button
                type="button"
                onTouchStart={(e) => {
                  e.preventDefault();
                  if (isReady) {
                    onUseSkill(sk.id);
                    sounds.playPowerUp();
                  }
                }}
                onClick={() => {
                  if (isReady) {
                    onUseSkill(sk.id);
                    sounds.playPowerUp();
                  }
                }}
                disabled={!isReady}
                className={`relative flex flex-col items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl border transition-all cursor-pointer overflow-hidden active:scale-95 ${
                  canUpgrade
                    ? 'ring-2 ring-amber-400 border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]'
                    : isActive
                    ? 'border-white ring-2 shadow-lg animate-pulse'
                    : isReady
                    ? 'border-slate-600/80 hover:border-white bg-slate-900/90 shadow-lg hover:shadow-cyan-500/20 active:scale-95'
                    : 'border-slate-800 bg-slate-950/80 cursor-not-allowed opacity-80'
                }`}
                style={{
                  boxShadow: isActive
                    ? `0 0 20px ${sk.color}80, inset 0 0 12px ${sk.color}40`
                    : canUpgrade
                    ? `0 0 16px rgba(251, 191, 36, 0.7)`
                    : isReady
                    ? `0 4px 14px rgba(0,0,0,0.5)`
                    : 'none',
                }}
              >
                {/* Skill Level Badge */}
                <span className="absolute top-1 right-1 z-20 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[8.5px] px-1 py-0.2 rounded-md shadow border border-white/60">
                  Lv.{skillLvl}
                </span>

                {/* Cooldown Dark Overlay Radial Mask */}
                {!isReady && (
                  <div
                    className="absolute inset-0 bg-slate-950/85 flex items-center justify-center backdrop-blur-[1px] z-10"
                    style={{
                      clipPath: `inset(${Math.max(0, 100 - cdRatio * 100)}% 0 0 0)`,
                    }}
                  />
                )}

                {/* Icon */}
                <div className={`relative z-10 transition-transform ${isReady ? 'group-hover:scale-110' : 'grayscale'}`}>
                  {sk.icon}
                </div>

                {/* Status / Key Label Badge */}
                <div className="relative z-10 mt-0.5">
                  {isActive ? (
                    <span className="text-[10px] md:text-xs font-black font-mono text-white bg-black/60 px-1 rounded">
                      {activeSecLeft.toFixed(1)}s
                    </span>
                  ) : !isReady ? (
                    <span className="text-xs md:text-sm font-black font-mono text-amber-300 tabular-nums">
                      {cdSecLeft.toFixed(1)}s
                    </span>
                  ) : (
                    <span className="text-[10px] md:text-xs font-black font-mono text-slate-300 uppercase tracking-tighter bg-slate-800/80 px-1 md:px-1.5 py-0.2 rounded border border-slate-700/60">
                      {sk.keyLabel}
                    </span>
                  )}
                </div>

                {/* Active glow corner line */}
                {isActive && (
                  <div
                    className="absolute inset-x-0 bottom-0 h-1 animate-pulse"
                    style={{ backgroundColor: sk.color }}
                  />
                )}
              </button>

              {/* MOBA Level Pips below button */}
              <div className="flex items-center justify-center gap-0.5 mt-1 bg-slate-950/80 px-1.5 py-0.5 rounded-full border border-slate-800">
                <span className="text-[9px] font-mono font-black text-amber-300 mr-0.5">Lv.{skillLvl}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <span
                      key={lvl}
                      className={`w-1 h-1 rounded-full ${
                        lvl <= skillLvl
                          ? 'bg-amber-400 shadow-[0_0_3px_#fbbf24]'
                          : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
