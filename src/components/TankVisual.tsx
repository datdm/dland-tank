import React from 'react';
import { TankClass } from '../types/game';

interface TankVisualProps {
  tankClass: TankClass;
  color: string;
  size?: number;
  animated?: boolean;
  turretAngle?: number;
}

export const TankVisual: React.FC<TankVisualProps> = ({
  tankClass,
  color,
  size = 100,
  animated = false,
  turretAngle = 0,
}) => {
  const primaryColor = color;
  const treadColor = '#1e293b';
  const rollerColor = '#475569';
  const highlightColor = 'rgba(255, 255, 255, 0.25)';

  if (tankClass === 'SCOUT') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="-60 -60 120 120"
        className={`overflow-visible select-none ${animated ? 'transition-all duration-300' : ''}`}
      >
        <circle cx="0" cy="0" r="48" fill={primaryColor} fillOpacity="0.15" />
        <ellipse cx="2" cy="8" rx="28" ry="22" fill="rgba(0,0,0,0.4)" filter="blur(3px)" />

        {/* Left Track */}
        <rect x="-26" y="-30" width="9" height="60" rx="3" fill={treadColor} stroke="#020617" strokeWidth="1.5" />
        {[-22, -12, -2, 8, 18].map((y, idx) => (
          <line key={`tl_${idx}`} x1="-26" y1={y} x2="-17" y2={y} stroke="#475569" strokeWidth="1" />
        ))}
        {[-16, 0, 16].map((y, idx) => (
          <circle key={`rl_${idx}`} cx="-21.5" cy={y} r="2.5" fill={rollerColor} stroke="#0f172a" strokeWidth="1" />
        ))}

        {/* Right Track */}
        <rect x="17" y="-30" width="9" height="60" rx="3" fill={treadColor} stroke="#020617" strokeWidth="1.5" />
        {[-22, -12, -2, 8, 18].map((y, idx) => (
          <line key={`tr_${idx}`} x1="17" y1={y} x2="26" y2={y} stroke="#475569" strokeWidth="1" />
        ))}
        {[-16, 0, 16].map((y, idx) => (
          <circle key={`rr_${idx}`} cx="21.5" cy={y} r="2.5" fill={rollerColor} stroke="#0f172a" strokeWidth="1" />
        ))}

        {/* Aerodynamic Chassis */}
        <path
          d="M 0 -32 L 16 -16 L 16 24 L 9 30 L -9 30 L -16 24 L -16 -16 Z"
          fill={primaryColor}
          stroke="#020617"
          strokeWidth="1.5"
        />
        <path d="M 0 -28 L 12 -14 L 12 20 L 0 26 L -12 20 L -12 -14 Z" fill="rgba(0,0,0,0.2)" />
        <line x1="0" y1="-26" x2="0" y2="23" stroke={highlightColor} strokeWidth="1.5" />

        {/* Turret Group */}
        <g transform={`rotate(${turretAngle})`}>
          <rect x="-2" y="-46" width="4" height="32" rx="1" fill="#475569" stroke="#020617" strokeWidth="1.2" />
          <rect x="-4" y="-50" width="8" height="6" rx="1" fill="#0f172a" stroke={primaryColor} strokeWidth="1" />
          <circle cx="0" cy="0" r="13" fill="#0f172a" stroke="#020617" strokeWidth="1.5" />
          <polygon points="0,-15 10,-3 7,9 -7,9 -10,-3" fill={primaryColor} stroke="#020617" strokeWidth="1.5" />
          <circle cx="0" cy="2" r="4" fill="#1e293b" stroke="#020617" strokeWidth="1" />
          <circle cx="4" cy="-4" r="1.5" fill="#38bdf8" />
        </g>
      </svg>
    );
  }

  if (tankClass === 'JUGGERNAUT') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="-60 -60 120 120"
        className={`overflow-visible select-none ${animated ? 'transition-all duration-300' : ''}`}
      >
        <circle cx="0" cy="0" r="52" fill={primaryColor} fillOpacity="0.15" />
        <ellipse cx="2" cy="10" rx="34" ry="28" fill="rgba(0,0,0,0.5)" filter="blur(4px)" />

        {/* Heavy Quad Tracks */}
        <rect x="-33" y="-32" width="12" height="64" rx="4" fill={treadColor} stroke="#020617" strokeWidth="1.5" />
        {[-24, -14, -4, 6, 16, 24].map((y, idx) => (
          <line key={`jtl_${idx}`} x1="-33" y1={y} x2="-21" y2={y} stroke="#64748b" strokeWidth="1.5" />
        ))}
        {[-18, -6, 6, 18].map((y, idx) => (
          <circle key={`jrl_${idx}`} cx="-27" cy={y} r="3" fill={rollerColor} stroke="#020617" strokeWidth="1" />
        ))}

        <rect x="21" y="-32" width="12" height="64" rx="4" fill={treadColor} stroke="#020617" strokeWidth="1.5" />
        {[-24, -14, -4, 6, 16, 24].map((y, idx) => (
          <line key={`jtr_${idx}`} x1="21" y1={y} x2="33" y2={y} stroke="#64748b" strokeWidth="1.5" />
        ))}
        {[-18, -6, 6, 18].map((y, idx) => (
          <circle key={`jrr_${idx}`} cx="27" cy={y} r="3" fill={rollerColor} stroke="#020617" strokeWidth="1" />
        ))}

        {/* Heavy Hull */}
        <rect x="-22" y="-26" width="44" height="52" rx="4" fill={primaryColor} stroke="#020617" strokeWidth="2" />
        <polygon points="-22,-26 -26,-16 26,-16 22,-26" fill="#0f172a" stroke="#020617" strokeWidth="1.5" />

        {/* Turret */}
        <g transform={`rotate(${turretAngle})`}>
          <rect x="-7" y="-44" width="5" height="32" rx="1.5" fill="#334155" stroke="#020617" strokeWidth="1.2" />
          <rect x="2" y="-44" width="5" height="32" rx="1.5" fill="#334155" stroke="#020617" strokeWidth="1.2" />
          <rect x="-8.5" y="-48" width="8" height="5" rx="1" fill="#0f172a" stroke="#ef4444" strokeWidth="1" />
          <rect x="0.5" y="-48" width="8" height="5" rx="1" fill="#0f172a" stroke="#ef4444" strokeWidth="1" />

          <circle cx="0" cy="0" r="17" fill="#0f172a" stroke="#020617" strokeWidth="2" />
          <polygon
            points="-13,-11 13,-11 15,5 9,13 -9,13 -15,5"
            fill={primaryColor}
            stroke="#020617"
            strokeWidth="1.5"
          />
          <circle cx="-4" cy="2" r="4.5" fill="#1e293b" stroke="#020617" strokeWidth="1" />
          <circle cx="5" cy="-2" r="2.5" fill="#ef4444" stroke="#020617" strokeWidth="0.8" />
        </g>
      </svg>
    );
  }

  // STRIKER
  return (
    <svg
      width={size}
      height={size}
      viewBox="-60 -60 120 120"
      className={`overflow-visible select-none ${animated ? 'transition-all duration-300' : ''}`}
    >
      <circle cx="0" cy="0" r="46" fill={primaryColor} fillOpacity="0.15" />
      <ellipse cx="2" cy="8" rx="30" ry="24" fill="rgba(0,0,0,0.45)" filter="blur(3.5px)" />

      {/* Left Track */}
      <rect x="-28" y="-28" width="9" height="56" rx="3" fill={treadColor} stroke="#020617" strokeWidth="1.5" />
      {[-20, -10, 0, 10, 20].map((y, idx) => (
        <line key={`stl_${idx}`} x1="-28" y1={y} x2="-19" y2={y} stroke="#475569" strokeWidth="1.2" />
      ))}
      {[-14, 0, 14].map((y, idx) => (
        <circle key={`srl_${idx}`} cx="-23.5" cy={y} r="2.5" fill={rollerColor} stroke="#020617" strokeWidth="1" />
      ))}

      {/* Right Track */}
      <rect x="19" y="-28" width="9" height="56" rx="3" fill={treadColor} stroke="#020617" strokeWidth="1.5" />
      {[-20, -10, 0, 10, 20].map((y, idx) => (
        <line key={`str_${idx}`} x1="19" y1={y} x2="28" y2={y} stroke="#475569" strokeWidth="1.2" />
      ))}
      {[-14, 0, 14].map((y, idx) => (
        <circle key={`srr_${idx}`} cx="23.5" cy={y} r="2.5" fill={rollerColor} stroke="#020617" strokeWidth="1" />
      ))}

      {/* Hull */}
      <rect x="-20" y="-24" width="40" height="48" rx="4" fill={primaryColor} stroke="#020617" strokeWidth="1.8" />
      <polygon points="-20,-24 20,-24 14,-14 -14,-14" fill="#0f172a" stroke="#020617" strokeWidth="1.2" />

      {/* Turret */}
      <g transform={`rotate(${turretAngle})`}>
        <rect x="-3" y="-42" width="6" height="30" rx="1.5" fill="#334155" stroke="#020617" strokeWidth="1.2" />
        <rect x="-5" y="-46" width="10" height="5" rx="1.5" fill="#0f172a" stroke="#fbbf24" strokeWidth="1" />
        <circle cx="0" cy="0" r="15" fill="#0f172a" stroke="#020617" strokeWidth="1.5" />
        <polygon points="0,-14 12,-4 10,9 -10,9 -12,-4" fill={primaryColor} stroke="#020617" strokeWidth="1.5" />
        <circle cx="0" cy="1" r="4.5" fill="#1e293b" stroke="#020617" strokeWidth="1" />
        <circle cx="4" cy="-4" r="2" fill="#38bdf8" />
      </g>
    </svg>
  );
};
