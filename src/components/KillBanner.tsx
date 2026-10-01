import React, { useEffect, useState } from 'react';
import { CombatEvent, COMBAT_MEDALS, CombatMedalType } from '../types/game';
import { Trophy, Flame, Crosshair, ShieldAlert, AlertTriangle, Sparkles, Award } from 'lucide-react';
import { sounds } from '../utils/audio';

interface KillBannerProps {
  recentEvent: CombatEvent | null;
  myPlayerName: string;
  myPlayerId?: string;
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

export const KillBanner: React.FC<KillBannerProps> = ({ recentEvent, myPlayerName, myPlayerId }) => {
  const [activeBanner, setActiveBanner] = useState<BannerData | null>(null);

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
    }, 3800);

    return () => clearTimeout(timer);
  }, [recentEvent, myPlayerName, myPlayerId]);

  if (!activeBanner) return null;

  const currentMedal = activeBanner.medal ? COMBAT_MEDALS[activeBanner.medal] : null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none select-none flex flex-col items-center animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300">
      {activeBanner.bannerType === 'MY_KILL' ? (
        <div
          className={`relative overflow-hidden rounded-3xl border-2 px-6 py-4 min-w-[340px] max-w-lg text-center backdrop-blur-md shadow-2xl ${
            currentMedal
              ? `bg-gradient-to-r ${currentMedal.bgGradient} shadow-[0_0_50px_rgba(234,179,8,0.5)]`
              : 'bg-gradient-to-r from-amber-950/95 via-slate-900/95 to-amber-950/95 border-amber-400/90 shadow-[0_0_40px_rgba(251,191,36,0.45)]'
          }`}
        >
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-400 animate-pulse" />

          {/* If Combat Medal Awarded: Grand Medal Emblem Badge */}
          {currentMedal ? (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <span className="text-3xl animate-bounce drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]">
                  {currentMedal.icon}
                </span>
                <span className="text-sm font-black font-mono tracking-wider text-yellow-300 uppercase drop-shadow-md">
                  {currentMedal.vietnameseTitle}
                </span>
                <span className="text-[10px] font-mono font-bold bg-yellow-400/20 text-yellow-200 border border-yellow-400/40 px-2 py-0.5 rounded-full">
                  {currentMedal.title}
                </span>
              </div>
              <p className="text-[11px] text-yellow-100/90 font-medium">{currentMedal.subtitle}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-300">
              {activeBanner.streakCount && activeBanner.streakCount >= 3 ? (
                <Flame className="w-4 h-4 text-orange-400 animate-bounce" />
              ) : (
                <Crosshair className="w-4 h-4 text-amber-400" />
              )}
              <span>{activeBanner.streakText}</span>
            </div>
          )}

          {/* Defeat Statement */}
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-white text-base sm:text-lg font-black tracking-tight">
              ĐÃ BẮN HẠ
            </span>
            <span className="text-rose-300 text-base sm:text-lg font-black tracking-tight underline decoration-rose-400/60 decoration-2">
              {activeBanner.victimName}
            </span>
          </div>

          {/* Reward Badges */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
            <span className="bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 px-3 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              <span>+{activeBanner.scoreBonus} ĐIỂM CHIẾN ĐẤU</span>
            </span>

            {activeBanner.streakCount && activeBanner.streakCount >= 2 && (
              <span className="bg-amber-500/25 text-amber-300 border border-amber-500/50 px-3 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>CHUỖI {activeBanner.streakCount} MẠNG</span>
              </span>
            )}
          </div>
        </div>
      ) : activeBanner.bannerType === 'MY_DEATH' ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-950/95 via-slate-900/95 to-rose-950/95 border-2 border-rose-500/90 shadow-[0_0_40px_rgba(244,63,94,0.45)] px-6 py-3.5 min-w-[320px] max-w-md text-center backdrop-blur-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-red-300 to-rose-500 animate-pulse" />

          <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider text-rose-300">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>XE TĂNG BỊ TIÊU DIỆT</span>
          </div>

          <div className="mt-1 text-white text-sm sm:text-base font-bold">
            Bị hạ gục bởi <span className="text-rose-400 font-black">{activeBanner.killerName}</span>
          </div>

          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            Hồi sinh để báo thù rửa hận đối thủ!
          </div>
        </div>
      ) : activeBanner.bannerType === 'GLOBAL_STREAK' ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950/95 via-slate-900/95 to-purple-950/95 border-2 border-purple-500/80 shadow-[0_0_35px_rgba(168,85,247,0.35)] px-5 py-3 min-w-[320px] max-w-md text-center backdrop-blur-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-pink-300 to-purple-400 animate-pulse" />

          <div className="flex items-center justify-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-purple-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>HUÂN CHƯƠNG CHIẾN TRƯỜNG</span>
          </div>

          <div className="mt-1 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 flex-wrap">
            <span className="text-purple-300 font-black">{activeBanner.killerName}</span>
            <span className="text-slate-400">hạ gục</span>
            <span className="text-rose-300 font-semibold">{activeBanner.victimName}</span>
            {currentMedal ? (
              <span className="bg-yellow-500/30 text-yellow-300 text-xs px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 border border-yellow-500/50">
                <span>{currentMedal.icon}</span>
                <span>{currentMedal.title}</span>
              </span>
            ) : (
              <span className="bg-purple-500/30 text-purple-200 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                {activeBanner.streakCount} KILLS 🔥
              </span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
