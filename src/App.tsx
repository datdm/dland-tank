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
  WeatherType,
  WEATHER_CONFIGS,
  WEATHER_CYCLE,
  SkillType,
  Landmine,
} from './types/game';
import { GameCanvas } from './components/GameCanvas';
import { RadarMinimap } from './components/RadarMinimap';
import { Scoreboard } from './components/Scoreboard';
import { KillFeed } from './components/KillFeed';
import { KillBanner } from './components/KillBanner';
import { ChatBox } from './components/ChatBox';
import { LobbyModal } from './components/LobbyModal';
import { RespawnOverlay } from './components/RespawnOverlay';
import { SpectatorHUD } from './components/SpectatorHUD';
import { HelpModal } from './components/HelpModal';
import { VirtualJoystick } from './components/VirtualJoystick';
import { SkillBarHUD } from './components/SkillBarHUD';
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
  LogOut,
  Eye,
  Swords,
  Video,
  Crosshair,
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
  const [mapMode, setMapMode] = useState<'small' | 'large' | 'hidden'>('small');
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [showKillfeed, setShowKillfeed] = useState(true);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const [tanks, setTanks] = useState<PlayerTank[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUpCrate[]>([]);
  const [landmines, setLandmines] = useState<Landmine[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [events, setEvents] = useState<CombatEvent[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [ping, setPing] = useState(18);

  const [isScoreboardOpen, setIsScoreboardOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isControlsModalOpen, setIsControlsModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getIsMuted());
  const [botCount, setBotCount] = useState(7);

  // Dynamic 1-Minute Weather Cycle System
  const [currentWeatherIndex, setCurrentWeatherIndex] = useState(0);
  const [weatherSecondsLeft, setWeatherSecondsLeft] = useState(60);
  const [weatherToast, setWeatherToast] = useState<{
    name: string;
    icon: string;
    description: string;
    themeColor: string;
  } | null>(null);

  // Spectator & Free Camera Panning States
  const [isSpectator, setIsSpectator] = useState(false);
  const [spectatorTargetId, setSpectatorTargetId] = useState<string | 'free'>('free');
  const [freeCameraPos, setFreeCameraPos] = useState({ x: 2100, y: 2100 });
  const [focusBeacon, setFocusBeacon] = useState<{ x: number; y: number; timestamp: number } | null>(null);
  const [isFreeCameraActive, setIsFreeCameraActive] = useState(false);

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

  // 1-Minute Weather Cycle Timer (60 seconds per weather atmosphere)
  useEffect(() => {
    const timer = setInterval(() => {
      setWeatherSecondsLeft((prev) => {
        if (prev <= 1) {
          setCurrentWeatherIndex((oldIdx) => {
            const nextIdx = (oldIdx + 1) % WEATHER_CYCLE.length;
            const nextWeatherType = WEATHER_CYCLE[nextIdx];
            const cfg = WEATHER_CONFIGS[nextWeatherType];
            setWeatherToast({
              name: cfg.vietnameseName,
              icon: cfg.icon,
              description: cfg.description,
              themeColor: cfg.themeColor,
            });
            sounds.playPowerUp();
            return nextIdx;
          });
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-dismiss weather change announcement banner after 5 seconds
  useEffect(() => {
    if (weatherToast) {
      const t = setTimeout(() => {
        setWeatherToast(null);
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [weatherToast]);

  const handleManualSwitchWeather = () => {
    setCurrentWeatherIndex((oldIdx) => {
      const nextIdx = (oldIdx + 1) % WEATHER_CYCLE.length;
      const nextWeatherType = WEATHER_CYCLE[nextIdx];
      const cfg = WEATHER_CONFIGS[nextWeatherType];
      setWeatherToast({
        name: cfg.vietnameseName,
        icon: cfg.icon,
        description: cfg.description,
        themeColor: cfg.themeColor,
      });
      sounds.playPowerUp();
      return nextIdx;
    });
    setWeatherSecondsLeft(60);
  };

  const handleFocusWorldPos = (x: number, y: number) => {
    setFreeCameraPos({ x, y });
    setIsFreeCameraActive(true);
    setFocusBeacon({ x, y, timestamp: Date.now() });
    sounds.playPowerUp();
  };

  const handlePanCamera = (camX: number, camY: number) => {
    setFreeCameraPos({ x: camX, y: camY });
    setIsFreeCameraActive(true);
  };

  const handleRecenterCamera = () => {
    setIsFreeCameraActive(false);
    const myTank = tanks.find((t) => t.id === myPlayerId);
    if (myTank) {
      setFreeCameraPos({ x: myTank.x, y: myTank.y });
    }
  };

  const handleExitGame = () => {
    setIsInGame(false);
    setIsSpectator(false);
    setIsFreeCameraActive(false);
  };

  const handleUseSkill = (skill: SkillType) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const msg: ClientMessage = {
        type: 'USE_SKILL',
        skill,
      };
      socketRef.current.send(JSON.stringify(msg));
    }
  };

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
              setLandmines(msg.snapshot.landmines || []);
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
              setLandmines(msg.snapshot.landmines || []);
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

      // Hotkey M: Cycle Map Mode (Lần 1: Map Nhỏ -> Lần 2: Map To ở giữa màn hình -> Lần 3: Ẩn -> Lần tiếp: Map Nhỏ lại)
      if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setMapMode((prev) => {
          if (prev === 'small') return 'large';
          if (prev === 'large') return 'hidden';
          return 'small';
        });
        return;
      }

      // Escape Key: If large map dialog is open, close/hide it
      if (e.key === 'Escape' && mapMode === 'large') {
        e.preventDefault();
        setMapMode('hidden');
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

      const k = e.key.toLowerCase();

      // Spectator Hotkeys: Q/E or Left/Right arrows to cycle target, WASD to move free camera
      if (isSpectator) {
        const aliveTanks = tanks.filter((t) => !t.isDead);
        if (k === 'q') {
          e.preventDefault();
          if (aliveTanks.length > 0) {
            const curIdx = aliveTanks.findIndex((t) => t.id === spectatorTargetId);
            const prevIdx = (curIdx - 1 + aliveTanks.length) % aliveTanks.length;
            setSpectatorTargetId(aliveTanks[prevIdx].id);
          }
          return;
        }
        if (k === 'e') {
          e.preventDefault();
          if (aliveTanks.length > 0) {
            const curIdx = aliveTanks.findIndex((t) => t.id === spectatorTargetId);
            const nextIdx = (curIdx + 1) % aliveTanks.length;
            setSpectatorTargetId(aliveTanks[nextIdx].id);
          }
          return;
        }

        // Free Camera WASD panning
        const moveStep = e.shiftKey ? 80 : 40;
        if (k === 'w' || k === 'arrowup') {
          e.preventDefault();
          setSpectatorTargetId('free');
          setFreeCameraPos((prev) => ({ ...prev, y: Math.max(100, prev.y - moveStep) }));
          return;
        }
        if (k === 's' || k === 'arrowdown') {
          e.preventDefault();
          setSpectatorTargetId('free');
          setFreeCameraPos((prev) => ({ ...prev, y: Math.min(worldSize.height - 100, prev.y + moveStep) }));
          return;
        }
        if (k === 'a' || k === 'arrowleft') {
          e.preventDefault();
          setSpectatorTargetId('free');
          setFreeCameraPos((prev) => ({ ...prev, x: Math.max(100, prev.x - moveStep) }));
          return;
        }
        if (k === 'd' || k === 'arrowright') {
          e.preventDefault();
          setSpectatorTargetId('free');
          setFreeCameraPos((prev) => ({ ...prev, x: Math.min(worldSize.width - 100, prev.x + moveStep) }));
          return;
        }
      }

      // Tactical Skill Shortcuts: Shift (Boost), Space/Q (Shield), E/F (Mine), R (Barrage)
      if (e.key === 'Shift' || k === 'shift') {
        e.preventDefault();
        handleUseSkill('BOOST');
        return;
      }
      if (e.code === 'Space' || k === 'q') {
        e.preventDefault();
        handleUseSkill('SHIELD');
        return;
      }
      if (k === 'e' || k === 'f') {
        e.preventDefault();
        handleUseSkill('MINE');
        return;
      }
      if (k === 'r') {
        e.preventDefault();
        handleUseSkill('BARRAGE');
        return;
      }

      let changed = false;
      if (k === 'w' || k === 'arrowup') {
        setIsFreeCameraActive(false);
        if (!inputStateRef.current.up) {
          inputStateRef.current.up = true;
          changed = true;
        }
      }
      if (k === 's' || k === 'arrowdown') {
        setIsFreeCameraActive(false);
        if (!inputStateRef.current.down) {
          inputStateRef.current.down = true;
          changed = true;
        }
      }
      if (k === 'a' || k === 'arrowleft') {
        setIsFreeCameraActive(false);
        if (!inputStateRef.current.left) {
          inputStateRef.current.left = true;
          changed = true;
        }
      }
      if (k === 'd' || k === 'arrowright') {
        setIsFreeCameraActive(false);
        if (!inputStateRef.current.right) {
          inputStateRef.current.right = true;
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
    customRoomId?: string,
    spectator: boolean = false
  ) => {
    setGameMode(mode);
    setBotCount(selectedBots);
    setIsSpectator(spectator);
    if (spectator) {
      setSpectatorTargetId('free');
    }
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
          isSpectator: spectator,
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

  const handleToggleSpectator = (targetSpectatorState?: boolean) => {
    const nextSpectatorState = targetSpectatorState !== undefined ? targetSpectatorState : !isSpectator;
    setIsSpectator(nextSpectatorState);

    if (nextSpectatorState) {
      // Switch to Spectator
      const otherAlive = tanks.find((t) => t.id !== myPlayerId && !t.isDead);
      setSpectatorTargetId(otherAlive ? otherAlive.id : 'free');
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'SET_SPECTATOR',
            isSpectator: true,
          })
        );
      }
    } else {
      // Switch to active combat
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'SET_SPECTATOR',
            isSpectator: false,
            name: profileRef.current.name,
            color: profileRef.current.color,
            tankClass: profileRef.current.tankClass,
          })
        );
      }
    }
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

            {/* Dynamic Weather Ambient Status (Auto-cycles in background) */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/70 text-xs font-mono shadow-sm select-none"
              title={`Thời tiết chiến trường: ${WEATHER_CONFIGS[WEATHER_CYCLE[currentWeatherIndex]].vietnameseName}`}
            >
              <span className="text-sm">{WEATHER_CONFIGS[WEATHER_CYCLE[currentWeatherIndex]].icon}</span>
              <span className="text-slate-200 font-bold hidden md:inline">
                {WEATHER_CONFIGS[WEATHER_CYCLE[currentWeatherIndex]].vietnameseName}
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-amber-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-amber-500/50 hover:border-amber-400 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95"
              title="Đổi loại xe tăng hoặc đổi chế độ"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Đổi Xe</span>
            </button>

            {/* Chuyển đổi Khán Giả / Tham Chiến */}
            <button
              onClick={() => handleToggleSpectator()}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95 border ${
                isSpectator
                  ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-400 shadow-sky-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white border-sky-500/40'
              }`}
              title={isSpectator ? 'Tham gia chiến đấu ngay' : 'Chuyển sang chế độ khán giả xem trận'}
            >
              {isSpectator ? <Swords className="w-3.5 h-3.5 text-white" /> : <Eye className="w-3.5 h-3.5 text-sky-400" />}
              <span>{isSpectator ? 'Vào Chiến Đấu' : 'Xem Trận'}</span>
            </button>

            {/* Thoát Game / Rời Trận */}
            <button
              onClick={handleExitGame}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/50 hover:border-rose-400 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95"
              title="Thoát trận đấu và quay về sảnh chờ"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Thoát Game</span>
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

          <div
            className="bg-slate-900/90 border border-slate-700/80 text-slate-300 px-2.5 py-1 rounded-full text-[11px] font-mono shadow-xl backdrop-blur-md flex items-center gap-1.5 select-none"
            title={`Thời tiết: ${WEATHER_CONFIGS[WEATHER_CYCLE[currentWeatherIndex]].vietnameseName}`}
          >
            <span>{WEATHER_CONFIGS[WEATHER_CYCLE[currentWeatherIndex]].icon}</span>
            <span>{WEATHER_CONFIGS[WEATHER_CYCLE[currentWeatherIndex]].vietnameseName}</span>
          </div>

          <button
            onClick={handleExitGame}
            className="flex items-center gap-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 text-rose-300 px-2.5 py-1 rounded-full text-xs shadow-xl backdrop-blur-md cursor-pointer transition-all active:scale-95"
            title="Thoát trận đấu"
          >
            <LogOut className="w-3 h-3 text-rose-400" />
            <span>Thoát</span>
          </button>
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
          landmines={landmines}
          worldSize={worldSize}
          is25DMode={is25DMode}
          zoomScale={zoomScale}
          isSpectator={isSpectator}
          spectatorTargetId={spectatorTargetId}
          freeCameraPos={freeCameraPos}
          onSelectSpectatorTarget={(id) => setSpectatorTargetId(id)}
          currentWeather={WEATHER_CYCLE[currentWeatherIndex]}
          focusBeacon={focusBeacon}
          onPanCamera={handlePanCamera}
          onFocusWorldPos={handleFocusWorldPos}
          isFreeCameraActive={isFreeCameraActive}
        />

        {/* Floating Re-center Camera Button when user has panned freely */}
        {isFreeCameraActive && !isSpectator && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
              onClick={handleRecenterCamera}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-black px-4 py-2 rounded-full shadow-2xl border border-amber-300/60 cursor-pointer text-xs uppercase tracking-wider transition-all active:scale-95"
              title="Quay lại vị trí xe của bạn (Nhấn WASD hoặc click nút này)"
            >
              <Crosshair className="w-4 h-4" />
              <span>QUAY VỀ XE CỦA TÔI (WASD / Space)</span>
            </button>
          </div>
        )}

        {/* Weather Transition Announcement Toast */}
        {weatherToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300 max-w-md w-[92%]">
            <div
              className="flex items-center gap-3 bg-slate-950/95 border px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs"
              style={{ borderColor: weatherToast.themeColor }}
            >
              <span className="text-3xl shrink-0 animate-bounce">{weatherToast.icon}</span>
              <div className="min-w-0">
                <div className="font-mono font-black uppercase tracking-wide flex items-center gap-1.5 text-xs truncate" style={{ color: weatherToast.themeColor }}>
                  <span>THỜI TIẾT CHIẾN TRƯỜNG:</span>
                  <span className="text-white font-bold">{weatherToast.name}</span>
                </div>
                <div className="text-[11px] text-slate-300 truncate mt-0.5">{weatherToast.description}</div>
              </div>
            </div>
          </div>
        )}

        {/* In-Game HUD Overlays */}
        {isInGame && (
          <>
            {/* TOP-LEFT: Radar Minimap + Killfeed */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2.5 pointer-events-none">
              {/* Minimap on Top-Left (Small) or Button (Hidden) */}
              {mapMode === 'small' && (
                <div className="pointer-events-auto">
                  <RadarMinimap
                    myPlayerId={myPlayerId}
                    tanks={tanks}
                    obstacles={obstacles}
                    powerUps={powerUps}
                    worldSize={worldSize}
                    mode="small"
                    onSetMode={setMapMode}
                    onFocusWorldPos={handleFocusWorldPos}
                    cameraPos={freeCameraPos}
                    focusBeacon={focusBeacon}
                  />
                </div>
              )}

              {mapMode === 'hidden' && (
                <button
                  onClick={() => setMapMode('small')}
                  className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/85 hover:bg-slate-800 border border-sky-500/40 text-sky-300 px-2.5 py-1.5 rounded-lg shadow-lg text-xs backdrop-blur-sm cursor-pointer transition-all self-start"
                  title="Nhấn phím M: Map Nhỏ -> Map To (Dialog giữa) -> Ẩn"
                >
                  <MapIcon className="w-3.5 h-3.5 text-sky-400" />
                  <span>Hiện Bản Đồ (M)</span>
                </button>
              )}

              {/* Centered Large Map Dialog when mode is large */}
              {mapMode === 'large' && (
                <RadarMinimap
                  myPlayerId={myPlayerId}
                  tanks={tanks}
                  obstacles={obstacles}
                  powerUps={powerUps}
                  worldSize={worldSize}
                  mode="large"
                  onSetMode={setMapMode}
                  onFocusWorldPos={handleFocusWorldPos}
                  cameraPos={freeCameraPos}
                  focusBeacon={focusBeacon}
                />
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

            {/* BOTTOM-CENTER: Tactical Skill Bar HUD (Shift: Boost, Space: Shield, E: Mine, R: Barrage) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
              <SkillBarHUD myTank={myTank} onUseSkill={handleUseSkill} />
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

            {/* Spectator Mode HUD */}
            {isSpectator && (
              <SpectatorHUD
                tanks={tanks}
                spectatorTargetId={spectatorTargetId}
                onSelectTarget={setSpectatorTargetId}
                onJoinBattle={() => handleToggleSpectator(false)}
              />
            )}

            {/* Respawn Dialog if dead */}
            {myTank?.isDead && !isSpectator && (
              <RespawnOverlay
                countdown={myTank.respawnCountdown}
                onRespawn={handleRespawn}
                kills={myTank.kills}
                score={myTank.score}
                onSwitchToSpectator={() => handleToggleSpectator(true)}
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
          currentWeather={WEATHER_CYCLE[currentWeatherIndex]}
        />
      )}

      {/* 4. Controls & Help Modal */}
      <HelpModal isOpen={isControlsModalOpen} onClose={() => setIsControlsModalOpen(false)} />
    </div>
  );
}
