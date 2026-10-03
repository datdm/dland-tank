import React, { useState, useRef, useEffect } from 'react';
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
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isShortLandscape, setIsShortLandscape] = useState(false);
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const isTouchingRef = useRef(false);

  useEffect(() => {
    const evaluateDevice = () => {
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(touch);
      setIsShortLandscape(window.innerHeight <= 540);
    };
    evaluateDevice();
    window.addEventListener('resize', evaluateDevice);
    return () => window.removeEventListener('resize', evaluateDevice);
  }, []);

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
    const maxRadius = isShortLandscape ? 36 : 45;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const normX = Math.cos(angle) * clampedDist;
    const normY = Math.sin(angle) * clampedDist;

    setTouchPos({ x: normX, y: normY });
    onAimChange(angle);

    // Determine movement intent
    const threshold = 10;
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

  if (!isTouchDevice) return null;

  return (
    <div
      className={`fixed inset-x-0 flex justify-between items-end pointer-events-none z-30 select-none ${
        isShortLandscape ? 'bottom-2.5 px-3 sm:px-6' : 'bottom-5 px-6'
      }`}
    >
      {/* Left movement joystick */}
      <div
        ref={joystickBaseRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`rounded-full bg-slate-950/75 border-2 border-slate-600/80 backdrop-blur-md relative flex items-center justify-center pointer-events-auto shadow-2xl active:border-sky-400 ${
          isShortLandscape ? 'w-24 h-24' : 'w-28 sm:w-32 h-28 sm:h-32'
        }`}
      >
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-[10px] font-mono tracking-wider font-bold opacity-60">
          LÁI XE
        </div>
        <div
          className={`rounded-full bg-gradient-to-tr from-sky-600 to-cyan-400 border-2 border-white/80 shadow-lg absolute transition-transform ${
            isShortLandscape ? 'w-10 h-10' : 'w-12 sm:w-14 h-12 sm:h-14'
          }`}
          style={{
            transform: touchPos
              ? `translate(${touchPos.x}px, ${touchPos.y}px)`
              : 'translate(0px, 0px)',
          }}
        />
      </div>

      {/* Right fire button */}
      <button
        type="button"
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
        className={`rounded-full bg-gradient-to-tr from-rose-600 to-red-500 active:from-rose-500 active:to-red-400 border-2 border-white/90 text-white flex flex-col items-center justify-center pointer-events-auto shadow-2xl active:scale-95 transition-transform cursor-pointer ${
          isShortLandscape ? 'w-20 h-20' : 'w-24 h-24'
        }`}
      >
        <Crosshair className={isShortLandscape ? 'w-6 h-6' : 'w-8 h-8'} />
        <span className="text-[10px] sm:text-xs font-black tracking-widest mt-0.5 uppercase font-mono">BẮN</span>
      </button>
    </div>
  );
};
