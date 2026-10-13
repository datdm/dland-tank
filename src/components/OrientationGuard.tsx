import React, { useState, useEffect } from 'react';
import { RotateCw, Shield, Maximize, AlertTriangle } from 'lucide-react';
import { sounds } from '../utils/audio';

export const OrientationGuard: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    // Clean up any old dismiss flags so mobile portrait is always guarded
    try {
      sessionStorage.removeItem('dismiss_orientation_guard');
    } catch {
      // Ignore storage errors
    }

    const evaluateOrientation = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Determine if device is mobile/tablet/touch or mobile emulator
      const userAgent = navigator.userAgent || '';
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(userAgent);
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = Math.min(w, h) <= 900;

      // Check if held in portrait (height > width)
      const isHeightGreater = h > w;
      const isMediaPortrait = window.matchMedia && window.matchMedia('(orientation: portrait)').matches;

      // Trigger guard if mobile/touch or small handheld device in portrait orientation
      const shouldBlock = (isMobileUA || isTouch || isSmallScreen) && (isHeightGreater || isMediaPortrait);
      setIsPortrait(shouldBlock);
    };

    evaluateOrientation();

    window.addEventListener('resize', evaluateOrientation);
    window.addEventListener('orientationchange', evaluateOrientation);
    const mediaQuery = window.matchMedia?.('(orientation: portrait)');
    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener('change', evaluateOrientation);
    }

    return () => {
      window.removeEventListener('resize', evaluateOrientation);
      window.removeEventListener('orientationchange', evaluateOrientation);
      if (mediaQuery?.removeEventListener) {
        mediaQuery.removeEventListener('change', evaluateOrientation);
      }
    };
  }, []);

  const handleRequestFullscreenAndRotate = async () => {
    try {
      sounds.playRadioBeep();
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      if (screen.orientation && 'lock' in screen.orientation) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (screen.orientation as any).lock('landscape');
      }
    } catch {
      // Browser might restrict orientation lock to installed PWAs or user gesture settings
    }
  };

  if (!isPortrait) return null;

  return (
    <aside
      aria-label="Cảnh báo xoay màn hình điện thoại"
      className="fixed inset-0 z-[99999] bg-slate-950/98 backdrop-blur-2xl flex flex-col items-center justify-center p-4 sm:p-6 text-white select-none overflow-hidden"
    >
      <style>{`
        @keyframes phoneRotateLoop {
          0%, 20% {
            transform: rotate(0deg) scale(1);
          }
          40%, 80% {
            transform: rotate(90deg) scale(1.05);
          }
          95%, 100% {
            transform: rotate(0deg) scale(1);
          }
        }

        @keyframes screenContentShift {
          0%, 20% {
            opacity: 0.95;
            background: linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%);
            border-color: #f43f5e;
          }
          40%, 80% {
            opacity: 1;
            background: linear-gradient(135deg, #064e3b 0%, #022c22 100%);
            border-color: #10b981;
          }
          95%, 100% {
            opacity: 0.95;
            background: linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%);
            border-color: #f43f5e;
          }
        }

        @keyframes sweepOrbit {
          0%, 20% {
            stroke-dashoffset: 280;
            opacity: 0.4;
          }
          40%, 80% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          95%, 100% {
            stroke-dashoffset: 280;
            opacity: 0.4;
          }
        }

        @keyframes pulseRing {
          0% {
            transform: scale(0.9);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.25;
          }
          100% {
            transform: scale(0.9);
            opacity: 0.8;
          }
        }

        .animate-phone-turn {
          animation: phoneRotateLoop 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          transform-origin: center center;
        }

        .animate-screen-glow {
          animation: screenContentShift 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .animate-sweep-orbit {
          stroke-dasharray: 280;
          animation: sweepOrbit 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .animate-pulse-ring {
          animation: pulseRing 2.4s ease-in-out infinite;
        }
      `}</style>

      {/* Military Corner Accents */}
      <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-amber-500/70 pointer-events-none" />
      <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-amber-500/70 pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-amber-500/70 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-amber-500/70 pointer-events-none" />

      <div className="max-w-xs w-full flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
        {/* Item 1: Brand Shield Tag */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-bold tracking-wider uppercase">
          <Shield className="w-3.5 h-3.5 text-amber-400 fill-current" />
          <span>DLAND TANK ARENA</span>
        </div>

        {/* Item 2: Animated Rotating Phone */}
        <div className="relative w-48 h-48 flex items-center justify-center select-none my-1">
          {/* Circular Orbit */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="rgba(245, 158, 11, 0.2)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="url(#orbitGradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="animate-sweep-orbit"
            />
            <defs>
              <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>

          {/* Pulse Halo */}
          <div className="absolute inset-3 rounded-full border border-sky-500/20 animate-pulse-ring pointer-events-none" />

          {/* Curved Arrow Indicator */}
          <div className="absolute -top-1 right-5 text-amber-400 bg-slate-900/90 border border-amber-500/50 p-1.5 rounded-full shadow-lg animate-bounce">
            <RotateCw className="w-4 h-4 stroke-[2.5]" />
          </div>

          {/* Rotating Smartphone Device Frame */}
          <div className="animate-phone-turn flex items-center justify-center filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]">
            <div className="relative w-[68px] h-[120px] bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-[3px] border-slate-600 rounded-[20px] shadow-2xl p-1 flex flex-col justify-between items-center transition-all">
              {/* Notch */}
              <div className="w-5 h-1 bg-slate-950 rounded-full border border-slate-700/60 shrink-0 mt-0.5" />

              {/* Inside Screen Display */}
              <div className="w-full flex-1 rounded-[13px] border my-1 flex flex-col items-center justify-center p-1 overflow-hidden animate-screen-glow relative shadow-inner">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs text-white">
                  <Shield className="w-3.5 h-3.5 fill-current text-amber-400" />
                </div>
                <div className="w-8 h-1 bg-white/40 rounded-full mt-1.5" />
                <div className="w-5 h-0.5 bg-white/20 rounded-full mt-0.5" />
              </div>

              {/* Home Indicator */}
              <div className="w-6 h-0.5 bg-slate-500 rounded-full mb-0.5" />
            </div>
          </div>
        </div>

        {/* Item 3: Title */}
        <div className="space-y-1.5">
          <h2 className="text-lg font-black text-white font-mono tracking-tight flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
            <span>VUI LÒNG XOAY NGANG</span>
          </h2>
          {/* Item 4: Subtitle */}
          <p className="text-xs text-slate-300 leading-relaxed px-2">
            Xoay ngang điện thoại để trải nghiệm điều khiển xe tăng và góc nhìn chiến trường tốt nhất.
          </p>
        </div>

        {/* Item 5: Action Button */}
        <div className="w-full pt-1">
          <button
            type="button"
            onClick={handleRequestFullscreenAndRotate}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-xs font-mono tracking-wider uppercase shadow-xl shadow-emerald-500/20 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Maximize className="w-4 h-4" />
            <span>Toàn Màn Hình & Xoay Ngang</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
