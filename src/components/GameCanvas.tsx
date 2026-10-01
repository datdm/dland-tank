import React, { useEffect, useRef } from 'react';
import {
  PlayerTank,
  Bullet,
  Obstacle,
  PowerUpCrate,
  Landmine,
  TANK_CLASSES,
  WeatherType,
  WEATHER_CONFIGS,
  StormZone,
  BossInfo,
  BaseZone,
  GameMode,
} from '../types/game';
import { sounds } from '../utils/audio';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
}

interface Decal {
  x: number;
  y: number;
  angle: number;
  alpha: number;
  type: 'track' | 'scorch';
  createdAt: number;
}

interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  swayOffset: number;
  splashAge: number;
}

interface GameCanvasProps {
  myPlayerId: string;
  tanks: PlayerTank[];
  bullets: Bullet[];
  obstacles: Obstacle[];
  powerUps: PowerUpCrate[];
  landmines?: Landmine[];
  worldSize: { width: number; height: number };
  is25DMode?: boolean;
  zoomScale?: number;
  isSpectator?: boolean;
  spectatorTargetId?: string | 'free';
  freeCameraPos?: { x: number; y: number };
  onSelectSpectatorTarget?: (id: string) => void;
  currentWeather?: WeatherType;
  focusBeacon?: { x: number; y: number; timestamp: number } | null;
  onPanCamera?: (camX: number, camY: number) => void;
  onFocusWorldPos?: (worldX: number, worldY: number) => void;
  isFreeCameraActive?: boolean;
  storm?: StormZone | null;
  boss?: BossInfo | null;
  bases?: BaseZone[];
  gameMode?: GameMode;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  myPlayerId,
  tanks,
  bullets,
  obstacles,
  powerUps,
  landmines = [],
  worldSize,
  is25DMode = true,
  zoomScale = 0.75,
  isSpectator = false,
  spectatorTargetId = 'free',
  freeCameraPos,
  onSelectSpectatorTarget,
  currentWeather = 'DAWN',
  focusBeacon,
  onPanCamera,
  onFocusWorldPos,
  isFreeCameraActive = false,
  storm,
  boss,
  bases = [],
  gameMode = 'PUBLIC',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Smooth camera position
  const cameraRef = useRef({ x: worldSize.width / 2, y: worldSize.height / 2 });
  const particlesRef = useRef<Particle[]>([]);
  const decalsRef = useRef<Decal[]>([]);
  const screenShakeRef = useRef(0);
  const prevBulletsCountRef = useRef(0);
  const prevTanksStateRef = useRef<Map<string, { hp: number; isDead: boolean }>>(new Map());

  // Weather Ambient System
  const weatherParticlesRef = useRef<WeatherParticle[]>([]);
  const lightningFlashRef = useRef<number>(0);
  const nextLightningRef = useRef<number>(Date.now() + 10000);

  // Track recoil state per tank: tankId -> recoilOffset (0 to 1)
  const tankRecoilRef = useRef<Map<string, number>>(new Map());

  // Detect combat events for audio and particle triggers
  useEffect(() => {
    // Check new bullets fired for audio and muzzle recoil
    if (bullets.length > prevBulletsCountRef.current) {
      const latest = bullets[bullets.length - 1];
      if (latest) {
        sounds.playShoot(latest.isHeavy);
        tankRecoilRef.current.set(latest.shooterId, 1.0);

        // 3D Muzzle flash & smoke particles
        for (let i = 0; i < 4; i++) {
          const spd = 2 + Math.random() * 3;
          particlesRef.current.push({
            x: latest.x,
            y: latest.y,
            z: 18,
            vx: latest.vx * 0.15 + (Math.random() - 0.5) * spd,
            vy: latest.vy * 0.15 + (Math.random() - 0.5) * spd,
            vz: 0.8 + Math.random() * 1.5,
            radius: 8 + Math.random() * 6,
            color: i % 2 === 0 ? '#fbbf24' : '#f97316',
            alpha: 0.9,
            decay: 0.12,
          });
        }
      }
    }
    prevBulletsCountRef.current = bullets.length;

    // Check tank damage & deaths
    for (const t of tanks) {
      const prev = prevTanksStateRef.current.get(t.id);
      if (prev) {
        // Just died
        if (!prev.isDead && t.isDead) {
          sounds.playExplosion();
          // Massive 2.5D Explosion plume
          for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 2 + Math.random() * 8;
            particlesRef.current.push({
              x: t.x,
              y: t.y,
              z: 10 + Math.random() * 20,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd,
              vz: 1.5 + Math.random() * 4,
              radius: 6 + Math.random() * 12,
              color: i % 3 === 0 ? '#ef4444' : i % 3 === 1 ? '#f97316' : '#71717a',
              alpha: 1,
              decay: 0.018 + Math.random() * 0.025,
            });
          }
          // Scorch decal on ground
          decalsRef.current.push({
            x: t.x,
            y: t.y,
            angle: Math.random() * Math.PI,
            alpha: 0.85,
            type: 'scorch',
            createdAt: Date.now(),
          });
          if (t.id === myPlayerId) {
            screenShakeRef.current = 15;
          }
        } else if (prev.hp > t.hp) {
          // Took damage
          sounds.playHit();
          if (t.id === myPlayerId) {
            screenShakeRef.current = 6;
          }
          // Armor sparks flying in 3D
          for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 2 + Math.random() * 5;
            particlesRef.current.push({
              x: t.x,
              y: t.y,
              z: 14,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd,
              vz: 2 + Math.random() * 3,
              radius: 2 + Math.random() * 3,
              color: '#fde047',
              alpha: 1,
              decay: 0.08,
            });
          }
        }
      }
      prevTanksStateRef.current.set(t.id, { hp: t.hp, isDead: t.isDead });
    }
  }, [bullets, tanks, myPlayerId]);

  // Main 60fps render loop with 2.5D Isometric/Oblique depth engine
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Camera lerp
      let targetCamX = worldSize.width / 2;
      let targetCamY = worldSize.height / 2;

      if (isSpectator) {
        if (spectatorTargetId === 'free' && freeCameraPos) {
          targetCamX = freeCameraPos.x;
          targetCamY = freeCameraPos.y;
        } else {
          const targetTank =
            tanks.find((t) => t.id === spectatorTargetId && !t.isDead) ||
            tanks.find((t) => !t.isDead) ||
            tanks.find((t) => t.id === spectatorTargetId);
          if (targetTank) {
            targetCamX = targetTank.x;
            targetCamY = targetTank.y;
          } else if (freeCameraPos) {
            targetCamX = freeCameraPos.x;
            targetCamY = freeCameraPos.y;
          }
        }
      } else {
        if (isFreeCameraActive && freeCameraPos) {
          targetCamX = freeCameraPos.x;
          targetCamY = freeCameraPos.y;
        } else {
          const myTank = tanks.find((t) => t.id === myPlayerId);
          targetCamX = myTank ? myTank.x : worldSize.width / 2;
          targetCamY = myTank ? myTank.y : worldSize.height / 2;
        }
      }

      cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.14;
      cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.14;

      // Screen shake
      let shakeOffsetX = 0;
      let shakeOffsetY = 0;
      if (screenShakeRef.current > 0) {
        shakeOffsetX = (Math.random() - 0.5) * screenShakeRef.current;
        shakeOffsetY = (Math.random() - 0.5) * screenShakeRef.current;
        screenShakeRef.current = Math.max(0, screenShakeRef.current - 0.65);
      }

      const camX = cameraRef.current.x + shakeOffsetX;
      const camY = cameraRef.current.y + shakeOffsetY;

      const zoom = zoomScale || 0.75;
      const viewWidth = width / zoom;
      const viewHeight = height / zoom;

      const viewLeft = camX - viewWidth / 2;
      const viewTop = camY - viewHeight / 2;
      const now = Date.now();

      // Decay recoil
      for (const [id, r] of tankRecoilRef.current) {
        if (r > 0.01) {
          tankRecoilRef.current.set(id, r * 0.85);
        } else {
          tankRecoilRef.current.delete(id);
        }
      }

      const weatherCfg = WEATHER_CONFIGS[currentWeather] || WEATHER_CONFIGS.DAWN;

      // ==========================================
      // 1. TERRAIN BASE & GROUND TEXTURE
      // ==========================================
      ctx.fillStyle = weatherCfg.groundBgColor; // Dynamic weather tactical ground
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      // Center-scale zoom (like Chrome 75% zoom)
      ctx.translate(width / 2, height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-camX, -camY);

      // Tactical grid with dynamic weather ambient tint
      const gridSize = 100;
      const startX = Math.floor(Math.max(0, viewLeft) / gridSize) * gridSize;
      const endX = Math.min(worldSize.width, viewLeft + viewWidth + gridSize);
      const startY = Math.floor(Math.max(0, viewTop) / gridSize) * gridSize;
      const endY = Math.min(worldSize.height, viewTop + viewHeight + gridSize);

      ctx.strokeStyle = weatherCfg.gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = startX; x <= endX; x += gridSize) {
        ctx.moveTo(x, Math.max(0, viewTop));
        ctx.lineTo(x, Math.min(worldSize.height, viewTop + viewHeight));
      }
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.moveTo(Math.max(0, viewLeft), y);
        ctx.lineTo(Math.min(worldSize.width, viewLeft + viewWidth), y);
      }
      ctx.stroke();

      // Sector Markings / Ground Stencils
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.font = 'bold 36px font-mono, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SECTOR 01: CITADEL', worldSize.width / 2, worldSize.height / 2 - 320);
      ctx.fillText('SECTOR NW: INDUSTRIAL', 1000, 700);
      ctx.fillText('SECTOR NE: RIVER DELTA', 3100, 700);
      ctx.fillText('SECTOR SW: AMBUSH RUINS', 1000, 2750);
      ctx.fillText('SECTOR SE: PROVING GROUND', 3100, 2750);

      // Arena Outer Perimeter Warning Stripes
      const borderThick = 44;
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, worldSize.width, borderThick);
      ctx.fillRect(0, worldSize.height - borderThick, worldSize.width, borderThick);
      ctx.fillRect(0, 0, borderThick, worldSize.height);
      ctx.fillRect(worldSize.width - borderThick, 0, borderThick, worldSize.height);

      // Yellow/Black diagonal hazard pattern on perimeter
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
      ctx.lineWidth = 4;
      for (let x = 0; x < worldSize.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 20, borderThick);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, worldSize.height - borderThick);
        ctx.lineTo(x + 20, worldSize.height);
        ctx.stroke();
      }

      // ==========================================
      // 2. DECALS (Tread Marks & Explosion Craters)
      // ==========================================
      for (let i = decalsRef.current.length - 1; i >= 0; i--) {
        const decal = decalsRef.current[i];
        const age = now - decal.createdAt;
        if (age > 45000) {
          decalsRef.current.splice(i, 1);
          continue;
        }

        const fade = Math.max(0, decal.alpha * (1 - age / 45000));
        ctx.save();
        ctx.translate(decal.x, decal.y);
        ctx.rotate(decal.angle);
        ctx.globalAlpha = fade;

        if (decal.type === 'scorch') {
          // 2.5D Crater with charred bevel rim
          const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, 42);
          grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
          grad.addColorStop(0.5, 'rgba(25, 15, 10, 0.55)');
          grad.addColorStop(0.9, 'rgba(40, 25, 20, 0.25)');
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, 42, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // ==========================================
      // 2.5 FOCUS PING BEACON ON THE BATTLEFIELD
      // ==========================================
      if (focusBeacon && now - focusBeacon.timestamp < 3800) {
        const elapsed = (now - focusBeacon.timestamp) / 1000;
        const bx = focusBeacon.x;
        const by = focusBeacon.y;

        ctx.save();
        ctx.translate(bx, by);

        // 3 concentric expanding holographic rings
        for (let rIdx = 0; rIdx < 3; rIdx++) {
          const ringProgress = (elapsed + rIdx * 0.33) % 1;
          const ringRadius = 15 + ringProgress * 110;
          const ringAlpha = Math.max(0, 1 - ringProgress);

          ctx.strokeStyle = `rgba(245, 158, 11, ${ringAlpha * 0.9})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Center spinning tactical reticle
        ctx.rotate(now / 350);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-34, 0);
        ctx.lineTo(-10, 0);
        ctx.moveTo(10, 0);
        ctx.lineTo(34, 0);
        ctx.moveTo(0, -34);
        ctx.lineTo(0, -10);
        ctx.moveTo(0, 10);
        ctx.lineTo(0, 34);
        ctx.stroke();
        ctx.restore();
      }

      // ==========================================
      // 3. SUNKEN TERRAIN: WATER LAKES & RIVERS
      // ==========================================
      for (const obs of obstacles) {
        if (obs.type !== 'WATER') continue;

        // 2.5D Shore Embankment (Dark bevel drop into water basin)
        ctx.fillStyle = '#06263b';
        ctx.fillRect(obs.x - 4, obs.y - 4, obs.w + 8, obs.h + 8);

        // Water basin fill
        const waterGrad = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.h);
        waterGrad.addColorStop(0, '#0284c7');
        waterGrad.addColorStop(0.5, '#0369a1');
        waterGrad.addColorStop(1, '#075985');
        ctx.fillStyle = waterGrad;
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

        // 2.5D Animated Water Caustics / Sun Glare Ripples
        ctx.strokeStyle = '#7dd3fc';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.45;
        const waveOffset = (now / 350) % 40;
        ctx.beginPath();
        for (let y = obs.y + 15; y < obs.y + obs.h - 10; y += 30) {
          ctx.moveTo(obs.x + 12, y + Math.sin(y * 0.1 + waveOffset) * 4);
          ctx.lineTo(obs.x + obs.w - 12, y + Math.sin(y * 0.1 + waveOffset) * 4);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Shoreline highlight
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      }

      // ==========================================
      // 3.5. TEAM DEATHMATCH BASES (Căn Cứ Hồi Máu Đội Đỏ & Đội Xanh)
      // ==========================================
      for (const base of bases) {
        ctx.save();
        const isRed = base.team === 'RED';
        const baseColor = isRed ? '#ef4444' : '#3b82f6';
        const pulse = 0.5 + Math.sin(now / 350) * 0.5;

        // Base field glow
        ctx.fillStyle = isRed ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.12)';
        ctx.fillRect(base.x, base.y, base.w, base.h);

        // Tech Floor Grid in base
        ctx.strokeStyle = isRed ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)';
        ctx.lineWidth = 1;
        const bStep = 40;
        for (let bx = base.x; bx <= base.x + base.w; bx += bStep) {
          ctx.beginPath();
          ctx.moveTo(bx, base.y);
          ctx.lineTo(bx, base.y + base.h);
          ctx.stroke();
        }
        for (let by = base.y; by <= base.y + base.h; by += bStep) {
          ctx.beginPath();
          ctx.moveTo(base.x, by);
          ctx.lineTo(base.x + base.w, by);
          ctx.stroke();
        }

        // Perimeter Forcefield Border
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([12, 8]);
        ctx.strokeRect(base.x, base.y, base.w, base.h);
        ctx.setLineDash([]);

        // Floating Healing Crosses in base
        ctx.fillStyle = isRed ? 'rgba(252, 165, 165, 0.65)' : 'rgba(147, 197, 253, 0.65)';
        for (let i = 0; i < 6; i++) {
          const crossX = base.x + 40 + ((i * 55 + (now / 20)) % (base.w - 80));
          const crossY = base.y + 60 + ((i * 120 + (now / 15)) % (base.h - 120));
          const cSize = 6;
          ctx.fillRect(crossX - cSize / 2, crossY - 1.5, cSize, 3);
          ctx.fillRect(crossX - 1.5, crossY - cSize / 2, 3, cSize);
        }

        // Tactical Holographic Center Emblem & Text
        const cx = base.x + base.w / 2;
        const cy = base.y + base.h / 2;
        ctx.fillStyle = baseColor;
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 12;
        ctx.font = 'black 18px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isRed ? '🔴 CĂN CỨ ĐỘI ĐỎ' : '🔵 CĂN CỨ ĐỘI XANH', cx, cy - 14);

        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 4;
        ctx.fillText('💚 VÙNG HỒI MÁU (+10 HP/s & HỒI GIÁP)', cx, cy + 14);
        ctx.restore();
      }

      // ==========================================
      // 4. TANK HEADLIGHT BEAMS (Projected on ground in front of living tanks)
      // ==========================================
      for (const tank of tanks) {
        if (tank.isDead) continue;
        ctx.save();
        ctx.translate(tank.x, tank.y);
        ctx.rotate(tank.angle);

        // Twin headlight cones
        const beamLength = 160;
        const beamAngle = 0.38;

        const leftBeam = ctx.createRadialGradient(16, -10, 2, 16 + beamLength * 0.7, -10, beamLength);
        leftBeam.addColorStop(0, 'rgba(255, 255, 220, 0.4)');
        leftBeam.addColorStop(0.5, 'rgba(255, 240, 180, 0.12)');
        leftBeam.addColorStop(1, 'transparent');

        ctx.fillStyle = leftBeam;
        ctx.beginPath();
        ctx.moveTo(16, -10);
        ctx.arc(16, -10, beamLength, -beamAngle, beamAngle);
        ctx.closePath();
        ctx.fill();

        const rightBeam = ctx.createRadialGradient(16, 10, 2, 16 + beamLength * 0.7, 10, beamLength);
        rightBeam.addColorStop(0, 'rgba(255, 255, 220, 0.4)');
        rightBeam.addColorStop(0.5, 'rgba(255, 240, 180, 0.12)');
        rightBeam.addColorStop(1, 'transparent');

        ctx.fillStyle = rightBeam;
        ctx.beginPath();
        ctx.moveTo(16, 10);
        ctx.arc(16, 10, beamLength, -beamAngle, beamAngle);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // ==========================================
      // 5. 2.5D SHADOW PASS (Sun angle from top-left ~315°)
      // ==========================================
      const shadowOffsetX = is25DMode ? 14 : 3;
      const shadowOffsetY = is25DMode ? 18 : 3;

      // Obstacle Shadows
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      for (const obs of obstacles) {
        if (obs.type === 'WATER' || obs.type === 'BUSH') continue;
        const h3D = !is25DMode ? 0 : obs.type === 'STEEL' ? 32 : 24;
        ctx.beginPath();
        ctx.rect(obs.x + shadowOffsetX, obs.y + shadowOffsetY - h3D, obs.w, obs.h + h3D);
        ctx.fill();
      }

      // Tank Shadows
      for (const tank of tanks) {
        if (tank.isDead) continue;
        ctx.save();
        ctx.translate(tank.x + shadowOffsetX * 0.7, tank.y + shadowOffsetY * 0.7);
        ctx.rotate(tank.angle);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 26, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Boss Leviathan Shadow
      if (boss && boss.isAlive) {
        ctx.save();
        ctx.translate(boss.x + shadowOffsetX * 0.9, boss.y + shadowOffsetY * 0.9);
        ctx.rotate(boss.angle);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 68, 52, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Supply Crate Shadows & Light Shaft
      for (const crate of powerUps) {
        const hoverZ = 16 + Math.sin(now / 250) * 4;
        // Ground shadow (scales with hover height)
        const shadowScale = 1 - hoverZ * 0.015;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(crate.x + shadowOffsetX * 0.5, crate.y + shadowOffsetY * 0.5, 18 * shadowScale, 12 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Skyward Beacon Beam
        const beamGrad = ctx.createLinearGradient(crate.x, crate.y, crate.x, crate.y - 250);
        beamGrad.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
        beamGrad.addColorStop(0.7, 'rgba(251, 191, 36, 0.1)');
        beamGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(crate.x - 12, crate.y);
        ctx.lineTo(crate.x + 12, crate.y);
        ctx.lineTo(crate.x + 30, crate.y - 250);
        ctx.lineTo(crate.x - 30, crate.y - 250);
        ctx.closePath();
        ctx.fill();
      }

      // Render Tactical Plasma Landmines on ground
      for (const mine of landmines) {
        ctx.save();
        const pulse = 0.5 + Math.sin((now - mine.createdAt) / 140) * 0.5;
        const isArmed = now - mine.createdAt >= 400;

        // Laser perimeter circle
        ctx.strokeStyle = isArmed ? `rgba(239, 68, 68, ${0.35 + pulse * 0.45})` : 'rgba(234, 179, 8, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(mine.x, mine.y, 28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Ground Mine Disc
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(mine.x, mine.y, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 4 Corner bolts
        ctx.fillStyle = '#94a3b8';
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
          ctx.beginPath();
          ctx.arc(mine.x + Math.cos(a) * 8, mine.y + Math.sin(a) * 8, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Inner Core Warning LED
        ctx.fillStyle = isArmed ? (pulse > 0.4 ? '#ef4444' : '#991b1b') : '#eab308';
        ctx.shadowColor = isArmed ? '#ef4444' : '#eab308';
        ctx.shadowBlur = isArmed ? 8 : 4;
        ctx.beginPath();
        ctx.arc(mine.x, mine.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
      }

      // ==========================================
      // 6. Y-SORTED 2.5D ENTITY PASS (Painters Algorithm for authentic 3D depth)
      // ==========================================
      interface RenderEntity {
        baseY: number;
        type: 'obstacle' | 'tank' | 'crate' | 'boss';
        item: Obstacle | PlayerTank | PowerUpCrate | BossInfo;
      }

      const entityList: RenderEntity[] = [];

      for (const obs of obstacles) {
        if (obs.type === 'WATER' || obs.type === 'BUSH') continue;
        entityList.push({
          baseY: obs.y + obs.h,
          type: 'obstacle',
          item: obs,
        });
      }

      for (const tank of tanks) {
        if (tank.isDead) continue;
        entityList.push({
          baseY: tank.y + 14,
          type: 'tank',
          item: tank,
        });
      }

      for (const crate of powerUps) {
        entityList.push({
          baseY: crate.y + 10,
          type: 'crate',
          item: crate,
        });
      }

      // Add World Boss Leviathan to depth-sorting queue
      if (boss && boss.isAlive) {
        entityList.push({
          baseY: boss.y + 45,
          type: 'boss',
          item: boss,
        });
      }

      // Sort ascending by baseY: objects higher up (smaller Y) drawn FIRST,
      // objects lower down (larger Y) drawn IN FRONT!
      entityList.sort((a, b) => a.baseY - b.baseY);

      for (const entity of entityList) {
        if (entity.type === 'obstacle') {
          const obs = entity.item as Obstacle;
          const h3D = !is25DMode ? 0 : obs.type === 'STEEL' ? 32 : 24;

          if (obs.type === 'STEEL') {
            // --- 2.5D STEEL BASTION / CONTAINER ---
            // 1. Front Shaded Face
            const frontGrad = ctx.createLinearGradient(obs.x, obs.y + obs.h - h3D, obs.x, obs.y + obs.h);
            frontGrad.addColorStop(0, '#334155');
            frontGrad.addColorStop(1, '#1e293b');
            ctx.fillStyle = frontGrad;
            ctx.fillRect(obs.x, obs.y + obs.h - h3D, obs.w, h3D);

            // Corrugated vertical panel stripes on front
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.lineWidth = 1.5;
            for (let px = obs.x + 12; px < obs.x + obs.w; px += 16) {
              ctx.beginPath();
              ctx.moveTo(px, obs.y + obs.h - h3D);
              ctx.lineTo(px, obs.y + obs.h);
              ctx.stroke();
            }

            // Hazard stripe plate in center of front face
            if (obs.w >= 60) {
              ctx.fillStyle = '#eab308';
              ctx.fillRect(obs.x + obs.w / 2 - 16, obs.y + obs.h - 18, 32, 12);
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(obs.x + obs.w / 2 - 10, obs.y + obs.h - 18, 6, 12);
              ctx.fillRect(obs.x + obs.w / 2 + 4, obs.y + obs.h - 18, 6, 12);
            }

            // 2. Top Roof Face (Light from sun)
            const topGrad = ctx.createLinearGradient(obs.x, obs.y - h3D, obs.x + obs.w, obs.y + obs.h - h3D);
            topGrad.addColorStop(0, '#64748b');
            topGrad.addColorStop(1, '#475569');
            ctx.fillStyle = topGrad;
            ctx.fillRect(obs.x, obs.y - h3D, obs.w, obs.h);

            // Roof diagonal cross reinforcement
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(obs.x, obs.y - h3D, obs.w, obs.h);

            ctx.beginPath();
            ctx.moveTo(obs.x + 6, obs.y - h3D + 6);
            ctx.lineTo(obs.x + obs.w - 6, obs.y - h3D + obs.h - 6);
            ctx.moveTo(obs.x + obs.w - 6, obs.y - h3D + 6);
            ctx.lineTo(obs.x + 6, obs.y - h3D + obs.h - 6);
            ctx.stroke();

            // Roof corner rivets
            ctx.fillStyle = '#cbd5e1';
            const rSize = 3;
            ctx.fillRect(obs.x + 4, obs.y - h3D + 4, rSize, rSize);
            ctx.fillRect(obs.x + obs.w - 7, obs.y - h3D + 4, rSize, rSize);
            ctx.fillRect(obs.x + 4, obs.y - h3D + obs.h - 7, rSize, rSize);
            ctx.fillRect(obs.x + obs.w - 7, obs.y - h3D + obs.h - 7, rSize, rSize);

          } else if (obs.type === 'BRICK') {
            // --- 2.5D DESTRUCTIBLE BRICK WALL ---
            const hpRatio = (obs.hp || 100) / (obs.maxHp || 100);

            // 1. Front Brick Face (Darker terracotta)
            const frontGrad = ctx.createLinearGradient(obs.x, obs.y + obs.h - h3D, obs.x, obs.y + obs.h);
            frontGrad.addColorStop(0, hpRatio > 0.4 ? '#9a3412' : '#7c2d12');
            frontGrad.addColorStop(1, hpRatio > 0.4 ? '#7c2d12' : '#451a03');
            ctx.fillStyle = frontGrad;
            ctx.fillRect(obs.x, obs.y + obs.h - h3D, obs.w, h3D);

            // Mortar line courses
            ctx.strokeStyle = '#451a03';
            ctx.lineWidth = 1;
            for (let by = obs.y + obs.h - h3D + 8; by < obs.y + obs.h; by += 8) {
              ctx.beginPath();
              ctx.moveTo(obs.x, by);
              ctx.lineTo(obs.x + obs.w, by);
              ctx.stroke();
            }

            // 2. Top Coping Stone Face (Lit brick top)
            ctx.fillStyle = hpRatio > 0.4 ? '#c2410c' : '#9a3412';
            ctx.fillRect(obs.x, obs.y - h3D, obs.w, obs.h);
            ctx.strokeStyle = '#ea580c';
            ctx.lineWidth = 1;
            ctx.strokeRect(obs.x, obs.y - h3D, obs.w, obs.h);

            // Damage cracks & missing chunks
            if (hpRatio < 0.7) {
              ctx.strokeStyle = '#180702';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(obs.x + obs.w * 0.4, obs.y - h3D);
              ctx.lineTo(obs.x + obs.w * 0.5, obs.y + obs.h * 0.4);
              ctx.lineTo(obs.x + obs.w * 0.8, obs.y + obs.h);
              ctx.stroke();
            }
          }

        } else if (entity.type === 'crate') {
          // --- 2.5D HOVERING SUPPLY CRATE ---
          const crate = entity.item as PowerUpCrate;
          const hoverZ = 16 + Math.sin(now / 250) * 4;

          ctx.save();
          ctx.translate(crate.x, crate.y - hoverZ);

          const crateColors: Record<string, string> = {
            TRIPLE_SHOT: '#fbbf24',
            SPEED_BOOST: '#38bdf8',
            SHIELD: '#818cf8',
            REPAIR: '#34d399',
            RAPID_FIRE: '#f87171',
          };
          const color = crateColors[crate.type] || '#fbbf24';

          // 2.5D Isometric Crate Body
          // Front Face
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.fillRect(-14, 0, 28, 14);
          ctx.strokeRect(-14, 0, 28, 14);

          // Top Face
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-14, -14, 28, 14);
          ctx.strokeRect(-14, -14, 28, 14);

          // Crate glowing insignia
          ctx.fillStyle = color;
          ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          let symbol = '★';
          if (crate.type === 'TRIPLE_SHOT') symbol = 'III';
          else if (crate.type === 'SPEED_BOOST') symbol = '⚡';
          else if (crate.type === 'SHIELD') symbol = '🛡';
          else if (crate.type === 'REPAIR') symbol = '✚';
          else if (crate.type === 'RAPID_FIRE') symbol = '⚡⚡';
          ctx.fillText(symbol, 0, -7);

          // Floating Tactical Item Name & Description Badge
          const crateDetails: Record<
            string,
            { label: string; color: string; bg: string; icon: string }
          > = {
            REPAIR: {
              label: 'CỨU THƯƠNG (+50HP)',
              color: '#34d399',
              bg: 'rgba(6, 78, 59, 0.9)',
              icon: '✚',
            },
            SHIELD: {
              label: 'KHIÊN GIÁP (100)',
              color: '#a5b4fc',
              bg: 'rgba(49, 46, 129, 0.9)',
              icon: '🛡️',
            },
            TRIPLE_SHOT: {
              label: 'ĐẠN 3 TIA',
              color: '#fde047',
              bg: 'rgba(113, 63, 18, 0.9)',
              icon: '🔱',
            },
            SPEED_BOOST: {
              label: 'NITRO TURBO',
              color: '#38bdf8',
              bg: 'rgba(12, 74, 110, 0.9)',
              icon: '⚡',
            },
            RAPID_FIRE: {
              label: 'BẮN LIÊN THANH',
              color: '#f87171',
              bg: 'rgba(127, 29, 29, 0.9)',
              icon: '🔥',
            },
          };

          const info = crateDetails[crate.type] || {
            label: 'LINH KIỆN',
            color: '#fbbf24',
            bg: 'rgba(15, 23, 42, 0.9)',
            icon: '📦',
          };

          // Draw pill badge above crate
          const badgeY = -30;
          const badgeW = 92;
          const badgeH = 14;

          ctx.fillStyle = info.bg;
          ctx.strokeStyle = info.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(-badgeW / 2, badgeY, badgeW, badgeH, 4);
          } else {
            ctx.rect(-badgeW / 2, badgeY, badgeW, badgeH);
          }
          ctx.fill();
          ctx.stroke();

          // Text label
          ctx.fillStyle = info.color;
          ctx.font = 'bold 8px Plus Jakarta Sans, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${info.icon} ${info.label}`, 0, badgeY + badgeH / 2);

          ctx.restore();

        } else if (entity.type === 'tank') {
          // --- 2.5D TANK MODEL ---
          const tank = entity.item as PlayerTank;
          const recoil = tankRecoilRef.current.get(tank.id) || 0;
          const recoilDist = recoil * 6; // slides back up to 6px

          ctx.save();
          ctx.translate(tank.x, tank.y);

          // Camouflage foliage check
          let isInBush = false;
          for (const obs of obstacles) {
            if (
              obs.type === 'BUSH' &&
              tank.x >= obs.x &&
              tank.x <= obs.x + obs.w &&
              tank.y >= obs.y &&
              tank.y <= obs.y + obs.h
            ) {
              isInBush = true;
              break;
            }
          }
          if (isInBush) {
            ctx.globalAlpha = tank.id === myPlayerId ? 0.65 : 0.2;
          }

          // 1. Invulnerability 3D Bubble Forcefield
          if (now < tank.invulnerableUntil) {
            ctx.save();
            const pulse = 1 + Math.sin(now / 150) * 0.08;
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, -6, 32 * pulse, 0, Math.PI * 2);
            ctx.stroke();

            const shieldGrad = ctx.createRadialGradient(0, -6, 5, 0, -6, 32 * pulse);
            shieldGrad.addColorStop(0, 'rgba(56, 189, 248, 0.1)');
            shieldGrad.addColorStop(0.8, 'rgba(56, 189, 248, 0.25)');
            shieldGrad.addColorStop(1, 'rgba(56, 189, 248, 0.6)');
            ctx.fillStyle = shieldGrad;
            ctx.fill();
            ctx.restore();
          }

          // 2. Active 3D Energy Shield Matrix
          if (tank.shield > 0) {
            ctx.save();
            ctx.strokeStyle = '#60a5fa';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 5]);
            ctx.beginPath();
            ctx.arc(0, -5, 29, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
          }

          // 3. Tactical [Space] FORCE SHIELD Skill Barrier
          if (tank.skills && now < tank.skills.shieldUntil) {
            ctx.save();
            const hexPulse = 1 + Math.sin(now / 100) * 0.06;
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(0, -6, 36 * hexPulse, 0, Math.PI * 2);
            ctx.stroke();

            const hexGrad = ctx.createRadialGradient(0, -6, 10, 0, -6, 36 * hexPulse);
            hexGrad.addColorStop(0, 'rgba(0, 240, 255, 0.05)');
            hexGrad.addColorStop(0.7, 'rgba(0, 240, 255, 0.22)');
            hexGrad.addColorStop(1, 'rgba(0, 240, 255, 0.55)');
            ctx.fillStyle = hexGrad;
            ctx.fill();

            // Orbiting energy nodes
            for (let nodeIdx = 0; nodeIdx < 4; nodeIdx++) {
              const nodeAngle = (now / 350) + (nodeIdx * (Math.PI / 2));
              const nx = Math.cos(nodeAngle) * 36 * hexPulse;
              const ny = -6 + Math.sin(nodeAngle) * 36 * hexPulse;
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(nx, ny, 3, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.shadowBlur = 0;
            ctx.restore();
          }

          // --- 3D TANK HULL (Rotates with tank.angle) ---
          ctx.save();
          ctx.rotate(tank.angle);

          // 3D Caterpillar Tracks with Extruded Height
          // Left track unit
          ctx.fillStyle = '#090d16';
          ctx.fillRect(-23, -20, 46, 8);
          // 3D Road Wheels on Left Track
          ctx.fillStyle = '#334155';
          for (let wx = -18; wx <= 18; wx += 9) {
            ctx.beginPath();
            ctx.arc(wx, -16, 3, 0, Math.PI * 2);
            ctx.fill();
          }

          // Right track unit
          ctx.fillStyle = '#090d16';
          ctx.fillRect(-23, 12, 46, 8);
          // 3D Road Wheels on Right Track
          ctx.fillStyle = '#334155';
          for (let wx = -18; wx <= 18; wx += 9) {
            ctx.beginPath();
            ctx.arc(wx, 16, 3, 0, Math.PI * 2);
            ctx.fill();
          }

          // 3D Armored Hull Box
          // Hull Lower Drop Shadow onto tracks
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fillRect(-20, -13, 40, 26);

          // Sloped Upper Hull Plate with Custom Skin Workshop Pattern
          const skin = tank.skinId || 'DEFAULT';
          if (skin === 'CAMO_WOODLAND') {
            ctx.fillStyle = '#2d4a22';
            ctx.fillRect(-19, -12, 38, 24);
            // Camo splotches
            ctx.fillStyle = '#4d7c0f';
            ctx.beginPath();
            ctx.ellipse(-8, -4, 9, 6, 0.4, 0, Math.PI * 2);
            ctx.ellipse(9, 3, 7, 5, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#713f12';
            ctx.beginPath();
            ctx.ellipse(3, -5, 6, 4, -0.5, 0, Math.PI * 2);
            ctx.ellipse(-12, 5, 5, 4, 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.ellipse(-3, 6, 7, 3, 0.1, 0, Math.PI * 2);
            ctx.fill();
          } else if (skin === 'ARCTIC_FROST') {
            const frostGrad = ctx.createLinearGradient(-19, -12, 19, 12);
            frostGrad.addColorStop(0, '#0284c7');
            frostGrad.addColorStop(0.5, '#38bdf8');
            frostGrad.addColorStop(1, '#e0f2fe');
            ctx.fillStyle = frostGrad;
            ctx.fillRect(-19, -12, 38, 24);
            // Crystal facets & shimmer
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-10, -12); ctx.lineTo(-2, 0); ctx.lineTo(8, -12);
            ctx.moveTo(-2, 0); ctx.lineTo(6, 12);
            ctx.stroke();
          } else if (skin === 'VOLCANIC_MAGMA') {
            ctx.fillStyle = '#1c1917';
            ctx.fillRect(-19, -12, 38, 24);
            // Magma glowing fissures
            const lavaPulse = 0.6 + Math.sin(now / 180) * 0.4;
            ctx.strokeStyle = `rgba(239, 68, 68, ${lavaPulse})`;
            ctx.lineWidth = 2;
            ctx.shadowColor = '#f97316';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.moveTo(-18, -6); ctx.lineTo(-6, -2); ctx.lineTo(4, -8); ctx.lineTo(16, -3);
            ctx.moveTo(-10, 6); ctx.lineTo(2, 4); ctx.lineTo(14, 8);
            ctx.stroke();
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.shadowBlur = 0;
          } else if (skin === 'NEON_CYBERPUNK') {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-19, -12, 38, 24);
            // Cyberpunk neon edges & grid
            ctx.strokeStyle = '#d946ef';
            ctx.lineWidth = 1.5;
            ctx.shadowColor = '#d946ef';
            ctx.shadowBlur = 8;
            ctx.strokeRect(-18, -11, 36, 22);
            ctx.strokeStyle = '#06b6d4';
            ctx.beginPath();
            ctx.moveTo(-18, 0); ctx.lineTo(18, 0);
            ctx.moveTo(0, -11); ctx.lineTo(0, 11);
            ctx.stroke();
            ctx.shadowBlur = 0;
          } else if (skin === 'ROYAL_GOLD') {
            const goldGrad = ctx.createLinearGradient(-19, -12, 19, 12);
            goldGrad.addColorStop(0, '#fef08a');
            goldGrad.addColorStop(0.3, '#eab308');
            goldGrad.addColorStop(0.7, '#ca8a04');
            goldGrad.addColorStop(1, '#a16207');
            ctx.fillStyle = goldGrad;
            ctx.fillRect(-19, -12, 38, 24);
            // Royal filigree borders
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 1.2;
            ctx.strokeRect(-16, -9, 32, 18);
          } else {
            ctx.fillStyle = tank.color;
            ctx.fillRect(-19, -12, 38, 24);
          }

          // 3D Bevel highlight on front glacis armor plate
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(19, -12);
          ctx.lineTo(19, 12);
          ctx.stroke();

          // Engine deck ventilation grilles (rear)
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-16, -8, 8, 16);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1;
          for (let gy = -6; gy <= 6; gy += 3) {
            ctx.beginPath();
            ctx.moveTo(-16, gy);
            ctx.lineTo(-8, gy);
            ctx.stroke();
          }

          // Driver's front hatch & vision slit
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(13, -3, 3, 6);

          // Nitro & Component Speed Booster Flames (when powerup or [Shift] Boost Skill active)
          const isSkillBoost = !!(tank.skills && now < tank.skills.boostUntil);
          if (tank.activePowerUp || isSkillBoost) {
            const isNitro = isSkillBoost || tank.activePowerUp?.type === 'SPEED_BOOST';
            const flameLen = isNitro ? 22 + Math.random() * 12 : 8 + Math.random() * 5;
            const flameGrad = ctx.createLinearGradient(-20, 0, -20 - flameLen, 0);
            if (isNitro) {
              flameGrad.addColorStop(0, '#ffffff');
              flameGrad.addColorStop(0.2, '#38bdf8');
              flameGrad.addColorStop(0.7, '#0284c7');
              flameGrad.addColorStop(1, 'transparent');
            } else {
              flameGrad.addColorStop(0, '#fbbf24');
              flameGrad.addColorStop(0.6, '#f97316');
              flameGrad.addColorStop(1, 'transparent');
            }
            ctx.fillStyle = flameGrad;
            // Left exhaust pipe jet
            ctx.beginPath();
            ctx.moveTo(-20, -7);
            ctx.lineTo(-20 - flameLen, -4);
            ctx.lineTo(-20, -1);
            ctx.fill();
            // Right exhaust pipe jet
            ctx.beginPath();
            ctx.moveTo(-20, 1);
            ctx.lineTo(-20 - flameLen, 4);
            ctx.lineTo(-20, 7);
            ctx.fill();
          }

          ctx.restore(); // Finish Tank Hull

          // --- 3D TURRET & CANNON BARREL (Rotates with tank.turretAngle) ---
          ctx.save();
          ctx.rotate(tank.turretAngle);

          // Turret Elevation Cast Shadow onto hull deck
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.beginPath();
          ctx.ellipse(3, 4, 13, 11, 0, 0, Math.PI * 2);
          ctx.fill();

          // Cannon Barrel with Recoil Slide
          const barrelLength = tank.tankClass === 'JUGGERNAUT' ? 28 : tank.tankClass === 'SCOUT' ? 20 : 24;
          const barrelWidth = tank.tankClass === 'JUGGERNAUT' ? 7 : 5;
          const currentBarrelLen = barrelLength - recoilDist;

          // 2.5D Cylindrical Barrel Shading
          const barrelGrad = ctx.createLinearGradient(0, -barrelWidth / 2, 0, barrelWidth / 2);
          barrelGrad.addColorStop(0, '#475569');
          barrelGrad.addColorStop(0.5, '#94a3b8');
          barrelGrad.addColorStop(1, '#1e293b');

          ctx.fillStyle = barrelGrad;
          ctx.fillRect(0, -barrelWidth / 2, currentBarrelLen, barrelWidth);

          // [R] Barrage Skill: Overcharge electricity arcs along barrel
          if (tank.skills && now < tank.skills.barrageUntil) {
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 1.5;
            ctx.shadowColor = '#f43f5e';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(4, 0);
            for (let bx = 6; bx < currentBarrelLen; bx += 5) {
              ctx.lineTo(bx, (Math.random() - 0.5) * (barrelWidth + 4));
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
          }

          // Double-baffle muzzle brake at tip
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(currentBarrelLen - 3, -barrelWidth / 2 - 1.5, 3, barrelWidth + 3);

          // 3D Turret Dome (Elevated on Z = 16)
          const domeRad = tank.tankClass === 'JUGGERNAUT' ? 14 : tank.tankClass === 'SCOUT' ? 10 : 12;
          const turretGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, domeRad);
          turretGrad.addColorStop(0, '#ffffff');

          let turretColor = tank.color;
          if (skin === 'CAMO_WOODLAND') turretColor = '#2d4a22';
          else if (skin === 'ARCTIC_FROST') turretColor = '#0ea5e9';
          else if (skin === 'VOLCANIC_MAGMA') turretColor = '#dc2626';
          else if (skin === 'NEON_CYBERPUNK') turretColor = '#d946ef';
          else if (skin === 'ROYAL_GOLD') turretColor = '#eab308';

          turretGrad.addColorStop(0.3, turretColor);
          turretGrad.addColorStop(1, '#0f172a');

          ctx.fillStyle = turretGrad;
          ctx.beginPath();
          ctx.arc(0, 0, domeRad, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Commander's Cupola Hatch & Periscope
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(-3, 1, 4, 0, Math.PI * 2);
          ctx.fill();

          // Radio whip antenna base
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.arc(-7, -4, 2, 0, Math.PI * 2);
          ctx.fill();

          // Roof Decal / Flag Emblem mounted on top of turret
          const decal = tank.roofDecal || 'NONE';
          if (decal === 'FLAG_VIETNAM') {
            // Cờ Đỏ Sao Vàng Việt Nam tung bay trên nóc tháp pháo
            ctx.save();
            ctx.fillStyle = '#da251d';
            ctx.fillRect(-6, -4, 12, 8);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 0.6;
            ctx.strokeRect(-6, -4, 12, 8);
            // Gold Star
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 7px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', 0, 0.5);
            ctx.restore();
          } else if (decal === 'PIRATE_SKULL') {
            // Cờ Hải Tặc Jolly Roger
            ctx.save();
            ctx.fillStyle = '#000000';
            ctx.fillRect(-5, -4, 10, 8);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 7px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('☠', 0, 0.5);
            ctx.restore();
          } else if (decal === 'TIGER_BEAST') {
            // Icon Mãnh Hổ
            ctx.save();
            ctx.font = '8px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🐯', 0, 0);
            ctx.restore();
          } else if (decal === 'MILITARY_STAR') {
            // Ngôi sao quân sự vàng
            ctx.save();
            ctx.fillStyle = '#facc15';
            ctx.shadowColor = '#facc15';
            ctx.shadowBlur = 4;
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', 0, 0.5);
            ctx.shadowBlur = 0;
            ctx.restore();
          } else if (decal === 'DRAGON_CREST') {
            // Biểu tượng Rồng
            ctx.save();
            ctx.font = '8px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🐉', 0, 0);
            ctx.restore();
          } else if (decal === 'ROYAL_SHIELD') {
            // Khiên Hiệp Sĩ Hoàng Gia
            ctx.save();
            ctx.font = '8px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🛡️', 0, 0);
            ctx.restore();
          }

          ctx.restore(); // Finish Turret

          // --- 2.5D OVERHEAD HEALTH & TAG BAR (Floating above tank at Z = 42) ---
          ctx.globalAlpha = 1;
          const barW = 48;
          const barH = 5;
          const barY = -38;

          // Bar shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(-barW / 2 - 1, barY - 1, barW + 2, barH + 2);

          // HP gauge
          const hpPct = Math.max(0, Math.min(1, tank.hp / tank.maxHp));
          ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#eab308' : '#ef4444';
          ctx.fillRect(-barW / 2, barY, barW * hpPct, barH);

          // Shield bar overlay if active
          if (tank.shield > 0) {
            const sPct = Math.min(1, tank.shield / 100);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(-barW / 2, barY - 4, barW * sPct, 3);
          }

          // Commander name with distinct online indicator
          ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';

          const lvlTag = `[LV.${tank.level || 1}]`;
          if (tank.id === myPlayerId) {
            ctx.fillStyle = '#38bdf8';
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 3;
            const displayName = `${lvlTag} [BẠN] 🎯 ${tank.name}`;
            ctx.strokeText(displayName, 0, barY - 5);
            ctx.fillText(displayName, 0, barY - 5);
          } else if (!tank.isBot) {
            // Real Online Socket Opponent!
            ctx.fillStyle = '#34d399';
            ctx.strokeStyle = '#022c22';
            ctx.lineWidth = 3.5;
            const displayName = `${lvlTag} [ONLINE] ⚡ ${tank.name}`;
            ctx.strokeText(displayName, 0, barY - 5);
            ctx.fillText(displayName, 0, barY - 5);

            // Small live indicator dot
            const pulseRad = 3 + Math.sin(now / 150) * 0.8;
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(-barW / 2 - 6, barY + barH / 2, pulseRad, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Bot AI
            ctx.fillStyle = '#f87171';
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 3;
            const displayName = `${lvlTag} [AI] ${tank.name}`;
            ctx.strokeText(displayName, 0, barY - 5);
            ctx.fillText(displayName, 0, barY - 5);
          }

          // --- Tank Debuff Visuals ---
          // Frost Freeze / Slow aura
          if (tank.slowUntil && now < tank.slowUntil) {
            ctx.save();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(0, 0, 28, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // Incendiary Burn flames
          if (tank.burnUntil && now < tank.burnUntil) {
            ctx.save();
            const flamePulse = Math.sin(now / 100) * 4;
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.arc(-8, -10 + flamePulse, 5, 0, Math.PI * 2);
            ctx.arc(8, -10 - flamePulse, 5, 0, Math.PI * 2);
            ctx.arc(0, -14, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          ctx.restore();
        } else if (entity.type === 'boss') {
          // --- 2.5D WORLD BOSS LEVIATHAN (1000 HP, 4-BARREL DREADNOUGHT TANK) ---
          const b = entity.item as BossInfo;
          ctx.save();
          ctx.translate(b.x, b.y);

          // 1. Dual Heavy Treads (Left & Right Track Assemblies)
          const treadW = 30;
          const treadL = 140;
          const treadOffsets = [-56, 56];

          for (const tox of treadOffsets) {
            // Track base shadow
            ctx.fillStyle = '#020617';
            ctx.fillRect(tox - treadW / 2, -treadL / 2, treadW, treadL);

            // Metallic track casing gradient
            const trackGrad = ctx.createLinearGradient(tox - treadW / 2, 0, tox + treadW / 2, 0);
            trackGrad.addColorStop(0, '#1e293b');
            trackGrad.addColorStop(0.5, '#475569');
            trackGrad.addColorStop(1, '#0f172a');
            ctx.fillStyle = trackGrad;
            ctx.fillRect(tox - treadW / 2, -treadL / 2, treadW, treadL);

            // Animated track tread ridges
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            const treadScroll = (now / 20) % 16;
            for (let ty = -treadL / 2 + treadScroll; ty < treadL / 2; ty += 14) {
              ctx.beginPath();
              ctx.moveTo(tox - treadW / 2, ty);
              ctx.lineTo(tox + treadW / 2, ty);
              ctx.stroke();
            }

            // Heavy Golden Armor Skirts over tracks
            ctx.fillStyle = '#b45309';
            ctx.fillRect(tox - treadW / 2 - 3, -treadL / 2 + 10, 4, treadL - 20);
            ctx.fillRect(tox + treadW / 2 - 1, -treadL / 2 + 10, 4, treadL - 20);
          }

          // 2. Heavy Dreadnought Hull
          const hullW = 86;
          const hullL = 120;
          const hullGrad = ctx.createLinearGradient(-hullW / 2, -hullL / 2, hullW / 2, hullL / 2);
          hullGrad.addColorStop(0, '#334155');
          hullGrad.addColorStop(0.3, '#1e293b');
          hullGrad.addColorStop(0.7, '#0f172a');
          hullGrad.addColorStop(1, '#020617');

          ctx.fillStyle = hullGrad;
          ctx.beginPath();
          // Angular armored front bow
          ctx.moveTo(-hullW / 2, -hullL / 2 + 25);
          ctx.lineTo(-hullW / 2 + 20, -hullL / 2);
          ctx.lineTo(hullW / 2 - 20, -hullL / 2);
          ctx.lineTo(hullW / 2, -hullL / 2 + 25);
          ctx.lineTo(hullW / 2, hullL / 2);
          ctx.lineTo(-hullW / 2, hullL / 2);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Yellow/Black Hazard Stripes on rear chassis
          ctx.fillStyle = '#eab308';
          ctx.fillRect(-hullW / 2 + 8, hullL / 2 - 18, hullW - 16, 12);
          ctx.fillStyle = '#0f172a';
          for (let hx = -hullW / 2 + 14; hx < hullW / 2 - 14; hx += 16) {
            ctx.beginPath();
            ctx.moveTo(hx, hullL / 2 - 18);
            ctx.lineTo(hx + 8, hullL / 2 - 6);
            ctx.lineTo(hx + 4, hullL / 2 - 6);
            ctx.lineTo(hx - 4, hullL / 2 - 18);
            ctx.closePath();
            ctx.fill();
          }

          // Center Leviathan Plasma Core (Pulsing cyan reactor)
          const corePulse = 0.5 + Math.sin(now / 150) * 0.5;
          ctx.fillStyle = `rgba(6, 182, 212, ${0.4 + corePulse * 0.6})`;
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(0, 18, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // 3. Rotating Quad-Cannon Turret (4 Nòng Pháo)
          ctx.save();
          ctx.rotate(b.turretAngle);

          // 4 Cannon Barrels:
          // A) Dual Heavy Main Cannons (Center barrels)
          const mainBarrelLen = 78;
          const mainBarrelW = 10;
          const mainOffsets = [-14, 14];

          for (const mox of mainOffsets) {
            const bGrad = ctx.createLinearGradient(0, mox - mainBarrelW / 2, 0, mox + mainBarrelW / 2);
            bGrad.addColorStop(0, '#64748b');
            bGrad.addColorStop(0.5, '#cbd5e1');
            bGrad.addColorStop(1, '#1e293b');
            ctx.fillStyle = bGrad;
            ctx.fillRect(0, mox - mainBarrelW / 2, mainBarrelLen, mainBarrelW);

            // Heavy double muzzle brake
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(mainBarrelLen - 10, mox - mainBarrelW / 2 - 2, 10, mainBarrelW + 4);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(mainBarrelLen - 5, mox - mainBarrelW / 2 - 3, 2, mainBarrelW + 6);
          }

          // B) Dual Secondary Flak / Plasma Barrels (Outer flank barrels)
          const secBarrelLen = 58;
          const secBarrelW = 6;
          const secOffsets = [-32, 32];

          for (const sox of secOffsets) {
            ctx.fillStyle = '#334155';
            ctx.fillRect(0, sox - secBarrelW / 2, secBarrelLen, secBarrelW);
            // Cyan plasma conduit light
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 6;
            ctx.fillRect(10, sox - 1.5, secBarrelLen - 18, 3);
            ctx.shadowBlur = 0;
          }

          // Turret Base Dome
          const domeRad = 38;
          const tGrad = ctx.createRadialGradient(-6, -6, 4, 0, 0, domeRad);
          tGrad.addColorStop(0, '#fef08a');
          tGrad.addColorStop(0.35, '#d97706');
          tGrad.addColorStop(0.85, '#451a03');
          tGrad.addColorStop(1, '#0f172a');
          ctx.fillStyle = tGrad;
          ctx.beginPath();
          ctx.arc(0, 0, domeRad, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Golden Skull / Crown Crest on Turret
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('👑', 0, -2);

          ctx.restore(); // Restore turret

          // 4. Forcefield Shield Aura (When shield > 0)
          if (b.shield > 0) {
            ctx.save();
            const sPulse = 1 + Math.sin(now / 180) * 0.05;
            const shieldRad = 92 * sPulse;
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 8]);
            ctx.beginPath();
            ctx.arc(0, 0, shieldRad, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            const sfGrad = ctx.createRadialGradient(0, 0, 30, 0, 0, shieldRad);
            sfGrad.addColorStop(0, 'rgba(245, 158, 11, 0.05)');
            sfGrad.addColorStop(0.8, 'rgba(245, 158, 11, 0.25)');
            sfGrad.addColorStop(1, 'rgba(251, 191, 36, 0.6)');
            ctx.fillStyle = sfGrad;
            ctx.beginPath();
            ctx.arc(0, 0, shieldRad, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // 5. EMP Shockwave Visual Ring (When boss activates EMP)
          if (b.lastSkillName === 'EMP_SHOCKWAVE') {
            ctx.save();
            const waveR = 80 + ((now / 8) % 240);
            const waveAlpha = Math.max(0, 1 - waveR / 320);
            ctx.strokeStyle = `rgba(0, 240, 255, ${waveAlpha})`;
            ctx.lineWidth = 4;
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 16;
            ctx.beginPath();
            ctx.arc(0, 0, waveR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // 6. Overhead Boss Title & Health Bar (Floating at Z = 65)
          const barW = 140;
          const barH = 10;
          const barY = -85;

          // Bar shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
          ctx.fillRect(-barW / 2 - 2, barY - 2, barW + 4, barH + 4);

          // HP gauge
          const hpPct = Math.max(0, Math.min(1, b.hp / b.maxHp));
          const hpGrad = ctx.createLinearGradient(-barW / 2, 0, barW / 2, 0);
          hpGrad.addColorStop(0, '#ef4444');
          hpGrad.addColorStop(0.5, '#f59e0b');
          hpGrad.addColorStop(1, '#10b981');
          ctx.fillStyle = hpGrad;
          ctx.fillRect(-barW / 2, barY, barW * hpPct, barH);

          // Shield bar overlay if active
          if (b.shield > 0) {
            const sPct = Math.min(1, b.shield / 250);
            ctx.fillStyle = '#00f0ff';
            ctx.fillRect(-barW / 2, barY - 5, barW * sPct, 4);
          }

          // Boss Title & HP numbers
          ctx.font = 'black 12px Plus Jakarta Sans, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillStyle = '#fbbf24';
          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 4;
          const bossLabel = `👑 SIÊU BOSS LEVIATHAN [1000 HP]`;
          ctx.strokeText(bossLabel, 0, barY - 8);
          ctx.fillText(bossLabel, 0, barY - 8);

          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(`${Math.ceil(b.hp)} / ${b.maxHp} HP${b.shield > 0 ? ` (+${Math.ceil(b.shield)} Giáp)` : ''}`, 0, barY + barH + 12);

          ctx.restore();
        }
      }

      // ==========================================
      // 7. 2.5D ELEVATED BULLETS & AIR TRACERS (Flying in 3D air at Z = 20)
      // ==========================================
      for (const b of bullets) {
        // 1. Ground shadow trailing under bullet
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(b.x + shadowOffsetX * 0.6, b.y + shadowOffsetY * 0.6, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Custom Bullet Trail & Muzzle Effects
        const trail = b.trailEffect || 'STANDARD';
        const speed = Math.hypot(b.vx, b.vy) || 10;
        const normVx = b.vx / speed;
        const normVy = b.vy / speed;

        if (trail === 'PURPLE_LIGHTNING') {
          // Vệt tia chớp tím phóng điện lách tách
          ctx.save();
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#9333ea';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y - 18);
          for (let step = 1; step <= 5; step++) {
            const tx = b.x - normVx * (step * 7) + (Math.sin(now / 40 + step * 2) * 5);
            const ty = b.y - 18 - normVy * (step * 7) + (Math.cos(now / 40 + step * 2) * 5);
            ctx.lineTo(tx, ty);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.restore();
        } else if (trail === 'DRAGON_FIRE') {
          // Vệt lửa rồng cuộn tàn than hồng
          ctx.save();
          for (let step = 1; step <= 4; step++) {
            const pDist = step * 8;
            const px = b.x - normVx * pDist + (Math.sin(step * 3) * 3);
            const py = b.y - 18 - normVy * pDist + (Math.cos(step * 3) * 3);
            const pRad = Math.max(1.5, 5.5 - step * 1.1);
            ctx.fillStyle = step % 2 === 0 ? '#f97316' : '#ef4444';
            ctx.shadowColor = '#f97316';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(px, py, pRad, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.shadowBlur = 0;
          ctx.restore();
        } else if (trail === 'FROST_SNOW') {
          // Hạt tuyết rơi băng tuyết bắc cực
          ctx.save();
          for (let step = 1; step <= 3; step++) {
            const pDist = step * 9;
            const px = b.x - normVx * pDist;
            const py = b.y - 18 - normVy * pDist;
            ctx.fillStyle = '#e0f2fe';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 6;
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('❄', px, py);
          }
          ctx.shadowBlur = 0;
          ctx.restore();
        } else if (trail === 'CYAN_LASER') {
          // Tia laze neon plasma công nghệ cao
          ctx.save();
          const laserGrad = ctx.createLinearGradient(b.x, b.y - 18, b.x - normVx * 35, b.y - 18 - normVy * 35);
          laserGrad.addColorStop(0, '#00f0ff');
          laserGrad.addColorStop(0.6, 'rgba(0, 240, 255, 0.4)');
          laserGrad.addColorStop(1, 'transparent');
          ctx.strokeStyle = laserGrad;
          ctx.lineWidth = 3;
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y - 18);
          ctx.lineTo(b.x - normVx * 35, b.y - 18 - normVy * 35);
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.restore();
        } else {
          // Vệt đạn tiêu chuẩn
          ctx.save();
          const trailGrad = ctx.createLinearGradient(b.x, b.y - 18, b.x - normVx * 22, b.y - 18 - normVy * 22);
          trailGrad.addColorStop(0, b.color || '#fbbf24');
          trailGrad.addColorStop(1, 'transparent');
          ctx.strokeStyle = trailGrad;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y - 18);
          ctx.lineTo(b.x - normVx * 22, b.y - 18 - normVy * 22);
          ctx.stroke();
          ctx.restore();
        }

        // 3. Elevated 3D Shell Body with specialized visual per bullet modifier
        ctx.save();
        ctx.translate(b.x, b.y - 18); // Elevated in air!

        const bRad = b.modifier === 'EXPLOSIVE' ? 8 : b.isHeavy ? 6 : 4.5;
        const bColor = b.color || '#fbbf24';

        if (b.modifier === 'PLASMA') {
          // Elongated laser beam bolt
          const angle = Math.atan2(b.vy, b.vx);
          ctx.rotate(angle);
          ctx.fillStyle = '#00f0ff';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 10;
          ctx.fillRect(-12, -2.5, 24, 5);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-6, -1.5, 12, 3);
          ctx.shadowBlur = 0;
        } else if (b.modifier === 'RICOCHET') {
          // Purple bouncy ring with pulse
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, bRad * 1.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, bRad * 0.8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Glowing radial projectile with aura
          const bGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, bRad * 2.2);
          bGrad.addColorStop(0, '#ffffff');
          bGrad.addColorStop(0.4, bColor);
          bGrad.addColorStop(1, 'transparent');

          ctx.fillStyle = bGrad;
          ctx.beginPath();
          ctx.arc(0, 0, bRad * 2.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, bRad * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // ==========================================
      // 8. 2.5D VOLUMETRIC FOLIAGE / BUSHES (Treetops occlude tanks under them)
      // ==========================================
      for (const obs of obstacles) {
        if (obs.type !== 'BUSH') continue;
        ctx.save();

        // Bush ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(obs.x + shadowOffsetX * 0.5, obs.y + shadowOffsetY * 0.5, obs.w, obs.h);

        // Volumetric overlapping tree canopy spheres
        ctx.globalAlpha = 0.88;
        const step = 32;
        for (let bx = obs.x + 18; bx < obs.x + obs.w; bx += step) {
          for (let by = obs.y + 18; by < obs.y + obs.h; by += step) {
            // Leaf dome gradient with sunlight highlight
            const leafGrad = ctx.createRadialGradient(bx - 5, by - 12, 3, bx, by, 22);
            leafGrad.addColorStop(0, '#22c55e');
            leafGrad.addColorStop(0.5, '#15803d');
            leafGrad.addColorStop(1, '#14532d');

            ctx.fillStyle = leafGrad;
            ctx.beginPath();
            ctx.arc(bx, by - 8, 20, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // ==========================================
      // 9. 2.5D AIR PARTICLES & SMOKE PLUMES (Rise in Z-axis)
      // ==========================================
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        // Elevated projection: y - p.z
        ctx.beginPath();
        ctx.arc(p.x, p.y - p.z, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ==========================================
      // 9.5. BATTLE ROYALE STORM ZONE (Vòng Bo Điện Từ)
      // ==========================================
      if (storm && (storm.active || gameMode === 'BATTLE_ROYALE')) {
        ctx.save();
        const scx = storm.centerX;
        const scy = storm.centerY;
        const sRadius = Math.max(10, storm.currentRadius);

        // 1. Shaded Storm Electromagnetic Haze Outside Safe Circle
        ctx.fillStyle = 'rgba(126, 34, 206, 0.22)';
        ctx.beginPath();
        ctx.rect(0, 0, worldSize.width, worldSize.height);
        ctx.arc(scx, scy, sRadius, 0, Math.PI * 2, true);
        ctx.fill();

        // 2. Safe Zone Neon Electric Perimeter Ring
        const ringPulse = 0.5 + Math.sin(now / 120) * 0.5;
        ctx.strokeStyle = storm.isShrinking ? '#f59e0b' : '#c084fc';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = storm.isShrinking ? '#f59e0b' : '#a855f7';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(scx, scy, sRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Secondary cyan plasma ring
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(scx, scy, sRadius + (Math.sin(now / 180) * 4), 0, Math.PI * 2);
        ctx.stroke();

        // Lightning arcs along perimeter
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        const arcCount = 12;
        for (let i = 0; i < arcCount; i++) {
          const baseAngle = (i / arcCount) * Math.PI * 2 + (now / 2000);
          const ax1 = scx + Math.cos(baseAngle) * sRadius;
          const ay1 = scy + Math.sin(baseAngle) * sRadius;
          const ax2 = scx + Math.cos(baseAngle + 0.1) * (sRadius + (Math.random() - 0.5) * 16);
          const ay2 = scy + Math.sin(baseAngle + 0.1) * (sRadius + (Math.random() - 0.5) * 16);
          ctx.beginPath();
          ctx.moveTo(ax1, ay1);
          ctx.lineTo(ax2, ay2);
          ctx.stroke();
        }

        // Tactical Perimeter Text along top edge of safe zone
        ctx.font = 'black 14px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = storm.isShrinking ? '#fef08a' : '#e9d5ff';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 3.5;
        const stormTag = storm.isShrinking
          ? `⚠️ [VÒNG BO ĐANG THU HẸP] BÁN KÍNH: ${Math.round(sRadius)}m`
          : `⚡ [VÙNG AN TOÀN] BÁN KÍNH: ${Math.round(sRadius)}m`;
        ctx.strokeText(stormTag, scx, scy - sRadius - 12);
        ctx.fillText(stormTag, scx, scy - sRadius - 12);

        ctx.restore();
      }

      // ==========================================
      // 10. DYNAMIC WEATHER & ATMOSPHERE SYSTEM
      // ==========================================
      const weatherList = weatherParticlesRef.current;
      const targetCount = 140;
      while (weatherList.length < targetCount) {
        weatherList.push({
          x: viewLeft + Math.random() * (viewWidth + 400) - 200,
          y: viewTop + Math.random() * (viewHeight + 400) - 200,
          vx: 0,
          vy: 0,
          size: Math.random() * 2.5 + 1.2,
          alpha: Math.random() * 0.6 + 0.3,
          swayOffset: Math.random() * Math.PI * 2,
          splashAge: 0,
        });
      }

      if (currentWeather === 'RAIN') {
        // --- RAIN PARTICLES & PUDDLE RIPPLES ---
        ctx.save();
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        for (const wp of weatherList) {
          wp.x += 4.5;
          wp.y += 18;
          if (wp.y > viewTop + viewHeight + 80) {
            wp.y = viewTop - 60 - Math.random() * 40;
            wp.x = viewLeft + Math.random() * (viewWidth + 400) - 200;
          }
          if (wp.x > viewLeft + viewWidth + 200) {
            wp.x = viewLeft - 100;
          }

          ctx.moveTo(wp.x, wp.y);
          ctx.lineTo(wp.x + 3.5, wp.y + 16);
        }
        ctx.stroke();

        // Puddle splashes on ground
        ctx.strokeStyle = 'rgba(147, 197, 253, 0.25)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 20; i++) {
          const wp = weatherList[i];
          if (wp) {
            const rippleR = ((now / 20 + i * 15) % 18) + 2;
            ctx.beginPath();
            ctx.ellipse(wp.x, wp.y, rippleR * 1.5, rippleR * 0.75, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        ctx.restore();

        // Lightning flash calculation
        if (now > nextLightningRef.current) {
          lightningFlashRef.current = 1.0;
          nextLightningRef.current = now + 12000 + Math.random() * 15000;
          sounds.playExplosion();
        }
      } else if (currentWeather === 'SNOW') {
        // --- SNOW PARTICLES & FROST FLAKES ---
        ctx.save();
        ctx.fillStyle = 'rgba(240, 249, 255, 0.85)';
        for (const wp of weatherList) {
          wp.x += Math.sin(now / 600 + wp.swayOffset) * 1.2 + 0.3;
          wp.y += 1.8 + wp.size * 0.4;
          if (wp.y > viewTop + viewHeight + 60) {
            wp.y = viewTop - 30;
            wp.x = viewLeft + Math.random() * (viewWidth + 200) - 100;
          }
          ctx.beginPath();
          ctx.arc(wp.x, wp.y, wp.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (currentWeather === 'DESERT') {
        // --- DESERT SAND DUST & HEAT WAVES ---
        ctx.save();
        ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
        for (const wp of weatherList) {
          wp.x += 8.5 + wp.size * 2;
          wp.y += Math.sin(now / 400 + wp.swayOffset) * 1.2 + 0.5;
          if (wp.x > viewLeft + viewWidth + 100) {
            wp.x = viewLeft - 100;
            wp.y = viewTop + Math.random() * (viewHeight + 100);
          }
          ctx.beginPath();
          ctx.arc(wp.x, wp.y, wp.size * 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (currentWeather === 'SUNSET') {
        // --- DUSK FIREFLIES & TWILIGHT EMBERS ---
        ctx.save();
        for (const wp of weatherList) {
          wp.x += Math.sin(now / 900 + wp.swayOffset) * 0.8;
          wp.y -= 1.1 + wp.size * 0.2;
          if (wp.y < viewTop - 40) {
            wp.y = viewTop + viewHeight + 30;
            wp.x = viewLeft + Math.random() * (viewWidth + 200) - 100;
          }
          const pulse = (Math.sin(now / 400 + wp.swayOffset) + 1) * 0.5;
          ctx.fillStyle = `rgba(251, 146, 60, ${0.3 + pulse * 0.5})`;
          ctx.beginPath();
          ctx.arc(wp.x, wp.y, wp.size * (1 + pulse * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (currentWeather === 'DAWN') {
        // --- DAWN SUNBEAM MOTES & MORNING MIST ---
        ctx.save();
        ctx.fillStyle = 'rgba(254, 215, 170, 0.35)';
        for (const wp of weatherList) {
          wp.x += 0.8;
          wp.y += Math.sin(now / 1100 + wp.swayOffset) * 0.6;
          if (wp.x > viewLeft + viewWidth + 50) {
            wp.x = viewLeft - 50;
          }
          ctx.beginPath();
          ctx.arc(wp.x, wp.y, wp.size * 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.restore(); // Restore world transform

      // ==========================================
      // 11. FULLSCREEN ATMOSPHERE TINT & LIGHTNING
      // ==========================================
      ctx.save();
      ctx.fillStyle = weatherCfg.ambientColor;
      ctx.fillRect(0, 0, width, height);

      if (lightningFlashRef.current > 0) {
        ctx.fillStyle = `rgba(224, 242, 254, ${lightningFlashRef.current * 0.35})`;
        ctx.fillRect(0, 0, width, height);
        lightningFlashRef.current = Math.max(0, lightningFlashRef.current - 0.08);
      }

      // Outside Storm Zone Screen Vignette Warning
      const myActiveTank = tanks.find((t) => t.id === myPlayerId);
      if (myActiveTank && myActiveTank.inStorm && !myActiveTank.isDead) {
        const pulse = 0.5 + Math.sin(now / 150) * 0.5;
        const vignetteGrad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          Math.min(width, height) * 0.35,
          width / 2,
          height / 2,
          Math.max(width, height) * 0.75
        );
        vignetteGrad.addColorStop(0, 'transparent');
        vignetteGrad.addColorStop(0.7, `rgba(168, 85, 247, ${0.25 + pulse * 0.35})`);
        vignetteGrad.addColorStop(1, `rgba(225, 29, 72, ${0.4 + pulse * 0.4})`);

        ctx.fillStyle = vignetteGrad;
        ctx.fillRect(0, 0, width, height);

        // Warning text top center
        ctx.font = 'black 16px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#f43f5e';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 4;
        ctx.strokeText(`⚠️ BẠN ĐANG Ở NGOÀI BO! BỊ RÚT MÁU LIÊN TỤC!`, width / 2, 70);
        ctx.fillText(`⚠️ BẠN ĐANG Ở NGOÀI BO! BỊ RÚT MÁU LIÊN TỤC!`, width / 2, 70);
      }

      ctx.restore();

      ctx.restore(); // Restore canvas scaling

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    tanks,
    bullets,
    obstacles,
    powerUps,
    worldSize,
    myPlayerId,
    is25DMode,
    zoomScale,
    isSpectator,
    spectatorTargetId,
    freeCameraPos,
    currentWeather,
    focusBeacon,
    isFreeCameraActive,
    storm,
    boss,
    bases,
    gameMode,
  ]);

  // Drag-to-pan camera state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, camX: 0, camY: 0, button: 0 });
  const hasDraggedRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Left-click (0) in Spectator OR Right-click (2) / Middle-click (1) in any mode
    if (isSpectator || e.button === 2 || e.button === 1) {
      isDraggingRef.current = true;
      hasDraggedRef.current = false;
      dragStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        camX: cameraRef.current.x,
        camY: cameraRef.current.y,
        button: e.button,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasDraggedRef.current = true;
      }

      const zoom = zoomScale || 0.75;
      const newCamX = Math.max(100, Math.min(worldSize.width - 100, dragStartRef.current.camX - dx / zoom));
      const newCamY = Math.max(100, Math.min(worldSize.height - 100, dragStartRef.current.camY - dy / zoom));

      cameraRef.current.x = newCamX;
      cameraRef.current.y = newCamY;

      if (onPanCamera) {
        onPanCamera(newCamX, newCamY);
      }
    }
  };

  const handleMouseUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // If it was a drag motion, do not trigger single click
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const zoom = zoomScale || 0.75;
    const viewWidth = canvas.clientWidth / zoom;
    const viewHeight = canvas.clientHeight / zoom;
    const viewLeft = cameraRef.current.x - viewWidth / 2;
    const viewTop = cameraRef.current.y - viewHeight / 2;

    const worldX = Math.max(50, Math.min(worldSize.width - 50, viewLeft + clickX / zoom));
    const worldY = Math.max(50, Math.min(worldSize.height - 50, viewTop + clickY / zoom));

    if (isSpectator) {
      // Find clicked tank within 45px radius
      let foundTank = false;
      for (const tank of tanks) {
        if (tank.isDead) continue;
        const dist = Math.hypot(tank.x - worldX, tank.y - worldY);
        if (dist < 45) {
          onSelectSpectatorTarget?.(tank.id);
          foundTank = true;
          break;
        }
      }
      if (!foundTank && onFocusWorldPos) {
        onFocusWorldPos(worldX, worldY);
      }
    } else {
      // In player mode: Right-click focus or middle click
      if (onFocusWorldPos && (e.button === 2 || e.button === 1 || e.altKey)) {
        onFocusWorldPos(worldX, worldY);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!hasDraggedRef.current && onFocusWorldPos) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const zoom = zoomScale || 0.75;
      const viewWidth = canvas.clientWidth / zoom;
      const viewHeight = canvas.clientHeight / zoom;
      const viewLeft = cameraRef.current.x - viewWidth / 2;
      const viewTop = cameraRef.current.y - viewHeight / 2;

      const worldX = Math.max(50, Math.min(worldSize.width - 50, viewLeft + clickX / zoom));
      const worldY = Math.max(50, Math.min(worldSize.height - 50, viewTop + clickY / zoom));
      onFocusWorldPos(worldX, worldY);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleCanvasClick}
      onContextMenu={handleContextMenu}
      className={`w-full h-full block select-none touch-none ${
        isSpectator ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
      }`}
    />
  );
};
