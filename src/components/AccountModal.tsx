import React, { useState } from 'react';
import {
  X,
  User,
  LogOut,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Trophy,
  Swords,
  ShieldAlert,
  ArrowRight,
  Check,
} from 'lucide-react';
import { UserAccount, loginWithGoogle, loginAsGuest, logoutToGuest, syncAccountToCloud } from '../utils/auth';
import { sounds } from '../utils/audio';
import { getPlayerStats, PlayerRecordStats } from '../utils/playerStats';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onUserChange: (user: UserAccount) => void;
  onToast: (text: string) => void;
  playerRankRp: number;
  onOpenFullProfile?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  onToast,
  playerRankRp,
  onOpenFullProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'google_login' | 'guest_config'>(
    currentUser.isGuest ? 'google_login' : 'profile'
  );
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [syncGuestData, setSyncGuestData] = useState(true);
  const [guestName, setGuestName] = useState(currentUser.name);
  const [isSyncing, setIsSyncing] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setGuestName(currentUser.name);
      setActiveTab(currentUser.isGuest ? 'google_login' : 'profile');
      setIsSyncing(false);
    }
  }, [isOpen, currentUser]);

  const stats: PlayerRecordStats = getPlayerStats();

  if (!isOpen) return null;

  const markInitialShown = () => {
    try {
      localStorage.setItem('tank_auth_initial_shown', 'true');
    } catch (err) {
      console.warn('Failed to set initial auth shown:', err);
    }
  };

  const handlePerformGoogleLogin = (emailToUse: string, nameToUse: string) => {
    sounds.playPowerUp();
    setIsSyncing(true);

    setTimeout(() => {
      const { user, synced } = loginWithGoogle(
        {
          email: emailToUse,
          name: nameToUse,
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(emailToUse)}`,
        },
        syncGuestData
      );

      setIsSyncing(false);
      markInitialShown();
      onUserChange(user);
      setActiveTab('profile');

      if (synced) {
        onToast(`✓ Đã đăng nhập Google & đồng bộ Rank RP (${user.rankRp}) thành công!`);
      } else {
        onToast(`✓ Đã đăng nhập tài khoản Google: ${user.name}`);
      }
    }, 400);
  };

  const handleManualSyncCloud = () => {
    sounds.playRadioBeep();
    setIsSyncing(true);
    setTimeout(() => {
      const updated = syncAccountToCloud(currentUser);
      setIsSyncing(false);
      onUserChange(updated);
      onToast('✓ Dữ liệu chiến tích, Rank RP và ngoại trang đã được đồng bộ lên Cloud!');
    }, 500);
  };

  const handleSaveGuestName = () => {
    sounds.playPowerUp();
    const updated = loginAsGuest(guestName);
    markInitialShown();
    onUserChange(updated);
    onToast(`✓ Đã cập nhật biệt danh Khách: ${updated.name}`);
    onClose();
  };

  const handleQuickGuestPlay = () => {
    sounds.playPowerUp();
    const updated = loginAsGuest(guestName || currentUser.name);
    markInitialShown();
    onUserChange(updated);
    onToast(`✓ Bắt đầu chơi với tư cách Khách: ${updated.name}`);
    onClose();
  };

  const handleSwitchToGuest = () => {
    sounds.playRadioBeep();
    const guestUser = logoutToGuest();
    onUserChange(guestUser);
    setActiveTab('guest_config');
    onToast('✓ Đã chuyển về chế độ Khách (Guest).');
  };

  const handleClose = () => {
    markInitialShown();
    onClose();
  };

  const isFirstTime = typeof window !== 'undefined' && !localStorage.getItem('tank_auth_initial_shown');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-1.5 sm:p-4 overflow-y-auto animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94dvh]">
        {/* First time welcome highlight */}
        {isFirstTime && (
          <div className="bg-gradient-to-r from-amber-500/25 via-emerald-500/20 to-sky-500/20 border-b border-amber-500/30 px-3.5 py-2 flex items-center gap-2 text-xs font-mono text-amber-200">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span className="font-bold">
              Chào mừng bạn! Hãy chọn đăng nhập Google để bảo lưu Rank RP hoặc Chơi ngay (Khách).
            </span>
          </div>
        )}

        {/* Header */}
        <div className="shrink-0 border-b border-slate-800 p-3 sm:p-4 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white font-mono text-sm sm:text-base flex items-center gap-1.5">
                <span>HỒ SƠ TÀI KHOẢN & ĐỒNG BỘ</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  currentUser.isGuest
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {currentUser.isGuest ? 'GUEST' : 'GOOGLE SYNCED'}
                </span>
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-400">
                Đăng nhập Google hoặc chơi ngay Khách • Bảo lưu Rank & Chiến tích
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors active:scale-95"
            title="Đóng / Chơi sau"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/50 p-1.5 gap-1.5 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition-all cursor-pointer text-center ${
              activeTab === 'profile'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Thông Tin Chỉ Huy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('google_login')}
            className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'google_login'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="font-bold">G</span> Đăng Nhập Google
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guest_config')}
            className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition-all cursor-pointer text-center ${
              activeTab === 'guest_config'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Chơi Ngay (Khách)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3 sm:p-5 space-y-3 sm:space-y-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {/* TAB 1: PROFILE INFO & CLOUD STATUS */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* User Identity Card */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-3.5 relative overflow-hidden">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-blue-700 p-0.5 shrink-0 shadow-lg relative">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-full h-full rounded-2xl object-cover bg-slate-900"
                    />
                  ) : (
                    <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-amber-400 text-2xl font-black">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {!currentUser.isGuest && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-white text-base truncate font-mono">{currentUser.name}</h4>
                  </div>
                  <p className="text-xs text-slate-400 font-mono truncate">
                    {currentUser.isGuest ? 'Tài khoản khách vãng lai' : currentUser.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                      🏆 Rank: {currentUser.rankTier} ({playerRankRp} RP)
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Summary Grid */}
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase">Tổng Trận</div>
                  <div className="text-base font-black text-white">{stats.totalMatches}</div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase">Thắng / Bại</div>
                  <div className="text-base font-black text-emerald-400">
                    {stats.totalWins} <span className="text-slate-600 text-xs">/</span> <span className="text-rose-400 text-sm">{stats.totalLosses}</span>
                  </div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase">Tiêu Diệt</div>
                  <div className="text-base font-black text-amber-300">{stats.totalKills} 🎯</div>
                </div>
              </div>

              {/* Status Warning or Cloud Sync Status */}
              {currentUser.isGuest ? (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-amber-300 font-mono">Tiến trình Khách chưa liên kết Google!</div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      Nếu bạn xóa lịch sử trình duyệt hoặc đổi thiết bị, điểm Rank và chiến tích sẽ bị mất. Hãy đăng nhập Google để đồng bộ vĩnh viễn!
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('google_login')}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer hover:bg-amber-400 transition-colors"
                    >
                      <span>Đồng Bộ Google Ngay</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-emerald-300 font-mono">Đã đồng bộ Google Cloud an toàn</div>
                      <p className="text-slate-300 text-[11px]">
                        Điểm Rank ({playerRankRp} RP), skins và huân chương của bạn tự động bảo lưu.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleManualSyncCloud}
                    disabled={isSyncing}
                    className="shrink-0 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 cursor-pointer active:scale-95 transition-all"
                    title="Đồng bộ thủ công lên Cloud"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-3">
                  {!currentUser.isGuest ? (
                    <button
                      type="button"
                      onClick={handleSwitchToGuest}
                      className="text-xs text-slate-400 hover:text-rose-400 font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất (Về Khách)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab('guest_config')}
                      className="text-xs text-sky-400 hover:underline font-mono"
                    >
                      Đổi biệt danh Khách
                    </button>
                  )}
                  {onOpenFullProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        onOpenFullProfile();
                      }}
                      className="text-xs text-amber-300 hover:text-amber-200 font-mono font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Xem Trang Profile Đầy Đủ →</span>
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE LOGIN & SYNC */}
          {activeTab === 'google_login' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="inline-flex w-12 h-12 rounded-2xl bg-white text-slate-900 items-center justify-center font-black text-2xl shadow-lg shadow-white/10 mb-1">
                  <span className="text-[#4285F4]">G</span>
                </div>
                <h4 className="text-base font-black text-white font-mono">ĐĂNG NHẬP BẰNG GOOGLE</h4>
                <p className="text-xs text-slate-400">
                  Liên kết tài khoản Google để đồng bộ xếp hạng và lưu trữ chiến xa vĩnh viễn
                </p>
              </div>

              {/* Clean Google Account Input & Authentication */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-200 block">
                    Nhập địa chỉ Email Google của bạn:
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={googleEmail}
                      onChange={(e) => {
                        setGoogleEmail(e.target.value);
                        if (!googleName && e.target.value.includes('@')) {
                          const username = e.target.value.split('@')[0];
                          setGoogleName(username.charAt(0).toUpperCase() + username.slice(1));
                        }
                      }}
                      placeholder="tenban@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-white font-mono text-xs focus:border-amber-400 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-200 block">
                    Tên hiển thị chỉ huy chiến trường:
                  </label>
                  <input
                    type="text"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    placeholder="Chỉ Huy Xe Tăng"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-white font-mono text-xs focus:border-amber-400 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Sync Guest Progress Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer text-xs font-mono">
                <input
                  type="checkbox"
                  checked={syncGuestData}
                  onChange={(e) => setSyncGuestData(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
                <span className="text-slate-300 text-[11px] leading-relaxed">
                  Đồng bộ toàn bộ Rank RP ({playerRankRp} RP), số trận thắng ({stats.totalWins}) và các ngoại trang đã chọn vào tài khoản Google này.
                </span>
              </label>

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={() => handlePerformGoogleLogin(googleEmail, googleName)}
                disabled={isSyncing || !googleEmail}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black font-mono text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>ĐANG ĐỒNG BỘ CLOUD...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ĐĂNG NHẬP GOOGLE & ĐỒNG BỘ TIẾN TRÌNH</span>
                  </>
                )}
              </button>

              {/* Or Quick Play as Guest */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] font-mono text-slate-500 uppercase">Hoặc</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <button
                type="button"
                onClick={handleQuickGuestPlay}
                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-amber-400/60 text-slate-200 hover:text-white font-mono font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md"
              >
                <span className="text-amber-400">⚡</span>
                <span>CHƠI NGAY VỚI TƯ CÁCH KHÁCH (GUEST)</span>
              </button>

              <div className="text-center pt-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('guest_config')}
                  className="text-[11px] text-slate-400 hover:text-amber-300 font-mono underline"
                >
                  Tùy chỉnh tên Khách trước khi vào trận →
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: GUEST QUICK PLAY */}
          {activeTab === 'guest_config' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="inline-flex w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 items-center justify-center text-xl font-bold mb-1">
                  ⚡
                </div>
                <h4 className="text-base font-black text-white font-mono">CHƠI NGAY VỚI TƯ CÁCH KHÁCH</h4>
                <p className="text-xs text-slate-400">
                  Vào trận đấu ngay lập tức mà không cần tài khoản hay mật khẩu
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                <label className="text-xs font-mono font-bold text-slate-300 block">
                  Biệt danh chiến trường của bạn:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    maxLength={24}
                    placeholder="Nhập tên xe tăng..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playRadioBeep();
                      const names = ['Thần Sấm Guest', 'Pháo Thủ Alpha', 'Thiết Giáp 007', 'Xạ Thủ Bão Lửa'];
                      setGuestName(names[Math.floor(Math.random() * names.length)]);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold cursor-pointer"
                  >
                    Ngẫu nhiên
                  </button>
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed font-mono">
                  • Mọi thành tích trong phiên chơi sẽ được lưu tạm thời trên thiết bị này.
                  <br />
                  • Bạn có thể đăng nhập Google bất cứ lúc nào để đồng bộ giữ nguyên điểm Rank.
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveGuestName}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black font-mono text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                <Swords className="w-4 h-4" />
                <span>LƯU & XUNG TRẬN NGAY</span>
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('google_login')}
                  className="text-xs text-amber-400 hover:underline font-mono"
                >
                  ← Hoặc kết nối tài khoản Google để bảo vệ điểm Rank
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
