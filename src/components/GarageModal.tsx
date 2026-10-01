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
import { sounds } from '../utils/audio';
import {
  X,
  Palette,
  Sparkles,
  Flag,
  Crosshair,
  Check,
  RotateCw,
  Flame,
  Zap,
  Shield,
  Layers,
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

  const [turretRotation, setTurretRotation] = useState<number>(0);
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Test firing particles in preview canvas
  const [testProjectiles, setTestProjectiles] = useState<
    Array<{ x: number; y: number; vx: number; vy: number; trail: BulletTrailId; id: number }>
  >([]);

  useEffect(() => {
    setSelectedSkin(currentSkin || 'DEFAULT');
    setSelectedTrail(currentTrail || 'STANDARD');
    setSelectedDecal(currentDecal || 'NONE');
  }, [currentSkin, currentTrail, currentDecal, isOpen]);

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

      // Background Grid & Lighting Aura
      const skinInfo = TANK_SKINS[selectedSkin];
      const glowGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 140);
      glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
      glowGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.4)');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Rotating Pedestal Base
      ctx.save();
      ctx.translate(cx, cy + 35);
      ctx.scale(1, 0.45);
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
      ctx.translate(cx, cy + 5);

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
        frostGrad.addColorStop(0.5, '#38bdf8');
        frostGrad.addColorStop(1, '#e0f2fe');
        ctx.fillStyle = frostGrad;
        ctx.fillRect(-hw / 2, -hh / 2, hw, hh);
        // Shimmer crystal facet lines
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-18, -hh / 2); ctx.lineTo(-4, 0); ctx.lineTo(14, -hh / 2);
        ctx.moveTo(-4, 0); ctx.lineTo(10, hh / 2);
        ctx.stroke();
      } else if (selectedSkin === 'VOLCANIC_MAGMA') {
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-hw / 2, -hh / 2, hw, hh);
        // Pulsing magma veins
        const pulse = 0.6 + Math.sin(now / 180) * 0.4;
        ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(-30, -8); ctx.lineTo(-10, -3); ctx.lineTo(6, -12); ctx.lineTo(26, -4);
        ctx.moveTo(-16, 8); ctx.lineTo(4, 6); ctx.lineTo(22, 12);
        ctx.stroke();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (selectedSkin === 'NEON_CYBERPUNK') {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-hw / 2, -hh / 2, hw, hh);
        ctx.strokeStyle = '#d946ef';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 10;
        ctx.strokeRect(-hw / 2 + 2, -hh / 2 + 2, hw - 4, hh - 4);
        ctx.strokeStyle = '#06b6d4';
        ctx.beginPath();
        ctx.moveTo(-hw / 2, 0); ctx.lineTo(hw / 2, 0);
        ctx.moveTo(0, -hh / 2); ctx.lineTo(0, hh / 2);
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
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-hw / 2 + 4, -hh / 2 + 4, hw - 8, hh - 8);
      } else {
        ctx.fillStyle = tankColor || '#2563eb';
        ctx.fillRect(-hw / 2, -hh / 2, hw, hh);
      }

      // Glacis bevel
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-hw / 2, -hh / 2, hw, hh);

      // Rear engine grilles
      ctx.fillStyle = '#020617';
      ctx.fillRect(-hw / 2 + 4, -12, 10, 24);

      // 3. Rotating Turret with Barrel
      ctx.save();
      ctx.rotate(turretRotation);

      // Barrel
      const barrelLen = 42;
      const barrelW = 8;
      const bGrad = ctx.createLinearGradient(0, -barrelW / 2, 0, barrelW / 2);
      bGrad.addColorStop(0, '#475569');
      bGrad.addColorStop(0.5, '#94a3b8');
      bGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = bGrad;
      ctx.fillRect(0, -barrelW / 2, barrelLen, barrelW);

      // Muzzle brake
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(barrelLen - 5, -barrelW / 2 - 2, 5, barrelW + 4);

      // Turret Dome
      const domeR = 20;
      const tGrad = ctx.createRadialGradient(-4, -4, 3, 0, 0, domeR);
      tGrad.addColorStop(0, '#ffffff');

      let tColor = tankColor || '#2563eb';
      if (selectedSkin === 'CAMO_WOODLAND') tColor = '#2d4a22';
      else if (selectedSkin === 'ARCTIC_FROST') tColor = '#0ea5e9';
      else if (selectedSkin === 'VOLCANIC_MAGMA') tColor = '#dc2626';
      else if (selectedSkin === 'NEON_CYBERPUNK') tColor = '#d946ef';
      else if (selectedSkin === 'ROYAL_GOLD') tColor = '#eab308';

      tGrad.addColorStop(0.3, tColor);
      tGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = tGrad;
      ctx.beginPath();
      ctx.arc(0, 0, domeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 4. Roof Decal mounted on top of turret
      if (selectedDecal === 'FLAG_VIETNAM') {
        ctx.save();
        ctx.fillStyle = '#da251d';
        ctx.fillRect(-10, -7, 20, 14);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1;
        ctx.strokeRect(-10, -7, 20, 14);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', 0, 1);
        ctx.restore();
      } else if (selectedDecal === 'PIRATE_SKULL') {
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillRect(-9, -7, 18, 14);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☠', 0, 1);
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
    const cx = 140;
    const cy = 135;
    const speed = 7;
    const muzzleDist = 48;
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
    onSaveCosmetics({
      skinId: selectedSkin,
      bulletTrail: selectedTrail,
      roofDecal: selectedDecal,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white font-mono flex items-center gap-2">
                <span>GARA CHIẾN XA & XƯỞNG SKIN</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full font-bold">
                  WORKSHOP
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tùy biến sơn phủ ngoại trang, vệt đạn nòng pháo và biểu tượng cờ nóc tháp pháo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Left Showcase & Right Customization Tabs */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Interactive 3D Showcase & Test Fire */}
          <div className="lg:col-span-5 flex flex-col items-center gap-3 bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <div className="w-full flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 text-sky-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                Mô Phỏng 360° Trực Quan
              </span>
              <button
                type="button"
                onClick={() => setIsAutoRotate((prev) => !prev)}
                className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                  isAutoRotate
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <RotateCw className={`w-3 h-3 ${isAutoRotate ? 'animate-spin' : ''}`} />
                <span>{isAutoRotate ? 'Tự Xoay' : 'Dừng'}</span>
              </button>
            </div>

            {/* Canvas Preview Area */}
            <div className="relative w-full aspect-square max-w-[280px] bg-radial from-slate-900 to-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden flex items-center justify-center shadow-inner">
              <canvas
                ref={canvasRef}
                width={280}
                height={270}
                className="w-full h-full cursor-grab active:cursor-grabbing"
                onClick={() => setTurretRotation((prev) => (prev + 0.4) % (Math.PI * 2))}
              />

              {/* Angle indicator tag */}
              <div className="absolute bottom-2 left-2 text-[10px] font-mono text-slate-500 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                Tháp Pháo: {Math.round((turretRotation * 180) / Math.PI)}°
              </div>
            </div>

            {/* Test Fire & Angle Controls */}
            <div className="w-full flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestFire}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-orange-600/20 transition-all cursor-pointer active:scale-95"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>BẮN THỬ VỆT ĐẠN</span>
              </button>
            </div>

            {/* Selected Summary Card */}
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Sơn xe:</span>
                <span className="font-bold text-white font-mono">{TANK_SKINS[selectedSkin]?.vietnameseName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Vệt đạn:</span>
                <span className="font-bold text-amber-400 font-mono flex items-center gap-1">
                  <span>{BULLET_TRAILS[selectedTrail]?.icon}</span>
                  <span>{BULLET_TRAILS[selectedTrail]?.vietnameseName}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Biểu tượng / Cờ:</span>
                <span className="font-bold text-sky-400 font-mono flex items-center gap-1">
                  <span>{ROOF_DECALS[selectedDecal]?.icon}</span>
                  <span>{ROOF_DECALS[selectedDecal]?.vietnameseName}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Customization Tabs & Options */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Tab Navigation Buttons */}
            <div className="flex items-center gap-2 p-1 bg-slate-950/70 border border-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTab('skin')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'skin'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Sơn Xe ({Object.keys(TANK_SKINS).length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('trail')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'trail'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Vệt Đạn ({Object.keys(BULLET_TRAILS).length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('decal')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'decal'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Decal / Cờ ({Object.keys(ROOF_DECALS).length})</span>
              </button>
            </div>

            {/* TAB 1: TANK SKINS */}
            {activeTab === 'skin' && (
              <div className="space-y-2.5">
                <div className="text-xs text-slate-400 font-medium">
                  Chọn mẫu sơn ngoại trang cho thân và tháp pháo xe tăng của bạn:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(Object.keys(TANK_SKINS) as TankSkinId[]).map((skinId) => {
                    const skin = TANK_SKINS[skinId];
                    const isSelected = selectedSkin === skinId;
                    return (
                      <button
                        key={skinId}
                        type="button"
                        onClick={() => {
                          setSelectedSkin(skinId);
                          sounds.playPowerUp();
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col gap-1.5 ${
                          isSelected
                            ? 'bg-sky-500/15 border-sky-400 ring-2 ring-sky-500/50 text-white shadow-lg shadow-sky-500/20'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        {/* Selected Indicator */}
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-sky-400">
                            {skin.badge}
                          </span>
                          <span className="font-bold text-xs text-white truncate">{skin.vietnameseName}</span>
                        </div>

                        {/* Skin Palette Visual Strip */}
                        <div
                          className={`w-full h-3 rounded-lg border bg-gradient-to-r ${skin.previewGradient}`}
                        />

                        <p className="text-[11px] text-slate-400 line-clamp-2">{skin.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: BULLET TRAILS */}
            {activeTab === 'trail' && (
              <div className="space-y-2.5">
                <div className="text-xs text-slate-400 font-medium">
                  Chọn hiệu ứng ánh sáng nòng pháo và vệt đạn xé toạc không gian:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(Object.keys(BULLET_TRAILS) as BulletTrailId[]).map((trailId) => {
                    const trail = BULLET_TRAILS[trailId];
                    const isSelected = selectedTrail === trailId;
                    return (
                      <button
                        key={trailId}
                        type="button"
                        onClick={() => {
                          setSelectedTrail(trailId);
                          sounds.playShoot();
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col gap-1.5 ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-500/50 text-white shadow-lg shadow-amber-500/20'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <span className="text-base">{trail.icon}</span>
                          <span className="font-bold text-xs text-white truncate">{trail.vietnameseName}</span>
                        </div>

                        {/* Color Glow Indicator */}
                        <div className="flex items-center gap-2 pt-0.5">
                          <div
                            className="w-4 h-4 rounded-full border border-white/50 shadow-md"
                            style={{ backgroundColor: trail.color }}
                          />
                          <div
                            className="h-1.5 flex-1 rounded-full"
                            style={{
                              background: `linear-gradient(to right, ${trail.color}, ${trail.secondaryColor}, transparent)`,
                            }}
                          />
                        </div>

                        <p className="text-[11px] text-slate-400 line-clamp-2">{trail.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: ROOF DECALS & FLAGS */}
            {activeTab === 'decal' && (
              <div className="space-y-2.5">
                <div className="text-xs text-slate-400 font-medium">
                  Gắn cờ biểu tượng hoặc huy hiệu oai dũng lên nóc tháp pháo xe tăng:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(Object.keys(ROOF_DECALS) as RoofDecalId[]).map((decalId) => {
                    const decal = ROOF_DECALS[decalId];
                    const isSelected = selectedDecal === decalId;
                    return (
                      <button
                        key={decalId}
                        type="button"
                        onClick={() => {
                          setSelectedDecal(decalId);
                          sounds.playPowerUp();
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col gap-1.5 ${
                          isSelected
                            ? 'bg-indigo-500/15 border-indigo-400 ring-2 ring-indigo-500/50 text-white shadow-lg shadow-indigo-500/20'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-indigo-500 text-slate-950 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <span className="text-xl">{decal.icon}</span>
                          <span className="font-bold text-xs text-white truncate">{decal.vietnameseName}</span>
                        </div>

                        <p className="text-[11px] text-slate-400 line-clamp-2">{decal.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-xs text-slate-400 hidden sm:block">
            Mọi tùy chỉnh ngoại trang sẽ hiển thị với tất cả người chơi trong phòng trận!
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-sky-600/30 transition-all cursor-pointer active:scale-95 flex items-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>TRANG BỊ & LƯU LẠI</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
