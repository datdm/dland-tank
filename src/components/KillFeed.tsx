import React from 'react';
import { CombatEvent } from '../types/game';

interface KillFeedProps {
  events: CombatEvent[];
}

export const KillFeed: React.FC<KillFeedProps> = ({ events }) => {
  // Show up to 5 most recent events
  const visibleEvents = events.slice(-5);

  return (
    <div className="flex flex-col gap-1.5 pointer-events-none select-none max-w-sm">
      {visibleEvents.map((evt, idx) => {
        let prefixColor = 'text-slate-400';
        if (evt.type === 'kill') prefixColor = 'text-rose-400 font-semibold';
        if (evt.type === 'powerup') prefixColor = 'text-amber-400';
        if (evt.type === 'join') prefixColor = 'text-emerald-400';
        if (evt.type === 'leave') prefixColor = 'text-slate-500';

        return (
          <div
            key={`${evt.id || 'evt'}_${evt.timestamp || 0}_${idx}`}
            className="text-xs text-slate-200 bg-slate-950/70 backdrop-blur-sm px-2.5 py-1 rounded border-l-2 shadow-sm animate-in fade-in slide-in-from-left-2 duration-200"
            style={{ borderLeftColor: evt.color || '#94a3b8' }}
          >
            <span className={prefixColor}>{evt.text}</span>
          </div>
        );
      })}
    </div>
  );
};
