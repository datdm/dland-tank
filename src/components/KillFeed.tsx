import React from 'react';
import { CombatEvent } from '../types/game';

interface KillFeedProps {
  events: CombatEvent[];
}

export const KillFeed: React.FC<KillFeedProps> = ({ events }) => {
  // Only show 'kill' and 'join' events
  const filteredEvents = events.filter((evt) => evt.type === 'kill' || evt.type === 'join');
  const visibleEvents = filteredEvents.slice(-5);

  return (
    <div className="flex flex-col gap-1.5 pointer-events-none select-none max-w-sm">
      {visibleEvents.map((evt, idx) => {
        let prefixColor = 'text-slate-400';
        if (evt.type === 'kill') prefixColor = 'text-rose-400 font-semibold';
        if (evt.type === 'join') prefixColor = 'text-emerald-400 font-semibold';

        return (
          <div
            key={`${evt.id || 'evt'}_${evt.timestamp || 0}_${idx}`}
            className="text-xs text-slate-200 bg-slate-950/75 backdrop-blur-md px-2.5 py-1 rounded-lg border-l-2 shadow-md animate-in fade-in slide-in-from-left-2 duration-200"
            style={{ borderLeftColor: evt.color || (evt.type === 'join' ? '#10b981' : '#ef4444') }}
          >
            <span className={prefixColor}>{evt.text}</span>
          </div>
        );
      })}
    </div>
  );
};
