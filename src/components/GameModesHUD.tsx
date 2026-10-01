import React from 'react';
import { GameMode, StormZone, TeamScore, BossInfo, PlayerTank, Team } from '../types/game';
import { Shield, Skull, Zap, Trophy, Flame, AlertTriangle, Users, Award, Crown } from 'lucide-react';

interface GameModesHUDProps {
  mode?: GameMode;
  storm?: StormZone;
  teamScore?: TeamScore;
  boss?: BossInfo | null;
  aliveCount?: number;
  totalParticipants?: number;
  brWinner?: { id: string; name: string; color: string; kills: number } | null;
  myTank: PlayerTank | null | undefined;
}

export const GameModesHUD: React.FC<GameModesHUDProps> = ({
  mode,
  storm,
  teamScore,
  boss,
  aliveCount = 0,
  totalParticipants = 0,
  brWinner,
  myTank,
}) => {
  if (!mode || mode === 'AI') return null;

  return (
    <div className="pointer-events-none select-none">
      {/* ======================================================== */}
      {/* 1. BATTLE ROYALE HUD (VÒNG BO SINH TỒN)                  */}
      {/* ======================================================== */}
      {mode === 'BATTLE_ROYALE' && storm && (
        <>
          {/* Top Status Bar for BR */}
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-25 flex flex-col items-center gap-1.5 w-full max-w-md px-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between w-full bg-slate-950/90 border border-purple-500/50 rounded-2xl px-4 py-2 shadow-2xl backdrop-blur-md">
              {/* Alive Count */}
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  <Skull className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">
                    CÒN SỐNG
                  </div>
                  <div className="text-base font-black font-mono text-white">
                    {aliveCount} <span className="text-xs text-slate-400 font-normal">/ {totalParticipants}</span>
                  </div>
                </div>
              </div>

              {/* Storm Phase & Countdown */}
              <div className="text-right">
                <div className="text-[10px] text-purple-300 font-mono font-bold uppercase tracking-wider flex items-center gap-1 justify-end">
                  <Zap className="w-3 h-3 text-purple-400 animate-pulse" />
                  <span>VÒNG BO GIAI ĐOẠN {storm.phase}</span>
                </div>
                <div className="text-sm font-black font-mono text-amber-300">
                  {storm.isShrinking ? (
                    <span className="text-rose-400 animate-pulse">ĐANG THU HẸP!</span>
                  ) : (
                    `Co lại sau: ${Math.max(0, Math.round(storm.phaseTimeLeft))}s`
                  )}
                </div>
              </div>
            </div>

            {/* In-Storm Warning Flash */}
            {myTank?.inStorm && !myTank.isDead && (
              <div className="w-full flex items-center justify-center gap-2 bg-rose-600/90 border border-rose-400 text-white font-black text-xs px-4 py-1.5 rounded-xl shadow-lg animate-pulse tracking-wide uppercase">
                <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                <span>CẢNH BÁO: BẠN ĐANG Ở NGOÀI BO (BỊ RÚT MÁU LIÊN TỤC)!</span>
              </div>
            )}
          </div>

          {/* Winner Winner Chicken Dinner Modal */}
          {brWinner && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in zoom-in-90 duration-300">
              <div className="max-w-md w-full bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden space-y-4">
                <div className="text-5xl animate-bounce">👑</div>
                <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 font-mono font-black text-xs tracking-widest uppercase">
                  BATTLE ROYALE CHAMPION
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-yellow-200 font-mono">
                  WINNER WINNER CHICKEN DINNER!
                </h2>
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                    CHIẾN THẦN SỐNG SÓT DUY NHẤT:
                  </div>
                  <div className="text-xl font-black text-white" style={{ color: brWinner.color }}>
                    {brWinner.name}
                  </div>
                  <div className="text-xs font-mono text-emerald-400 font-bold">
                    Tổng hạ gục: {brWinner.kills} Kills
                  </div>
                </div>
                <p className="text-xs text-slate-400 font-mono animate-pulse">
                  Trận đấu sinh tồn mới sẽ tự động bắt đầu sau ít giây...
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ======================================================== */}
      {/* 2. TEAM DEATHMATCH HUD (ĐẤU ĐỘI 🔴 ĐỎ VS 🔵 XANH)         */}
      {/* ======================================================== */}
      {mode === 'TEAM_DEATHMATCH' && teamScore && (
        <>
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-25 flex flex-col items-center gap-1.5 w-full max-w-md px-3 animate-in fade-in duration-200">
            {/* Team Scoreboard Banner */}
            <div className="flex items-center justify-between w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl px-4 py-2 shadow-2xl backdrop-blur-md">
              {/* Red Team */}
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-md shadow-rose-500/50" />
                <div>
                  <div className="text-[10px] text-rose-300 font-mono font-extrabold uppercase">
                    ĐỘI ĐỎ
                  </div>
                  <div className="text-lg font-black font-mono text-rose-400 leading-tight">
                    {teamScore.red}
                  </div>
                </div>
              </div>

              {/* Goal Target */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-400 font-mono uppercase tracking-widest font-bold">
                  MỤC TIÊU 30 KILLS
                </span>
                <span className="text-xs font-mono font-black text-amber-400">VS</span>
              </div>

              {/* Blue Team */}
              <div className="flex items-center gap-2 text-right">
                <div>
                  <div className="text-[10px] text-sky-300 font-mono font-extrabold uppercase">
                    ĐỘI XANH
                  </div>
                  <div className="text-lg font-black font-mono text-sky-400 leading-tight">
                    {teamScore.blue}
                  </div>
                </div>
                <span className="w-3.5 h-3.5 rounded-full bg-sky-500 shadow-md shadow-sky-500/50" />
              </div>
            </div>

            {/* In-Base Healing Notice */}
            {myTank?.inHealingBase && !myTank.isDead && (
              <div className="flex items-center justify-center gap-2 bg-emerald-600/90 border border-emerald-400 text-white font-black text-xs px-4 py-1.5 rounded-xl shadow-lg animate-pulse tracking-wide uppercase">
                <Shield className="w-4 h-4 text-emerald-200 shrink-0" />
                <span>CĂN CỨ ĐỒNG MINH (+20 HP/s & NẠP GIÁP)!</span>
              </div>
            )}
          </div>

          {/* TDM Victory Banner */}
          {teamScore.winner && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in zoom-in-90 duration-300">
              <div className="max-w-md w-full bg-slate-900 border-2 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden space-y-4"
                style={{ borderColor: teamScore.winner === 'RED' ? '#ef4444' : '#3b82f6' }}
              >
                <div className="text-5xl animate-bounce">🏆</div>
                <h2 className="text-2xl sm:text-3xl font-black font-mono"
                  style={{ color: teamScore.winner === 'RED' ? '#ef4444' : '#38bdf8' }}
                >
                  {teamScore.winner === 'RED' ? 'ĐỘI ĐỎ CHIẾN THẮNG!' : 'ĐỘI XANH CHIẾN THẮNG!'}
                </h2>
                <p className="text-sm text-slate-300 font-medium">
                  Đã xuất sắc đạt cột mốc <strong className="text-amber-400">30 Kills</strong> đầu tiên trên chiến trường!
                </p>
                <div className="text-xs text-slate-400 font-mono animate-pulse">
                  Trận đấu mới sẽ bắt đầu sau ít giây...
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ======================================================== */}
      {/* 3. WORLD BOSS RAID HUD (SIÊU XE TĂNG LEVIATHAN)          */}
      {/* ======================================================== */}
      {(mode === 'BOSS_RAID' || boss?.isAlive) && boss && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-25 flex flex-col items-center gap-1 w-full max-w-lg px-3 animate-in fade-in duration-200">
          {boss.isAlive ? (
            <div className="w-full bg-slate-950/90 border border-amber-500/60 rounded-2xl p-3 shadow-2xl backdrop-blur-md space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="p-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 font-black">
                    BOSS
                  </span>
                  <span className="font-black text-amber-300 uppercase tracking-wide">
                    SIÊU XE TĂNG LEVIATHAN
                  </span>
                </div>
                <div className="font-bold text-slate-200 tabular-nums">
                  {Math.max(0, boss.hp)} / {boss.maxHp} HP
                </div>
              </div>

              {/* Boss HP Bar */}
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 rounded-full transition-all duration-200 shadow-md"
                  style={{ width: `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%` }}
                />
              </div>

              {/* Boss Shield if present */}
              {boss.shield > 0 && (
                <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300">
                  <span>LÁ CHẮN TỪ TRƯỜNG:</span>
                  <span>{boss.shield} GIÁP</span>
                </div>
              )}
            </div>
          ) : (
            boss.respawnTimeLeft && boss.respawnTimeLeft > 0 && (
              <div className="bg-slate-950/85 border border-slate-800 rounded-xl px-3 py-1.5 shadow-lg backdrop-blur-md text-[11px] font-mono text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Siêu Boss Leviathan sẽ hồi sinh sau:</span>
                <span className="text-amber-300 font-bold tabular-nums">
                  {Math.floor(boss.respawnTimeLeft / 60)}m {Math.floor(boss.respawnTimeLeft % 60)}s
                </span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
