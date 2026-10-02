import React, { useEffect, useRef } from 'react';
import { WeatherType, WEATHER_CONFIGS } from '../types/game';

interface WeatherBackgroundCanvasProps {
  weather: WeatherType;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  swayOffset: number;
  alpha: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export const WeatherBackgroundCanvas: React.FC<WeatherBackgroundCanvasProps> = ({ weather }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const lightningFlashRef = useRef<number>(0);
  const nextLightningRef = useRef<number>(Date.now() + 6000 + Math.random() * 8000);

  // Initialize particle pool on mount or weather switch
  useEffect(() => {
    const count = weather === 'RAIN' ? 180 : weather === 'DESERT' ? 140 : 100;
    const width = window.innerWidth;
    const height = window.innerHeight;

    const list: Particle[] = [];
    for (let i = 0; i < count; i++) {
      list.push({
        x: Math.random() * (width + 300) - 150,
        y: Math.random() * (height + 200) - 100,
        size: 1 + Math.random() * 2.5,
        speed: 1 + Math.random() * 2,
        swayOffset: Math.random() * Math.PI * 2,
        alpha: 0.3 + Math.random() * 0.7,
      });
    }
    particlesRef.current = list;
    ripplesRef.current = [];
  }, [weather]);

  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const now = Date.now();
      const cfg = WEATHER_CONFIGS[weather] || WEATHER_CONFIGS.RAIN;

      // 1. BASE BATTLEFIELD GROUND COLOR
      ctx.fillStyle = cfg.groundBgColor;
      ctx.fillRect(0, 0, width, height);

      // 2. RADIAL AMBIENT GLOW FROM CENTER TOP
      const radialGrad = ctx.createRadialGradient(
        width / 2,
        height * 0.25,
        50,
        width / 2,
        height * 0.5,
        Math.max(width, height) * 0.8
      );
      radialGrad.addColorStop(0, cfg.ambientColor);
      radialGrad.addColorStop(0.5, 'rgba(2, 6, 23, 0.4)');
      radialGrad.addColorStop(1, 'rgba(2, 6, 23, 0.95)');
      ctx.fillStyle = radialGrad;
      ctx.fillRect(0, 0, width, height);

      // 3. TACTICAL BATTLEFIELD GRID (Just like in-game arena)
      ctx.save();
      ctx.strokeStyle = cfg.gridColor;
      ctx.lineWidth = 1;
      const gridSize = 80;
      const scrollOffset = (now * 0.015) % gridSize;

      // Vertical grid lines
      for (let x = -gridSize; x <= width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal grid lines moving subtly forward
      for (let y = scrollOffset - gridSize; y <= height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      // 4. WEATHER SPECIFIC PARTICLES & EFFECTS
      const particles = particlesRef.current;

      if (weather === 'RAIN') {
        // --- RAINSTORM: Slanted falling raindrops & puddle ripples ---
        ctx.save();
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();

        for (const p of particles) {
          p.x += 4.2 * p.speed;
          p.y += 18.5 * p.speed;

          if (p.y > height + 40) {
            // Spawn splash ripple on ground
            if (Math.random() < 0.35 && ripplesRef.current.length < 30) {
              ripplesRef.current.push({
                x: p.x,
                y: Math.min(height - 10, p.y - 20),
                radius: 2,
                maxRadius: 14 + Math.random() * 12,
                alpha: 0.6,
              });
            }
            p.y = -40 - Math.random() * 50;
            p.x = Math.random() * (width + 300) - 150;
          }
          if (p.x > width + 150) {
            p.x = -50;
          }

          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + 3.8 * p.speed, p.y + 16 * p.speed);
        }
        ctx.stroke();

        // Render puddle water ripples
        ctx.lineWidth = 1.1;
        for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
          const rip = ripplesRef.current[i];
          rip.radius += 0.8;
          rip.alpha *= 0.93;

          if (rip.alpha < 0.05 || rip.radius >= rip.maxRadius) {
            ripplesRef.current.splice(i, 1);
            continue;
          }

          ctx.strokeStyle = `rgba(147, 197, 253, ${rip.alpha})`;
          ctx.beginPath();
          ctx.ellipse(rip.x, rip.y, rip.radius * 1.8, rip.radius * 0.7, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Lightning Flash Timer
        if (now > nextLightningRef.current) {
          lightningFlashRef.current = 1.0;
          nextLightningRef.current = now + 9000 + Math.random() * 12000;
        }

        ctx.restore();
      } else if (weather === 'DESERT') {
        // --- DESERT SANDSTORM: Fast horizontal golden sand drifts & dust waves ---
        ctx.save();

        // Sand haze gradient overlay
        const sandHaze = ctx.createLinearGradient(0, height, width, 0);
        sandHaze.addColorStop(0, 'rgba(217, 119, 6, 0.12)');
        sandHaze.addColorStop(0.5, 'rgba(245, 158, 11, 0.08)');
        sandHaze.addColorStop(1, 'rgba(180, 83, 9, 0.15)');
        ctx.fillStyle = sandHaze;
        ctx.fillRect(0, 0, width, height);

        for (const p of particles) {
          p.x += (8.5 + p.size * 2.2) * p.speed;
          p.y += Math.sin(now / 350 + p.swayOffset) * 1.6 + 0.4;

          if (p.x > width + 100) {
            p.x = -80;
            p.y = Math.random() * height;
          }

          const sandAlpha = p.alpha * 0.65;
          ctx.fillStyle = `rgba(245, 158, 11, ${sandAlpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (weather === 'SNOW') {
        // --- BLIZZARD SNOW: Swirling frost flakes & blizzard wind ---
        ctx.save();
        for (const p of particles) {
          p.x += Math.sin(now / 550 + p.swayOffset) * 1.8 + 0.8;
          p.y += (2.2 + p.size * 0.5) * p.speed;

          if (p.y > height + 20) {
            p.y = -20;
            p.x = Math.random() * width;
          }
          if (p.x > width + 40) p.x = -20;
          if (p.x < -40) p.x = width + 20;

          ctx.fillStyle = `rgba(240, 249, 255, ${p.alpha * 0.8})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (weather === 'SUNSET') {
        // --- SUNSET EMBERS: Glowing fireflies & red-violet embers drifting up ---
        ctx.save();
        for (const p of particles) {
          p.x += Math.sin(now / 800 + p.swayOffset) * 1.0;
          p.y -= (1.4 + p.size * 0.25) * p.speed;

          if (p.y < -30) {
            p.y = height + 20;
            p.x = Math.random() * width;
          }

          const pulse = (Math.sin(now / 350 + p.swayOffset) + 1) * 0.5;
          ctx.fillStyle = `rgba(251, 146, 60, ${0.3 + pulse * 0.55})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 + pulse * 0.6), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else {
        // --- DAWN: Sunbeam motes & morning mist ---
        ctx.save();
        for (const p of particles) {
          p.x += 1.2 * p.speed;
          p.y += Math.sin(now / 950 + p.swayOffset) * 0.8;

          if (p.x > width + 40) p.x = -40;

          ctx.fillStyle = `rgba(254, 215, 170, ${p.alpha * 0.4})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 5. LIGHTNING FLASH ILLUMINATION (When in RAIN weather)
      if (lightningFlashRef.current > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(224, 242, 254, ${lightningFlashRef.current * 0.38})`;
        ctx.fillRect(0, 0, width, height);
        lightningFlashRef.current = Math.max(0, lightningFlashRef.current - 0.06);
        ctx.restore();
      }

      // 6. PERIMETER DARK VIGNETTE (Keeps text & battle cards ultra clear)
      const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.45,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.85
      );
      vignette.addColorStop(0, 'rgba(2, 6, 23, 0)');
      vignette.addColorStop(0.7, 'rgba(2, 6, 23, 0.45)');
      vignette.addColorStop(1, 'rgba(2, 6, 23, 0.88)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [weather]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};
