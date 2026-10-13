import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  UserCheck,
  Copy,
  Check,
  X,
  Swords,
  Radio,
  Search,
  Trash2,
  Trophy,
  Shield,
  Zap,
  Play,
  Share2,
  Sparkles,
  Gamepad2,
} from 'lucide-react';
import { FriendUser, DEFAULT_SAMPLE_FRIENDS, RankTier, RANK_TIERS, getRankFromRp, TankClass, GameMode } from '../types/game';
import { sounds } from '../utils/audio';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  myPlayerName: string;
  myPlayerColor: string;
  myTankClass: TankClass;
  myRankRp: number;
  onJoinFriendRoom?: (roomId: string, mode: GameMode) => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  myPlayerName,
  myPlayerColor,
  myTankClass,
  myRankRp,
  onJoinFriendRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'add' | 'requests'>('friends');
  const [isShortLandscape, setIsShortLandscape] = useState(
    () => typeof window !== 'undefined' && (window.innerHeight <= 620 || (window.innerWidth < 768 && window.innerHeight > window.innerWidth))
  );

  useEffect(() => {
    const handleResize = () => {
      setIsShortLandscape(window.innerHeight <= 620 || (window.innerWidth < 768 && window.innerHeight > window.innerWidth));
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);
  const [friends, setFriends] = useState<FriendUser[]>(() => {
    try {
      const saved = localStorage.getItem('tank_friends_list');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return DEFAULT_SAMPLE_FRIENDS;
  });

  const [myFriendCode] = useState(() => {
    let code = localStorage.getItem('tank_my_friend_code');
    if (!code) {
      code = `DLAND-${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem('tank_my_friend_code', code);
    }
    return code;
  });

  const [copiedCode, setCopiedCode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addInput, setAddInput] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setAddInput('');
      setCopiedCode(false);
      setToastMsg(null);
    }
  }, [isOpen]);

  // Incoming pending requests state
  const [pendingRequests, setPendingRequests] = useState<
    Array<{ id: string; name: string; friendCode: string; rankRp: number; tankClass: TankClass }>
  >([
    {
      id: 'req_1',
      name: 'Chiến Binh Sấm Sét',
      friendCode: 'DLAND-3391',
      rankRp: 1150,
      tankClass: 'STRIKER',
    },
  ]);

  // Persist friends to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tank_friends_list', JSON.stringify(friends));
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

  const handleAddFriend = () => {
    const trimmed = addInput.trim();
    if (!trimmed) return;

    if (trimmed.toUpperCase() === myFriendCode.toUpperCase()) {
      showToast('Không thể kết bạn với chính mình!');
      return;
    }

    const existing = friends.find(
      (f) => f.friendCode.toUpperCase() === trimmed.toUpperCase() || f.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      showToast(`${existing.name} đã có trong danh sách bạn bè!`);
      return;
    }

    const newFriend: FriendUser = {
      id: `f_${Date.now()}`,
      friendCode: trimmed.startsWith('DLAND-') ? trimmed.toUpperCase() : `DLAND-${Math.floor(1000 + Math.random() * 9000)}`,
      name: trimmed.startsWith('DLAND-') ? `Chiến Binh ${trimmed.slice(-4)}` : trimmed,
      color: '#3b82f6',
      tankClass: 'STRIKER',
      rankTier: 'GOLD',
      rankRp: 850,
      status: 'ONLINE',
      currentMode: 'PUBLIC',
      roomId: 'public',
      lastActive: 'Vừa kết bạn',
    };

    setFriends((prev) => [newFriend, ...prev]);
    setAddInput('');
    sounds.playPowerUp();
    showToast(`Đã kết bạn thành công với ${newFriend.name}!`);
    setActiveTab('friends');
  };

  const handleAcceptRequest = (reqId: string) => {
    const req = pendingRequests.find((r) => r.id === reqId);
    if (!req) return;

    const newFriend: FriendUser = {
      id: `f_${Date.now()}`,
      friendCode: req.friendCode,
      name: req.name,
      color: '#10b981',
      tankClass: req.tankClass,
      rankTier: 'GOLD',
      rankRp: req.rankRp,
      status: 'ONLINE',
      currentMode: 'PUBLIC',
      roomId: 'public',
      lastActive: 'Vừa chấp nhận lời mời',
    };

    setFriends((prev) => [newFriend, ...prev]);
    setPendingRequests((prev) => prev.filter((r) => r.id !== reqId));
    sounds.playPowerUp();
    showToast(`Đã đồng ý kết bạn với ${req.name}!`);
  };

  const handleDeclineRequest = (reqId: string) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== reqId));
    sounds.playRadioBeep();
  };

  const handleRemoveFriend = (friendId: string, name: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
    sounds.playRadioBeep();
    showToast(`Đã xóa ${name} khỏi danh sách bạn bè.`);
  };

  const handleInviteFriend = (friend: FriendUser, inviteType: 'CASUAL' | 'RANKED' = 'CASUAL') => {
    sounds.playRadioBeep();
    const typeLabel = inviteType === 'RANKED' ? 'ĐẤU RANK 🏆' : 'ĐẤU THƯỜNG 🎮';
    showToast(`Đã gửi lời mời tham gia ${typeLabel} tới ${friend.name}!`);
  };

  const myRank = getRankFromRp(myRankRp);

  const filteredFriends = friends.filter((f) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return f.name.toLowerCase().includes(q) || f.friendCode.toLowerCase().includes(q);
  });

  const onlineFriends = friends.filter((f) => f.status === 'ONLINE' || f.status === 'IN_BATTLE');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-1.5 sm:p-4 overflow-y-auto animate-in fade-in duration-200 select-none">
      <div className={`bg-slate-900 border border-slate-700/80 rounded-xl sm:rounded-2xl md:rounded-3xl max-w-2xl md:max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col my-auto ${
        isShortLandscape ? 'max-h-[94dvh] h-[92vh]' : 'max-h-[88vh]'
      }`}>
        {/* HEADER */}
        <div className={`shrink-0 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between ${
          isShortLandscape ? 'px-3 py-1.5' : 'px-4 sm:px-6 py-3.5 md:py-4'
        }`}>
          <div className="flex items-center gap-2 md:gap-3">
            <div className={`${isShortLandscape ? 'w-7 h-7' : 'w-9 h-9 md:w-11 md:h-11'} rounded-xl md:rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0`}>
              <Users className={isShortLandscape ? 'w-4 h-4' : 'w-5 h-5 md:w-6 md:h-6'} />
            </div>
            <div>
              <h2 className={`font-black text-white font-mono flex items-center gap-1.5 md:gap-2 ${isShortLandscape ? 'text-xs' : 'text-base sm:text-lg md:text-xl'}`}>
                <span>HỆ THỐNG BẠN BÈ & TÁC CHIẾN</span>
                <span className="text-[9px] sm:text-[10px] md:text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-mono">
                  {onlineFriends.length}/{friends.length} ONLINE
                </span>
              </h2>
              {!isShortLandscape && <p className="text-[11px] md:text-xs text-slate-400">Kết nối đồng đội, mời vào trận đấu thường & leo rank</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className={`${isShortLandscape ? 'w-6 h-6' : 'w-8 h-8 md:w-9 md:h-9'} rounded-lg md:rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors`}
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* MY FRIEND CODE PROFILE BANNER */}
        <div className={`bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950/40 border-b border-slate-800/80 flex items-center justify-between gap-2 ${
          isShortLandscape ? 'p-1.5 px-3' : 'p-3 sm:p-4 md:p-4.5'
        }`}>
          <div className="flex items-center gap-2.5 md:gap-3.5">
            <div
              className={`rounded-xl flex items-center justify-center font-bold border shadow-lg ${
                isShortLandscape ? 'w-7 h-7 text-sm' : 'w-10 h-10 md:w-12 md:h-12 text-lg md:text-xl rounded-2xl'
              }`}
              style={{ backgroundColor: `${myPlayerColor}25`, borderColor: myPlayerColor }}
            >
              <span>{myRank.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <span className={`font-bold text-white font-mono ${isShortLandscape ? 'text-xs' : 'text-sm md:text-base'}`}>{myPlayerName}</span>
                <span
                  className="text-[8px] sm:text-[9.5px] md:text-xs font-mono font-bold px-1.5 py-0.2 rounded border"
                  style={{ color: myRank.color, borderColor: `${myRank.color}50` }}
                >
                  {myRank.badge} • {myRank.rp} RP
                </span>
              </div>
              <div className="text-[9.5px] sm:text-[11px] md:text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                <span>Mã:</span>
                <strong className="text-sky-300 font-black tracking-wider">{myFriendCode}</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className={`flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-bold transition-all cursor-pointer active:scale-95 shrink-0 shadow-md ${
              isShortLandscape ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-xl'
            }`}
          >
            {copiedCode ? <Check className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" /> : <Copy className="w-3 h-3 md:w-4 md:h-4 text-sky-400" />}
            <span>{copiedCode ? 'Đã Sao Chép' : 'Sao Chép Mã'}</span>
          </button>
        </div>

        {/* TAB CONTROLS */}
        <div className={`flex border-b border-slate-800 bg-slate-950/50 gap-2 font-mono font-bold ${
          isShortLandscape ? 'px-3 pt-1 text-[10px]' : 'px-3 sm:px-6 pt-2 md:pt-3 text-xs md:text-sm'
        }`}>
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
            <Users className="w-3 h-3 md:w-4 md:h-4" />
            <span>Bạn Bè ({friends.length})</span>
          </button>

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
            <UserPlus className="w-3 h-3 md:w-4 md:h-4" />
            <span>Thêm Bạn</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`border-b-2 transition-all cursor-pointer flex items-center gap-1 md:gap-1.5 relative ${
              isShortLandscape ? 'pb-1 px-2' : 'pb-2.5 md:pb-3 px-3 md:px-4'
            } ${
              activeTab === 'requests'
                ? 'border-emerald-500 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3 h-3 md:w-4 md:h-4" />
            <span>Lời Mời ({pendingRequests.length})</span>
            {pendingRequests.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* TAB 1: FRIENDS LIST */}
        {activeTab === 'friends' && (
          <div className={`flex-1 overflow-y-auto space-y-2 md:space-y-3 ${
            isShortLandscape ? 'p-2 min-h-0' : 'p-4 sm:p-5 md:p-6 min-h-[220px]'
          }`}>
            {/* Search filter */}
            <div className="relative">
              <Search className="w-4 h-4 md:w-5 md:h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bạn theo tên hoặc mã DLAND-XXXX..."
                className={`w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500 rounded-xl pl-9 md:pl-10 pr-3 text-white placeholder-slate-500 focus:outline-none transition-colors ${
                  isShortLandscape ? 'py-1 text-[10px]' : 'py-2 md:py-2.5 text-xs md:text-sm'
                }`}
              />
            </div>

            {filteredFriends.length === 0 ? (
              <div className={`${isShortLandscape ? 'py-4' : 'py-10'} text-center space-y-2`}>
                <Users className="w-8 h-8 md:w-12 md:h-12 text-slate-600 mx-auto" />
                <p className="text-xs md:text-sm text-slate-400 font-mono">Chưa tìm thấy bạn bè nào.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('add')}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs md:text-sm font-bold font-mono transition-colors"
                >
                  Thêm bạn ngay
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 md:space-y-2.5">
                {filteredFriends.map((friend) => {
                  const friendRank = getRankFromRp(friend.rankRp);
                  const isOnline = friend.status === 'ONLINE';
                  const isInBattle = friend.status === 'IN_BATTLE';

                  return (
                    <div
                      key={friend.id}
                      className={`bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 rounded-xl md:rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between transition-colors ${
                        isShortLandscape ? 'p-1.5 px-2 gap-1.5' : 'p-3 md:p-3.5 gap-3'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 md:gap-3.5">
                        {/* Status dot + Avatar */}
                        <div className="relative">
                          <div
                            className={`rounded-xl flex items-center justify-center font-bold shadow-md border ${
                              isShortLandscape ? 'w-7 h-7 text-xs' : 'w-9 h-9 md:w-11 md:h-11 text-base md:text-lg'
                            }`}
                            style={{ backgroundColor: `${friend.color}25`, borderColor: friend.color }}
                          >
                            <span>{friendRank.icon}</span>
                          </div>
                          <span
                            className={`rounded-full absolute -top-0.5 -right-0.5 border-2 border-slate-900 ${
                              isShortLandscape ? 'w-2 h-2' : 'w-2.5 h-2.5 md:w-3 md:h-3'
                            } ${
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
                          <div className="flex items-center gap-1.5 md:gap-2">
                            <span className={`font-bold text-white font-mono ${isShortLandscape ? 'text-[11px]' : 'text-xs sm:text-sm md:text-base'}`}>{friend.name}</span>
                            <span
                              className="text-[8px] sm:text-[9px] md:text-xs font-mono font-bold px-1.5 py-0.2 rounded border"
                              style={{ color: friendRank.color, borderColor: `${friendRank.color}40` }}
                            >
                              {friendRank.badge}
                            </span>
                          </div>

                          <div className={`text-slate-400 font-mono flex items-center gap-2 mt-0.5 ${isShortLandscape ? 'text-[9px]' : 'text-[10px] md:text-xs'}`}>
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
                        {isInBattle && friend.roomId && onJoinFriendRoom && (
                          <button
                            type="button"
                            onClick={() => {
                              onJoinFriendRoom(friend.roomId || 'public', friend.currentMode || 'PUBLIC');
                              sounds.playPowerUp();
                              onClose();
                            }}
                            className={`bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-bold rounded-lg font-mono transition-all cursor-pointer flex items-center gap-1 shadow-md ${
                              isShortLandscape ? 'px-2 py-1 text-[9px]' : 'px-2.5 md:px-3 py-1.5 md:py-2 text-xs md:text-sm'
                            }`}
                            title="Vào trận cùng bạn"
                          >
                            <Play className="w-3 h-3 md:w-3.5 md:h-3.5 fill-current" />
                            <span>Vào Trận</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleInviteFriend(friend, 'CASUAL')}
                          className={`bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white rounded-lg font-bold font-mono transition-all cursor-pointer flex items-center gap-1 border border-slate-700 shadow-sm ${
                            isShortLandscape ? 'px-1.5 py-1 text-[9px]' : 'px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm'
                          }`}
                          title="Mời bạn vào trận Đấu Thường (giải trí, không trừ RP)"
                        >
                          <Gamepad2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-sky-400" />
                          <span>Đấu Thường</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleInviteFriend(friend, 'RANKED')}
                          className={`bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-white rounded-lg font-bold font-mono transition-all cursor-pointer flex items-center gap-1 border border-amber-500/40 shadow-sm ${
                            isShortLandscape ? 'px-1.5 py-1 text-[9px]' : 'px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm'
                          }`}
                          title="Mời bạn cùng leo Rank xếp hạng (tính điểm RP)"
                        >
                          <Trophy className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-400" />
                          <span>Đấu Rank</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveFriend(friend.id, friend.name)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Xóa bạn"
                        >
                          <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ADD FRIEND */}
        {activeTab === 'add' && (
          <div className={`flex-1 overflow-y-auto ${
            isShortLandscape ? 'p-2 space-y-2.5 min-h-0' : 'p-4 sm:p-6 md:p-7 space-y-5 min-h-[220px]'
          }`}>
            <div className="space-y-2">
              <label className="text-xs md:text-sm font-mono font-bold text-slate-300 flex items-center gap-1.5 uppercase">
                <UserPlus className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400" />
                <span>Nhập Tên Hoặc Mã Bạn Bè</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={addInput}
                  onChange={(e) => setAddInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
                  placeholder="Ví dụ: DLAND-7701 hoặc tên chỉ huy..."
                  className={`flex-1 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 text-white placeholder-slate-500 font-mono focus:outline-none transition-colors ${
                    isShortLandscape ? 'py-1.5 text-[10px]' : 'py-2 md:py-2.5 text-xs md:text-sm'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddFriend}
                  className={`bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-mono font-black rounded-xl transition-all cursor-pointer active:scale-95 shadow-lg shadow-amber-500/20 shrink-0 ${
                    isShortLandscape ? 'px-3 py-1.5 text-[10px]' : 'px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-sm'
                  }`}
                >
                  Kết Bạn
                </button>
              </div>
            </div>

            {/* Quick Share Link Section */}
            <div className="p-3 md:p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5 md:space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 md:w-5 md:h-5 text-sky-400" />
                  <span className="text-xs md:text-sm font-bold text-white font-mono">Liên Kết Mời Bạn Bè Trực Tiếp</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-[11px] md:text-xs font-mono text-sky-400 hover:text-sky-300 cursor-pointer font-bold"
                >
                  Sao Chép Link
                </button>
              </div>
              <p className="text-[11px] md:text-xs text-slate-400">
                Gửi mã <strong className="text-amber-300 font-mono">{myFriendCode}</strong> cho bạn bè để cùng tham gia tổ đội tác chiến xe tăng!
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: PENDING REQUESTS */}
        {activeTab === 'requests' && (
          <div className={`flex-1 overflow-y-auto ${
            isShortLandscape ? 'p-2 space-y-2 min-h-0' : 'p-4 sm:p-5 md:p-6 space-y-3 min-h-[220px]'
          }`}>
            {pendingRequests.length === 0 ? (
              <div className={`${isShortLandscape ? 'py-4' : 'py-10'} text-center space-y-2`}>
                <UserCheck className="w-8 h-8 md:w-12 md:h-12 text-slate-600 mx-auto" />
                <p className="text-xs md:text-sm text-slate-400 font-mono">Không có lời mời kết bạn nào đang chờ.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white text-xs sm:text-sm md:text-base font-mono">{req.name}</div>
                      <div className="text-[11px] md:text-xs text-slate-400 font-mono mt-0.5">{req.friendCode} • {req.rankRp} RP</div>
                    </div>

                    <div className="flex items-center gap-1.5 md:gap-2">
                      <button
                        type="button"
                        onClick={() => handleAcceptRequest(req.id)}
                        className="px-3 md:px-4 py-1.5 md:py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs md:text-sm font-bold font-mono transition-colors cursor-pointer"
                      >
                        Đồng Ý
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeclineRequest(req.id)}
                        className="px-2.5 md:px-3.5 py-1.5 md:py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs md:text-sm font-mono transition-colors cursor-pointer"
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
          <div className="px-4 py-2 bg-amber-500/20 border-t border-amber-500/40 text-amber-300 text-xs md:text-sm font-mono font-bold flex items-center justify-between animate-in slide-in-from-bottom duration-150">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>{toastMsg}</span>
            </span>
            <button onClick={() => setToastMsg(null)} className="text-amber-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
