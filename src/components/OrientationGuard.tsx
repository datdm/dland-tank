import React, { useState, useEffect } from 'react';
import { RotateCw, Shield, Smartphone, Check, Copy, Maximize, AlertTriangle, Monitor } from 'lucide-react';
import { sounds } from '../utils/audio';

export const OrientationGuard: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [viewportDims, setViewportDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const evaluateOrientation = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setViewportDims({ w, h });

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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopiedLink(true);
      sounds.playPowerUp();
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

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
      // Browser might restrict orientation lock to installed PWAs or user settings
    }
  };

  if (!isPortrait) return null;

  return (
    <aside
      aria-label="Cảnh báo xoay màn hình điện thoại"
      className="fixed inset-0 z-[99999] bg-slate-950/98 backdrop-blur-2xl flex flex-col items-center justify-center p-4 sm:p-6 text-white select-none overflow-y-auto"
    >
      <style>{`
        @keyframes phoneRotateLoop {
          0%, 18% {
            transform: rotate(0deg) scale(1);
          }
          38%, 78% {
            transform: rotate(90deg) scale(1.04);
          }
          92%, 100% {
            transform: rotate(0deg) scale(1);
          }
        }

        @keyframes screenContentShift {
          0%, 20% {
            opacity: 0.95;
            background: linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%);
            border-color: #f43f5e;
          }
          38%, 78% {
            opacity: 1;
            background: linear-gradient(135deg, #064e3b 0%, #022c22 100%);
            border-color: #10b981;
          }
          92%, 100% {
            opacity: 0.95;
            background: linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%);
            border-color: #f43f5e;
          }
        }

        @keyframes sweepOrbit {
          0%, 18% {
            stroke-dashoffset: 280;
            opacity: 0.4;
          }
          38%, 78% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          92%, 100% {
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
          animation: phoneRotateLoop 4.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          transform-origin: center center;
        }

        .animate-screen-glow {
          animation: screenContentShift 4.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .animate-sweep-orbit {
          stroke-dasharray: 280;
          animation: sweepOrbit 4.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .animate-pulse-ring {
          animation: pulseRing 2.4s ease-in-out infinite;
        }
      `}</style>

      {/* Military Corner Accents */}
      <div className="absolute top-4 left-4 w-7 h-7 border-t-2 border-l-2 border-amber-500/80 pointer-events-none" />
      <div className="absolute top-4 right-4 w-7 h-7 border-t-2 border-r-2 border-amber-500/80 pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-7 h-7 border-b-2 border-l-2 border-amber-500/80 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-7 h-7 border-b-2 border-r-2 border-amber-500/80 pointer-events-none" />

      <div className="max-w-md w-full my-auto flex flex-col items-center text-center space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Shield & Game Tag */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold tracking-wider uppercase">
          <Shield className="w-3.5 h-3.5 text-amber-400 fill-current" />
          <span>DLAND TANK ARENA · MOBILE GUARD</span>
        </div>

        {/* ==============================================================
            ANIMATION: PHONE ROTATING FROM PORTRAIT (DỌC) TO LANDSCAPE (NGANG)
           ============================================================== */}
        <div className="relative w-56 h-56 flex items-center justify-center my-1 select-none">
          {/* Glowing Animated Circular Orbit with Sweep Arrow */}
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
          <div className="absolute inset-4 rounded-full border border-sky-500/20 animate-pulse-ring pointer-events-none" />

          {/* Curved Directional Arrow Indicator */}
          <div className="absolute -top-1 right-7 text-amber-400 bg-slate-900/90 border border-amber-500/50 p-1.5 rounded-full shadow-lg animate-bounce">
            <RotateCw className="w-5 h-5 stroke-[2.5]" />
          </div>

          {/* Rotating Smartphone Device Frame */}
          <div className="animate-phone-turn flex items-center justify-center filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.85)]">
            {/* Phone Outer Chassis (Width 76px, Height 132px - Realistic Smartphone Dimensions) */}
            <div className="relative w-[76px] h-[134px] bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-[3.5px] border-slate-600 rounded-[24px] shadow-2xl p-1 flex flex-col justify-between items-center transition-all">
              {/* Left/Right Volume & Power Button Nibs */}
              <div className="absolute -left-[5px] top-7 w-[2px] h-3.5 bg-slate-600 rounded-l" />
              <div className="absolute -left-[5px] top-12 w-[2px] h-5 bg-slate-600 rounded-l" />
              <div className="absolute -right-[5px] top-9 w-[2px] h-6 bg-slate-600 rounded-r" />

              {/* Top Speaker / Dynamic Island Notch */}
              <div className="w-6 h-1.5 bg-slate-950 rounded-full border border-slate-700/60 shrink-0 mt-0.5" />

              {/* Inside Screen Display: Transforms from Red/Locked (Portrait) to Green/Active (Landscape) */}
              <div className="w-full flex-1 rounded-[15px] border my-1 flex flex-col items-center justify-center p-1.5 overflow-hidden animate-screen-glow relative shadow-inner">
                {/* Visual Icon Inside Phone Screen */}
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center font-black text-xs text-white">
                  <Shield className="w-4 h-4 fill-current text-amber-400" />
                </div>
                <div className="w-9 h-1 bg-white/40 rounded-full mt-1.5" />
                <div className="w-6 h-1 bg-white/20 rounded-full mt-0.5" />

                {/* Radar Grid Lines on mini screen */}
                <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:6px_6px] opacity-25 pointer-events-none" />
              </div>

              {/* Bottom Home Indicator Bar */}
              <div className="w-7 h-1 bg-slate-500 rounded-full mb-0.5" />
            </div>
          </div>
        </div>

        {/* State Comparison Chips */}
        <div className="flex items-center justify-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Màn Hình Dọc (Khóa)</span>
          </span>
          <span className="text-slate-500">→</span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
            <span>Màn Hình Ngang (Vào Game)</span>
          </span>
        </div>

        {/* Warning Title & Clear Brief */}
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight flex items-center justify-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 animate-pulse" />
            <span>VUI LÒNG XOAY NGANG ĐIỆN THOẠI</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
            DLAND TANK chỉ cho phép tham chiến ở <strong className="text-emerald-400 font-bold uppercase">Màn Hình Ngang (Landscape)</strong> để kích hoạt cần gạt ảo hai tay và bao quát toàn cảnh đấu trường 360°.
          </p>
        </div>

        {/* Real-time Viewport Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>Kích thước hiện tại: <strong className="text-rose-300">{viewportDims.w}px × {viewportDims.h}px (Dọc)</strong></span>
          <span>→</span>
          <span className="text-emerald-300 font-bold">Xoay ngang để vào</span>
        </div>

        {/* Action Controls */}
        <div className="w-full space-y-2 pt-1">
          {/* Button: Request Fullscreen & Orientation Lock */}
          <button
            type="button"
            onClick={handleRequestFullscreenAndRotate}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm font-mono tracking-wider uppercase shadow-xl shadow-emerald-500/20 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Maximize className="w-4 h-4" />
            <span>Toàn Màn Hình & Xoay Ngang</span>
          </button>

          {/* Button: Copy PC Link for Desktop Play */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-mono text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-sky-400" />}
            <span>{copiedLink ? 'Đã sao chép link game!' : 'Sao chép link mở trên Máy Tính (PC)'}</span>
          </button>
        </div>

        {/* Helpful Tip */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-mono">
          <Smartphone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>Nếu không tự xoay: Hãy mở Control Center hoặc Cài đặt nhanh để tắt "Khóa hướng dọc".</span>
        </div>
      </div>
    </aside>
  );
};
