import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  UserCheck,
  Copy,
  Check,
  X,
  Radio,
  Search,
  Trash2,
  Trophy,
  Play,
  Gamepad2,
  Sparkles,
  Signal,
  UserMinus,
  RefreshCw,
  Eye,
} from 'lucide-react';
import {
  FriendUser,
  OnlinePlayerInfo,
  TankClass,
  GameMode,
  RankTier,
  getRankFromRp,
} from '../types/game';
import { sounds } from '../utils/audio';

export interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  myPlayerName: string;
  myPlayerColor: string;
  myTankClass: TankClass;
  myRankRp: number;
  myFriendCode?: string;
  onlinePlayers?: OnlinePlayerInfo[];
  pendingRequests?: Array<{
    id: string;
    name: string;
    friendCode: string;
    rankRp: number;
    tankClass: TankClass;
    color?: string;
    rankTier?: RankTier;
  }>;
  onJoinFriendRoom?: (roomId: string, mode: GameMode) => void;
  onSpectateFriendRoom?: (roomId: string, mode: GameMode) => void;
  onSendFriendRequest?: (targetFriendCode: string, targetPlayerId?: string) => void;
  onAcceptFriendRequest?: (req: {
    id: string;
    name: string;
    friendCode: string;
    rankRp: number;
    tankClass: TankClass;
    color?: string;
    rankTier?: RankTier;
  }) => void;
  onDeclineFriendRequest?: (reqId: string) => void;
  onInviteFriend?: (friend: FriendUser, inviteType: 'CASUAL' | 'RANKED') => void;
}

const SAMPLE_IDS = new Set(['f_1', 'f_2', 'f_3', 'f_4', 'f_5', 'f_6']);
const SAMPLE_NAMES = new Set([
  'BáoĐen_Pro99',
  'XạThủ_Hùng9x',
  'SátThủ_SấmSét',
  'Trần_Hoàng_Tank',
  'GiaBảo_T90',
  'ĐạiĐộiTrưởng_Nam',
]);

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  myPlayerName,
  myPlayerColor,
  myTankClass,
  myRankRp,
  myFriendCode: propFriendCode,
  onlinePlayers = [],
  pendingRequests: propPendingRequests = [],
  onJoinFriendRoom,
  onSpectateFriendRoom,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onDeclineFriendRequest,
  onInviteFriend,
}) => {
  const [activeTab, setActiveTab] = useState<'online' | 'friends' | 'add' | 'requests'>('online');
  const [isShortLandscape, setIsShortLandscape] = useState(
    () =>
      typeof window !== 'undefined' &&
      (window.innerHeight <= 620 || (window.innerWidth < 768 && window.innerHeight > window.innerWidth))
  );

  useEffect(() => {
    const handleResize = () => {
      setIsShortLandscape(
        window.innerHeight <= 620 || (window.innerWidth < 768 && window.innerHeight > window.innerWidth)
      );
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Filter out any legacy fake sample data
  const [friends, setFriends] = useState<FriendUser[]>(() => {
    try {
      const saved = localStorage.getItem('tank_friends_list');
      if (saved) {
        const parsed: FriendUser[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((f) => !SAMPLE_IDS.has(f.id) && !SAMPLE_NAMES.has(f.name));
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  const [myFriendCode] = useState(() => {
    if (propFriendCode) return propFriendCode;
    let code = localStorage.getItem('tank_my_friend_code');
    if (!code) {
      code = `DLAND-${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem('tank_my_friend_code', code);
    }
    return code;
  });

  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [copiedCode, setCopiedCode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addInput, setAddInput] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Incoming pending requests (combined with props)
  const [localPendingRequests, setLocalPendingRequests] = useState<
    Array<{
      id: string;
      name: string;
      friendCode: string;
      rankRp: number;
      tankClass: TankClass;
      color?: string;
      rankTier?: RankTier;
    }>
  >([]);

  const pendingRequests = useMemo(() => {
    const combined = [...propPendingRequests, ...localPendingRequests];
    const seen = new Set<string>();
    return combined.filter((r) => {
      const key = r.friendCode || r.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [propPendingRequests, localPendingRequests]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setAddInput('');
      setCopiedCode(false);
      setToastMsg(null);
    }
  }, [isOpen]);

  // Persist clean friends list to localStorage
  useEffect(() => {
    try {
      const cleanList = friends.filter((f) => !SAMPLE_IDS.has(f.id) && !SAMPLE_NAMES.has(f.name));
      localStorage.setItem('tank_friends_list', JSON.stringify(cleanList));
    } catch {
      // ignore
    }
  }, [friends]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? null : cur));
    }, 2800);
  };

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(myFriendCode);
    }
    setCopiedCode(true);
    sounds.playRadioBeep();
    showToast(`Đã sao chép mã bạn bè: ${myFriendCode}`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Add friend directly by code or from online player list
  const handleAddOnlineFriend = (target: {
    id: string;
    friendCode: string;
    name: string;
    color?: string;
    tankClass?: TankClass;
    rankRp?: number;
    rankTier?: RankTier;
  }) => {
    if (target.friendCode.toUpperCase() === myFriendCode.toUpperCase()) {
      showToast('Không thể kết bạn với chính mình!');
      return;
    }

    const existing = friends.find(
      (f) =>
        f.friendCode.toUpperCase() === target.friendCode.toUpperCase() ||
        f.name.toLowerCase() === target.name.toLowerCase()
    );
    if (existing) {
      showToast(`${existing.name} đã có trong danh sách bạn bè!`);
      return;
    }

    // Call WebSocket hook if available
    if (onSendFriendRequest) {
      onSendFriendRequest(target.friendCode, target.id);
    }

    // Add directly to local friends or mark as request sent
    const newFriend: FriendUser = {
      id: target.id || `f_${Date.now()}`,
      friendCode: target.friendCode,
      name: target.name,
      color: target.color || '#3b82f6',
      tankClass: target.tankClass || 'STRIKER',
      rankTier: target.rankTier || 'GOLD',
      rankRp: target.rankRp ?? 850,
      status: 'ONLINE',
      roomId: 'public',
      lastActive: 'Trực tuyến vừa kết bạn',
    };

    setFriends((prev) => [newFriend, ...prev.filter((f) => f.friendCode !== newFriend.friendCode)]);
    setSentRequests((prev) => new Set(prev).add(target.friendCode));
    sounds.playPowerUp();
    showToast(`Đã gửi lời mời và kết bạn với ${target.name}!`);
  };

  const handleAddFriendByInput = () => {
    const trimmed = addInput.trim();
    if (!trimmed) return;

    if (trimmed.toUpperCase() === myFriendCode.toUpperCase()) {
      showToast('Không thể kết bạn với chính mình!');
      return;
    }

    const existing = friends.find(
      (f) =>
        f.friendCode.toUpperCase() === trimmed.toUpperCase() ||
        f.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      showToast(`${existing.name} đã có trong danh sách bạn bè!`);
      return;
    }

    // Check if matching online player exists
    const matchingOnline = onlinePlayers.find(
      (p) =>
        p.friendCode.toUpperCase() === trimmed.toUpperCase() ||
        p.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (matchingOnline) {
      handleAddOnlineFriend(matchingOnline);
      setAddInput('');
      return;
    }

    // If adding a friend code or name that isn't connected right now
    const cleanCode = trimmed.startsWith('DLAND-')
      ? trimmed.toUpperCase()
      : `DLAND-${Math.floor(1000 + Math.random() * 9000)}`;

    const newFriend: FriendUser = {
      id: `f_${Date.now()}`,
      friendCode: cleanCode,
      name: trimmed.startsWith('DLAND-') ? `Chiến Binh ${trimmed.slice(-4)}` : trimmed,
      color: '#3b82f6',
      tankClass: 'STRIKER',
      rankTier: 'GOLD',
      rankRp: 850,
      status: 'OFFLINE',
      lastActive: 'Vừa thêm mã kết bạn',
    };

    if (onSendFriendRequest) {
      onSendFriendRequest(cleanCode);
    }

    setFriends((prev) => [newFriend, ...prev]);
    setAddInput('');
    sounds.playPowerUp();
    showToast(`Đã thêm bạn thành công: ${newFriend.name}!`);
    setActiveTab('friends');
  };

  const handleAcceptRequest = (req: {
    id: string;
    name: string;
    friendCode: string;
    rankRp: number;
    tankClass: TankClass;
    color?: string;
    rankTier?: RankTier;
  }) => {
    if (onAcceptFriendRequest) {
      onAcceptFriendRequest(req);
    }

    const newFriend: FriendUser = {
      id: req.id || `f_${Date.now()}`,
      friendCode: req.friendCode,
      name: req.name,
      color: req.color || '#10b981',
      tankClass: req.tankClass,
      rankTier: req.rankTier || 'GOLD',
      rankRp: req.rankRp,
      status: 'ONLINE',
      roomId: 'public',
      lastActive: 'Vừa chấp nhận lời mời',
    };

    setFriends((prev) => [newFriend, ...prev.filter((f) => f.friendCode !== newFriend.friendCode)]);
    setLocalPendingRequests((prev) => prev.filter((r) => r.id !== req.id && r.friendCode !== req.friendCode));
    sounds.playPowerUp();
    showToast(`Đã đồng ý kết bạn với ${req.name}!`);
  };

  const handleDeclineRequest = (reqId: string) => {
    if (onDeclineFriendRequest) {
      onDeclineFriendRequest(reqId);
    }
    setLocalPendingRequests((prev) => prev.filter((r) => r.id !== reqId));
    sounds.playRadioBeep();
    showToast('Đã từ chối lời mời kết bạn.');
  };

  const handleRemoveFriend = (friendId: string, name: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
    sounds.playRadioBeep();
    showToast(`Đã xóa ${name} khỏi danh sách bạn bè.`);
  };

  const handleInviteFriend = (friend: FriendUser, inviteType: 'CASUAL' | 'RANKED' = 'CASUAL') => {
    sounds.playRadioBeep();
    if (onInviteFriend) {
      onInviteFriend(friend, inviteType);
    }
    const typeLabel = inviteType === 'RANKED' ? 'ĐẤU RANK 🏆' : 'ĐẤU THƯỜNG 🎮';
    showToast(`Đã gửi lời mời tham gia ${typeLabel} tới ${friend.name}!`);
  };

  const myRank = getRankFromRp(myRankRp);

  // Sync live status with online players
  const synchronizedFriends = useMemo(() => {
    return friends.map((f) => {
      const matchOnline = onlinePlayers.find(
        (op) => op.friendCode.toUpperCase() === f.friendCode.toUpperCase() || op.name.toLowerCase() === f.name.toLowerCase()
      );
      if (matchOnline) {
        return {
          ...f,
          status: matchOnline.status,
          currentMode: matchOnline.currentMode,
          roomId: matchOnline.roomId || f.roomId,
          rankRp: typeof matchOnline.rankRp === 'number' ? matchOnline.rankRp : f.rankRp,
          lastActive: matchOnline.status === 'IN_BATTLE' ? 'Đang trong trận đấu' : 'Trực tuyến • Sảnh chờ',
        };
      }
      return f;
    });
  }, [friends, onlinePlayers]);

  const filteredFriends = useMemo(() => {
    if (!searchQuery) return synchronizedFriends;
    const q = searchQuery.toLowerCase();
    return synchronizedFriends.filter(
      (f) => f.name.toLowerCase().includes(q) || f.friendCode.toLowerCase().includes(q)
    );
  }, [synchronizedFriends, searchQuery]);

  // Online players excluding current user
  const otherOnlinePlayers = useMemo(() => {
    return onlinePlayers.filter((p) => {
      const isMe =
        p.friendCode.toUpperCase() === myFriendCode.toUpperCase() ||
        (p.name.toLowerCase() === myPlayerName.toLowerCase() && p.isMe);
      return !isMe;
    });
  }, [onlinePlayers, myFriendCode, myPlayerName]);

  const onlineFriendsCount = synchronizedFriends.filter(
    (f) => f.status === 'ONLINE' || f.status === 'IN_BATTLE'
  ).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-1.5 sm:p-4 overflow-y-auto animate-in fade-in duration-200 select-none">
      <div
        className={`bg-slate-900 border border-slate-700/80 rounded-xl sm:rounded-2xl max-w-2xl md:max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col my-auto ${
          isShortLandscape ? 'max-h-[94dvh] h-[92vh]' : 'max-h-[88vh]'
        }`}
      >
        {/* HEADER */}
        <div
          className={`shrink-0 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between ${
            isShortLandscape ? 'px-2.5 py-1.5' : 'px-3 sm:px-4 py-2 sm:py-2.5'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`${
                isShortLandscape ? 'w-6 h-6' : 'w-7 h-7 sm:w-8 sm:h-8'
              } rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0`}
            >
              <Users className={isShortLandscape ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            </div>
            <div>
              <h2 className="font-bold text-white font-mono flex items-center gap-1.5 text-xs sm:text-sm">
                <span>HỆ THỐNG BẠN BÈ & TÁC CHIẾN</span>
                <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {otherOnlinePlayers.length} ONLINE
                </span>
              </h2>
              {!isShortLandscape && (
                <p className="text-[10px] text-slate-400 font-mono">
                  Dữ liệu người chơi thực tế trên máy chủ • Kết bạn 1-chạm & mời vào trận
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors shrink-0 z-10"
            title="Đóng (X)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MY FRIEND CODE PROFILE BANNER */}
        <div
          className={`bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950/40 border-b border-slate-800/80 flex items-center justify-between gap-2 ${
            isShortLandscape ? 'p-1.5 px-2.5' : 'p-2 sm:p-2.5'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`rounded-lg flex items-center justify-center font-bold border shadow-md ${
                isShortLandscape ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'
              }`}
              style={{ backgroundColor: `${myPlayerColor}25`, borderColor: myPlayerColor }}
            >
              <span>{myRank.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white font-mono text-xs sm:text-sm">{myPlayerName}</span>
                <span
                  className="text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded border"
                  style={{ color: myRank.color, borderColor: `${myRank.color}50` }}
                >
                  {myRank.badge} • {myRank.rp} RP
                </span>
              </div>
              <div className="text-[9.5px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                <span>Mã bạn bè của bạn:</span>
                <strong className="text-sky-300 font-black tracking-wider">{myFriendCode}</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer active:scale-95 shrink-0 shadow-sm"
          >
            {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-sky-400" />}
            <span>{copiedCode ? 'Đã Sao Chép' : 'Sao Chép Mã'}</span>
          </button>
        </div>

        {/* TAB CONTROLS */}
        <div
          className={`flex border-b border-slate-800 bg-slate-950/50 gap-2 font-mono font-bold ${
            isShortLandscape ? 'px-3 pt-1 text-[10px]' : 'px-3 sm:px-6 pt-2 md:pt-3 text-xs md:text-sm'
          }`}
        >
          {/* TAB 1: ONLINE PLAYERS (Dữ liệu thực tế máy chủ) */}
          <button
            type="button"
            onClick={() => setActiveTab('online')}
            className={`border-b-2 transition-all cursor-pointer flex items-center gap-1 md:gap-1.5 ${
              isShortLandscape ? 'pb-1 px-2' : 'pb-2.5 md:pb-3 px-3 md:px-4'
            } ${
              activeTab === 'online'
                ? 'border-emerald-500 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Signal className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-400" />
            <span>Người Chơi Online ({otherOnlinePlayers.length})</span>
          </button>

          {/* TAB 2: FRIENDS LIST */}
          <button
            type="button"
            onClick={() => setActiveTab('friends')}
            className={`border-b-2 transition-all cursor-pointer flex items-center gap-1 md:gap-1.5 ${
              isShortLandscape ? 'pb-1 px-2' : 'pb-2.5 md:pb-3 px-3 md:px-4'
            } ${
              activeTab === 'friends'
                ? 'border-sky-500 text-sky-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span>Bạn Bè ({friends.length})</span>
            {onlineFriendsCount > 0 && (
              <span className="text-[9px] text-emerald-400 font-normal">({onlineFriendsCount} on)</span>
            )}
          </button>

          {/* TAB 3: ADD FRIEND */}
          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={`border-b-2 transition-all cursor-pointer flex items-center gap-1 md:gap-1.5 ${
              isShortLandscape ? 'pb-1 px-2' : 'pb-2.5 md:pb-3 px-3 md:px-4'
            } ${
              activeTab === 'add'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span>Thêm Bạn</span>
          </button>

          {/* TAB 4: REQUESTS */}
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`border-b-2 transition-all cursor-pointer flex items-center gap-1 md:gap-1.5 relative ${
              isShortLandscape ? 'pb-1 px-2' : 'pb-2.5 md:pb-3 px-3 md:px-4'
            } ${
              activeTab === 'requests'
                ? 'border-rose-500 text-rose-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span>Lời Mời ({pendingRequests.length})</span>
            {pendingRequests.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* TAB 1: ONLINE PLAYERS (Dữ liệu thực tế) */}
        {activeTab === 'online' && (
          <div
            className={`flex-1 overflow-y-auto space-y-2 md:space-y-3 ${
              isShortLandscape ? 'p-2 min-h-0' : 'p-3 sm:p-4 md:p-5 min-h-[220px]'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Người chơi đang online cùng bạn trên máy chủ:</span>
              </span>
              <span className="text-emerald-400 font-bold">{otherOnlinePlayers.length} người</span>
            </div>

            {otherOnlinePlayers.length === 0 ? (
              <div className={`${isShortLandscape ? 'py-4' : 'py-8'} text-center space-y-2.5`}>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-500 flex items-center justify-center mx-auto">
                  <Signal className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-bold text-slate-300 font-mono">
                    Hiện chỉ có bạn đang trực tuyến trên máy chủ
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-mono max-w-md mx-auto">
                    Mở thêm một tab trình duyệt hoặc chia sẻ mã <strong className="text-amber-300">{myFriendCode}</strong> để người chơi khác cùng kết nối và kết bạn trực tiếp!
                  </p>
                </div>
                <div className="flex justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao Chép Mã Bạn Bè</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('add')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    Nhập mã kết bạn
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 md:space-y-2">
                {otherOnlinePlayers.map((player) => {
                  const playerRank = getRankFromRp(player.rankRp || 850);
                  const isAlreadyFriend = friends.some(
                    (f) =>
                      f.friendCode.toUpperCase() === player.friendCode.toUpperCase() ||
                      f.name.toLowerCase() === player.name.toLowerCase()
                  );
                  const isRequestSent = sentRequests.has(player.friendCode);
                  const isInBattle = player.status === 'IN_BATTLE';

                  return (
                    <div
                      key={player.id || player.friendCode}
                      className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <div
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm border shadow-sm"
                            style={{
                              backgroundColor: `${player.color || '#3b82f6'}25`,
                              borderColor: player.color || '#3b82f6',
                            }}
                          >
                            <span>{playerRank.icon}</span>
                          </div>
                          <span
                            className={`rounded-full absolute -top-0.5 -right-0.5 border-2 border-slate-900 w-2.5 h-2.5 ${
                              isInBattle ? 'bg-amber-400 animate-bounce' : 'bg-emerald-400 animate-pulse'
                            }`}
                            title={isInBattle ? 'Đang tác chiến' : 'Ở sảnh chờ'}
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white font-mono text-xs sm:text-sm">
                              {player.name}
                            </span>
                            <span
                              className="text-[8px] sm:text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border"
                              style={{ color: playerRank.color, borderColor: `${playerRank.color}40` }}
                            >
                              {playerRank.badge} • {player.rankRp || 850} RP
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              [{player.tankClass || 'STRIKER'}]
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                            <span className="text-sky-300 font-bold">{player.friendCode}</span>
                            <span>•</span>
                            <span className={isInBattle ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                              {isInBattle ? 'Đang Trong Trận' : 'Đang Ở Sảnh Chờ'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        {isAlreadyFriend ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-lg flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Đã là bạn bè</span>
                            </span>

                            {isInBattle && player.roomId && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onSpectateFriendRoom) {
                                      onSpectateFriendRoom(player.roomId || 'public', player.currentMode || 'PUBLIC');
                                    } else if (onJoinFriendRoom) {
                                      onJoinFriendRoom(player.roomId || 'public', player.currentMode || 'PUBLIC');
                                    }
                                    sounds.playPowerUp();
                                    onClose();
                                  }}
                                  className="px-2.5 py-1 bg-cyan-700/80 hover:bg-cyan-600 text-cyan-100 font-mono font-black text-[10px] sm:text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-sm border border-cyan-400/50"
                                  title="Xem trận người chơi này đang đấu (Chế độ Khán giả)"
                                >
                                  <Eye className="w-3 h-3 text-cyan-300" />
                                  <span>Xem Trận</span>
                                </button>

                                {onJoinFriendRoom && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onJoinFriendRoom(player.roomId || 'public', player.currentMode || 'PUBLIC');
                                      sounds.playPowerUp();
                                      onClose();
                                    }}
                                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono font-bold text-[10px] sm:text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                                    title="Chơi cùng người này"
                                  >
                                    <Play className="w-3 h-3 fill-current" />
                                    <span>Vào Trận</span>
                                  </button>
                                )}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                const found = friends.find(
                                  (f) => f.friendCode.toUpperCase() === player.friendCode.toUpperCase()
                                );
                                if (found) handleInviteFriend(found, 'CASUAL');
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 font-mono font-bold text-[10px] sm:text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                              title="Mời Đấu Thường"
                            >
                              <Gamepad2 className="w-3 h-3" />
                              <span>Mời</span>
                            </button>
                          </div>
                        ) : isRequestSent ? (
                          <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg">
                            Đã gửi lời mời
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddOnlineFriend(player)}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-bold text-[10px] sm:text-xs rounded-lg flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>+ Kết Bạn</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FRIENDS LIST */}
        {activeTab === 'friends' && (
          <div
            className={`flex-1 overflow-y-auto space-y-2 md:space-y-3 ${
              isShortLandscape ? 'p-2 min-h-0' : 'p-3 sm:p-4 md:p-5 min-h-[220px]'
            }`}
          >
            {/* Search filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bạn theo tên hoặc mã DLAND-XXXX..."
                className={`w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500 rounded-xl pl-8 pr-3 text-white placeholder-slate-500 focus:outline-none transition-colors ${
                  isShortLandscape ? 'py-1 text-[10px]' : 'py-1.5 sm:py-2 text-xs sm:text-sm'
                }`}
              />
            </div>

            {filteredFriends.length === 0 ? (
              <div className={`${isShortLandscape ? 'py-4' : 'py-8'} text-center space-y-2`}>
                <Users className="w-8 h-8 md:w-10 md:h-10 text-slate-600 mx-auto" />
                <p className="text-xs sm:text-sm text-slate-300 font-mono font-bold">
                  {searchQuery ? 'Không tìm thấy bạn bè nào phù hợp.' : 'Danh sách bạn bè đang trống (Dữ liệu thực tế)'}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500 font-mono max-w-sm mx-auto">
                  {searchQuery
                    ? 'Hãy kiểm tra lại từ khóa tìm kiếm.'
                    : 'Hãy chuyển sang tab "Người Chơi Online" để kết bạn 1-chạm với những người đang online, hoặc nhập mã bạn bè!'}
                </p>
                {!searchQuery && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('online')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer shadow-md inline-flex items-center gap-1.5"
                  >
                    <Signal className="w-3 h-3" />
                    <span>Xem Người Chơi Online ({otherOnlinePlayers.length})</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-1.5 md:space-y-2">
                {filteredFriends.map((friend) => {
                  const friendRank = getRankFromRp(friend.rankRp);
                  const isOnline = friend.status === 'ONLINE';
                  const isInBattle = friend.status === 'IN_BATTLE';

                  return (
                    <div
                      key={friend.id}
                      className="bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <div
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm border shadow-sm"
                            style={{ backgroundColor: `${friend.color}25`, borderColor: friend.color }}
                          >
                            <span>{friendRank.icon}</span>
                          </div>
                          <span
                            className={`rounded-full absolute -top-0.5 -right-0.5 border-2 border-slate-900 w-2.5 h-2.5 ${
                              isOnline
                                ? 'bg-emerald-400 animate-pulse'
                                : isInBattle
                                ? 'bg-amber-400 animate-bounce'
                                : 'bg-slate-600'
                            }`}
                            title={isOnline ? 'Trực tuyến' : isInBattle ? 'Đang tác chiến' : 'Ngoại tuyến'}
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white font-mono text-xs sm:text-sm">
                              {friend.name}
                            </span>
                            <span
                              className="text-[8px] sm:text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border"
                              style={{ color: friendRank.color, borderColor: `${friendRank.color}40` }}
                            >
                              {friendRank.badge}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                            <span className="text-slate-500">{friend.friendCode}</span>
                            <span>•</span>
                            <span
                              className={
                                isOnline
                                  ? 'text-emerald-400 font-semibold'
                                  : isInBattle
                                  ? 'text-amber-400 font-semibold'
                                  : 'text-slate-500'
                              }
                            >
                              {friend.lastActive}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        {isInBattle && friend.roomId && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (onSpectateFriendRoom) {
                                  onSpectateFriendRoom(friend.roomId || 'public', friend.currentMode || 'PUBLIC');
                                } else if (onJoinFriendRoom) {
                                  onJoinFriendRoom(friend.roomId || 'public', friend.currentMode || 'PUBLIC');
                                }
                                sounds.playPowerUp();
                                onClose();
                              }}
                              className="bg-cyan-700/80 hover:bg-cyan-600 text-cyan-100 font-bold rounded-lg font-mono px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-sm border border-cyan-400/50"
                              title="Xem trận bạn bè đang đấu (Chế độ Khán giả)"
                            >
                              <Eye className="w-3 h-3 text-cyan-300" />
                              <span>Xem Trận</span>
                            </button>

                            {onJoinFriendRoom && (
                              <button
                                type="button"
                                onClick={() => {
                                  onJoinFriendRoom(friend.roomId || 'public', friend.currentMode || 'PUBLIC');
                                  sounds.playPowerUp();
                                  onClose();
                                }}
                                className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg font-mono px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                                title="Vào trận cùng bạn"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>Vào Trận</span>
                              </button>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleInviteFriend(friend, 'CASUAL')}
                          className="bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg font-bold font-mono px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs flex items-center gap-1 border border-slate-700 cursor-pointer transition-colors"
                          title="Mời Đấu Thường"
                        >
                          <Gamepad2 className="w-3 h-3 text-sky-400" />
                          <span>Mời Đấu Thường</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleInviteFriend(friend, 'RANKED')}
                          className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-lg font-bold font-mono px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs flex items-center gap-1 border border-amber-500/40 cursor-pointer transition-colors"
                          title="Mời Đấu Rank"
                        >
                          <Trophy className="w-3 h-3 text-amber-400" />
                          <span>Đấu Rank</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveFriend(friend.id, friend.name)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Xóa bạn"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ADD FRIEND */}
        {activeTab === 'add' && (
          <div
            className={`flex-1 overflow-y-auto space-y-3 md:space-y-4 ${
              isShortLandscape ? 'p-2 min-h-0' : 'p-3 sm:p-5 min-h-[220px]'
            }`}
          >
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5 uppercase">
                <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>Nhập Tên Hoặc Mã Bạn Bè DLAND-XXXX</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={addInput}
                  onChange={(e) => setAddInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFriendByInput()}
                  placeholder="Ví dụ: DLAND-7701 hoặc tên chỉ huy..."
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-1.5 sm:py-2 text-white placeholder-slate-500 font-mono text-xs sm:text-sm focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddFriendByInput}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-black rounded-xl px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition-all cursor-pointer active:scale-95 shadow-md shrink-0"
                >
                  Kết Bạn
                </button>
              </div>
            </div>

            {/* Quick Online Player Suggestions */}
            {otherOnlinePlayers.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="text-xs font-mono font-bold text-emerald-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Signal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Gợi ý người chơi đang online ({otherOnlinePlayers.length}):</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {otherOnlinePlayers.slice(0, 4).map((p) => {
                    const isFriend = friends.some(
                      (f) => f.friendCode.toUpperCase() === p.friendCode.toUpperCase()
                    );
                    return (
                      <div
                        key={p.friendCode}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex items-center justify-between gap-2"
                      >
                        <div className="truncate">
                          <div className="font-bold text-white font-mono text-xs truncate">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.friendCode}</div>
                        </div>
                        {isFriend ? (
                          <span className="text-[10px] text-emerald-400 font-mono font-bold">Đã là bạn</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddOnlineFriend(p)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-mono font-bold shrink-0 cursor-pointer"
                          >
                            + Kết Bạn
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Share Link Section */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5 text-sky-400" />
                  <span>Mã bạn bè của bạn</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-[11px] font-mono text-sky-400 hover:text-sky-300 cursor-pointer font-bold"
                >
                  Sao Chép Mã
                </button>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Chia sẻ mã <strong className="text-amber-300 font-bold">{myFriendCode}</strong> cho bạn bè để kết nối cùng tổ đội!
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: PENDING REQUESTS */}
        {activeTab === 'requests' && (
          <div
            className={`flex-1 overflow-y-auto space-y-2 ${
              isShortLandscape ? 'p-2 min-h-0' : 'p-3 sm:p-5 min-h-[220px]'
            }`}
          >
            {pendingRequests.length === 0 ? (
              <div className={`${isShortLandscape ? 'py-4' : 'py-8'} text-center space-y-2`}>
                <UserCheck className="w-8 h-8 md:w-10 md:h-10 text-slate-600 mx-auto" />
                <p className="text-xs sm:text-sm text-slate-300 font-mono font-bold">
                  Không có lời mời kết bạn nào đang chờ.
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500 font-mono">
                  Khi người chơi khác gửi lời mời kết bạn, thông báo sẽ hiển thị tại đây.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 md:space-y-2">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id || req.friendCode}
                    className="p-2.5 sm:p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-white text-xs sm:text-sm font-mono">{req.name}</div>
                      <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono mt-0.5">
                        {req.friendCode} • {req.rankRp || 850} RP • [{req.tankClass || 'STRIKER'}]
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAcceptRequest(req)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer shadow-sm"
                      >
                        Đồng Ý
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeclineRequest(req.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-mono transition-colors cursor-pointer"
                      >
                        Từ Chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TOAST FEEDBACK ALERT */}
        {toastMsg && (
          <div className="px-3 py-1.5 bg-amber-500/20 border-t border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center justify-between animate-in slide-in-from-bottom duration-150">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{toastMsg}</span>
            </span>
            <button onClick={() => setToastMsg(null)} className="text-amber-400 hover:text-white cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
