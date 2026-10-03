import React, { useEffect, useState } from 'react';
import { PlayerTank, SkillType, ALL_PERK_CARDS } from '../types/game';
import { Zap, Shield, Disc, Flame, Sparkles } from 'lucide-react';
import { sounds } from '../utils/audio';

interface SkillBarHUDProps {
  myTank: PlayerTank | null | undefined;
  onUseSkill: (skill: SkillType) => void;
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

export const SkillBarHUD: React.FC<SkillBarHUDProps> = ({ myTank, onUseSkill }) => {
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
    <div className="flex flex-col items-center gap-2 pointer-events-auto select-none max-w-md w-full">
      {/* 1. Level & EXP Bar Header */}
      <div className="w-full bg-slate-950/85 backdrop-blur-md border border-amber-500/40 rounded-xl p-2 shadow-xl space-y-1">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black px-2 py-0.5 rounded-md text-xs shadow-md">
              LV.{level}
            </span>
            <span className="font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>ROGUELIKE EXP</span>
            </span>
          </div>

          <span className="text-slate-300 font-bold tabular-nums">
            {level >= 10 ? 'CẤP TỐI ĐA (MAX)' : `${exp} / ${maxExp} EXP (${Math.round(expPct)}%)`}
          </span>
        </div>

        {/* EXP Progress Bar Track */}
        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300 rounded-full transition-all duration-300 shadow-sm"
            style={{ width: `${level >= 10 ? 100 : expPct}%` }}
          />
        </div>

        {/* Unlocked Perks Badges Row */}
        {perks.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-mono font-bold mr-1">NÂNG CẤP:</span>
            {perks.map((pId) => {
              const card = ALL_PERK_CARDS[pId];
              if (!card) return null;
              return (
                <span
                  key={pId}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border shadow-sm"
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

      {/* 2. Tactical Active Skill Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {SKILLS.map((sk) => {
          const { cdSecLeft, activeSecLeft, isReady, isActive, cdRatio } = getSkillTimeInfo(sk.id);

          return (
            <div key={sk.id} className="relative group">
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 sm:w-56 p-2.5 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 text-left scale-95 group-hover:scale-100 duration-150">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <span className="text-xs font-black" style={{ color: sk.color }}>
                    {sk.vietnameseName}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                    [{sk.keyLabel}]
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-snug">{sk.description}</p>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Hồi chiêu: {sk.cooldownSec}s</span>
                  {sk.durationSec && <span className="text-sky-300">Duy trì: {sk.durationSec}s</span>}
                </div>
              </div>

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
                className={`relative flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border transition-all cursor-pointer overflow-hidden active:scale-95 ${
                  isActive
                    ? 'border-white ring-2 shadow-lg animate-pulse'
                    : isReady
                    ? 'border-slate-600/80 hover:border-white bg-slate-900/90 shadow-lg hover:shadow-cyan-500/20 active:scale-95'
                    : 'border-slate-800 bg-slate-950/80 cursor-not-allowed opacity-80'
                }`}
                style={{
                  boxShadow: isActive
                    ? `0 0 20px ${sk.color}80, inset 0 0 12px ${sk.color}40`
                    : isReady
                    ? `0 4px 14px rgba(0,0,0,0.5)`
                    : 'none',
                }}
              >
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
                    <span className="text-[10px] font-black font-mono text-white bg-black/60 px-1 rounded">
                      {activeSecLeft.toFixed(1)}s
                    </span>
                  ) : !isReady ? (
                    <span className="text-xs font-black font-mono text-amber-300 tabular-nums">
                      {cdSecLeft.toFixed(1)}s
                    </span>
                  ) : (
                    <span className="text-[10px] font-black font-mono text-slate-300 uppercase tracking-tighter bg-slate-800/80 px-1 py-0.2 rounded border border-slate-700/60">
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
            </div>
          );
        })}
      </div>
    </div>
  );
};
