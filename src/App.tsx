/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PlayerTank,
  Bullet,
  BulletModifier,
  Obstacle,
  PowerUpCrate,
  CombatEvent,
  ChatMessage,
  LeaderboardEntry,
  TankClass,
  ClientMessage,
  ServerMessage,
  GameMode,
  PublicPlayerInfo,
  TANK_CLASSES,
} from './types/game';
import { GameCanvas } from './components/GameCanvas';
import { RadarMinimap } from './components/RadarMinimap';
import { Scoreboard } from './components/Scoreboard';
import { KillFeed } from './components/KillFeed';
import { KillBanner } from './components/KillBanner';
import { ChatBox } from './components/ChatBox';
import { LobbyModal } from './components/LobbyModal';
import { RespawnOverlay } from './components/RespawnOverlay';
import { VirtualJoystick } from './components/VirtualJoystick';
import { sounds } from './utils/audio';
import {
  Volume2,
  VolumeX,
  Shield,
  Zap,
  Users,
  Bot,
  Globe,
  HelpCircle,
  X,
  Map as MapIcon,
  Trophy,
  Activity,
  ChevronUp,
  ChevronDown,
  Bell,
  Minus,
  Plus,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

export default function App() {
  const [isInGame, setIsInGame] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [worldSize, setWorldSize] = useState({ width: 4200, height: 4200 });
  const [is25DMode, setIs25DMode] = useState(true);
  const [zoomScale, setZoomScale] = useState(0.75); // 75% default ratio like Chrome
  const [gameMode, setGameMode] = useState<GameMode>('PUBLIC');
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [lobbyInfo, setLobbyInfo] = useState<{
    totalSockets: number;
    publicOnlineCount: number;
    publicPlayers: PublicPlayerInfo[];
  }>({
    totalSockets: 0,
    publicOnlineCount: 0,
    publicPlayers: [],
  });
  const [recentCombatEvent, setRecentCombatEvent] = useState<CombatEvent | null>(null);

  // Show/Hide UI Toggles
  const [showTopBar, setShowTopBar] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [showKillfeed, setShowKillfeed] = useState(true);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const [tanks, setTanks] = useState<PlayerTank[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUpCrate[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [events, setEvents] = useState<CombatEvent[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [ping, setPing] = useState(18);

  const [isScoreboardOpen, setIsScoreboardOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isControlsModalOpen, setIsControlsModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getIsMuted());
  const [botCount, setBotCount] = useState(7);

  const socketRef = useRef<WebSocket | null>(null);
  const isInGameRef = useRef(false);
  const inputStateRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    turretAngle: 0,
    isFiring: false,
  });

  // Track player profile for joining/reconnecting
  const profileRef = useRef<{
    name: string;
    color: string;
    tankClass: TankClass;
    mode: GameMode;
    botCount: number;
    roomId?: string;
  }>({
    name: 'Chỉ Huy',
    color: '#2563eb',
    tankClass: 'STRIKER',
    mode: 'PUBLIC',
    botCount: 5,
    roomId: 'public',
  });

  // Keep isInGameRef synchronized
  useEffect(() => {
    isInGameRef.current = isInGame;
  }, [isInGame]);

  // Immediate send input function
  const sendInput = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const inputMsg: ClientMessage = {
        type: 'INPUT',
        ...inputStateRef.current,
      };
      socketRef.current.send(JSON.stringify(inputMsg));
    }
  }, []);

  // Persistent WebSocket Connection (runs once on mount)
  useEffect(() => {
    let ws: WebSocket;
    let pingInterval: NodeJS.Timeout;
    let isUnmounted = false;

    const connect = () => {
      if (isUnmounted) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsSocketConnected(true);
        // If already in game, auto-rejoin immediately
        if (isInGameRef.current) {
          const joinMsg: ClientMessage = {
            type: 'JOIN',
            ...profileRef.current,
          };
          ws.send(JSON.stringify(joinMsg));
        }

        // Setup ping interval
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            const pingMsg: ClientMessage = {
              type: 'PING',
              timestamp: Date.now(),
            };
            ws.send(JSON.stringify(pingMsg));
          }
        }, 3000);
      };

      ws.onmessage = (e) => {
        try {
          const msg: ServerMessage = JSON.parse(e.data);
          switch (msg.type) {
            case 'LOBBY_STATE': {
              setLobbyInfo({
                totalSockets: msg.totalSockets,
                publicOnlineCount: msg.publicOnlineCount,
                publicPlayers: msg.publicPlayers || [],
              });
              break;
            }

            case 'INIT': {
              setMyPlayerId(msg.playerId);
              setWorldSize(msg.world);
              setObstacles(msg.obstacles);
              setTanks(msg.snapshot.tanks);
              setBullets(msg.snapshot.bullets);
              setPowerUps(msg.snapshot.powerUps);
              setLeaderboard(msg.snapshot.leaderboard);

              // De-duplicate initial events by id
              const seenEvts = new Set<string>();
              const uniqueEvents = (msg.recentEvents || []).filter((e) => {
                if (!e || seenEvts.has(e.id)) return false;
                seenEvts.add(e.id);
                return true;
              });
              setEvents(uniqueEvents);
              setChatMessages(msg.chatHistory || []);
              break;
            }

            case 'TICK': {
              setTanks(msg.snapshot.tanks);
              setBullets(msg.snapshot.bullets);
              setPowerUps(msg.snapshot.powerUps);
              setObstacles(msg.snapshot.obstacles);
              setLeaderboard(msg.snapshot.leaderboard);
              break;
            }

            case 'EVENT': {
              if (!msg.event || !msg.event.id) break;
              setEvents((prev) => {
                if (prev.some((e) => e && e.id === msg.event.id)) {
                  return prev;
                }
                const updated = [...prev, msg.event];
                const seen = new Set<string>();
                const deduped: CombatEvent[] = [];
                for (let i = updated.length - 1; i >= 0; i--) {
                  const ev = updated[i];
                  if (ev && ev.id && !seen.has(ev.id)) {
                    seen.add(ev.id);
                    deduped.unshift(ev);
                  }
                }
                return deduped.slice(-20);
              });
              if (msg.event.type === 'kill') {
                setRecentCombatEvent(msg.event);
              }
              break;
            }

            case 'CHAT': {
              if (!msg.message || !msg.message.id) break;
              setChatMessages((prev) => {
                if (prev.some((m) => m && m.id === msg.message.id)) {
                  return prev;
                }
                return [...prev.slice(-30), msg.message];
              });
              break;
            }

            case 'PONG': {
              const rtt = Date.now() - msg.clientTimestamp;
              setPing(rtt);
              break;
            }
          }
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      ws.onclose = () => {
        setIsSocketConnected(false);
        clearInterval(pingInterval);
        if (!isUnmounted) {
          setTimeout(connect, 1500);
        }
      };

      ws.onerror = (err) => {
        console.warn('WebSocket encountered error:', err);
      };
    };

    connect();

    return () => {
      isUnmounted = true;
      clearInterval(pingInterval);
      if (ws) ws.close();
    };
  }, []);

  // Interval sync for held inputs at 30Hz
  useEffect(() => {
    if (!isInGame) return;

    const interval = setInterval(() => {
      sendInput();
    }, 33);

    return () => clearInterval(interval);
  }, [isInGame, sendInput]);

  // Handle Keyboard Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in chat, do not intercept WASD
      if (isChatOpen) {
        if (e.key === 'Escape') {
          setIsChatOpen(false);
        }
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        setIsChatOpen(true);
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        setIsScoreboardOpen((prev) => !prev);
        return;
      }

      // Hotkey U: Toggle Top Status Bar
      if (e.key.toLowerCase() === 'u') {
        e.preventDefault();
        setShowTopBar((prev) => !prev);
        return;
      }

      // Hotkey K: Toggle Combat Notifications / Killfeed Status
      if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowKillfeed((prev) => !prev);
        return;
      }

      // Hotkey M: Toggle Minimap
      if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setShowMinimap((prev) => !prev);
        return;
      }

      // Hotkey L: Toggle Leaderboard
      if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setShowLeaderboard((prev) => !prev);
        return;
      }

      // Hotkey H: Toggle Tank Status Bar
      if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setShowStats((prev) => !prev);
        return;
      }

      // Zoom Scale Shortcuts like Chrome: - (zoom out), + / = (zoom in), 0 (reset 75%)
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoomScale((prev) => Math.max(0.5, Math.round((prev - 0.1) * 100) / 100));
        return;
      }
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        setZoomScale((prev) => Math.min(1.25, Math.round((prev + 0.1) * 100) / 100));
        return;
      }
      if (e.key === '0') {
        e.preventDefault();
        setZoomScale(0.75);
        return;
      }

      let changed = false;
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') {
        if (!inputStateRef.current.up) {
          inputStateRef.current.up = true;
          changed = true;
        }
      }
      if (k === 's' || k === 'arrowdown') {
        if (!inputStateRef.current.down) {
          inputStateRef.current.down = true;
          changed = true;
        }
      }
      if (k === 'a' || k === 'arrowleft') {
        if (!inputStateRef.current.left) {
          inputStateRef.current.left = true;
          changed = true;
        }
      }
      if (k === 'd' || k === 'arrowright') {
        if (!inputStateRef.current.right) {
          inputStateRef.current.right = true;
          changed = true;
        }
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (!inputStateRef.current.isFiring) {
          inputStateRef.current.isFiring = true;
          changed = true;
        }
      }

      if (changed) {
        sendInput();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isChatOpen) return;

      let changed = false;
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') {
        if (inputStateRef.current.up) {
          inputStateRef.current.up = false;
          changed = true;
        }
      }
      if (k === 's' || k === 'arrowdown') {
        if (inputStateRef.current.down) {
          inputStateRef.current.down = false;
          changed = true;
        }
      }
      if (k === 'a' || k === 'arrowleft') {
        if (inputStateRef.current.left) {
          inputStateRef.current.left = false;
          changed = true;
        }
      }
      if (k === 'd' || k === 'arrowright') {
        if (inputStateRef.current.right) {
          inputStateRef.current.right = false;
          changed = true;
        }
      }
      if (e.code === 'Space') {
        if (inputStateRef.current.isFiring) {
          inputStateRef.current.isFiring = false;
          changed = true;
        }
      }

      if (changed) {
        sendInput();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isChatOpen, sendInput]);

  // Handle Mouse Movement and Firing
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const angle = Math.atan2(mouseY - centerY, mouseX - centerX);
    inputStateRef.current.turretAngle = angle;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      inputStateRef.current.isFiring = true;
      sendInput();
    }
  }, [sendInput]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      inputStateRef.current.isFiring = false;
      sendInput();
    }
  }, [sendInput]);

  // Actions
  const handleJoinGame = (
    name: string,
    color: string,
    tankClass: TankClass,
    mode: GameMode,
    selectedBots: number,
    customRoomId?: string
  ) => {
    setGameMode(mode);
    setBotCount(selectedBots);
    profileRef.current = {
      name,
      color,
      tankClass,
      mode,
      botCount: selectedBots,
      roomId: customRoomId || 'public',
    };

    const transmitJoin = () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        const joinMsg: ClientMessage = {
          type: 'JOIN',
          name,
          color,
          tankClass,
          mode,
          roomId: customRoomId || 'public',
          botCount: selectedBots,
        };
        socketRef.current.send(JSON.stringify(joinMsg));
      }
    };

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      transmitJoin();
    } else {
      const waitInterval = setInterval(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          clearInterval(waitInterval);
          transmitJoin();
        }
      }, 100);
      setTimeout(() => clearInterval(waitInterval), 4000);
    }
    setIsInGame(true);
  };

  const handleRespawn = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const respawnMsg: ClientMessage = { type: 'RESPAWN' };
      socketRef.current.send(JSON.stringify(respawnMsg));
    }
  };

  const handleSendMessage = (text: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const chatMsg: ClientMessage = {
        type: 'CHAT',
        text,
      };
      socketRef.current.send(JSON.stringify(chatMsg));
    }
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleSetBots = (count: number) => {
    setBotCount(count);
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const botMsg: ClientMessage = {
        type: 'TOGGLE_BOTS',
        count,
      };
      socketRef.current.send(JSON.stringify(botMsg));
    }
  };

  // Find my current tank
  const myTank = tanks.find((t) => t.id === myPlayerId);

  const getAmmoInfo = (type?: BulletModifier) => {
    switch (type) {
      case 'EXPLOSIVE':
        return { name: 'Đại Bác Nổ', icon: '💥', color: '#ef4444' };
      case 'TRIPLE':
        return { name: 'Chùm 3 Tia', icon: '🔱', color: '#fbbf24' };
      case 'PLASMA':
        return { name: 'Laze Siêu Tốc', icon: '⚡', color: '#00f0ff' };
      case 'CRYO':
        return { name: 'Băng Làm Chậm', icon: '❄️', color: '#38bdf8' };
      case 'INCENDIARY':
        return { name: 'Lửa Thiêu Đốt', icon: '🔥', color: '#f97316' };
      case 'RICOCHET':
        return { name: 'Bật Nảy Tường', icon: '🪃', color: '#c084fc' };
      case 'PIERCING':
        return { name: 'Xuyên Giáp', icon: '🎯', color: '#10b981' };
      default:
        return { name: 'Tiêu Chuẩn', icon: '•', color: '#94a3b8' };
    }
  };

  const getSectorName = (x: number, y: number) => {
    if (x >= 1600 && x <= 2600 && y >= 1600 && y <= 2600) return 'Pháo Đài Trung Tâm';
    if (x < 2100 && y < 2100) return 'Bãi Container Tây Bắc';
    if (x >= 2100 && y < 2100) return 'Đầm Lầy Đông Bắc';
    if (x < 2100 && y >= 2100) return 'Tàn Tích Tây Nam';
    return 'Khu Thử Nghiệm Đông Nam';
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none flex flex-col">
      {/* 1. Universal Top Bar (DLAND TANK) */}
      {showTopBar && (
        <header className="h-14 bg-slate-900/95 border-b border-slate-800/80 px-3 sm:px-5 flex items-center justify-between z-30 shrink-0 select-none backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Left: 1. Tiêu đề DLAND TANK & 2. Số người chơi */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <span className="text-base sm:text-lg font-black tracking-tight text-white font-mono flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              DLAND TANK
            </span>

            {/* Số người chơi */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/70 text-xs font-semibold text-slate-200 shadow-sm"
              title="Số người chơi đang trực tuyến"
            >
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>
                {gameMode === 'PUBLIC'
                  ? `${Math.max(tanks.filter((t) => !t.isBot).length, lobbyInfo.publicOnlineCount, isInGame ? 1 : 0)} Người Chơi`
                  : `${tanks.length || (isInGame ? 1 : 0)} Người Chơi`}
              </span>
            </div>
          </div>

          {/* Center: 3. Đổi kích thước & 4. Ping */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Đổi kích thước */}
            <div
              className="flex items-center bg-slate-800/90 rounded-lg px-1.5 py-0.5 border border-slate-700/80 text-xs shadow-sm"
              title="Đổi kích thước / Tỉ lệ hiển thị (Mặc định 75% như Chrome)"
            >
              <button
                onClick={() => setZoomScale((prev) => Math.max(0.5, Math.round((prev - 0.1) * 100) / 100))}
                className="p-1 hover:text-white text-slate-400 rounded cursor-pointer transition-colors"
                title="Thu nhỏ (-)"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <select
                value={zoomScale}
                onChange={(e) => setZoomScale(Number(e.target.value))}
                className="bg-transparent text-sky-300 font-mono text-xs font-bold px-1 cursor-pointer focus:outline-none text-center"
              >
                <option value={0.5} className="bg-slate-900 text-slate-200">50%</option>
                <option value={0.67} className="bg-slate-900 text-slate-200">67%</option>
                <option value={0.75} className="bg-slate-900 text-slate-200">75% (Chuẩn)</option>
                <option value={0.9} className="bg-slate-900 text-slate-200">90%</option>
                <option value={1.0} className="bg-slate-900 text-slate-200">100%</option>
                <option value={1.25} className="bg-slate-900 text-slate-200">125%</option>
              </select>
              <button
                onClick={() => setZoomScale((prev) => Math.min(1.25, Math.round((prev + 0.1) * 100) / 100))}
                className="p-1 hover:text-white text-slate-400 rounded cursor-pointer transition-colors"
                title="Phóng to (+)"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Ping */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/70 text-xs font-mono tabular-nums shadow-sm"
              title="Độ trễ mạng qua WebSocket (Ping)"
            >
              <span className={`w-2 h-2 rounded-full ${ping < 80 ? 'bg-emerald-400 animate-pulse' : ping < 150 ? 'bg-amber-400' : 'bg-rose-400'}`} />
              <span className={ping < 80 ? 'text-emerald-400 font-bold' : ping < 150 ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold'}>
                {ping}ms
              </span>
            </div>
          </div>

          {/* Right: 5. Loa, 6. Help, 7. Đổi xe, 8. Ẩn thanh */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Loa */}
            <button
              onClick={handleToggleMute}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/70 shadow-sm"
              title={isMuted ? 'Bật âm thanh (Loa)' : 'Tắt âm thanh (Loa)'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
            </button>

            {/* Help */}
            <button
              onClick={() => setIsControlsModalOpen(true)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/70 shadow-sm"
              title="Hướng dẫn & Phím tắt (Help)"
            >
              <HelpCircle className="w-4 h-4 text-sky-400" />
            </button>

            {/* Đổi xe */}
            <button
              onClick={() => setIsInGame(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-amber-500/50 hover:border-amber-400 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95"
              title="Đổi loại xe tăng hoặc đổi chế độ"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Đổi Xe</span>
            </button>

            {/* Ẩn thanh */}
            <button
              onClick={() => setShowTopBar(false)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors cursor-pointer border border-slate-700/70 shadow-sm"
              title="Ẩn thanh công cụ (Phím U)"
            >
              <ChevronUp className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline">Ẩn Thanh (U)</span>
            </button>
          </div>
        </header>
      )}

      {/* Floating pull-down tab when top bar is hidden */}
      {!showTopBar && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setShowTopBar(true)}
            className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white px-3.5 py-1 rounded-full text-xs shadow-xl backdrop-blur-md cursor-pointer transition-all active:scale-95"
            title="Nhấn phím U để mở nhanh"
          >
            <ChevronDown className="w-3.5 h-3.5 text-sky-400" />
            <span>Hiện Thanh DLAND TANK (U)</span>
          </button>
          <div className="bg-slate-900/90 border border-slate-700/80 text-sky-300 px-2.5 py-1 rounded-full text-[11px] font-mono shadow-xl backdrop-blur-md">
            Zoom {Math.round(zoomScale * 100)}%
          </div>
        </div>
      )}

      {/* 2. Interactive Game Battlefield Canvas */}
      <div
        className="relative flex-1 w-full h-full overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <GameCanvas
          myPlayerId={myPlayerId}
          tanks={tanks}
          bullets={bullets}
          obstacles={obstacles}
          powerUps={powerUps}
          worldSize={worldSize}
          is25DMode={is25DMode}
          zoomScale={zoomScale}
        />

        {/* In-Game HUD Overlays */}
        {isInGame && (
          <>
            {/* TOP-LEFT: Radar Minimap + Killfeed */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2.5 pointer-events-none">
              {/* Minimap on Top-Left with Show/Hide */}
              {showMinimap ? (
                <div className="pointer-events-auto">
                  <RadarMinimap
                    myPlayerId={myPlayerId}
                    tanks={tanks}
                    obstacles={obstacles}
                    powerUps={powerUps}
                    worldSize={worldSize}
                    onHide={() => setShowMinimap(false)}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowMinimap(true)}
                  className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/85 hover:bg-slate-800 border border-sky-500/40 text-sky-300 px-2.5 py-1.5 rounded-lg shadow-lg text-xs backdrop-blur-sm cursor-pointer transition-all self-start"
                  title="Nhấn phím M để mở nhanh"
                >
                  <MapIcon className="w-3.5 h-3.5 text-sky-400" />
                  <span>Hiện Bản Đồ (M)</span>
                </button>
              )}

              {/* Combat Killfeed Status with Show/Hide */}
              {showKillfeed ? (
                <div className="flex flex-col gap-1 pointer-events-auto">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pr-2">
                    <span className="flex items-center gap-1">
                      <Bell className="w-2.5 h-2.5 text-sky-400" />
                      <span>BÁO CÁO HẠ GỤC</span>
                    </span>
                    <button
                      onClick={() => setShowKillfeed(false)}
                      className="text-slate-500 hover:text-rose-400 p-0.5 rounded cursor-pointer"
                      title="Ẩn thông báo hạ gục (Phím K)"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="pointer-events-none">
                    <KillFeed events={events} />
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowKillfeed(true)}
                  className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-white px-2.5 py-1 rounded-lg shadow-sm text-xs backdrop-blur-sm cursor-pointer transition-all self-start"
                  title="Nhấn phím K để mở nhanh"
                >
                  <Bell className="w-3 h-3 text-slate-400" />
                  <span>Thông Báo (K)</span>
                </button>
              )}
            </div>

            {/* TOP-RIGHT: Live Scoreboard with Show/Hide */}
            <div className="absolute top-4 right-4 z-20 pointer-events-auto">
              {showLeaderboard ? (
                <Scoreboard
                  entries={leaderboard}
                  myPlayerId={myPlayerId}
                  isExpanded={isScoreboardOpen}
                  onToggleExpand={() => setIsScoreboardOpen((prev) => !prev)}
                  onHide={() => setShowLeaderboard(false)}
                />
              ) : (
                <button
                  onClick={() => setShowLeaderboard(true)}
                  className="flex items-center gap-1.5 bg-slate-900/85 hover:bg-slate-800 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-lg shadow-lg text-xs backdrop-blur-sm cursor-pointer transition-all"
                  title="Nhấn phím L để mở nhanh"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bảng Điểm (L)</span>
                </button>
              )}
            </div>

            {/* BOTTOM-LEFT: Tank Stats Gauge with Show/Hide + In-Game Chat */}
            <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-3 pointer-events-none">
              {/* Player Tank Health & Shield Gauge with Hide/Show */}
              {myTank && (
                <>
                  {showStats ? (
                    <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md w-72 pointer-events-auto select-none animate-in fade-in slide-in-from-bottom-2 duration-150">
                      {/* Header with Tactical Status Badge & Hide Button */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              myTank.isDead
                                ? 'bg-rose-500'
                                : myTank.hp < myTank.maxHp * 0.3
                                ? 'bg-rose-500 animate-pulse'
                                : myTank.shield > 0
                                ? 'bg-sky-400 animate-pulse'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <span className="text-white uppercase tracking-wider font-mono text-[11px]">
                            {myTank.isDead
                              ? 'ĐÃ BỊ PHÁ HỦY'
                              : myTank.hp < myTank.maxHp * 0.3
                              ? 'MÁU NGUY CẤP'
                              : myTank.shield > 0
                              ? 'GIÁP NĂNG LƯỢNG'
                              : 'SẴN SÀNG TÁC CHIẾN'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500 font-mono">STATUS (H)</span>
                          <button
                            onClick={() => setShowStats(false)}
                            className="text-slate-400 hover:text-rose-400 p-0.5 rounded hover:bg-slate-800 cursor-pointer transition-colors"
                            title="Ẩn thanh status (Phím H)"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Commander & Sector Location */}
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="font-bold text-white truncate max-w-[130px]">
                          {myTank.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {getSectorName(myTank.x, myTank.y)}
                        </span>
                      </div>

                      {/* HP Bar */}
                      <div className="mt-1.5">
                        <div className="flex justify-between items-center text-[11px] mb-1">
                          <span className="text-slate-400 font-medium">Độ bền (HP):</span>
                          <span className="font-mono text-emerald-400 font-bold tabular-nums">
                            {Math.max(0, Math.ceil(myTank.hp))} / {myTank.maxHp}
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                          <div
                            className={`h-full rounded-full transition-all duration-150 ${
                              myTank.hp > myTank.maxHp * 0.5
                                ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                                : myTank.hp > myTank.maxHp * 0.25
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                : 'bg-gradient-to-r from-rose-600 to-red-500 animate-pulse'
                            }`}
                            style={{ width: `${Math.max(0, (myTank.hp / myTank.maxHp) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Shield Bar if active */}
                      {myTank.shield > 0 && (
                        <div className="mt-1.5">
                          <div className="flex justify-between items-center text-[11px] mb-0.5 text-sky-400 font-semibold">
                            <span className="flex items-center gap-1 font-mono">
                              <Shield className="w-3 h-3 text-sky-400" /> GIÁP NĂNG LƯỢNG
                            </span>
                            <span className="font-mono">{myTank.shield} / 100</span>
                          </div>
                          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all"
                              style={{ width: `${Math.min(100, myTank.shield)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Real-time Tank Speed Indicator */}
                      <div className="mt-2 flex items-center justify-between text-[11px] font-mono bg-slate-950/80 border border-slate-800 px-2.5 py-1.5 rounded-lg">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          Tốc độ xe:
                        </span>
                        <span className="font-bold flex items-center gap-1.5">
                          <span className={myTank.activePowerUp ? 'text-amber-300 font-extrabold animate-pulse' : 'text-sky-300'}>
                            {Math.round((myTank.speed || 4.6) * 20)} km/h
                          </span>
                          {myTank.activePowerUp && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-0.2 rounded font-mono">
                              {myTank.activePowerUp.type === 'SPEED_BOOST' ? '+85% NITRO' : '+35% LINH KIỆN'}
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Active Power-up indicator */}
                      {myTank.activePowerUp && (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-semibold bg-amber-500/15 border border-amber-500/30 px-2 py-1 rounded-lg mt-2">
                          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>
                            {myTank.activePowerUp.type === 'TRIPLE_SHOT'
                              ? '🔱 Đạn Ba Tia (+35% Tốc Độ)'
                              : myTank.activePowerUp.type === 'SPEED_BOOST'
                              ? '🚀 NITRO SIÊU TỐC (+85% Tốc Độ)'
                              : myTank.activePowerUp.type === 'RAPID_FIRE'
                              ? '⚡⚡ Nạp Đạn Thần Tốc (+35% Tốc Độ)'
                              : myTank.activePowerUp.type === 'SHIELD'
                              ? '🛡️ Lá Chắn Giáp (+35% Tốc Độ)'
                              : '✚ Hộp Cứu Thương (+35% Tốc Độ)'}
                          </span>
                        </div>
                      )}

                      {/* Currently Loaded Random Ammunition */}
                      {myTank.nextAmmoType && (
                        <div className="flex items-center justify-between text-[11px] font-mono bg-slate-950/90 border border-slate-800 px-2.5 py-1.5 rounded-lg mt-2">
                          <span className="text-slate-400">Đạn ngẫu nhiên nạp:</span>
                          <span
                            className="font-bold flex items-center gap-1.5"
                            style={{ color: getAmmoInfo(myTank.nextAmmoType).color }}
                          >
                            <span>{getAmmoInfo(myTank.nextAmmoType).icon}</span>
                            <span>{getAmmoInfo(myTank.nextAmmoType).name}</span>
                          </span>
                        </div>
                      )}

                      {/* Combat Statistics */}
                      <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between text-[11px] text-slate-400 font-mono">
                        <span>Hạ gục: <strong className="text-emerald-400 font-bold">{myTank.kills}</strong></span>
                        <span>Bị hạ: <strong className="text-rose-400">{myTank.deaths}</strong></span>
                        <span>Chuỗi: <strong className="text-amber-400">{myTank.streak}🔥</strong></span>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowStats(true)}
                      className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/50 text-emerald-300 px-3 py-1.5 rounded-xl shadow-xl text-xs backdrop-blur-md cursor-pointer transition-all self-start active:scale-95"
                      title="Nhấn phím H để mở thanh status"
                    >
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-bold">STATUS:</span>
                      <span>HP {Math.max(0, Math.ceil(myTank.hp))}/{myTank.maxHp}</span>
                      {myTank.nextAmmoType && (
                        <span style={{ color: getAmmoInfo(myTank.nextAmmoType).color }}>
                          {getAmmoInfo(myTank.nextAmmoType).icon} {getAmmoInfo(myTank.nextAmmoType).name}
                        </span>
                      )}
                      <span className="text-slate-500 text-[10px]">(Phím H)</span>
                    </button>
                  )}
                </>
              )}

              {/* Chat Box */}
              <ChatBox
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                isChatOpen={isChatOpen}
                setIsChatOpen={setIsChatOpen}
              />
            </div>

            {/* Mobile Virtual Controls */}
            <VirtualJoystick
              onMoveChange={(move) => {
                inputStateRef.current.up = move.up;
                inputStateRef.current.down = move.down;
                inputStateRef.current.left = move.left;
                inputStateRef.current.right = move.right;
                sendInput();
              }}
              onFireChange={(firing) => {
                inputStateRef.current.isFiring = firing;
                sendInput();
              }}
              onAimChange={(angle) => {
                inputStateRef.current.turretAngle = angle;
              }}
            />

            {/* Respawn Dialog if dead */}
            {myTank?.isDead && (
              <RespawnOverlay
                countdown={myTank.respawnCountdown}
                onRespawn={handleRespawn}
                kills={myTank.kills}
                score={myTank.score}
              />
            )}
            {/* Kill Announcement Banner */}
            <KillBanner
              recentEvent={recentCombatEvent}
              myPlayerName={myTank?.name || profileRef.current.name}
              myPlayerId={myPlayerId}
            />
          </>
        )}
      </div>

      {/* 3. Lobby / Tank Selection Modal */}
      {!isInGame && (
        <LobbyModal
          onJoin={handleJoinGame}
          onlineCount={lobbyInfo.publicOnlineCount}
          isSocketConnected={isSocketConnected}
          publicPlayers={lobbyInfo.publicPlayers}
          initialMode={gameMode}
        />
      )}

      {/* 4. Controls & Help Modal */}
      {isControlsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 font-bold text-base">
                <HelpCircle className="w-5 h-5 text-sky-400" />
                Hướng Dẫn Thao Tác & Phím Tắt
              </div>
              <button
                onClick={() => setIsControlsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-300">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <h4 className="font-bold text-white text-sm mb-2 text-sky-400">Điều Khiển Xe Tăng</h4>
                <ul className="space-y-1.5 list-disc pl-4">
                  <li><strong>W, S, A, D / Mũi tên</strong>: Di chuyển xe tăng trực tiếp theo 8 hướng cực kỳ nhạy và trượt mượt mà dọc theo tường.</li>
                  <li><strong>Con trỏ chuột</strong>: Xoay nòng pháo 360 độ độc lập với thân xe.</li>
                  <li><strong>Chuột trái hoặc Phím Space</strong>: Bắn đạn pháo.</li>
                </ul>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <h4 className="font-bold text-white text-sm mb-2 text-emerald-400">2 Chế Độ Chơi, Linh Kiện Tăng Tốc & Thông Báo Hạ Gục</h4>
                <ul className="space-y-1.5 list-disc pl-4">
                  <li><strong>Chế Độ Online</strong>: Chiến đấu PvP trực tiếp giữa người chơi thật. Có nút sao chép link mời bạn bè vào cùng phòng.</li>
                  <li><strong>Chế Độ Bot AI</strong>: Phòng riêng tự do chọn số lượng bot AI (1 - 14 bots) để luyện tập tác chiến riêng biệt.</li>
                  <li><strong>Linh kiện nâng cấp tăng tốc độ</strong>: Mọi hộp linh kiện (Cứu thương, Khiên giáp, Đạn 3 tia, Nạp nhanh) đều tăng <strong>+35% tốc độ</strong>, riêng Nitro tăng vọt <strong>+85% tốc độ</strong> cực bốc!</li>
                  <li><strong>Thông báo hạ gục đối thủ</strong>: Hiển thị banner chiến công nổi bật khi tiêu diệt đối thủ kèm chuỗi hạ gục (Double Kill, Triple Kill, Mega Kill, Unstoppable) và âm thanh ăn mừng!</li>
                  <li><strong>Mỗi người bắn đạn ngẫu nhiên</strong>: Mỗi phát bắn xuất hiện ngẫu nhiên 1 trong 8 loại đạn (Đại bác nổ lan, Chùm 3 tia, Laze Plasma, Đạn Băng làm chậm, Đạn Lửa thiêu đốt, Đạn Bật nảy tường, Đạn Xuyên giáp, Đạn Tiêu chuẩn).</li>
                </ul>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <h4 className="font-bold text-white text-sm mb-2 text-amber-400">Phím Tắt Ẩn/Hiện Giao Diện (Show/Hide HUD)</h4>
                <ul className="space-y-1.5 list-disc pl-4">
                  <li><strong>Phím H</strong>: Ẩn / Hiện Thanh báo Status xe tăng (Máu HP, Giáp, Đạn ngẫu nhiên nạp).</li>
                  <li><strong>Phím - / + / 0</strong>: Điều chỉnh tỉ lệ hiển thị (Mặc định 75% như Chrome, phím 0 để đặt lại).</li>
                  <li><strong>Phím U</strong>: Ẩn / Hiện Thanh trạng thái đầu trang (Top Status Bar) để mở rộng tầm nhìn tối đa.</li>
                  <li><strong>Phím M</strong>: Ẩn / Hiện Bản đồ nhỏ (Minimap) ở góc trên bên trái.</li>
                  <li><strong>Phím L</strong>: Ẩn / Hiện Bảng điểm trực tiếp ở góc trên bên phải.</li>
                  <li><strong>Phím K</strong>: Ẩn / Hiện Báo cáo hạ gục (Combat Status / Killfeed).</li>
                  <li><strong>Phím TAB</strong>: Mở rộng / Đóng bảng xếp hạng chi tiết toàn phòng.</li>
                  <li><strong>Phím Enter</strong>: Bật khung chat để nói chuyện với người chơi khác.</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setIsControlsModalOpen(false)}
              className="mt-5 w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-xl transition-colors cursor-pointer text-xs"
            >
              Đã hiểu, quay lại trận đấu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
