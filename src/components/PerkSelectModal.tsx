import React, { useEffect } from 'react';
import { PerkCard, PerkId } from '../types/game';
import { Sparkles, Zap, Shield, ChevronRight } from 'lucide-react';
import { sounds } from '../utils/audio';
import { haptics } from '../utils/haptics';

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
  const [isShortLandscape, setIsShortLandscape] = React.useState(
    () => typeof window !== 'undefined' && (window.innerHeight <= 620 || (window.innerWidth < 768 && window.innerHeight > window.innerWidth))
  );

  useEffect(() => {
    const checkHeight = () => {
      setIsShortLandscape(window.innerHeight <= 620 || (window.innerWidth < 768 && window.innerHeight > window.innerWidth));
    };
    checkHeight();
    window.addEventListener('resize', checkHeight);
    window.addEventListener('orientationchange', checkHeight);
    return () => {
      window.removeEventListener('resize', checkHeight);
      window.removeEventListener('orientationchange', checkHeight);
    };
  }, []);

  useEffect(() => {
    sounds.playPowerUp();
    haptics.celebrate();

    // Keyboard shortcuts (1, 2, 3)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1' && perkChoices[0]) {
        haptics.medium();
        onSelectPerk(perkChoices[0].id);
      } else if (e.key === '2' && perkChoices[1]) {
        haptics.medium();
        onSelectPerk(perkChoices[1].id);
      } else if (e.key === '3' && perkChoices[2]) {
        haptics.medium();
        onSelectPerk(perkChoices[2].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [perkChoices, onSelectPerk]);

  if (!perkChoices || perkChoices.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 select-none overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
      <div className={`w-full max-w-4xl md:max-w-5xl bg-slate-900/95 border-2 border-amber-500/60 rounded-3xl my-auto ${
        isShortLandscape ? 'p-3 sm:p-4 space-y-2 max-h-[82vh]' : 'p-5 sm:p-7 md:p-8 space-y-4 max-h-[85vh]'
      } shadow-2xl text-center relative overflow-y-auto flex flex-col justify-center custom-scrollbar`}>
        {/* Glow Effects */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/15 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-sky-500/15 blur-3xl rounded-full pointer-events-none" />

        {/* Level Up Banner Header */}
        <div className={`relative z-10 ${isShortLandscape ? 'space-y-1' : 'space-y-2'}`}>
          <div className={`inline-flex items-center gap-1.5 ${isShortLandscape ? 'px-3 py-0.5 text-[10px]' : 'px-4 py-1.5 text-xs md:text-sm'} rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/50 text-amber-300 font-mono font-black uppercase tracking-widest shadow-lg`}>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>ROGUELIKE IN-GAME LEVEL UP</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          </div>

          <h2 className={`${isShortLandscape ? 'text-lg sm:text-2xl' : 'text-2xl sm:text-4xl md:text-5xl'} font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-yellow-200 font-mono tracking-tight drop-shadow-md`}>
            THĂNG CẤP LEVEL {level}!
          </h2>

          <p className={`${isShortLandscape ? 'text-[11px]' : 'text-xs sm:text-sm md:text-base'} text-slate-300 max-w-xl mx-auto leading-relaxed`}>
            Chọn <strong className="text-amber-300">1 trong 3 Thẻ Nâng Cấp</strong> để cường hóa xe tăng của bạn:
          </p>
        </div>

        {/* 3 Perk Cards Grid */}
        <div className={`grid grid-cols-3 ${isShortLandscape ? 'gap-1.5 pt-0.5' : 'gap-3 sm:gap-4 md:gap-6 pt-2'} relative z-10`}>
          {perkChoices.map((card, idx) => (
            <button
              key={card.id}
              onClick={() => {
                haptics.medium();
                sounds.playShoot();
                onSelectPerk(card.id);
              }}
              className={`group relative flex flex-col justify-between ${
                isShortLandscape ? 'p-1.5 sm:p-2 rounded-xl' : 'p-4 sm:p-5 md:p-6 rounded-2xl md:rounded-3xl'
              } border-2 text-left transition-all duration-200 cursor-pointer bg-gradient-to-b ${card.themeGradient} hover:scale-102 active:scale-98 shadow-2xl`}
            >
              {/* Keybinding Badge */}
              <div className={`absolute top-1.5 right-1.5 md:top-2 md:right-2 bg-slate-950/80 border border-slate-700 text-slate-300 font-mono font-bold ${
                isShortLandscape ? 'text-[7.5px] px-1 py-0.2' : 'text-[10px] md:text-xs px-2 py-0.5'
              } rounded`}>
                Phím [{idx + 1}]
              </div>

              <div className={isShortLandscape ? 'space-y-0.5' : 'space-y-2 md:space-y-3'}>
                {/* Icon & Badge */}
                <div className={`flex items-center ${isShortLandscape ? 'gap-1.5' : 'gap-2.5 md:gap-3.5'}`}>
                  <div className={`${isShortLandscape ? 'text-base p-1 rounded-lg' : 'text-2xl sm:text-3xl md:text-4xl p-2 md:p-3 rounded-2xl'} bg-slate-950/60 border border-slate-800 shadow-inner group-hover:scale-105 transition-transform shrink-0`}>
                    {card.icon}
                  </div>
                  <div className="min-w-0">
                    <span
                      className={`inline-block font-mono font-black ${isShortLandscape ? 'text-[7px] px-1 py-0 mb-0' : 'text-[9.5px] md:text-xs px-2 py-0.5 mb-1'} rounded uppercase tracking-wider shadow-sm truncate`}
                      style={{ backgroundColor: `${card.color}25`, color: card.color, borderColor: `${card.color}60` }}
                    >
                      {card.badge}
                    </span>
                    <h3 className={`font-extrabold ${isShortLandscape ? 'text-[10px]' : 'text-xs sm:text-sm md:text-base'} text-white group-hover:text-amber-300 transition-colors leading-tight truncate`}>
                      {card.vietnameseName}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className={`${isShortLandscape ? 'text-[8.5px] line-clamp-2 p-1' : 'text-xs md:text-sm min-h-[3.5rem] md:min-h-[4rem] p-2 md:p-3'} text-slate-300 leading-snug bg-slate-950/40 rounded-lg md:rounded-xl border border-slate-800/60`}>
                  {card.description}
                </p>
              </div>

              {/* Action Button */}
              <div className={`${isShortLandscape ? 'mt-1 pt-0.5 text-[8.5px]' : 'mt-3 sm:mt-4 pt-2.5 sm:pt-3 text-xs md:text-sm'} border-t border-slate-800/80 flex items-center justify-between font-bold text-amber-400 group-hover:text-amber-300`}>
                <span>CHỌN THẺ</span>
                <ChevronRight className={`${isShortLandscape ? 'w-3 h-3' : 'w-4 h-4'} group-hover:translate-x-1 transition-transform`} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
