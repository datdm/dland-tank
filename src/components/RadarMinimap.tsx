import React, { useEffect, useRef, useState } from 'react';
import { PlayerTank, Obstacle, PowerUpCrate } from '../types/game';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface RadarMinimapProps {
  myPlayerId: string;
  tanks: PlayerTank[];
  obstacles: Obstacle[];
  powerUps: PowerUpCrate[];
  worldSize: { width: number; height: number };
  onHide?: () => void;
  initialSize?: 'small' | 'large';
}

export const RadarMinimap: React.FC<RadarMinimapProps> = ({
  myPlayerId,
  tanks,
  obstacles,
  powerUps,
  worldSize,
  onHide,
  initialSize = 'small',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mapSize, setMapSize] = useState<'small' | 'large'>(initialSize);

  const isLarge = mapSize === 'large';
  const size = isLarge ? 340 : 170;

  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scaleX = size / worldSize.width;
      const scaleY = size / worldSize.height;
      const now = Date.now();

      ctx.clearRect(0, 0, size, size);

      // Radar tactical background
      ctx.fillStyle = 'rgba(11, 17, 30, 0.95)';
      ctx.fillRect(0, 0, size, size);

      // Grid background markings
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      const step = size / 4;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(i * step, 0);
        ctx.lineTo(i * step, size);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * step);
        ctx.lineTo(size, i * step);
        ctx.stroke();
      }

      // Sector Labels if Map To
      if (isLarge) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TÂY BẮC (CONTAINER)', size * 0.25, size * 0.18);
        ctx.fillText('ĐÔNG BẮC (ĐẦM LẦY)', size * 0.75, size * 0.18);
        ctx.fillText('PHÁO ĐÀI TRUNG TÂM', size * 0.5, size * 0.48);
        ctx.fillText('TÂY NAM (TÀN TÍCH)', size * 0.25, size * 0.88);
        ctx.fillText('ĐÔNG NAM (THỬ NGHIỆM)', size * 0.75, size * 0.88);
      }

      // Water bodies (cyan/blue on radar)
      ctx.fillStyle = 'rgba(14, 116, 144, 0.75)';
      for (const obs of obstacles) {
        if (obs.type === 'WATER') {
          ctx.fillRect(obs.x * scaleX, obs.y * scaleY, Math.max(3, obs.w * scaleX), Math.max(3, obs.h * scaleY));
        }
      }

      // Solid obstacles (Steel / Brick)
      for (const obs of obstacles) {
        if (obs.type === 'BUSH' || obs.type === 'WATER') continue;
        ctx.fillStyle = obs.type === 'STEEL' ? 'rgba(148, 163, 184, 0.85)' : 'rgba(217, 119, 6, 0.85)';
        ctx.fillRect(obs.x * scaleX, obs.y * scaleY, Math.max(3, obs.w * scaleX), Math.max(3, obs.h * scaleY));
      }

      // Foliage / Bush zones (subtle green tint)
      ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
      for (const obs of obstacles) {
        if (obs.type === 'BUSH') {
          ctx.fillRect(obs.x * scaleX, obs.y * scaleY, Math.max(3, obs.w * scaleX), Math.max(3, obs.h * scaleY));
        }
      }

      // Power-up crates (amber glowing dots)
      const crateRadius = isLarge ? 4 : 2.5;
      for (const crate of powerUps) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(crate.x * scaleX, crate.y * scaleY, crateRadius, 0, Math.PI * 2);
        ctx.fill();

        if (isLarge) {
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('⚡', crate.x * scaleX, crate.y * scaleY - 6);
        }
      }

      // Radar Sweep Line (rotates like a military sonar)
      const sweepAngle = (now / 1500) % (Math.PI * 2);
      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.rotate(sweepAngle);
      const sweepGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, size * 0.7);
      sweepGrad.addColorStop(0, 'rgba(56, 189, 248, 0.3)');
      sweepGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, size * 0.7, -0.25, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Tanks (Red for enemy/bots, Cyan for online players, Green for player)
      for (const tank of tanks) {
        if (tank.isDead) continue;
        const tx = tank.x * scaleX;
        const ty = tank.y * scaleY;

        if (tank.id === myPlayerId) {
          // My tank (green dot + heading sight + ring)
          ctx.strokeStyle = '#86efac';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(tx, ty, isLarge ? 7 : 5, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(tx, ty, isLarge ? 5 : 3.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(tx + Math.cos(tank.turretAngle) * (isLarge ? 16 : 10), ty + Math.sin(tank.turretAngle) * (isLarge ? 16 : 10));
          ctx.stroke();

          if (isLarge) {
            ctx.fillStyle = '#86efac';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`BẠN (${Math.ceil(tank.hp)}HP)`, tx, ty - 10);
          }
        } else if (!tank.isBot) {
          // Real Online Opponent (Pulsing Cyan/Emerald Ping)
          const pulse = (isLarge ? 6 : 4) + Math.sin(now / 200) * 1.5;
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(tx, ty, pulse, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.arc(tx, ty, isLarge ? 4.5 : 3, 0, Math.PI * 2);
          ctx.fill();

          if (isLarge) {
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(tank.name.slice(0, 10), tx, ty - 8);
          }
        } else {
          // Bot AI tanks (Red dot)
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(tx, ty, isLarge ? 4 : 2.5, 0, Math.PI * 2);
          ctx.fill();

          if (isLarge) {
            ctx.fillStyle = '#f87171';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(tank.name.slice(0, 8), tx, ty - 6);
          }
        }
      }

      // Radar sector grid lines & frame
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, 0, size, size);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.beginPath();
      ctx.moveTo(size / 2, 0);
      ctx.lineTo(size / 2, size);
      ctx.moveTo(0, size / 2);
      ctx.lineTo(size, size / 2);
      ctx.stroke();

      // Concentric range circles
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size * 0.25, 0, Math.PI * 2);
      ctx.arc(size / 2, size / 2, size * 0.45, 0, Math.PI * 2);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [tanks, obstacles, powerUps, worldSize, myPlayerId, isLarge, size]);

  return (
    <div className="relative border border-sky-500/40 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md bg-slate-950/90 transition-all duration-200">
      {/* Radar Control Header */}
      <div className="absolute top-1.5 left-2 right-2 flex items-center justify-between text-[10px] font-mono tracking-wider select-none z-10">
        <div className="flex items-center gap-1.5 text-sky-400 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold">{isLarge ? 'BẢN ĐỒ TO (4.2K)' : 'RADAR 4.2K'}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Toggle Map Nhỏ / Map To */}
          <div className="flex items-center bg-slate-900/90 rounded-lg p-0.5 border border-slate-700/80 pointer-events-auto">
            <button
              onClick={() => setMapSize('small')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                !isLarge
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Chuyển sang Map Nhỏ"
            >
              Nhỏ
            </button>
            <button
              onClick={() => setMapSize('large')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-0.5 ${
                isLarge
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Chuyển sang Map To"
            >
              <span>To</span>
              {isLarge ? <Minimize2 className="w-2.5 h-2.5" /> : <Maximize2 className="w-2.5 h-2.5" />}
            </button>
          </div>

          {onHide && (
            <button
              onClick={onHide}
              className="text-slate-400 hover:text-rose-400 transition-colors p-1 rounded hover:bg-slate-800/80 cursor-pointer pointer-events-auto"
              title="Ẩn bản đồ (Phím M)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} width={size} height={size} className="block transition-all duration-200" />
    </div>
  );
};
