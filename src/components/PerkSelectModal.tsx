import React, { useEffect } from 'react';
import { PerkCard, PerkId } from '../types/game';
import { Sparkles, Zap, Shield, ChevronRight } from 'lucide-react';
import { sounds } from '../utils/audio';

interface PerkSelectModalProps {
  level: number;
  perkChoices: PerkCard[];
  onSelectPerk: (perkId: PerkId) => void;
}

export const PerkSelectModal: React.FC<PerkSelectModalProps> = ({
  level,
  perkChoices,
  onSelectPerk,
}) => {
  useEffect(() => {
    sounds.playPowerUp();

    // Keyboard shortcuts (1, 2, 3)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1' && perkChoices[0]) {
        onSelectPerk(perkChoices[0].id);
      } else if (e.key === '2' && perkChoices[1]) {
        onSelectPerk(perkChoices[1].id);
      } else if (e.key === '3' && perkChoices[2]) {
        onSelectPerk(perkChoices[2].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [perkChoices, onSelectPerk]);

  if (!perkChoices || perkChoices.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 select-none animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-4xl bg-slate-900/90 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/15 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-sky-500/15 blur-3xl rounded-full pointer-events-none" />

        {/* Level Up Banner Header */}
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/50 text-amber-300 font-mono font-black text-xs uppercase tracking-widest shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span>ROGUELIKE IN-GAME LEVEL UP</span>
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-yellow-200 font-mono tracking-tight drop-shadow-md">
            THĂNG CẤP LEVEL {level}!
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Chọn <strong className="text-amber-300">1 trong 3 Thẻ Nâng Cấp</strong> bên dưới để cường hóa vĩnh viễn xe tăng của bạn trong trận đấu này (Phím 1, 2, 3):
          </p>
        </div>

        {/* 3 Perk Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10 pt-2">
          {perkChoices.map((card, idx) => (
            <button
              key={card.id}
              onClick={() => {
                sounds.playShoot();
                onSelectPerk(card.id);
              }}
              className={`group relative flex flex-col justify-between p-5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer bg-gradient-to-b ${card.themeGradient} hover:scale-105 hover:-translate-y-1 shadow-2xl`}
            >
              {/* Keybinding Badge */}
              <div className="absolute top-3 right-3 bg-slate-950/80 border border-slate-700 text-slate-300 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md">
                Phím [{idx + 1}]
              </div>

              <div className="space-y-3">
                {/* Icon & Badge */}
                <div className="flex items-center gap-3">
                  <div className="text-3xl sm:text-4xl p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 shadow-inner group-hover:scale-110 transition-transform">
                    {card.icon}
                  </div>
                  <div>
                    <span
                      className="inline-block text-[10px] font-mono font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-sm mb-1"
                      style={{ backgroundColor: `${card.color}25`, color: card.color, borderColor: `${card.color}60` }}
                    >
                      {card.badge}
                    </span>
                    <h3 className="font-extrabold text-sm sm:text-base text-white group-hover:text-amber-300 transition-colors leading-snug">
                      {card.vietnameseName}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed min-h-[3.5rem] bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                  {card.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300">
                <span>MỞ KHÓA KỸ NĂNG</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
