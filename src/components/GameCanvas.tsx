import React, { useEffect, useRef } from 'react';
import {
  PlayerTank,
  Bullet,
  Obstacle,
  PowerUpCrate,
  TANK_CLASSES,
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

interface GameCanvasProps {
  myPlayerId: string;
  tanks: PlayerTank[];
  bullets: Bullet[];
  obstacles: Obstacle[];
  powerUps: PowerUpCrate[];
  worldSize: { width: number; height: number };
  is25DMode?: boolean;
  zoomScale?: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  myPlayerId,
  tanks,
  bullets,
  obstacles,
  powerUps,
  worldSize,
  is25DMode = true,
  zoomScale = 0.75,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Smooth camera position
  const cameraRef = useRef({ x: worldSize.width / 2, y: worldSize.height / 2 });
  const particlesRef = useRef<Particle[]>([]);
  const decalsRef = useRef<Decal[]>([]);
  const screenShakeRef = useRef(0);
  const prevBulletsCountRef = useRef(0);
  const prevTanksStateRef = useRef<Map<string, { hp: number; isDead: boolean }>>(new Map());

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
      const myTank = tanks.find((t) => t.id === myPlayerId);
      const targetCamX = myTank ? myTank.x : worldSize.width / 2;
      const targetCamY = myTank ? myTank.y : worldSize.height / 2;

      cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.12;
      cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.12;

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

      // ==========================================
      // 1. TERRAIN BASE & GROUND TEXTURE
      // ==========================================
      ctx.fillStyle = '#171d28'; // Deep tactical ground
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      // Center-scale zoom (like Chrome 75% zoom)
      ctx.translate(width / 2, height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-camX, -camY);

      // Tactical grid with 2.5D ambient tint
      const gridSize = 100;
      const startX = Math.floor(Math.max(0, viewLeft) / gridSize) * gridSize;
      const endX = Math.min(worldSize.width, viewLeft + viewWidth + gridSize);
      const startY = Math.floor(Math.max(0, viewTop) / gridSize) * gridSize;
      const endY = Math.min(worldSize.height, viewTop + viewHeight + gridSize);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
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

      // ==========================================
      // 6. Y-SORTED 2.5D ENTITY PASS (Painters Algorithm for authentic 3D depth)
      // ==========================================
      interface RenderEntity {
        baseY: number;
        type: 'obstacle' | 'tank' | 'crate';
        item: Obstacle | PlayerTank | PowerUpCrate;
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

          // Sloped Upper Hull Plate
          ctx.fillStyle = tank.color;
          ctx.fillRect(-19, -12, 38, 24);

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

          // Nitro & Component Speed Booster Flames (when speed boosted)
          if (tank.activePowerUp) {
            const isNitro = tank.activePowerUp.type === 'SPEED_BOOST';
            const flameLen = isNitro ? 16 + Math.random() * 10 : 8 + Math.random() * 5;
            const flameGrad = ctx.createLinearGradient(-20, 0, -20 - flameLen, 0);
            if (isNitro) {
              flameGrad.addColorStop(0, '#38bdf8');
              flameGrad.addColorStop(0.5, '#0284c7');
              flameGrad.addColorStop(1, 'transparent');
            } else {
              flameGrad.addColorStop(0, '#fbbf24');
              flameGrad.addColorStop(0.6, '#f97316');
              flameGrad.addColorStop(1, 'transparent');
            }
            ctx.fillStyle = flameGrad;
            // Left exhaust pipe jet
            ctx.beginPath();
            ctx.moveTo(-20, -6);
            ctx.lineTo(-20 - flameLen, -4);
            ctx.lineTo(-20, -2);
            ctx.fill();
            // Right exhaust pipe jet
            ctx.beginPath();
            ctx.moveTo(-20, 2);
            ctx.lineTo(-20 - flameLen, 4);
            ctx.lineTo(-20, 6);
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

          // Double-baffle muzzle brake at tip
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(currentBarrelLen - 3, -barrelWidth / 2 - 1.5, 3, barrelWidth + 3);

          // 3D Turret Dome (Elevated on Z = 16)
          const domeRad = tank.tankClass === 'JUGGERNAUT' ? 14 : tank.tankClass === 'SCOUT' ? 10 : 12;
          const turretGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, domeRad);
          turretGrad.addColorStop(0, '#ffffff');
          turretGrad.addColorStop(0.3, tank.color);
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

          if (tank.id === myPlayerId) {
            ctx.fillStyle = '#38bdf8';
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 3;
            const displayName = `[BẠN] 🎯 ${tank.name}`;
            ctx.strokeText(displayName, 0, barY - 5);
            ctx.fillText(displayName, 0, barY - 5);
          } else if (!tank.isBot) {
            // Real Online Socket Opponent!
            ctx.fillStyle = '#34d399';
            ctx.strokeStyle = '#022c22';
            ctx.lineWidth = 3.5;
            const displayName = `[ONLINE] ⚡ ${tank.name}`;
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
            const displayName = `[AI] ${tank.name}`;
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

          // Next Loaded Ammo Badge Indicator (above health bar)
          if (tank.nextAmmoType && tank.id === myPlayerId) {
            ctx.save();
            const ammoLabels: Record<string, { name: string; color: string; icon: string }> = {
              EXPLOSIVE: { name: 'ĐẠN NỔ', color: '#ef4444', icon: '💥' },
              TRIPLE: { name: 'ĐẠN CHÙM', color: '#fbbf24', icon: '🔱' },
              PLASMA: { name: 'ĐẠN LAZE', color: '#00f0ff', icon: '⚡' },
              CRYO: { name: 'ĐẠN BĂNG', color: '#38bdf8', icon: '❄️' },
              INCENDIARY: { name: 'ĐẠN LỬA', color: '#f97316', icon: '🔥' },
              RICOCHET: { name: 'ĐẠN NẢY', color: '#c084fc', icon: '🪃' },
              PIERCING: { name: 'XUYÊN GIÁP', color: '#10b981', icon: '🎯' },
              STANDARD: { name: 'TIÊU CHUẨN', color: '#94a3b8', icon: '•' },
            };
            const ammo = ammoLabels[tank.nextAmmoType] || ammoLabels.STANDARD;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.fillRect(-38, barY - 22, 76, 14);
            ctx.strokeStyle = ammo.color;
            ctx.lineWidth = 1;
            ctx.strokeRect(-38, barY - 22, 76, 14);

            ctx.fillStyle = ammo.color;
            ctx.font = 'bold 9px Plus Jakarta Sans, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${ammo.icon} ${ammo.name}`, 0, barY - 15);
            ctx.restore();
          }

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

        // 2. Elevated 3D Shell Body with specialized visual per bullet modifier
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

      ctx.restore(); // Restore world transform
      ctx.restore(); // Restore canvas scaling

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [tanks, bullets, obstacles, powerUps, worldSize, myPlayerId, is25DMode, zoomScale]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block cursor-crosshair select-none touch-none"
    />
  );
};
