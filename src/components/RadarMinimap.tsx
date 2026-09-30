import React, { useEffect, useRef, useState } from 'react';
import { PlayerTank, Obstacle, PowerUpCrate } from '../types/game';
import { X, Maximize2, Minimize2, MapPin, Target } from 'lucide-react';

interface RadarMinimapProps {
  myPlayerId: string;
  tanks: PlayerTank[];
  obstacles: Obstacle[];
  powerUps: PowerUpCrate[];
  worldSize: { width: number; height: number };
  mode: 'small' | 'large';
  onSetMode: (mode: 'small' | 'large' | 'hidden') => void;
  onFocusWorldPos?: (x: number, y: number) => void;
  cameraPos?: { x: number; y: number };
  focusBeacon?: { x: number; y: number; timestamp: number } | null;
}

export const RadarMinimap: React.FC<RadarMinimapProps> = ({
  myPlayerId,
  tanks,
  obstacles,
  powerUps,
  worldSize,
  mode,
  onSetMode,
  onFocusWorldPos,
  cameraPos,
  focusBeacon,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isLarge = mode === 'large';
  const size = isLarge ? 460 : 160;
  const [isDragging, setIsDragging] = useState(false);

  const myTank = tanks.find((t) => t.id === myPlayerId);

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

      // Background Tactical Grid
      ctx.fillStyle = 'rgba(10, 15, 29, 0.96)';
      ctx.fillRect(0, 0, size, size);

      // Grid Lines
      ctx.strokeStyle = isLarge ? 'rgba(56, 189, 248, 0.12)' : 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      const divisions = 4;
      const step = size / divisions;
      for (let i = 1; i < divisions; i++) {
        ctx.beginPath();
        ctx.moveTo(i * step, 0);
        ctx.lineTo(i * step, size);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * step);
        ctx.lineTo(size, i * step);
        ctx.stroke();
      }

      // Sector Markings for Large Dialog Mode
      if (isLarge) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('BÃI CONTAINER (TÂY BẮC)', size * 0.25, size * 0.14);
        ctx.fillText('ĐẦM LẦY (ĐÔNG BẮC)', size * 0.75, size * 0.14);
        ctx.fillText('PHÁO ĐÀI TRUNG TÂM', size * 0.5, size * 0.48);
        ctx.fillText('TÀN TÍCH (TÂY NAM)', size * 0.25, size * 0.88);
        ctx.fillText('KHU THỬ NGHIỆM (ĐÔNG NAM)', size * 0.75, size * 0.88);
      }

      // Water zones
      ctx.fillStyle = 'rgba(14, 116, 144, 0.8)';
      for (const obs of obstacles) {
        if (obs.type === 'WATER') {
          ctx.fillRect(obs.x * scaleX, obs.y * scaleY, Math.max(3, obs.w * scaleX), Math.max(3, obs.h * scaleY));
        }
      }

      // Solid Obstacles (Steel / Brick)
      for (const obs of obstacles) {
        if (obs.type === 'BUSH' || obs.type === 'WATER') continue;
        ctx.fillStyle = obs.type === 'STEEL' ? 'rgba(148, 163, 184, 0.9)' : 'rgba(217, 119, 6, 0.85)';
        ctx.fillRect(obs.x * scaleX, obs.y * scaleY, Math.max(3, obs.w * scaleX), Math.max(3, obs.h * scaleY));
      }

      // Bush zones
      ctx.fillStyle = 'rgba(34, 197, 94, 0.35)';
      for (const obs of obstacles) {
        if (obs.type === 'BUSH') {
          ctx.fillRect(obs.x * scaleX, obs.y * scaleY, Math.max(3, obs.w * scaleX), Math.max(3, obs.h * scaleY));
        }
      }

      // Power-up Crates
      for (const crate of powerUps) {
        const cx = crate.x * scaleX;
        const cy = crate.y * scaleY;
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(cx - 2, cy - 2, 4, 4);
      }

      // Rotating radar beam effect
      const sweepAngle = (now / 1400) % (Math.PI * 2);
      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.rotate(sweepAngle);
      const sweepGrad = ctx.createLinearGradient(0, 0, size * 0.5, 0);
      sweepGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      sweepGrad.addColorStop(1, 'rgba(56, 189, 248, 0.15)');
      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, size * 0.7, 0, 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Camera Viewport Frame (Shows where player/camera is currently looking)
      if (cameraPos) {
        const camMinimapX = cameraPos.x * scaleX;
        const camMinimapY = cameraPos.y * scaleY;
        const viewW = isLarge ? 80 : 36;
        const viewH = isLarge ? 55 : 24;

        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(camMinimapX - viewW / 2, camMinimapY - viewH / 2, viewW, viewH);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.fillRect(camMinimapX - viewW / 2, camMinimapY - viewH / 2, viewW, viewH);
        ctx.restore();
      }

      // Focus Ping Beacon (Expanding rings upon clicking map)
      if (focusBeacon && now - focusBeacon.timestamp < 3500) {
        const elapsed = (now - focusBeacon.timestamp) / 1000;
        const beaconX = focusBeacon.x * scaleX;
        const beaconY = focusBeacon.y * scaleY;

        ctx.save();
        for (let rIdx = 0; rIdx < 3; rIdx++) {
          const ringProgress = (elapsed + rIdx * 0.3) % 1;
          const ringRadius = 4 + ringProgress * (isLarge ? 24 : 14);
          const ringAlpha = Math.max(0, 1 - ringProgress);

          ctx.strokeStyle = `rgba(245, 158, 11, ${ringAlpha})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(beaconX, beaconY, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Crosshair marker
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(beaconX - 5, beaconY);
        ctx.lineTo(beaconX + 5, beaconY);
        ctx.moveTo(beaconX, beaconY - 5);
        ctx.lineTo(beaconX, beaconY + 5);
        ctx.stroke();
        ctx.restore();
      }

      // Tanks
      for (const tank of tanks) {
        if (tank.isDead) continue;
        const tx = tank.x * scaleX;
        const ty = tank.y * scaleY;
        const isMe = tank.id === myPlayerId;

        if (isMe) {
          // My tank marker: Bright green pulsating star
          const pulse = (Math.sin(now / 200) + 1) * 1.5;
          ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
          ctx.beginPath();
          ctx.arc(tx, ty, 6 + pulse, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(tx, ty, 4, 0, Math.PI * 2);
          ctx.fill();

          // Heading line
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(tx + Math.cos(tank.turretAngle) * 9, ty + Math.sin(tank.turretAngle) * 9);
          ctx.stroke();
        } else {
          // Opponents / Bots
          ctx.fillStyle = tank.isBot ? '#ef4444' : '#38bdf8';
          ctx.beginPath();
          ctx.arc(tx, ty, 3, 0, Math.PI * 2);
          ctx.fill();

          if (isLarge) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(tank.name.slice(0, 10), tx, ty - 7);
          }
        }
      }

      // Outer border and concentric circles
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, 0, size, size);

      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size * 0.25, 0, Math.PI * 2);
      ctx.arc(size / 2, size / 2, size * 0.45, 0, Math.PI * 2);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [tanks, obstacles, powerUps, worldSize, myPlayerId, isLarge, size, cameraPos, focusBeacon]);

  // Handle map interaction (Click or Drag on Minimap to focus camera)
  const processMinimapFocus = (clientX: number, clientY: number) => {
    if (!onFocusWorldPos) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    const targetWorldX = (clickX / rect.width) * worldSize.width;
    const targetWorldY = (clickY / rect.height) * worldSize.height;

    onFocusWorldPos(
      Math.max(50, Math.min(worldSize.width - 50, targetWorldX)),
      Math.max(50, Math.min(worldSize.height - 50, targetWorldY))
    );
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    processMinimapFocus(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      processMinimapFocus(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // If Map To: Render as Centered Dialog Modal
  if (isLarge) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 border border-sky-500/50 rounded-2xl w-full max-w-xl p-4 sm:p-5 shadow-2xl space-y-3">
          {/* Dialog Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-white text-base sm:text-lg flex items-center gap-2">
                  <span>BẢN ĐỒ CHIẾN THUẬT TOÀN CẢNH</span>
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded font-mono">
                    4200 x 4200
                  </span>
                </h3>
                <p className="text-xs text-sky-300 font-semibold flex items-center gap-1.5 mt-0.5">
                  <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Click hoặc giữ chuột kéo trên bản đồ để lập tức di chuyển camera quan sát đến vị trí đó!</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => onSetMode('hidden')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Đóng bản đồ (Phím M / Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Canvas Centerpiece */}
          <div className="flex justify-center items-center bg-slate-950 p-2 rounded-xl border border-slate-800 relative group">
            <canvas
              ref={canvasRef}
              width={size}
              height={size}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="rounded-lg shadow-inner max-w-full h-auto cursor-crosshair active:cursor-grabbing select-none"
            />
          </div>

          {/* Legend and Status Footer */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Xe Của Bạn</span>
            </div>
            <div className="flex items-center gap-1.5 text-sky-400">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
              <span>Đối Thủ Online</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span>Bot AI</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Hộp Tiếp Tế</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => onSetMode('small')}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Thu Nhỏ Về Góc Trái (Phím M)</span>
            </button>

            <button
              onClick={() => onSetMode('hidden')}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition-colors cursor-pointer shadow-md"
            >
              <span>Đóng Bản Đồ (Esc)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If Map Nhỏ: Render as Compact Widget in Top-Left
  return (
    <div className="border border-sky-500/40 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md bg-slate-950/95 transition-all duration-200 w-[160px] select-none">
      {/* Sleek Compact Header Bar */}
      <div className="flex items-center justify-between px-2 py-1 bg-slate-900/90 border-b border-sky-500/30 text-[10px] font-mono">
        <div className="flex items-center gap-1.5 text-sky-400 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>RADAR</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Maximize to Center Dialog Button */}
          <button
            onClick={() => onSetMode('large')}
            className="flex items-center gap-0.5 bg-slate-800 hover:bg-sky-950 border border-slate-700/80 hover:border-sky-500/50 text-slate-300 hover:text-sky-300 px-1 py-0.2 rounded text-[9px] font-bold transition-all cursor-pointer"
            title="Mở Map To chính giữa màn hình (Phím M)"
          >
            <span>To</span>
            <Maximize2 className="w-2.5 h-2.5" />
          </button>

          {/* Close/Hide Button */}
          <button
            onClick={() => onSetMode('hidden')}
            className="text-slate-400 hover:text-rose-400 transition-colors p-0.5 rounded hover:bg-slate-800 cursor-pointer"
            title="Ẩn bản đồ (Phím M)"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Flush Edge-to-Edge Canvas */}
      <canvas
        ref={canvasRef}
        width={160}
        height={160}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="block cursor-crosshair active:cursor-grabbing select-none w-[160px] h-[160px]"
      />
    </div>
  );
};
