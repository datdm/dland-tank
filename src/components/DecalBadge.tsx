import React from 'react';
import { RoofDecalId } from '../types/game';

interface DecalBadgeProps {
  decalId: RoofDecalId;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showWavingAnimation?: boolean;
}

export const DecalBadge: React.FC<DecalBadgeProps> = ({
  decalId,
  size = 'md',
  className = '',
  showWavingAnimation = false,
}) => {
  const sizeMap = {
    sm: 'w-5 h-4 text-xs',
    md: 'w-8 h-6 text-sm',
    lg: 'w-12 h-9 text-lg',
    xl: 'w-16 h-12 text-2xl',
  };

  const containerSize = sizeMap[size];

  if (decalId === 'FLAG_VIETNAM') {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-sm overflow-hidden shadow-md border border-amber-400/50 ${containerSize} ${className} ${
          showWavingAnimation ? 'animate-pulse' : ''
        }`}
        title="Cờ Đỏ Sao Vàng Việt Nam"
      >
        {/* Flag of Vietnam: Pure SVG Red with Golden Star */}
        <svg
          viewBox="0 0 30 20"
          className="w-full h-full drop-shadow-sm select-none pointer-events-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="vnFlagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e11d48" />
              <stop offset="50%" stopColor="#da251d" />
              <stop offset="100%" stopColor="#be123c" />
            </linearGradient>
            <linearGradient id="vnStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#ffd700" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
          </defs>
          {/* Red Flag Cloth */}
          <rect width="30" height="20" fill="url(#vnFlagGrad)" />
          {/* Subtle cloth ripple highlight */}
          <path
            d="M 0,0 Q 8,5 15,2 T 30,3 L 30,20 Q 22,17 15,19 T 0,20 Z"
            fill="rgba(255, 255, 255, 0.08)"
          />
          {/* Perfect 5-Pointed Gold Star */}
          {/* Center (15, 10), R=6.0, r=2.4 */}
          <polygon
            points="
              15,4
              16.76,8.14
              21.23,8.47
              17.82,11.39
              18.88,15.76
              15,13.3
              11.12,15.76
              12.18,11.39
              8.77,8.47
              13.24,8.14
            "
            fill="url(#vnStarGrad)"
            stroke="#b45309"
            strokeWidth="0.3"
          />
        </svg>
      </div>
    );
  }

  if (decalId === 'PIRATE_SKULL') {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-sm overflow-hidden shadow-md border border-slate-600 bg-slate-950 ${containerSize} ${className}`}
        title="Cờ Hải Tặc Jolly Roger"
      >
        <svg viewBox="0 0 30 20" className="w-full h-full select-none" preserveAspectRatio="none">
          <rect width="30" height="20" fill="#090d16" />
          {/* Crossed Bones */}
          <line x1="8" y1="5" x2="22" y2="15" stroke="#e2e8f0" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="22" y1="5" x2="8" y2="15" stroke="#e2e8f0" strokeWidth="2.2" strokeLinecap="round" />
          {/* Skull */}
          <circle cx="15" cy="8.5" r="4.5" fill="#f8fafc" />
          <rect x="13.2" y="11.5" width="3.6" height="2.8" rx="0.5" fill="#f8fafc" />
          {/* Eyes & Teeth */}
          <circle cx="13.5" cy="8" r="1.1" fill="#090d16" />
          <circle cx="16.5" cy="8" r="1.1" fill="#090d16" />
          <line x1="14.4" y1="12" x2="14.4" y2="14.3" stroke="#090d16" strokeWidth="0.5" />
          <line x1="15.6" y1="12" x2="15.6" y2="14.3" stroke="#090d16" strokeWidth="0.5" />
        </svg>
      </div>
    );
  }

  if (decalId === 'MILITARY_STAR') {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-sm overflow-hidden shadow-md border border-amber-500/60 bg-gradient-to-br from-amber-950/80 to-slate-950 ${containerSize} ${className}`}
        title="Ngôi Sao Quân Sự Vàng"
      >
        <svg viewBox="0 0 30 20" className="w-full h-full select-none" preserveAspectRatio="none">
          <circle cx="15" cy="10" r="8" fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="1.5,1.5" />
          <polygon
            points="
              15,3
              16.9,8.4
              22.6,8.8
              18.2,12.5
              19.6,18
              15,15
              10.4,18
              11.8,12.5
              7.4,8.8
              13.1,8.4
            "
            fill="#fbbf24"
            stroke="#d97706"
            strokeWidth="0.5"
          />
        </svg>
      </div>
    );
  }

  if (decalId === 'TIGER_BEAST') {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-sm overflow-hidden shadow-md border border-orange-500/60 bg-gradient-to-br from-orange-950/80 to-slate-950 ${containerSize} ${className}`}
        title="Icon Mãnh Hổ Chiến Trận"
      >
        <span className="text-base select-none pointer-events-none">🐯</span>
      </div>
    );
  }

  if (decalId === 'DRAGON_CREST') {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-sm overflow-hidden shadow-md border border-red-500/60 bg-gradient-to-br from-red-950/80 to-slate-950 ${containerSize} ${className}`}
        title="Biểu Tượng Rồng Lửa"
      >
        <span className="text-base select-none pointer-events-none">🐉</span>
      </div>
    );
  }

  if (decalId === 'ROYAL_SHIELD') {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-sm overflow-hidden shadow-md border border-cyan-500/60 bg-gradient-to-br from-cyan-950/80 to-slate-950 ${containerSize} ${className}`}
        title="Khiên Hiệp Sĩ Hoàng Gia"
      >
        <span className="text-base select-none pointer-events-none">🛡️</span>
      </div>
    );
  }

  // NONE
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-sm border border-slate-700/60 bg-slate-950/60 text-slate-500 ${containerSize} ${className}`}
      title="Không Gắn Decal"
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-slate-500" fill="none" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <line x1="5.7" y1="5.7" x2="18.3" y2="18.3" />
      </svg>
    </div>
  );
};
