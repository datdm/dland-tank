import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Crosshair } from 'lucide-react';

interface VirtualJoystickProps {
  onMoveChange: (move: { up: boolean; down: boolean; left: boolean; right: boolean }) => void;
  onFireChange: (isFiring: boolean) => void;
  onAimChange: (angle: number) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onMoveChange,
  onFireChange,
  onAimChange,
}) => {
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const isTouchingRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch || !joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    isTouchingRef.current = true;
    updateJoystick(touch.clientX - centerX, touch.clientY - centerY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isTouchingRef.current || !joystickBaseRef.current) return;
    const touch = e.touches[0];
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    updateJoystick(touch.clientX - centerX, touch.clientY - centerY);
  };

  const handleTouchEnd = () => {
    isTouchingRef.current = false;
    setTouchPos(null);
    onMoveChange({ up: false, down: false, left: false, right: false });
  };

  const updateJoystick = (dx: number, dy: number) => {
    const maxRadius = 45;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const normX = Math.cos(angle) * clampedDist;
    const normY = Math.sin(angle) * clampedDist;

    setTouchPos({ x: normX, y: normY });

    // Determine movement intent
    const threshold = 12;
    if (dist > threshold) {
      const up = dy < -threshold;
      const down = dy > threshold;
      const left = dx < -threshold;
      const right = dx > threshold;
      onMoveChange({ up, down, left, right });
    } else {
      onMoveChange({ up: false, down: false, left: false, right: false });
    }
  };

  return (
    <div className="md:hidden fixed inset-x-0 bottom-6 px-6 flex justify-between items-end pointer-events-none z-30 select-none">
      {/* Left movement joystick */}
      <div
        ref={joystickBaseRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-32 h-32 rounded-full bg-slate-900/60 border-2 border-slate-600/70 backdrop-blur-md relative flex items-center justify-center pointer-events-auto shadow-2xl"
      >
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs font-mono">
          DI CHUYỂN
        </div>
        <div
          className="w-14 h-14 rounded-full bg-sky-500/80 border-2 border-sky-300 shadow-lg absolute transition-transform"
          style={{
            transform: touchPos
              ? `translate(${touchPos.x}px, ${touchPos.y}px)`
              : 'translate(0px, 0px)',
          }}
        />
      </div>

      {/* Right fire button */}
      <button
        onTouchStart={(e) => {
          e.preventDefault();
          onFireChange(true);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          onFireChange(false);
        }}
        onMouseDown={() => onFireChange(true)}
        onMouseUp={() => onFireChange(false)}
        className="w-24 h-24 rounded-full bg-rose-600/80 active:bg-rose-500 border-3 border-rose-400/90 text-white flex flex-col items-center justify-center pointer-events-auto shadow-2xl active:scale-95 transition-transform"
      >
        <Crosshair className="w-8 h-8" />
        <span className="text-[11px] font-bold tracking-wider mt-0.5">BẮN</span>
      </button>
    </div>
  );
};
