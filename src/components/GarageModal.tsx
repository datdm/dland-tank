import React, { useState, useEffect, useRef } from 'react';
import {
  TankClass,
  TankSkinId,
  TANK_SKINS,
  BulletTrailId,
  BULLET_TRAILS,
  RoofDecalId,
  ROOF_DECALS,
} from '../types/game';
import { DecalBadge } from './DecalBadge';
import { sounds } from '../utils/audio';
import { haptics } from '../utils/haptics';
import {
  X,
  Palette,
  Sparkles,
  Flag,
  Crosshair,
  Check,
  RotateCw,
  Flame,
} from 'lucide-react';

interface GarageModalProps {
  isOpen: boolean;
  onClose: () => void;
  tankClass: TankClass;
  currentSkin: TankSkinId;
  currentTrail: BulletTrailId;
  currentDecal: RoofDecalId;
  tankColor: string;
  onSaveCosmetics: (cosmetics: {
    skinId: TankSkinId;
    bulletTrail: BulletTrailId;
    roofDecal: RoofDecalId;
  }) => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  isOpen,
  onClose,
  tankClass,
  currentSkin,
  currentTrail,
  currentDecal,
  tankColor,
  onSaveCosmetics,
}) => {
  const [activeTab, setActiveTab] = useState<'skin' | 'trail' | 'decal'>('skin');
  const [selectedSkin, setSelectedSkin] = useState<TankSkinId>(currentSkin || 'DEFAULT');
  const [selectedTrail, setSelectedTrail] = useState<BulletTrailId>(currentTrail || 'STANDARD');
  const [selectedDecal, setSelectedDecal] = useState<RoofDecalId>(currentDecal || 'NONE');
  const [isSavedRecently, setIsSavedRecently] = useState<boolean>(false);

  const [turretRotation, setTurretRotation] = useState<number>(0);
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Accurate responsive dimensions detection for mobile screens
  const [dimensions, setDimensions] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: typeof window !== 'undefined' ? window.innerHeight : 600,
  }));

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const isLandscape = dimensions.width > dimensions.height && dimensions.height <= 580;
  const isMobilePortrait = dimensions.height > dimensions.width && dimensions.width < 640;
  const isCompact = isLandscape || isMobilePortrait || dimensions.height <= 580;

  // Test firing particles in preview canvas
  const [testProjectiles, setTestProjectiles] = useState<
    Array<{ x: number; y: number; vx: number; vy: number; trail: BulletTrailId; id: number }>
  >([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedSkin(currentSkin || 'DEFAULT');
      setSelectedTrail(currentTrail || 'STANDARD');
      setSelectedDecal(currentDecal || 'NONE');
      setIsSavedRecently(false);
    }
  }, [isOpen, currentSkin, currentTrail, currentDecal]);

  // Turret rotation animation loop
  useEffect(() => {
    if (!isOpen) return;
    let animId: number;
    const animate = () => {
      if (isAutoRotate) {
        setTurretRotation((prev) => (prev + 0.015) % (Math.PI * 2));
      }
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, isAutoRotate]);

  // Preview Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isOpen) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const now = Date.now();
      const isSmall = canvas.width < 220;
      const scale = isSmall ? 0.62 : 1;

      // Background Grid & Lighting Aura
      const glowGrad = ctx.createRadialGradient(cx, cy, 15, cx, cy, isSmall ? 70 : 140);
      glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
      glowGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.4)');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Rotating Pedestal Base
      ctx.save();
      ctx.translate(cx, cy + (isSmall ? 22 : 35));
      ctx.scale(scale, scale * 0.45);
      ctx.beginPath();
      ctx.arc(0, 0, 85, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pedestal neon markings
      ctx.strokeStyle = '#0284c7';
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, 68, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Draw Tank Center
      ctx.save();
      ctx.translate(cx, cy + (isSmall ? 2 : 5));
      ctx.scale(scale, scale);

      // Tank Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.ellipse(0, 24, 44, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // 1. Caterpillar Tracks
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-38, -26, 76, 12);
      ctx.fillRect(-38, 14, 76, 12);

      // Road Wheels
      ctx.fillStyle = '#334155';
      for (let wx = -30; wx <= 30; wx += 15) {
        ctx.beginPath();
        ctx.arc(wx, -20, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(wx, 20, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Tank Hull with Selected Skin
      const hw = 66;
      const hh = 38;

      if (selectedSkin === 'CAMO_WOODLAND') {
        ctx.fillStyle = '#2d4a22';
        ctx.fillRect(-hw / 2, -hh / 2, hw, hh);
        // Camo patches
        ctx.fillStyle = '#4d7c0f';
        ctx.beginPath();
        ctx.ellipse(-14, -6, 16, 10, 0.4, 0, Math.PI * 2);
        ctx.ellipse(14, 5, 12, 8, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#713f12';
        ctx.beginPath();
        ctx.ellipse(4, -8, 10, 7, -0.5, 0, Math.PI * 2);
        ctx.ellipse(-18, 8, 9, 6, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(-5, 9, 12, 5, 0.1, 0, Math.PI * 2);
        ctx.fill();
      } else if (selectedSkin === 'ARCTIC_FROST') {
        const frostGrad = ctx.createLinearGradient(-hw / 2, -hh / 2, hw / 2, hh / 2);
        frostGrad.addColorStop(0, '#0284c7');
        frostGrad.addColorStop(0.5, '#e0f2fe');
        frostGrad.addColorStop(1, '#38bdf8');
        ctx.fillStyle = frostGrad;
        ctx.fillRect(-hw / 2, -hh / 2, hw, hh);
        // Frost geometric shards
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.moveTo(-20, -10);
        ctx.lineTo(-5, -16);
        ctx.lineTo(-12, 4);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(8, -8);
        ctx.lineTo(24, -14);
        ctx.lineTo(16, 6);
        ctx.closePath();
        ctx.fill();
      } else if (selectedSkin === 'VOLCANIC_MAGMA') {
        const magmaGrad = ctx.createLinearGradient(-hw / 2, -hh / 2, hw / 2, hh / 2);
        magmaGrad.addColorStop(0, '#1c1917');
        magmaGrad.addColorStop(0.5, '#451a03');
        magmaGrad.addColorStop(1, '#0c0a09');
        ctx.fillStyle = magmaGrad;
        ctx.fillRect(-hw / 2, -hh / 2, hw, hh);
        // Molten lava cracks
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = '#ea580c';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(-24, -12);
        ctx.lineTo(-10, -2);
        ctx.lineTo(0, -8);
        ctx.lineTo(14, 2);
        ctx.lineTo(26, -4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-18, 6);
        ctx.lineTo(-4, 12);
        ctx.lineTo(10, 8);
        ctx.lineTo(20, 14);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (selectedSkin === 'NEON_CYBERPUNK') {
        ctx.fillStyle = '#05050f';
        ctx.fillRect(-hw / 2, -hh / 2, hw, hh);
        // Cyber glowing traces
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.6;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 6;
        ctx.strokeRect(-hw / 2 + 3, -hh / 2 + 3, hw - 6, hh - 6);
        ctx.strokeStyle = '#ff007f';
        ctx.shadowColor = '#ff007f';
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.lineTo(16, 0);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (selectedSkin === 'ROYAL_GOLD') {
        const goldGrad = ctx.createLinearGradient(-hw / 2, -hh / 2, hw / 2, hh / 2);
        goldGrad.addColorStop(0, '#fef08a');
        goldGrad.addColorStop(0.3, '#eab308');
        goldGrad.addColorStop(0.7, '#ca8a04');
        goldGrad.addColorStop(1, '#854d0e');
        ctx.fillStyle = goldGrad;
        ctx.fillRect(-hw / 2, -hh / 2, hw, hh);
        // Gold ornamental border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-hw / 2 + 2, -hh / 2 + 2, hw - 4, hh - 4);
      } else {
        // Default skin uses chosen tankColor
        ctx.fillStyle = tankColor || '#2563eb';
        ctx.fillRect(-hw / 2, -hh / 2, hw, hh);
        // Tactical panel bevel
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(-hw / 2, -hh / 2, hw, 4);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(-hw / 2, hh / 2 - 4, hw, 4);
      }

      // Hull Border & Rivets
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-hw / 2, -hh / 2, hw, hh);

      // Front Armor Angle
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(hw / 2, -hh / 2);
      ctx.lineTo(hw / 2 + 8, 0);
      ctx.lineTo(hw / 2, hh / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 3. Rotating Turret with Roof Decal
      ctx.save();
      ctx.rotate(turretRotation);

      // Turret Barrel
      const barrelLen = 38;
      const barrelW = 7;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, -barrelW / 2, barrelLen, barrelW);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, -barrelW / 2, barrelLen, barrelW);

      // Muzzle Brake
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(barrelLen - 2, -barrelW / 2 - 2, 8, barrelW + 4);
      ctx.strokeStyle = '#090d16';
      ctx.strokeRect(barrelLen - 2, -barrelW / 2 - 2, 8, barrelW + 4);

      // Turret Cupola Base
      const tr = 17;
      ctx.beginPath();
      ctx.arc(0, 0, tr, 0, Math.PI * 2);

      if (selectedSkin === 'ROYAL_GOLD') {
        ctx.fillStyle = '#fef08a';
      } else if (selectedSkin === 'ARCTIC_FROST') {
        ctx.fillStyle = '#38bdf8';
      } else if (selectedSkin === 'VOLCANIC_MAGMA') {
        ctx.fillStyle = '#ea580c';
      } else if (selectedSkin === 'NEON_CYBERPUNK') {
        ctx.fillStyle = '#18182f';
      } else if (selectedSkin === 'CAMO_WOODLAND') {
        ctx.fillStyle = '#365314';
      } else {
        ctx.fillStyle = tankColor || '#1d4ed8';
      }

      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Hatch Ring
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fillStyle = '#090d16';
      ctx.fill();

      // DRAW ROOF DECAL / FLAG ON TURRET
      if (selectedDecal === 'FLAG_VIETNAM') {
        ctx.save();
        const fLen = 20;
        const fH = 13;
        const wave1 = Math.sin(now / 150) * 1.5;
        const wave2 = Math.cos(now / 150) * 1.5;

        ctx.beginPath();
        ctx.moveTo(-9, -19);
        ctx.bezierCurveTo(-14, -19 + wave1, -21, -19 + wave2, -28, -19);
        ctx.lineTo(-28, -7);
        ctx.bezierCurveTo(-21, -7 + wave2, -14, -7 + wave1, -9, -7);
        ctx.closePath();
        ctx.fillStyle = '#da251d';
        ctx.fill();
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // Flagpole
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-9, -21);
        ctx.lineTo(-9, 0);
        ctx.stroke();

        // Golden Star
        const starX = -18.5;
        const starY = -13 + (wave1 + wave2) / 2;
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', starX, starY);
        ctx.restore();
      } else if (selectedDecal === 'PIRATE_SKULL') {
        ctx.save();
        const w1 = Math.sin(now / 150) * 1.5;
        const w2 = Math.cos(now / 150) * 1.5;
        const w3 = Math.sin(now / 150 + 1) * 1.5;

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-9, -27);
        ctx.lineTo(-9, 0);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-9, -25);
        ctx.bezierCurveTo(-14, -25 + w1, -21, -25 + w2, -28, -25 + w3);
        ctx.lineTo(-28, -13 + w3);
        ctx.bezierCurveTo(-21, -13 + w2, -14, -13 + w1, -9, -13);
        ctx.closePath();
        ctx.fillStyle = '#090d16';
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 0.6;
        ctx.stroke();

        const skullX = -18.5;
        const skullY = -19 + (w1 + w2) / 2;
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☠', skullX, skullY);
        ctx.restore();
      } else if (selectedDecal === 'TIGER_BEAST') {
        ctx.save();
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐯', 0, 0);
        ctx.restore();
      } else if (selectedDecal === 'MILITARY_STAR') {
        ctx.save();
        ctx.fillStyle = '#facc15';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 6;
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', 0, 1);
        ctx.shadowBlur = 0;
        ctx.restore();
      } else if (selectedDecal === 'DRAGON_CREST') {
        ctx.save();
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐉', 0, 0);
        ctx.restore();
      } else if (selectedDecal === 'ROYAL_SHIELD') {
        ctx.save();
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛡️', 0, 0);
        ctx.restore();
      }

      ctx.restore(); // Finish Turret
      ctx.restore(); // Finish Tank

      // Draw Test Projectiles
      for (const proj of testProjectiles) {
        proj.x += proj.vx;
        proj.y += proj.vy;

        // Draw projectile trail
        if (proj.trail === 'PURPLE_LIGHTNING') {
          ctx.save();
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#9333ea';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(proj.x, proj.y);
          ctx.lineTo(proj.x - proj.vx * 3 + Math.sin(now / 30) * 4, proj.y - proj.vy * 3);
          ctx.stroke();
          ctx.restore();
        } else if (proj.trail === 'DRAGON_FIRE') {
          ctx.save();
          ctx.fillStyle = '#f97316';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(proj.x - proj.vx * 1.5, proj.y - proj.vy * 1.5, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (proj.trail === 'FROST_SNOW') {
          ctx.save();
          ctx.fillStyle = '#e0f2fe';
          ctx.font = 'bold 8px sans-serif';
          ctx.fillText('❄', proj.x - proj.vx * 2, proj.y - proj.vy * 2);
          ctx.restore();
        } else if (proj.trail === 'CYAN_LASER') {
          ctx.save();
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(proj.x, proj.y);
          ctx.lineTo(proj.x - proj.vx * 4, proj.y - proj.vy * 4);
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.save();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(proj.x, proj.y);
          ctx.lineTo(proj.x - proj.vx * 2.5, proj.y - proj.vy * 2.5);
          ctx.stroke();
          ctx.restore();
        }

        // Draw Shell Head
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Filter out offscreen test projectiles
      setTestProjectiles((prev) =>
        prev.filter((p) => p.x >= 0 && p.x <= canvas.width && p.y >= 0 && p.y <= canvas.height)
      );

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, selectedSkin, selectedDecal, selectedTrail, turretRotation, tankColor, testProjectiles]);

  const handleTestFire = () => {
    sounds.playShoot();
    haptics.light();
    const canvas = canvasRef.current;
    const cx = canvas ? canvas.width / 2 : 140;
    const isSmall = canvas ? canvas.width < 220 : false;
    const cy = canvas ? canvas.height / 2 + (isSmall ? 2 : 5) : 135;
    const scale = isSmall ? 0.62 : 1;
    const speed = 7 * scale;
    const muzzleDist = 48 * scale;
    const spawnX = cx + Math.cos(turretRotation) * muzzleDist;
    const spawnY = cy + Math.sin(turretRotation) * muzzleDist;

    setTestProjectiles((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        x: spawnX,
        y: spawnY,
        vx: Math.cos(turretRotation) * speed,
        vy: Math.sin(turretRotation) * speed,
        trail: selectedTrail,
      },
    ]);
  };

  const handleApply = () => {
    sounds.playPowerUp();
    haptics.light();
    setIsSavedRecently(true);

    try {
      localStorage.setItem('tank_skin', selectedSkin);
      localStorage.setItem('tank_trail', selectedTrail);
      localStorage.setItem('tank_decal', selectedDecal);
    } catch (err) {
      console.warn('Failed to save cosmetics to localStorage:', err);
    }

    onSaveCosmetics({
      skinId: selectedSkin,
      bulletTrail: selectedTrail,
      roofDecal: selectedDecal,
    });

    setTimeout(() => {
      setIsSavedRecently(false);
      onClose();
    }, 450);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#060a17] text-white flex flex-col w-screen h-screen overflow-hidden select-none animate-in fade-in duration-200">
      <div className="relative w-full h-full bg-[#060a17] flex flex-col overflow-hidden m-0 border-0 rounded-none shadow-none">
        {/* Header - Compact & Pinned */}
        <div
          className={`shrink-0 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 ${
            isCompact ? 'px-2.5 py-1 sm:py-1.5' : 'px-5 md:px-7 py-3'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div
              className={`${
                isCompact ? 'w-6 h-6 rounded-lg' : 'w-9 h-9 md:w-10 md:h-10 rounded-xl'
              } bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20`}
            >
              <Palette className={isCompact ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
            </div>
            <div>
              <h2
                className={`font-black text-white font-mono flex items-center gap-1.5 ${
                  isCompact ? 'text-xs sm:text-sm' : 'text-base sm:text-lg'
                }`}
              >
                <span>GARA CHIẾN XA & XƯỞNG SKIN</span>
                <span className="text-[8px] sm:text-[9.5px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1.5 py-0.2 rounded-full font-bold">
                  WORKSHOP
                </span>
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              haptics.light();
              onClose();
            }}
            className={`${
              isCompact ? 'w-6 h-6 rounded-lg' : 'w-8 h-8 rounded-xl'
            } bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0`}
            title="Đóng"
          >
            <X className={isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          </button>
        </div>

        {/* Modal Body: Two-column layout in Landscape / Desktop, Stacked in Portrait */}
        <div
          className={`flex-1 min-h-0 overflow-hidden ${
            isLandscape
              ? 'grid grid-cols-12 gap-2 p-2'
              : isMobilePortrait
              ? 'flex flex-col gap-2 p-2.5 overflow-y-auto'
              : 'grid grid-cols-12 gap-4 p-4 overflow-y-auto'
          }`}
        >
          {/* Left Column: Interactive 3D Showcase & Test Fire */}
          <div
            className={`${
              isLandscape
                ? 'col-span-4 p-1.5 gap-1'
                : isMobilePortrait
                ? 'w-full p-2 gap-1.5 shrink-0'
                : 'col-span-5 p-3.5 gap-2.5'
            } flex flex-col items-center bg-slate-950/70 border border-slate-800/80 rounded-xl justify-between`}
          >
            <div className="w-full flex items-center justify-between text-slate-400 font-mono">
              <span className={`flex items-center gap-1 text-sky-400 font-bold ${isCompact ? 'text-[8.5px]' : 'text-xs'}`}>
                <Sparkles className="w-2.5 h-2.5" />
                Mô Phỏng 360°
              </span>
              <button
                type="button"
                onClick={() => {
                  haptics.light();
                  setIsAutoRotate((prev) => !prev);
                }}
                className={`flex items-center gap-1 text-[8.5px] px-1.5 py-0.2 rounded border transition-all cursor-pointer ${
                  isAutoRotate
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <RotateCw className={`w-2 h-2 ${isAutoRotate ? 'animate-spin' : ''}`} />
                <span>{isAutoRotate ? 'Tự Xoay' : 'Dừng'}</span>
              </button>
            </div>

            {/* Canvas Preview Area */}
            <div
              className={`relative w-full ${
                isLandscape ? 'max-w-[130px] h-[80px]' : isMobilePortrait ? 'max-w-[170px] h-[105px]' : 'aspect-square max-w-[240px]'
              } bg-radial from-slate-900 to-slate-950 rounded-lg border border-slate-800/80 overflow-hidden flex items-center justify-center shadow-inner my-auto`}
            >
              <canvas
                ref={canvasRef}
                width={isLandscape ? 130 : isMobilePortrait ? 170 : 240}
                height={isLandscape ? 80 : isMobilePortrait ? 105 : 240}
                className="w-full h-full cursor-grab active:cursor-grabbing"
                onClick={() => setTurretRotation((prev) => (prev + 0.4) % (Math.PI * 2))}
              />

              {/* Angle indicator tag */}
              <div className="absolute bottom-0.5 left-0.5 text-[7.5px] font-mono text-slate-500 bg-slate-950/80 px-1 py-0 rounded border border-slate-800">
                {Math.round((turretRotation * 180) / Math.PI)}°
              </div>
            </div>

            {/* Test Fire Control */}
            <div className="w-full flex items-center gap-1">
              <button
                type="button"
                onClick={handleTestFire}
                className={`w-full ${
                  isCompact ? 'py-1 text-[9px]' : 'py-1.5 px-3 text-xs'
                } rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-md shadow-orange-600/20 transition-all cursor-pointer active:scale-95`}
              >
                <Crosshair className="w-2.5 h-2.5" />
                <span>BẮN THỬ VỆT ĐẠN</span>
              </button>
            </div>

            {/* Selected Summary Card */}
            <div
              className={`w-full bg-slate-900/90 border border-slate-800/80 rounded-lg ${
                isCompact ? 'p-1 text-[8.5px] space-y-0.5' : 'p-2.5 text-xs space-y-1'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Sơn:</span>
                <span className="font-bold text-white font-mono truncate">{TANK_SKINS[selectedSkin]?.vietnameseName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Vệt:</span>
                <span className="font-bold text-amber-400 font-mono flex items-center gap-0.5 truncate">
                  <span>{BULLET_TRAILS[selectedTrail]?.icon}</span>
                  <span className="truncate">{BULLET_TRAILS[selectedTrail]?.vietnameseName}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Decal:</span>
                <span className="font-bold text-sky-400 font-mono flex items-center gap-0.5 truncate">
                  <span>{ROOF_DECALS[selectedDecal]?.icon}</span>
                  <span className="truncate">{ROOF_DECALS[selectedDecal]?.vietnameseName}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Customization Tabs & Scrollable Grid */}
          <div
            className={`${
              isLandscape
                ? 'col-span-8 flex flex-col h-full min-h-0 gap-1.5'
                : isMobilePortrait
                ? 'w-full flex flex-col gap-2'
                : 'col-span-7 flex flex-col h-full min-h-0 gap-3'
            }`}
          >
            {/* Tab Navigation Buttons */}
            <div
              className={`flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-lg p-0.5 shrink-0`}
            >
              <button
                type="button"
                onClick={() => {
                  haptics.light();
                  setActiveTab('skin');
                }}
                className={`flex-1 rounded-md font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  isCompact ? 'py-1 text-[9.5px]' : 'py-1.5 px-3 text-xs'
                } ${
                  activeTab === 'skin'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Palette className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>Sơn Xe</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  haptics.light();
                  setActiveTab('trail');
                }}
                className={`flex-1 rounded-md font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  isCompact ? 'py-1 text-[9.5px]' : 'py-1.5 px-3 text-xs'
                } ${
                  activeTab === 'trail'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>Vệt Đạn</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  haptics.light();
                  setActiveTab('decal');
                }}
                className={`flex-1 rounded-md font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  isCompact ? 'py-1 text-[9.5px]' : 'py-1.5 px-3 text-xs'
                } ${
                  activeTab === 'decal'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flag className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>Decal Cờ</span>
              </button>
            </div>

            {/* TAB 1: TANK SKINS */}
            {activeTab === 'skin' && (
              <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-1">
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(TANK_SKINS) as TankSkinId[]).map((skinId) => {
                    const skin = TANK_SKINS[skinId];
                    const isSelected = selectedSkin === skinId;
                    return (
                      <button
                        key={skinId}
                        type="button"
                        onClick={() => {
                          haptics.light();
                          setSelectedSkin(skinId);
                          sounds.playPowerUp();
                        }}
                        className={`p-1.5 sm:p-2 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? 'bg-sky-500/15 border-sky-400 ring-1 ring-sky-500 text-white shadow-md'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 min-w-0 pr-4">
                          <span className="text-[7.5px] font-mono font-black uppercase px-1 py-0.1 rounded bg-slate-900 border border-slate-700 text-sky-400 shrink-0">
                            {skin.badge}
                          </span>
                          <span className="font-bold text-[10px] sm:text-[11px] text-white truncate">
                            {skin.vietnameseName}
                          </span>
                        </div>

                        {/* Skin Palette Visual Strip */}
                        <div
                          className={`w-full h-2 rounded border border-white/20 bg-gradient-to-r ${skin.previewGradient} mt-1`}
                        />

                        {!isLandscape && (
                          <p className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">{skin.description}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: BULLET TRAILS */}
            {activeTab === 'trail' && (
              <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-1">
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(BULLET_TRAILS) as BulletTrailId[]).map((trailId) => {
                    const trail = BULLET_TRAILS[trailId];
                    const isSelected = selectedTrail === trailId;
                    return (
                      <button
                        key={trailId}
                        type="button"
                        onClick={() => {
                          haptics.light();
                          setSelectedTrail(trailId);
                          sounds.playShoot();
                        }}
                        className={`p-1.5 sm:p-2 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-500 text-white shadow-md'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 min-w-0 pr-4">
                          <span className="text-xs shrink-0">{trail.icon}</span>
                          <span className="font-bold text-[10px] sm:text-[11px] text-white truncate">
                            {trail.vietnameseName}
                          </span>
                        </div>

                        {/* Color Glow Indicator */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <div
                            className="w-2.5 h-2.5 rounded-full border border-white/60 shadow shrink-0"
                            style={{ backgroundColor: trail.color }}
                          />
                          <div
                            className="h-1.5 flex-1 rounded-full"
                            style={{
                              background: `linear-gradient(to right, ${trail.color}, ${trail.secondaryColor}, transparent)`,
                            }}
                          />
                        </div>

                        {!isLandscape && (
                          <p className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">{trail.description}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: ROOF DECALS & FLAGS */}
            {activeTab === 'decal' && (
              <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-1">
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(ROOF_DECALS) as RoofDecalId[]).map((decalId) => {
                    const decal = ROOF_DECALS[decalId];
                    const isSelected = selectedDecal === decalId;
                    return (
                      <button
                        key={decalId}
                        type="button"
                        onClick={() => {
                          haptics.light();
                          setSelectedDecal(decalId);
                          sounds.playPowerUp();
                        }}
                        className={`p-1.5 sm:p-2 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-500/15 border-indigo-400 ring-1 ring-indigo-500 text-white shadow-md'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-indigo-500 text-slate-950 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 min-w-0 pr-4">
                          <DecalBadge decalId={decalId} size="sm" showWavingAnimation={isSelected} />
                          <span className="font-bold text-[10px] sm:text-[11px] text-white truncate">
                            {decal.vietnameseName}
                          </span>
                        </div>

                        {!isLandscape && (
                          <p className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">{decal.description}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions - Pinned and Always Fully Visible */}
        <div
          className={`shrink-0 ${
            isCompact ? 'px-2.5 py-1' : 'px-5 py-2.5'
          } border-t border-slate-800 bg-slate-950/95 flex items-center justify-between`}
        >
          <div className="text-[8.5px] sm:text-[10px] text-slate-400 truncate max-w-[200px] hidden sm:block">
            Ngoại trang hiển thị với tất cả người chơi!
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                haptics.light();
                onClose();
              }}
              className={`${
                isCompact ? 'py-1 px-3 text-[10px]' : 'py-1.5 px-4 text-xs'
              } rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer active:scale-95`}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isSavedRecently}
              className={`${
                isCompact ? 'py-1 px-3 text-[10px]' : 'py-1.5 px-5 text-xs'
              } rounded-lg ${
                isSavedRecently
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white ring-1 ring-emerald-400 shadow-emerald-500/40'
                  : 'bg-gradient-to-r from-sky-600 via-indigo-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-sky-600/30'
              } font-black uppercase tracking-wider shadow transition-all cursor-pointer active:scale-95 flex items-center gap-1`}
            >
              <Check className="w-3 h-3 stroke-[3]" />
              <span>{isSavedRecently ? '✓ ĐÃ LƯU!' : 'TRANG BỊ & LƯU LẠI'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
