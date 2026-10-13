import React, { useEffect, useState } from 'react';
import { CombatEvent, COMBAT_MEDALS, CombatMedalType } from '../types/game';
import { Trophy, Flame, Crosshair, ShieldAlert, AlertTriangle, Sparkles, Award } from 'lucide-react';
import { sounds } from '../utils/audio';

interface KillBannerProps {
  recentEvent: CombatEvent | null;
  myPlayerName: string;
  myPlayerId?: string;
  isMobile?: boolean;
  isShortLandscape?: boolean;
}

interface BannerData {
  id: string;
  bannerType: 'MY_KILL' | 'MY_DEATH' | 'GLOBAL_STREAK';
  killerName: string;
  victimName: string;
  color?: string;
  streakText?: string;
  streakCount?: number;
  scoreBonus: number;
  medal?: CombatMedalType;
}

export const KillBanner: React.FC<KillBannerProps> = ({
  recentEvent,
  myPlayerName,
  myPlayerId,
  isMobile: propIsMobile,
  isShortLandscape: propIsShortLandscape,
}) => {
  const [activeBanner, setActiveBanner] = useState<BannerData | null>(null);

  const isMobile =
    propIsMobile ??
    (typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 768));
  const isShortLandscape =
    propIsShortLandscape ??
    (typeof window !== 'undefined' && window.innerHeight <= 620 && window.innerWidth > window.innerHeight);

  useEffect(() => {
    if (!recentEvent || recentEvent.type !== 'kill') return;

    const killer = recentEvent.killerName || '';
    const victim = recentEvent.victimName || '';
    const cleanMyName = myPlayerName.trim().toLowerCase();

    const isMyKill =
      (!!myPlayerId && recentEvent.killerId === myPlayerId) ||
      (!!killer && killer.trim().toLowerCase() === cleanMyName);

    const isMyDeath =
      (!!myPlayerId && recentEvent.victimId === myPlayerId) ||
      (!!victim && victim.trim().toLowerCase() === cleanMyName);

    let streakText = '';
    let streakCount = recentEvent.streak || 1;
    let scoreBonus = 100;

    // Detect streak in text if not set
    if (!recentEvent.streak && (recentEvent.text.includes('KILLS') || recentEvent.text.includes('NỔI GIẬN'))) {
      const match = recentEvent.text.match(/\((\d+)\s*KILLS\)/i);
      streakCount = match ? parseInt(match[1], 10) : 3;
    }

    const medal = recentEvent.medal;
    const medalInfo = medal ? COMBAT_MEDALS[medal] : null;

    if (medalInfo) {
      streakText = `${medalInfo.vietnameseTitle} · ${medalInfo.title}`;
      if (medal === 'GODLIKE') scoreBonus = 300;
      else if (medal === 'UNSTOPPABLE') scoreBonus = 250;
      else if (medal === 'RAMPAGE') scoreBonus = 200;
      else if (medal === 'TRIPLE_KILL') scoreBonus = 180;
      else if (medal === 'DOUBLE_KILL') scoreBonus = 150;
      else if (medal === 'SNIPER') scoreBonus = 160;
      else if (medal === 'REVENGE') scoreBonus = 175;
      else if (medal === 'FIRST_BLOOD') scoreBonus = 150;
    } else if (streakCount >= 5) {
      streakText = 'UNSTOPPABLE · CHIẾN THẦN HUYỀN THOẠI 👑';
      scoreBonus = 200;
    } else if (streakCount === 4) {
      streakText = 'MEGA KILL · BẬC THẦY TIÊU DIỆT 💥';
      scoreBonus = 180;
    } else if (streakCount === 3) {
      streakText = 'TRIPLE KILL · ĐANG NỔI GIẬN 🔥';
      scoreBonus = 160;
    } else if (streakCount === 2) {
      streakText = 'DOUBLE KILL · HẠ GỤC LIÊN TIẾP ⚡';
      scoreBonus = 140;
    } else {
      streakText = 'TIÊU DIỆT ĐỐI THỦ THÀNH CÔNG 🎯';
      scoreBonus = 100;
    }

    if (isMyKill) {
      if (medal) {
        sounds.playMedalFanfare(medal);
        if (medalInfo) {
          sounds.announce(medalInfo.voiceText, medalInfo.viVoiceText);
        }
      } else {
        sounds.playKill(streakCount);
      }

      setActiveBanner({
        id: recentEvent.id,
        bannerType: 'MY_KILL',
        killerName: killer,
        victimName: victim,
        color: recentEvent.color,
        streakText,
        streakCount,
        scoreBonus,
        medal,
      });
    } else if (isMyDeath) {
      sounds.playExplosion();
      setActiveBanner({
        id: recentEvent.id,
        bannerType: 'MY_DEATH',
        killerName: killer,
        victimName: victim,
        color: recentEvent.color,
        streakText,
        streakCount,
        scoreBonus,
        medal,
      });
    } else if (streakCount >= 3 || medal === 'FIRST_BLOOD' || medal === 'GODLIKE' || medal === 'UNSTOPPABLE') {
      // Global broadcast notice with tactical announcer voice for significant battlefield events
      if (medalInfo && (medal === 'FIRST_BLOOD' || medal === 'GODLIKE')) {
        sounds.announce(medalInfo.voiceText, medalInfo.viVoiceText);
      }

      setActiveBanner({
        id: recentEvent.id,
        bannerType: 'GLOBAL_STREAK',
        killerName: killer,
        victimName: victim,
        color: recentEvent.color,
        streakText,
        streakCount,
        scoreBonus,
        medal,
      });
    } else {
      return;
    }

    const timer = setTimeout(() => {
      setActiveBanner(null);
    }, 1000);

    return () => clearTimeout(timer);
  }, [recentEvent, myPlayerName, myPlayerId]);

  if (!activeBanner) return null;

  const currentMedal = activeBanner.medal ? COMBAT_MEDALS[activeBanner.medal] : null;

  // 1. If player died: show clean banner on top right corner below settings / HP bar
  if (activeBanner.bannerType === 'MY_DEATH') {
    return (
      <div className="fixed top-18 sm:top-20 right-2 sm:right-3.5 z-40 pointer-events-none select-none flex flex-col items-end animate-in fade-in slide-in-from-right-4 duration-200 max-w-[240px] sm:max-w-[280px]">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-rose-950/95 via-slate-900/95 to-rose-950/95 border border-rose-500/80 shadow-[0_4px_25px_rgba(244,63,94,0.35)] px-3 py-1.5 sm:px-3.5 sm:py-2 text-right backdrop-blur-md w-full">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 via-red-300 to-rose-500 animate-pulse" />

          <div className="flex items-center justify-end gap-1 text-[9.5px] sm:text-xs font-black uppercase tracking-wider text-rose-300">
            <span>XE TĂNG BỊ TIÊU DIỆT</span>
            <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
          </div>

          <div className="mt-0.5 text-white text-[11px] sm:text-xs font-bold truncate">
            Bị hạ gục bởi <span className="text-rose-400 font-black">{activeBanner.killerName}</span>
          </div>

          <div className="mt-0.5 text-[8.5px] sm:text-[9.5px] text-slate-400 font-mono">
            Hồi sinh để tiếp tục chiến đấu!
          </div>
        </div>
      </div>
    );
  }

  // 2. On Mobile: CHIẾN BÁO (GLOBAL_STREAK) strictly 1 single line in top-right corner
  if (activeBanner.bannerType === 'GLOBAL_STREAK' && (isMobile || isShortLandscape)) {
    return (
      <div className="fixed top-18 sm:top-20 right-2 sm:right-3.5 z-40 pointer-events-none select-none flex items-center animate-in fade-in slide-in-from-right-4 duration-200 max-w-[94vw]">
        <div className="relative overflow-hidden rounded-full bg-gradient-to-r from-purple-950/95 via-slate-900/95 to-purple-950/95 border border-purple-500/80 shadow-[0_2px_18px_rgba(168,85,247,0.4)] px-2.5 py-1 text-[10px] sm:text-xs font-bold text-white flex items-center gap-1.5 backdrop-blur-md whitespace-nowrap">
          <div className="flex items-center gap-1 text-amber-300 font-mono font-black text-[9px] sm:text-[10px] shrink-0">
            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
            <span>CHIẾN BÁO</span>
          </div>
          <span className="text-slate-600 font-mono">|</span>
          <span className="text-purple-300 font-black truncate max-w-[85px] sm:max-w-[110px]">{activeBanner.killerName}</span>
          <span className="text-slate-400 font-normal text-[9px] sm:text-[10px]">hạ gục</span>
          <span className="text-rose-300 font-semibold truncate max-w-[85px] sm:max-w-[110px]">{activeBanner.victimName}</span>
          {currentMedal ? (
            <span className="bg-yellow-500/30 text-yellow-300 text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold flex items-center gap-0.5 border border-yellow-500/50 shrink-0">
              <span>{currentMedal.icon}</span>
              <span>{currentMedal.title}</span>
            </span>
          ) : (
            <span className="bg-purple-500/30 text-purple-200 text-[8.5px] px-1.5 py-0.2 rounded font-mono font-bold shrink-0">
              {activeBanner.streakCount} KILLS 🔥
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-12 sm:top-14 right-2 sm:right-3.5 z-40 pointer-events-none select-none flex flex-col items-end animate-in fade-in slide-in-from-right-3 duration-150 max-w-[240px] sm:max-w-[280px]">
      {activeBanner.bannerType === 'MY_KILL' ? (
        <div
          className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border sm:border-2 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-right min-w-[200px] sm:min-w-[240px] max-w-[240px] sm:max-w-[280px] text-center backdrop-blur-md shadow-2xl ${
            currentMedal
              ? `bg-gradient-to-r ${currentMedal.bgGradient} shadow-[0_0_35px_rgba(234,179,8,0.45)]`
              : 'bg-gradient-to-r from-amber-950/95 via-slate-900/95 to-amber-950/95 border-amber-400/90 shadow-[0_0_30px_rgba(251,191,36,0.35)]'
          }`}
        >
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-400 animate-pulse" />

          {/* If Combat Medal Awarded: Grand Medal Emblem Badge */}
          {currentMedal ? (
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg">
                  {currentMedal.icon}
                </span>
                <span className="text-[10px] sm:text-xs font-black font-mono text-yellow-300 uppercase">
                  {currentMedal.vietnameseTitle}
                </span>
                <span className="text-[8px] sm:text-[10px] font-mono font-bold bg-yellow-400/20 text-yellow-200 border border-yellow-400/40 px-1.5 py-0.2 rounded-full">
                  {currentMedal.title}
                </span>
              </div>
              <p className="text-[8px] sm:text-[9.5px] text-yellow-100/90 font-medium truncate">{currentMedal.subtitle}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-300">
              {activeBanner.streakCount && activeBanner.streakCount >= 3 ? (
                <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400 animate-bounce" />
              ) : (
                <Crosshair className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
              )}
              <span>{activeBanner.streakText}</span>
            </div>
          )}

          {/* Defeat Statement */}
          <div className="mt-1 flex items-center justify-center gap-1.5">
            <span className="text-white text-[10px] sm:text-xs font-black tracking-tight">
              ĐÃ BẮN HẠ
            </span>
            <span className="text-rose-300 text-[10px] sm:text-xs font-black tracking-tight underline decoration-rose-400/60 decoration-1 sm:decoration-2">
              {activeBanner.victimName}
            </span>
          </div>

          {/* Reward Badges */}
          <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5 text-[9px] sm:text-xs font-mono">
            <span className="bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 px-2 sm:px-3 py-0.2 sm:py-0.5 rounded-full font-bold flex items-center gap-1">
              <Trophy className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-emerald-400" />
              <span>+{activeBanner.scoreBonus} ĐIỂM</span>
            </span>

            {activeBanner.streakCount && activeBanner.streakCount >= 2 && (
              <span className="bg-amber-500/25 text-amber-300 border border-amber-500/50 px-2 sm:px-3 py-0.2 sm:py-0.5 rounded-full font-bold flex items-center gap-1">
                <Flame className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-orange-400" />
                <span>CHUỖI {activeBanner.streakCount}🔥</span>
              </span>
            )}
          </div>
        </div>
      ) : activeBanner.bannerType === 'GLOBAL_STREAK' ? (
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-purple-950/95 via-slate-900/95 to-purple-950/95 border sm:border-2 border-purple-500/80 shadow-[0_0_25px_rgba(168,85,247,0.3)] px-3 py-1.5 sm:px-5 sm:py-2.5 min-w-[240px] sm:min-w-[300px] max-w-xs sm:max-w-md text-center backdrop-blur-md">
          <div className="absolute top-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-purple-400 via-pink-300 to-purple-400 animate-pulse" />

          <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-purple-300">
            <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
            <span>CHIẾN BÁO</span>
          </div>

          <div className="mt-0.5 text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 flex-wrap">
            <span className="text-purple-300 font-black">{activeBanner.killerName}</span>
            <span className="text-slate-400">hạ gục</span>
            <span className="text-rose-300 font-semibold">{activeBanner.victimName}</span>
            {currentMedal ? (
              <span className="bg-yellow-500/30 text-yellow-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold flex items-center gap-0.5 border border-yellow-500/50">
                <span>{currentMedal.icon}</span>
                <span>{currentMedal.title}</span>
              </span>
            ) : (
              <span className="bg-purple-500/30 text-purple-200 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">
                {activeBanner.streakCount} KILLS 🔥
              </span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
