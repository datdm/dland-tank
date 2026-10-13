import React, { useEffect, useRef, useState } from 'react';
import { PlayerTank, Obstacle, PowerUpCrate, StormZone, BossInfo, BaseZone, WeatherType, WEATHER_CONFIGS } from '../types/game';
import { X, Maximize2, Minimize2, MapPin, Target, EyeOff, Wind } from 'lucide-react';

interface RadarMinimapProps {
  myPlayerId: string;
  tanks: PlayerTank[];
  obstacles: Obstacle[];
  powerUps: PowerUpCrate[];
  worldSize: { width: number; height: number };
  mode: 'small' | 'large';
  onSetMode: (mode: 'small' | 'large' | 'hidden') => void;
  onFocusWorldPos?: (x: number, y: number, pingType?: 'ATTACK' | 'DEFEND' | 'GATHER') => void;
  cameraPos?: { x: number; y: number };
  focusBeacon?: {
    x: number;
    y: number;
    timestamp: number;
    pingType?: 'ATTACK' | 'DEFEND' | 'GATHER';
    senderName?: string;
  } | null;
  storm?: StormZone | null;
  boss?: BossInfo | null;
  bases?: BaseZone[];
  currentWeather?: WeatherType;
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
  storm,
  boss,
  bases = [],
  currentWeather = 'DAWN',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedPingType, setSelectedPingType] = useState<'ATTACK' | 'DEFEND' | 'GATHER'>('ATTACK');
  const [isShortLandscape, setIsShortLandscape] = useState(() => typeof window !== 'undefined' && window.innerHeight <= 540);

  useEffect(() => {
    const handleResize = () => {
      setIsShortLandscape(window.innerHeight <= 540);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isLarge = mode === 'large';
  const size = isLarge
    ? Math.min(460, Math.floor(typeof window !== 'undefined' ? window.innerHeight * 0.8 : 360))
    : isShortLandscape
    ? 110
    : 160;
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

      // Team Bases in Minimap
      for (const base of bases) {
        const bx = base.x * scaleX;
        const by = base.y * scaleY;
        const bw = base.w * scaleX;
        const bh = base.h * scaleY;
        ctx.fillStyle = base.team === 'RED' ? 'rgba(239, 68, 68, 0.28)' : 'rgba(59, 130, 246, 0.28)';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = base.team === 'RED' ? '#ef4444' : '#3b82f6';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(bx, by, bw, bh);
        if (isLarge) {
          ctx.fillStyle = base.team === 'RED' ? '#fca5a5' : '#93c5fd';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(base.team === 'RED' ? '🔴 CĂN CỨ ĐỎ' : '🔵 CĂN CỨ XANH', bx + bw / 2, by + bh / 2 + 3);
        }
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

      // Storm Zone (Battle Royale) in Minimap
      if (storm && storm.active) {
        const stormX = storm.centerX * scaleX;
        const stormY = storm.centerY * scaleY;
        const stormR = Math.max(2, storm.currentRadius * scaleX);

        ctx.save();
        // Safe Zone Perimeter Ring
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = isLarge ? 2 : 1.5;
        ctx.beginPath();
        ctx.arc(stormX, stormY, stormR, 0, Math.PI * 2);
        ctx.stroke();

        // Shaded storm zone outside safe circle
        ctx.fillStyle = 'rgba(168, 85, 247, 0.22)';
        ctx.beginPath();
        ctx.rect(0, 0, size, size);
        ctx.arc(stormX, stormY, stormR, 0, Math.PI * 2, true);
        ctx.fill();

        if (isLarge) {
          ctx.fillStyle = '#e9d5ff';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`⚡ BO: ${Math.round(storm.currentRadius)}m`, stormX, Math.max(12, stormY - stormR - 3));
        }
        ctx.restore();
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
      if (focusBeacon && now - focusBeacon.timestamp < 3800) {
        const elapsed = (now - focusBeacon.timestamp) / 1000;
        const beaconX = focusBeacon.x * scaleX;
        const beaconY = focusBeacon.y * scaleY;
        const pType = focusBeacon.pingType || 'ATTACK';
        const beaconColor = pType === 'DEFEND' ? '#38bdf8' : pType === 'GATHER' ? '#10b981' : '#f59e0b';
        const beaconBg = pType === 'DEFEND' ? 'rgba(56, 189, 248, ' : pType === 'GATHER' ? 'rgba(16, 185, 129, ' : 'rgba(245, 158, 11, ';

        ctx.save();
        for (let rIdx = 0; rIdx < 3; rIdx++) {
          const ringProgress = (elapsed + rIdx * 0.3) % 1;
          const ringRadius = 4 + ringProgress * (isLarge ? 26 : 15);
          const ringAlpha = Math.max(0, 1 - ringProgress);

          ctx.strokeStyle = `${beaconBg}${ringAlpha})`;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(beaconX, beaconY, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Crosshair marker
        ctx.strokeStyle = beaconColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(beaconX - 6, beaconY);
        ctx.lineTo(beaconX + 6, beaconY);
        ctx.moveTo(beaconX, beaconY - 6);
        ctx.lineTo(beaconX, beaconY + 6);
        ctx.stroke();

        // Label above beacon on minimap
        ctx.fillStyle = beaconColor;
        ctx.font = 'bold 8.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const pLabel = pType === 'DEFEND' ? '🛡️ THỦ' : pType === 'GATHER' ? '🤝 HỢP' : '⚔️ CÔNG';
        ctx.fillText(pLabel, beaconX, beaconY - 6);

        ctx.restore();
      }

      // In DESERT weather: Sandstorm severely obscures radar visibility!
      const isSandstorm = currentWeather === 'DESERT';
      const radarMaxRange = 520;
      const originX = myTank ? myTank.x : (cameraPos ? cameraPos.x : worldSize.width / 2);
      const originY = myTank ? myTank.y : (cameraPos ? cameraPos.y : worldSize.height / 2);

      // Tanks
      for (const tank of tanks) {
        if (tank.isDead) continue;
        const tx = tank.x * scaleX;
        const ty = tank.y * scaleY;
        const isMe = tank.id === myPlayerId;

        if (isMe) {
          // If in sandstorm, draw the active radar detection boundary circle around myTank
          if (isSandstorm) {
            ctx.save();
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
            ctx.lineWidth = isLarge ? 1.5 : 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(tx, ty, radarMaxRange * scaleX, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

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
          // Opponents / Bots / Teammates
          const isSameTeam = myTank?.team && myTank.team !== 'NONE' && tank.team === myTank.team;

          // Sandstorm Radar Limitation: Enemies beyond 520m are completely obscured on minimap!
          if (isSandstorm && !isSameTeam) {
            const distFromOrigin = Math.hypot(tank.x - originX, tank.y - originY);
            if (distFromOrigin > radarMaxRange) {
              // Out of radar detection range in the blinding sandstorm
              continue;
            }
            if (distFromOrigin > radarMaxRange - 120) {
              // Edge of radar detection: Static interference blip flicker
              const staticFade = (radarMaxRange - distFromOrigin) / 120;
              ctx.globalAlpha = Math.max(0.18, staticFade * (0.35 + 0.65 * Math.abs(Math.sin(now / 75 + tank.x))));
            }
          }

          ctx.fillStyle = isSameTeam ? '#38bdf8' : (tank.isBot ? '#ef4444' : '#f97316');
          ctx.beginPath();
          ctx.arc(tx, ty, 3, 0, Math.PI * 2);
          ctx.fill();

          if (isLarge) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(tank.name.slice(0, 10), tx, ty - 7);
          }

          ctx.globalAlpha = 1.0;
        }
      }

      // Dynamic Weather Environmental Effects on Minimap
      if (isSandstorm) {
        ctx.save();
        // Swirling Sandstorm Particle Dust across Minimap
        for (let p = 0; p < (isLarge ? 28 : 14); p++) {
          const px = ((now * 0.08 + p * 41) % (size + 30)) - 15;
          const py = (p * 27 + Math.sin(now / 400 + p) * 14) % size;
          ctx.fillStyle = p % 2 === 0 ? 'rgba(245, 158, 11, 0.32)' : 'rgba(217, 119, 6, 0.22)';
          ctx.beginPath();
          ctx.arc(px, py, (p % 2) + 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
        // Sandstorm radar static scanlines
        ctx.fillStyle = 'rgba(245, 158, 11, 0.05)';
        ctx.fillRect(0, 0, size, size);
        ctx.restore();
      } else if (currentWeather === 'SNOW') {
        // Frost shimmer on minimap
        ctx.save();
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(2, 2, size - 4, size - 4);
        ctx.restore();
      }

      // World Boss Leviathan in Minimap
      if (boss && boss.isAlive) {
        const bx = boss.x * scaleX;
        const by = boss.y * scaleY;
        const pulse = (Math.sin(now / 180) + 1) * 2;

        ctx.save();
        ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.beginPath();
        ctx.arc(bx, by, 9 + pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(bx, by, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👑', bx, by);

        if (isLarge) {
          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`BOSS (${Math.ceil(boss.hp)} HP)`, bx, by - 12);
        }
        ctx.restore();
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
  }, [tanks, obstacles, powerUps, worldSize, myPlayerId, isLarge, size, cameraPos, focusBeacon, storm, boss, bases]);

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
      Math.max(50, Math.min(worldSize.height - 50, targetWorldY)),
      selectedPingType
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
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 select-none">
        <div className={`bg-slate-900 border border-sky-500/50 rounded-2xl w-full max-w-lg shadow-2xl my-auto ${
          isShortLandscape ? 'p-2.5 space-y-2 max-h-[82vh]' : 'p-3.5 sm:p-5 space-y-3 max-h-[85vh]'
        } overflow-y-auto custom-scrollbar`}>
          {/* Dialog Header */}
          <div className={`flex items-center justify-between border-b border-slate-800 ${isShortLandscape ? 'pb-1.5' : 'pb-2.5'}`}>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className={`${isShortLandscape ? 'p-1' : 'p-1.5 sm:p-2'} bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30`}>
                <MapPin className={isShortLandscape ? 'w-3.5 h-3.5' : 'w-4 h-4 sm:w-5 sm:h-5'} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className={`font-mono font-bold text-white flex items-center gap-1.5 ${
                    isShortLandscape ? 'text-xs' : 'text-xs sm:text-sm md:text-base'
                  }`}>
                    <span>BẢN ĐỒ CHIẾN THUẬT</span>
                    <span className="text-[8px] sm:text-[9.5px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.2 rounded font-mono">
                      4200 x 4200
                    </span>
                  </h3>
                  {currentWeather === 'DESERT' && (
                    <span className="flex items-center gap-1 text-[8.5px] sm:text-[9.5px] bg-amber-500/25 text-amber-300 border border-amber-500/50 px-1.5 py-0.2 rounded font-bold animate-pulse">
                      <Wind className="w-2.5 h-2.5" />
                      <span>BÃO CÁT (RADAR 520M)</span>
                    </span>
                  )}
                  {currentWeather === 'SNOW' && (
                    <span className="flex items-center gap-1 text-[8.5px] sm:text-[9.5px] bg-sky-500/20 text-sky-200 border border-sky-400/40 px-1.5 py-0.2 rounded font-bold">
                      <span>❄️ BĂNG TRƠN TRƯỢT</span>
                    </span>
                  )}
                </div>
                <p className={`text-sky-300 font-semibold flex items-center gap-1 mt-0.5 ${
                  isShortLandscape ? 'text-[8.5px]' : 'text-[9.5px] sm:text-xs'
                }`}>
                  <Target className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Click hoặc giữ chuột kéo trên map để lia camera quan sát</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => onSetMode('hidden')}
              className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Đóng bản đồ (Phím M / Esc)"
            >
              <X className={isShortLandscape ? 'w-3.5 h-3.5' : 'w-4 h-4 sm:w-5 sm:h-5'} />
            </button>
          </div>

          {/* Canvas Centerpiece */}
          <div className="flex justify-center items-center bg-slate-950 p-1.5 sm:p-2 rounded-xl border border-slate-800 relative group">
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

          {/* Tactical Beacon Mode Selector */}
          <div className="flex items-center justify-between gap-1.5 px-1 py-0.5">
            <span className="text-[10px] font-mono text-slate-400 font-bold hidden sm:inline">Chế độ Ping:</span>
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setSelectedPingType('ATTACK')}
                className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-lg font-mono text-[10px] sm:text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  selectedPingType === 'ATTACK'
                    ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span>⚔️</span>
                <span>TẤN CÔNG</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPingType('DEFEND')}
                className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-lg font-mono text-[10px] sm:text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  selectedPingType === 'DEFEND'
                    ? 'bg-sky-500/25 text-sky-300 border-sky-500/60 shadow-md shadow-sky-500/20'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span>🛡️</span>
                <span>PHÒNG THỦ</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPingType('GATHER')}
                className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-lg font-mono text-[10px] sm:text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  selectedPingType === 'GATHER'
                    ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/60 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span>🤝</span>
                <span>TẬP HỢP</span>
              </button>
            </div>
          </div>

          {/* Legend and Status Footer */}
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono bg-slate-950/70 rounded-xl border border-slate-800/80 ${
            isShortLandscape ? 'p-1.5 text-[8.5px]' : 'p-2 sm:p-2.5 text-[9.5px] sm:text-[11px]'
          }`}>
            <div className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="truncate">Xe Của Bạn</span>
            </div>
            <div className="flex items-center gap-1 text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0" />
              <span className="truncate">Đối Thủ</span>
            </div>
            <div className="flex items-center gap-1 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
              <span className="truncate">Bot AI</span>
            </div>
            <div className="flex items-center gap-1 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <span className="truncate">Tiếp Tế</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-0.5 gap-2">
            <button
              onClick={() => onSetMode('small')}
              className={`flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold border border-slate-700 transition-colors cursor-pointer ${
                isShortLandscape ? 'px-2 py-1 text-[9px]' : 'px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs'
              }`}
            >
              <Minimize2 className="w-3 h-3 text-sky-400 shrink-0" />
              <span>Thu Nhỏ (M)</span>
            </button>

            <button
              onClick={() => onSetMode('hidden')}
              className={`flex items-center gap-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-md ${
                isShortLandscape ? 'px-3 py-1 text-[9.5px]' : 'px-3.5 sm:px-4 py-1.5 text-[10px] sm:text-xs'
              }`}
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
    <div
      className="border border-sky-500/40 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md bg-slate-950/95 transition-all duration-200 select-none"
      style={{ width: size }}
    >
      {/* Sleek Compact Header Bar */}
      <div className={`flex items-center justify-between ${isShortLandscape ? 'px-1.5 py-0.5' : 'px-2 py-1'} bg-slate-900/90 border-b border-sky-500/30 text-[9px] sm:text-[10px] font-mono`}>
        <div className="flex items-center gap-1 text-sky-400 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>RADAR</span>
          {currentWeather === 'DESERT' && (
            <span className="text-[7.5px] sm:text-[8px] text-amber-300 bg-amber-500/25 border border-amber-500/40 px-1 py-0.2 rounded font-mono font-bold animate-pulse" title="Bão cát làm giảm tầm nhìn radar còn 520m">
              520M
            </span>
          )}
          {currentWeather === 'SNOW' && (
            <span className="text-[7.5px] sm:text-[8px] text-sky-300 bg-sky-500/20 border border-sky-400/30 px-1 py-0.2 rounded font-mono font-bold" title="Băng trơn trượt nhẹ">
              ❄️
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          {/* Maximize to Center Dialog Button */}
          <button
            onClick={() => onSetMode('large')}
            className="flex items-center gap-0.5 bg-slate-800 hover:bg-sky-950 border border-slate-700/80 hover:border-sky-500/50 text-slate-300 hover:text-sky-300 px-1 py-0.2 rounded text-[8px] sm:text-[9px] font-bold transition-all cursor-pointer"
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
        width={size}
        height={size}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="block cursor-crosshair active:cursor-grabbing select-none"
        style={{ width: size, height: size }}
      />
    </div>
  );
};
