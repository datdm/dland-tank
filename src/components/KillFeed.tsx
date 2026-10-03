import React, { useState, useEffect } from 'react';
import { CombatEvent } from '../types/game';

interface KillFeedProps {
  events: CombatEvent[];
  isShortLandscape?: boolean;
}

export const KillFeed: React.FC<KillFeedProps> = ({ events, isShortLandscape: propShortLandscape }) => {
  const [internalShortLandscape, setInternalShortLandscape] = useState(
    () => typeof window !== 'undefined' && window.innerHeight <= 560 && window.innerWidth > window.innerHeight
  );

  useEffect(() => {
    const handleResize = () => {
      setInternalShortLandscape(window.innerHeight <= 560 && window.innerWidth > window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const isShortLandscape = propShortLandscape !== undefined ? propShortLandscape : internalShortLandscape;

  // Only show 'kill' and 'join' events
  const filteredEvents = events.filter((evt) => evt.type === 'kill' || evt.type === 'join');
  // On mobile landscape, show only the latest 2 events to avoid blocking screen
  const maxEvents = isShortLandscape ? 2 : 5;
  const visibleEvents = filteredEvents.slice(-maxEvents);

  return (
    <div className={`flex flex-col ${isShortLandscape ? 'gap-0.5 max-w-[200px]' : 'gap-1.5 max-w-sm'} pointer-events-none select-none`}>
      {visibleEvents.map((evt, idx) => {
        let prefixColor = 'text-slate-400';
        if (evt.type === 'kill') prefixColor = 'text-rose-400 font-semibold';
        if (evt.type === 'join') prefixColor = 'text-emerald-400 font-semibold';

        return (
          <div
            key={`${evt.id || 'evt'}_${evt.timestamp || 0}_${idx}`}
            className={`${
              isShortLandscape
                ? 'text-[9px] px-1.5 py-0.5 rounded border-l-2'
                : 'text-xs px-2.5 py-1 rounded-lg border-l-2'
            } text-slate-200 bg-slate-950/85 backdrop-blur-md shadow-md animate-in fade-in slide-in-from-left-2 duration-150 truncate`}
            style={{ borderLeftColor: evt.color || (evt.type === 'join' ? '#10b981' : '#ef4444') }}
          >
            <span className={prefixColor}>{evt.text}</span>
          </div>
        );
      })}
    </div>
  );
};
