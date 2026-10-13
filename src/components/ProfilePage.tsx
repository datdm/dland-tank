import React, { useState, useEffect } from 'react';
import {
  User,
  Trophy,
  Shield,
  Swords,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Edit2,
  Share2,
  RefreshCw,
  ArrowLeft,
  Flame,
  Target,
  Skull,
  Zap,
  Volume2,
  ShieldAlert,
  Sliders,
  ExternalLink,
  ChevronRight,
  Award,
  Layers,
} from 'lucide-react';
import { UserAccount, updateUserName, syncAccountToCloud } from '../utils/auth';
import { getPlayerStats, PlayerRecordStats } from '../utils/playerStats';
import {
  TankClass,
  TANK_CLASSES,
  TankSkinId,
  TANK_SKINS,
  BulletTrailId,
  BULLET_TRAILS,
  RoofDecalId,
  ROOF_DECALS,
  COMBAT_MEDALS,
  CombatMedalType,
  getRankFromRp,
} from '../types/game';
import { sounds } from '../utils/audio';
import { haptics } from '../utils/haptics';
import { TankVisual } from './TankVisual';
import { DecalBadge } from './DecalBadge';

interface ProfilePageProps {
  currentUser?: UserAccount;
  onUserChange?: (user: UserAccount) => void;
  onOpenAccountModal?: () => void;
  onOpenGarage?: () => void;
  onBackToLobby: () => void;
  playerRankRp: number;
  tankClass: TankClass;
  tankColor: string;
  skinId: TankSkinId;
  bulletTrail: BulletTrailId;
  roofDecal: RoofDecalId;
  isShortLandscape?: boolean;
  onToast: (text: string) => void;
}

type ProfileSubTab = 'overview' | 'stats' | 'loadout' | 'medals';

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  onUserChange,
  onOpenAccountModal,
  onOpenGarage,
  onBackToLobby,
  playerRankRp,
  tankClass,
  tankColor,
  skinId,
  bulletTrail,
  roofDecal,
  isShortLandscape = false,
  onToast,
}) => {
  const [stats, setStats] = useState<PlayerRecordStats>(() => getPlayerStats());
  const [activeSubTab, setActiveSubTab] = useState<ProfileSubTab>('overview');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(currentUser?.name || 'Chiến Binh');
  const [copiedUid, setCopiedUid] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Dynamic viewport measurement for precise mobile scaling (especially landscape)
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

  // Determine if we need compact mobile mode (mobile landscape or small mobile screen)
  const isCompact = isShortLandscape || dimensions.height <= 580 || dimensions.width < 640;

  const rankInfo = getRankFromRp(playerRankRp);
  const currentClassInfo = TANK_CLASSES[tankClass] || TANK_CLASSES.STRIKER;
  const currentSkinInfo = TANK_SKINS[skinId] || TANK_SKINS.DEFAULT;
  const currentTrailInfo = BULLET_TRAILS[bulletTrail] || BULLET_TRAILS.STANDARD;
  const currentDecalInfo = ROOF_DECALS[roofDecal] || ROOF_DECALS.FLAG_VIETNAM;

  // Refresh stats on load
  useEffect(() => {
    setStats(getPlayerStats());
    if (currentUser?.name) {
      setEditedName(currentUser.name);
    }
  }, [currentUser?.name]);

  const handleSaveName = () => {
    const trimmed = editedName.trim();
    if (!trimmed) {
      onToast('Tên không được để trống!');
      return;
    }
    const updated = updateUserName(trimmed);
    if (onUserChange) {
      onUserChange(updated);
    }
    setIsEditingName(false);
    haptics.light();
    sounds.playPowerUp();
    onToast(`✓ Đã đổi tên chỉ huy thành "${trimmed}"`);
  };

  const handleCopyUid = () => {
    const uidToCopy = currentUser?.id || `tank_${Date.now().toString(36)}`;
    haptics.light();
    navigator.clipboard?.writeText(uidToCopy).then(
      () => {
        setCopiedUid(true);
        sounds.playRadioBeep();
        onToast(`✓ Đã sao chép UID: ${uidToCopy}`);
        setTimeout(() => setCopiedUid(false), 2000);
      },
      () => {
        onToast(`UID: ${uidToCopy}`);
      }
    );
  };

  const handleShareProfile = () => {
    haptics.light();
    const text = `🏆 Hồ Sơ Chỉ Huy DLAND TANK: [${currentUser?.name || 'Chiến Binh'}] - Rank ${rankInfo.badge} (${playerRankRp} RP) - K/D: ${
      stats.totalDeaths > 0 ? (stats.totalKills / stats.totalDeaths).toFixed(2) : stats.totalKills
    } - Thắng ${stats.totalWins}/${stats.totalMatches} trận! Chơi ngay tại: ${window.location.origin}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        sounds.playPowerUp();
        onToast('✓ Đã sao chép chiến tích hồ sơ để chia sẻ!');
      });
    } else {
      onToast('Đã tạo liên kết chia sẻ hồ sơ.');
    }
  };

  const handleManualSync = () => {
    if (!currentUser) return;
    haptics.light();
    setIsSyncing(true);
    sounds.playRadioBeep();
    setTimeout(() => {
      const updated = syncAccountToCloud(currentUser);
      if (onUserChange) onUserChange(updated);
      setIsSyncing(false);
      onToast('✓ Đã đồng bộ Rank RP & tài khoản lên Cloud!');
    }, 400);
  };

  const handleTabChange = (tab: ProfileSubTab) => {
    haptics.light();
    sounds.playRadioBeep();
    setActiveSubTab(tab);
  };

  const winRate =
    stats.totalMatches > 0 ? Math.round((stats.totalWins / stats.totalMatches) * 100) : 0;
  const kdRatio =
    stats.totalDeaths > 0
      ? (stats.totalKills / stats.totalDeaths).toFixed(2)
      : stats.totalKills.toFixed(2);
  const rankedWinRate =
    stats.rankedMatches > 0
      ? Math.round((stats.rankedWins / stats.rankedMatches) * 100)
      : 0;

  const joinDateFormatted = currentUser?.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Hôm nay';

  return (
    <div
      className={`w-full max-w-7xl mx-auto font-mono select-none animate-in fade-in duration-200 ${
        isCompact ? 'space-y-1.5 py-0.5 pb-20' : 'space-y-3 sm:space-y-4 py-1 sm:py-2 pb-28 sm:pb-32'
      }`}
    >
      {/* 1. TOP HEADER & BREADCRUMB - COMPACT & REFINED */}
      <div
        className={`flex items-center justify-between border-b border-slate-800/80 ${
          isCompact ? 'pb-1' : 'pb-2'
        }`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => {
              haptics.light();
              onBackToLobby();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-amber-400 text-slate-300 hover:text-white text-[10.5px] sm:text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm shrink-0"
            title="Quay lại sảnh chính"
          >
            <ArrowLeft className="w-3 h-3 text-amber-400" />
            <span>Sảnh</span>
          </button>

          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 truncate">
              <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">HỒ SƠ CHỈ HUY</span>
            </h2>
          </div>
        </div>

        {/* Right header actions: Share & Account Sync */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleShareProfile}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-sky-400 text-sky-300 hover:text-white text-[10px] sm:text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
            title="Chia sẻ hồ sơ chỉ huy"
          >
            <Share2 className="w-3 h-3 text-sky-400" />
            <span className="hidden min-[400px]:inline">Chia Sẻ</span>
          </button>

          {onOpenAccountModal && (
            <button
              type="button"
              onClick={() => {
                haptics.light();
                onOpenAccountModal();
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] sm:text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm ${
                currentUser?.isGuest
                  ? 'bg-amber-500/15 border-amber-500/50 hover:bg-amber-500/25 text-amber-300'
                  : 'bg-emerald-500/15 border-emerald-500/50 hover:bg-emerald-500/25 text-emerald-300'
              }`}
              title="Quản lý tài khoản"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{currentUser?.isGuest ? 'Lưu Cloud' : 'Tài Khoản'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. USER HERO CARD - COMPACT MOBILE PROPORTIONS */}
      <div
        className={`bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-slate-950/95 border border-slate-700/80 rounded-xl sm:rounded-2xl ${
          isCompact ? 'p-2 sm:p-2.5' : 'p-3 sm:p-4'
        } shadow-lg relative overflow-hidden backdrop-blur-md`}
      >
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-row items-center justify-between gap-2 sm:gap-4">
          {/* Left: Avatar with Rank Tier Frame & Identity Details */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className={`${
                  isCompact ? 'w-10 h-10 sm:w-11 sm:h-11' : 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16'
                } rounded-xl border sm:border-2 p-0.5 shadow-md flex items-center justify-center relative overflow-hidden`}
                style={{
                  borderColor: rankInfo.color,
                  boxShadow: `0 0 10px ${rankInfo.color}33`,
                }}
              >
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-full h-full rounded-lg object-cover bg-slate-950"
                  />
                ) : (
                  <div className="w-full h-full rounded-lg bg-gradient-to-tr from-slate-950 to-slate-900 flex items-center justify-center text-center">
                    <span className={isCompact ? 'text-lg' : 'text-xl sm:text-2xl'}>{rankInfo.icon}</span>
                  </div>
                )}
                {!currentUser?.isGuest && (
                  <div
                    className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow border border-slate-900"
                    title="Tài khoản Google đã xác thực"
                  >
                    <Check className="w-2 h-2 stroke-[3]" />
                  </div>
                )}
              </div>
              <div
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 py-0.1 rounded-full text-[6.5px] sm:text-[7.5px] font-black uppercase tracking-wider text-slate-950 whitespace-nowrap shadow-sm border border-slate-900"
                style={{ backgroundColor: rankInfo.color }}
              >
                {rankInfo.tier}
              </div>
            </div>

            {/* Name, Status, UID */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                {isEditingName ? (
                  <div className="flex items-center gap-1 w-full sm:w-auto">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      maxLength={20}
                      autoFocus
                      className="bg-slate-950 border border-amber-400 rounded-md px-1.5 py-0.5 text-white font-bold text-xs focus:outline-none min-w-[100px]"
                    />
                    <button
                      type="button"
                      onClick={handleSaveName}
                      className="px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold text-[10px] hover:bg-amber-400 cursor-pointer active:scale-95 shrink-0"
                    >
                      Lưu
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditedName(currentUser?.name || 'Chiến Binh');
                        setIsEditingName(false);
                      }}
                      className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] hover:bg-slate-700 cursor-pointer shrink-0"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 min-w-0">
                    <h3
                      className={`${
                        isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
                      } font-black text-white truncate tracking-wide`}
                    >
                      {currentUser?.name || 'Chiến Binh'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        haptics.light();
                        setIsEditingName(true);
                      }}
                      className="p-0.5 text-slate-400 hover:text-amber-400 cursor-pointer shrink-0"
                      title="Đổi tên"
                    >
                      <Edit2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </button>
                  </div>
                )}

                {/* Account badge */}
                <span
                  className={`text-[7.5px] sm:text-[8.5px] px-1.5 py-0.2 rounded-full font-bold border flex items-center gap-0.5 ${
                    currentUser?.isGuest
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {currentUser?.isGuest ? 'KHÁCH' : 'GOOGLE'}
                </span>
              </div>

              {/* UID & Date */}
              <div className="flex items-center gap-1.5 text-[8.5px] sm:text-[9.5px] text-slate-400 mt-0.5 truncate">
                <button
                  type="button"
                  onClick={handleCopyUid}
                  className="flex items-center gap-0.5 hover:text-amber-300 cursor-pointer shrink-0"
                  title="Sao chép UID"
                >
                  <span className="text-slate-500">UID:</span>
                  <span className="font-mono text-slate-300 underline underline-offset-1">
                    {currentUser?.id ? `${currentUser.id.substring(0, 8)}...` : 'guest'}
                  </span>
                  {copiedUid ? (
                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-2 h-2 text-slate-500" />
                  )}
                </button>
                <span className="hidden sm:inline text-slate-500">
                  • Gia nhập: {joinDateFormatted}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quick Action CTA (Sleek inline button) */}
          <div className="shrink-0 flex items-center">
            {currentUser?.isGuest ? (
              <button
                type="button"
                onClick={() => {
                  haptics.light();
                  if (onOpenAccountModal) onOpenAccountModal();
                }}
                className={`flex items-center justify-center gap-1 ${
                  isCompact ? 'px-2 py-1 text-[9.5px]' : 'px-2.5 py-1.5 text-xs'
                } rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 text-slate-950 font-bold cursor-pointer shadow active:scale-95 transition-all`}
              >
                <RefreshCw className="w-3 h-3 shrink-0" />
                <span>{isCompact ? 'Lưu Google' : 'Liên Kết Google Lưu Dữ Liệu'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className={`flex items-center justify-center gap-1 ${
                  isCompact ? 'px-2 py-1 text-[9.5px]' : 'px-2.5 py-1.5 text-xs'
                } rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 font-bold cursor-pointer active:scale-95 transition-all`}
              >
                <RefreshCw className={`w-3 h-3 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Đồng Bộ Cloud</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. SUB-TABS (COMPACT SEGMENTED PILLS - NEVER CUT OFF) */}
      <div className="grid grid-cols-4 gap-1 p-0.5 sm:p-1 bg-slate-950/80 border border-slate-800/90 rounded-lg sm:rounded-xl">
        <button
          type="button"
          onClick={() => handleTabChange('overview')}
          className={`flex items-center justify-center gap-1 py-1 sm:py-1.5 px-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10.5px] font-bold transition-all cursor-pointer active:scale-95 ${
            activeSubTab === 'overview'
              ? 'bg-amber-500 text-slate-950 font-black shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
          <span className="truncate">Tổng Quan</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('stats')}
          className={`flex items-center justify-center gap-1 py-1 sm:py-1.5 px-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10.5px] font-bold transition-all cursor-pointer active:scale-95 ${
            activeSubTab === 'stats'
              ? 'bg-amber-500 text-slate-950 font-black shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Trophy className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
          <span className="truncate">Chiến Tích</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('loadout')}
          className={`flex items-center justify-center gap-1 py-1 sm:py-1.5 px-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10.5px] font-bold transition-all cursor-pointer active:scale-95 ${
            activeSubTab === 'loadout'
              ? 'bg-amber-500 text-slate-950 font-black shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Layers className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
          <span className="truncate">Trang Bị</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('medals')}
          className={`flex items-center justify-center gap-1 py-1 sm:py-1.5 px-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10.5px] font-bold transition-all cursor-pointer active:scale-95 ${
            activeSubTab === 'medals'
              ? 'bg-amber-500 text-slate-950 font-black shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
          <span className="truncate">Huân Chương</span>
        </button>
      </div>

      {/* =========================================================================
          TAB CONTENT 1: TỔNG QUAN (OVERVIEW)
         ========================================================================= */}
      {activeSubTab === 'overview' && (
        <div className="space-y-1.5 sm:space-y-3 animate-in fade-in duration-200">
          {/* Rank Progression Card */}
          <div
            className={`bg-slate-900/90 border border-amber-500/30 rounded-xl sm:rounded-2xl ${
              isCompact ? 'p-2 sm:p-2.5' : 'p-3 sm:p-4'
            } shadow-md relative overflow-hidden`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-sm sm:text-base shadow-sm border shrink-0"
                  style={{
                    backgroundColor: `${rankInfo.color}18`,
                    borderColor: `${rankInfo.color}55`,
                  }}
                >
                  <span>{rankInfo.icon}</span>
                </div>
                <div>
                  <div className="text-[8px] sm:text-[9px] text-amber-400 font-bold uppercase tracking-wider">
                    QUÂN HÀM
                  </div>
                  <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1">
                    <span>{rankInfo.badge}</span>
                    <span
                      className="text-[9px] sm:text-[10px] px-1.5 py-0.1 rounded-full font-bold"
                      style={{
                        backgroundColor: `${rankInfo.color}25`,
                        color: rankInfo.color,
                      }}
                    >
                      {playerRankRp} RP
                    </span>
                  </h4>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-[8px] sm:text-[9px] text-slate-400">Tiến trình</div>
                <div className="text-[9.5px] sm:text-xs font-bold text-slate-200">
                  {rankInfo.progressToNext}% • Cần +{Math.max(0, rankInfo.nextTierRp - playerRankRp)} RP
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-950 rounded-full h-1.5 sm:h-2 p-0.5 border border-slate-800 relative overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-500 relative"
                style={{
                  width: `${Math.min(100, Math.max(5, rankInfo.progressToNext))}%`,
                  backgroundColor: rankInfo.color,
                  boxShadow: `0 0 8px ${rankInfo.color}88`,
                }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>

            <div className="flex justify-between items-center text-[8px] sm:text-[9px] text-slate-400 mt-1">
              <span>Mốc: {rankInfo.minRp} RP</span>
              <span className="text-amber-300 font-bold">Thăng hạng: {rankInfo.nextTierRp} RP</span>
            </div>
          </div>

          {/* 6 Key Combat Stat Cards - Refined mobile font sizes */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[10.5px] sm:text-xs font-black text-white flex items-center gap-1 uppercase">
                <Trophy className="w-3 h-3 text-amber-400" />
                <span>CHIẾN TÍCH TIÊU BIỂU</span>
              </span>
              <span className="text-[9px] text-slate-400">Trọn đời</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-2">
              {/* 1. Tổng Trận */}
              <div className="bg-slate-900/90 border border-slate-800 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-sm">
                <div className="text-[7.5px] sm:text-[8.5px] text-slate-400 uppercase tracking-wider">
                  Tổng Trận
                </div>
                <div className="text-xs sm:text-sm md:text-base font-black text-white">
                  {stats.totalMatches}
                </div>
                <div className="text-[7.5px] sm:text-[8px] text-slate-500 truncate">Tham chiến</div>
              </div>

              {/* 2. Tỉ Lệ Thắng */}
              <div className="bg-slate-900/90 border border-emerald-500/30 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-sm">
                <div className="text-[7.5px] sm:text-[8.5px] text-emerald-400 uppercase tracking-wider">
                  Tỉ Lệ Thắng
                </div>
                <div className="text-xs sm:text-sm md:text-base font-black text-emerald-300">
                  {winRate}%
                </div>
                <div className="text-[7.5px] sm:text-[8px] text-slate-400 truncate">
                  {stats.totalWins}W / {stats.totalLosses}L
                </div>
              </div>

              {/* 3. Tiêu Diệt (Kills) */}
              <div className="bg-slate-900/90 border border-amber-500/30 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-sm">
                <div className="text-[7.5px] sm:text-[8.5px] text-amber-400 uppercase tracking-wider">
                  Hạ Địch
                </div>
                <div className="text-xs sm:text-sm md:text-base font-black text-amber-300 flex items-center gap-0.5">
                  <span>{stats.totalKills}</span>
                  <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 shrink-0" />
                </div>
                <div className="text-[7.5px] sm:text-[8px] text-slate-400 truncate">Kills đối thủ</div>
              </div>

              {/* 4. Chỉ số K/D */}
              <div className="bg-slate-900/90 border border-rose-500/30 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-sm">
                <div className="text-[7.5px] sm:text-[8.5px] text-rose-400 uppercase tracking-wider">
                  K/D Ratio
                </div>
                <div className="text-xs sm:text-sm md:text-base font-black text-rose-300">
                  {kdRatio}
                </div>
                <div className="text-[7.5px] sm:text-[8px] text-slate-400 truncate">
                  {stats.totalKills}H / {stats.totalDeaths}T
                </div>
              </div>

              {/* 5. Chuỗi Diệt */}
              <div className="bg-slate-900/90 border border-orange-500/30 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-sm">
                <div className="text-[7.5px] sm:text-[8.5px] text-orange-400 uppercase tracking-wider">
                  Chuỗi Diệt
                </div>
                <div className="text-xs sm:text-sm md:text-base font-black text-orange-300 flex items-center gap-0.5">
                  <span>{stats.highestStreak}</span>
                  <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-400 shrink-0" />
                </div>
                <div className="text-[7.5px] sm:text-[8px] text-slate-400 truncate">Kỷ lục liên hoàn</div>
              </div>

              {/* 6. Tổng Điểm */}
              <div className="bg-slate-900/90 border border-sky-500/30 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-sm">
                <div className="text-[7.5px] sm:text-[8.5px] text-sky-400 uppercase tracking-wider">
                  Tổng Điểm
                </div>
                <div className="text-xs sm:text-sm md:text-base font-black text-sky-300">
                  {stats.totalScore}
                </div>
                <div className="text-[7.5px] sm:text-[8px] text-slate-400 truncate">EXP chiến công</div>
              </div>
            </div>
          </div>

          {/* Quick Snapshot of Equipped Tank */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-center shrink-0">
                <TankVisual
                  tankClass={tankClass}
                  color={tankColor}
                  skinId={skinId}
                  roofDecal={roofDecal}
                  size={32}
                  animated={false}
                />
              </div>
              <div className="min-w-0">
                <div className="text-[8px] sm:text-[9px] text-slate-400 uppercase">Thiết giáp hiện tại</div>
                <div className="text-xs font-black text-white truncate flex items-center gap-1.5">
                  <span>{currentClassInfo.name}</span>
                  <span className="text-[8.5px] px-1 py-0.1 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {currentSkinInfo.vietnameseName}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleTabChange('loadout')}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[9.5px] sm:text-[10px] cursor-pointer border border-amber-500/30 active:scale-95 transition-all flex items-center gap-0.5 shrink-0"
            >
              <span>Xem Trang Bị</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB CONTENT 2: CHIẾN TÍCH (DETAILED STATS)
         ========================================================================= */}
      {activeSubTab === 'stats' && (
        <div className="space-y-1.5 sm:space-y-2.5 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2.5">
            {/* 1. Ranked 3v3 */}
            <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-2.5 sm:p-3 shadow-md">
              <div className="flex items-center justify-between mb-1.5 border-b border-slate-800 pb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                    <Trophy className="w-3 h-3" />
                  </div>
                  <div>
                    <h4 className="text-[10.5px] sm:text-xs font-black text-white uppercase">RANK XẾP HẠNG 3V3</h4>
                    <p className="text-[8px] text-slate-400">Tính điểm RP</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs sm:text-sm font-black text-amber-300">{rankedWinRate}%</div>
                  <div className="text-[7.5px] text-slate-400">Tỉ lệ thắng</div>
                </div>
              </div>

              <div className="w-full bg-slate-950 rounded-full h-1.5 border border-slate-800 overflow-hidden mb-2">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${rankedWinRate}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-1 text-center">
                <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-[7.5px] text-slate-400">Trận</div>
                  <div className="font-black text-white text-xs">{stats.rankedMatches}</div>
                </div>
                <div className="bg-slate-950/70 p-1.5 rounded-lg border border-emerald-500/30">
                  <div className="text-[7.5px] text-emerald-400">Thắng</div>
                  <div className="font-black text-emerald-300 text-xs">{stats.rankedWins}</div>
                </div>
                <div className="bg-slate-950/70 p-1.5 rounded-lg border border-rose-500/30">
                  <div className="text-[7.5px] text-rose-400">Thua</div>
                  <div className="font-black text-rose-300 text-xs">
                    {Math.max(0, stats.rankedMatches - stats.rankedWins)}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Casual & Free Arena */}
            <div className="bg-slate-900/90 border border-sky-500/40 rounded-xl p-2.5 sm:p-3 shadow-md">
              <div className="flex items-center justify-between mb-1.5 border-b border-slate-800 pb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-md bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                    <Swords className="w-3 h-3" />
                  </div>
                  <div>
                    <h4 className="text-[10.5px] sm:text-xs font-black text-white uppercase">ĐẤU THƯỜNG & TỰ DO</h4>
                    <p className="text-[8px] text-slate-400">Chiến trường FFA</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs sm:text-sm font-black text-sky-300">
                    {stats.casualMatches > 0
                      ? Math.round((stats.casualWins / stats.casualMatches) * 100)
                      : 0}
                    %
                  </div>
                  <div className="text-[7.5px] text-slate-400">Tỉ lệ thắng</div>
                </div>
              </div>

              <div className="w-full bg-slate-950 rounded-full h-1.5 border border-slate-800 overflow-hidden mb-2">
                <div
                  className="h-full bg-sky-400 rounded-full"
                  style={{
                    width: `${stats.casualMatches > 0 ? Math.round((stats.casualWins / stats.casualMatches) * 100) : 0}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-1 text-center">
                <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-[7.5px] text-slate-400">Trận</div>
                  <div className="font-black text-white text-xs">{stats.casualMatches}</div>
                </div>
                <div className="bg-slate-950/70 p-1.5 rounded-lg border border-emerald-500/30">
                  <div className="text-[7.5px] text-emerald-400">Thắng</div>
                  <div className="font-black text-emerald-300 text-xs">{stats.casualWins}</div>
                </div>
                <div className="bg-slate-950/70 p-1.5 rounded-lg border border-rose-500/30">
                  <div className="text-[7.5px] text-rose-400">Thua</div>
                  <div className="font-black text-rose-300 text-xs">
                    {Math.max(0, stats.casualMatches - stats.casualWins)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Kill / Death / Efficiency Metrics */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 sm:p-2.5 shadow-sm space-y-1.5">
            <h4 className="text-[10px] sm:text-xs font-black text-white uppercase flex items-center gap-1.5">
              <Target className="w-3 h-3 text-rose-400" />
              <span>HIỆU SUẤT TÁC CHIẾN</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-1.5">
              <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80">
                <div className="text-[7.5px] text-slate-400">Hạ Gục Đối Thủ</div>
                <div className="text-xs sm:text-sm font-black text-amber-300">{stats.totalKills}</div>
              </div>

              <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80">
                <div className="text-[7.5px] text-slate-400">Bị Tiêu Diệt</div>
                <div className="text-xs sm:text-sm font-black text-rose-300">{stats.totalDeaths}</div>
              </div>

              <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80">
                <div className="text-[7.5px] text-slate-400">Chuỗi Hạ Gục Cao Nhất</div>
                <div className="text-xs sm:text-sm font-black text-orange-300 flex items-center gap-0.5">
                  <span>{stats.highestStreak}</span>
                  <Flame className="w-2.5 h-2.5 text-orange-400" />
                </div>
              </div>

              <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80">
                <div className="text-[7.5px] text-slate-400">Điểm Chiến Công</div>
                <div className="text-xs sm:text-sm font-black text-sky-300">{stats.totalScore}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB CONTENT 3: TRANG BỊ & THIẾT GIÁP (LOADOUT & COSMETICS)
         ========================================================================= */}
      {activeSubTab === 'loadout' && (
        <div className="space-y-1.5 sm:space-y-2.5 animate-in fade-in duration-200">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-md space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                <h4 className="text-[10.5px] sm:text-xs font-black text-white uppercase tracking-wider">
                  THIẾT LẬP CHIẾN XA
                </h4>
              </div>

              {onOpenGarage && (
                <button
                  type="button"
                  onClick={() => {
                    haptics.light();
                    onOpenGarage();
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 text-slate-950 font-black text-[9.5px] sm:text-[10px] cursor-pointer shadow active:scale-95 transition-all"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Vào Gara 3D</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center">
              {/* Tank Visual Preview Canvas */}
              <div className="sm:col-span-5 bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center justify-center relative shadow-inner">
                <div className="relative">
                  <TankVisual
                    tankClass={tankClass}
                    color={tankColor}
                    skinId={skinId}
                    roofDecal={roofDecal}
                    size={isCompact ? 56 : 72}
                    animated
                  />
                  {roofDecal !== 'NONE' && (
                    <div className="absolute -top-1 -right-1 bg-slate-900/90 border border-slate-700 rounded-full p-0.5 shadow">
                      <DecalBadge decalId={roofDecal} size="sm" showWavingAnimation />
                    </div>
                  )}
                </div>
                <div className="mt-1 text-center">
                  <span className="text-xs font-black text-white block">{currentClassInfo.name}</span>
                  <span className="text-[9px] text-amber-400 font-bold block">
                    {currentSkinInfo.vietnameseName}
                  </span>
                </div>
              </div>

              {/* Class Performance Metrics */}
              <div className="sm:col-span-7 space-y-1.5 text-xs">
                {/* Max HP */}
                <div className="bg-slate-950/60 border border-slate-800 p-1.5 rounded-lg">
                  <div className="flex justify-between items-center text-[8.5px] text-slate-400 mb-0.5">
                    <span>Máu Tối Đa (HP)</span>
                    <strong className="text-white font-mono">{currentClassInfo.maxHp} HP</strong>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, (currentClassInfo.maxHp / 220) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Speed */}
                <div className="bg-slate-950/60 border border-slate-800 p-1.5 rounded-lg">
                  <div className="flex justify-between items-center text-[8.5px] text-slate-400 mb-0.5">
                    <span>Tốc Độ Cơ Động</span>
                    <strong className="text-white font-mono">{currentClassInfo.speed} pts</strong>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full"
                      style={{ width: `${Math.min(100, (currentClassInfo.speed / 6) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Fire Cooldown */}
                <div className="bg-slate-950/60 border border-slate-800 p-1.5 rounded-lg">
                  <div className="flex justify-between items-center text-[8.5px] text-slate-400 mb-0.5">
                    <span>Hồi Pháo</span>
                    <strong className="text-white font-mono">{currentClassInfo.fireCooldown} ms</strong>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.min(100, (1000 / currentClassInfo.fireCooldown) * 50)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Loadout Slot Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-1.5">
              {/* 1. Lớp Xe (Class) */}
              <div className="bg-slate-950/70 border border-slate-800 p-1.5 rounded-lg">
                <div className="text-[7.5px] text-slate-400 uppercase">Dòng Xe</div>
                <div className="font-bold text-white text-[10px] truncate">{currentClassInfo.name}</div>
                <span className="text-[8px] text-sky-400">{tankClass}</span>
              </div>

              {/* 2. Skin Ngoại Trang */}
              <div className="bg-slate-950/70 border border-slate-800 p-1.5 rounded-lg">
                <div className="text-[7.5px] text-slate-400 uppercase">Sơn Thân</div>
                <div className="font-bold text-white text-[10px] truncate">{currentSkinInfo.vietnameseName}</div>
                <span className="text-[8px] text-fuchsia-400">{currentSkinInfo.badge}</span>
              </div>

              {/* 3. Vệt Đạn (Tracer) */}
              <div className="bg-slate-950/70 border border-slate-800 p-1.5 rounded-lg">
                <div className="text-[7.5px] text-slate-400 uppercase">Vệt Đạn</div>
                <div className="font-bold text-white text-[10px] truncate flex items-center gap-0.5">
                  <span>{currentTrailInfo.icon}</span>
                  <span className="truncate">{currentTrailInfo.vietnameseName}</span>
                </div>
              </div>

              {/* 4. Phù Hiệu Nóc Xe (Decal) */}
              <div className="bg-slate-950/70 border border-slate-800 p-1.5 rounded-lg">
                <div className="text-[7.5px] text-slate-400 uppercase">Phù Hiệu</div>
                <div className="font-bold text-white text-[10px] truncate flex items-center gap-0.5">
                  <span>{currentDecalInfo.icon}</span>
                  <span className="truncate">{currentDecalInfo.vietnameseName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB CONTENT 4: HUÂN CHƯƠNG CHIẾN CÔNG (MEDALS & ACCOLADES)
         ========================================================================= */}
      {activeSubTab === 'medals' && (
        <div className="space-y-1.5 sm:space-y-2 animate-in fade-in duration-200">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-md space-y-1.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                <h4 className="text-[10.5px] sm:text-xs font-black text-white uppercase tracking-wider">
                  8 HUÂN CHƯƠNG CHIẾN CÔNG
                </h4>
              </div>
              <span className="text-[8.5px] text-slate-400">Chạm để nghe 🔊</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-4 gap-1 sm:gap-1.5">
              {(Object.keys(COMBAT_MEDALS) as CombatMedalType[]).map((mKey) => {
                const medal = COMBAT_MEDALS[mKey];
                return (
                  <div
                    key={mKey}
                    onClick={() => {
                      haptics.light();
                      sounds.playMedalFanfare(mKey);
                      sounds.announce(medal.voiceText, medal.viVoiceText);
                      onToast(`🎖️ Huân chương: ${medal.vietnameseTitle} - "${medal.viVoiceText}"`);
                    }}
                    className="bg-slate-950/80 border border-slate-800/80 hover:border-amber-400/60 p-1.5 rounded-lg transition-all cursor-pointer group shadow-sm flex flex-col justify-between active:scale-95 select-none"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-base sm:text-xl p-0.5 bg-slate-900 rounded group-hover:scale-105 transition-transform">
                          {medal.icon}
                        </span>
                        <Volume2 className="w-2.5 h-2.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                      </div>
                      <div className="font-bold text-white text-[9px] sm:text-[10px] truncate font-mono">
                        {medal.vietnameseTitle}
                      </div>
                      <p className="text-[7.5px] sm:text-[8px] text-slate-400 line-clamp-1 mt-0.5 italic">
                        "{medal.viVoiceText}"
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. FOOTER ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => {
            haptics.light();
            onBackToLobby();
          }}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] sm:text-xs transition-all cursor-pointer active:scale-95 shadow-sm"
        >
          ← Quay Lại
        </button>

        {onOpenAccountModal && (
          <button
            type="button"
            onClick={() => {
              haptics.light();
              onOpenAccountModal();
            }}
            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] sm:text-xs transition-all cursor-pointer active:scale-95 shadow-sm flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Cài Đặt Tài Khoản & Đồng Bộ</span>
          </button>
        )}
      </div>
    </div>
  );
};
