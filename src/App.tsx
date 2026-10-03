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
  AimMode,
  Landmine,
  PerkId,
  StormZone,
  TeamScore,
  BossInfo,
  BaseZone,
  Team,
  TankSkinId,
  BulletTrailId,
  RoofDecalId,
  TANK_SKINS,
  BULLET_TRAILS,
  ROOF_DECALS,
} from './types/game';
import { GameCanvas } from './components/GameCanvas';
import { RadarMinimap } from './components/RadarMinimap';
import { Scoreboard } from './components/Scoreboard';
import { KillFeed } from './components/KillFeed';
import { KillBanner } from './components/KillBanner';
import { ChatBox } from './components/ChatBox';
import { HomePage } from './components/HomePage';
import { RespawnOverlay } from './components/RespawnOverlay';
import { SpectatorHUD } from './components/SpectatorHUD';
import { HelpModal } from './components/HelpModal';
import { VirtualJoystick } from './components/VirtualJoystick';
import { SkillBarHUD } from './components/SkillBarHUD';
import { PerkSelectModal } from './components/PerkSelectModal';
import { GarageModal } from './components/GarageModal';
import { OrientationGuard } from './components/OrientationGuard';
import { sounds } from './utils/audio';
import {
  Volume2,
  VolumeX,
  Palette,
  Music,
  Sliders,
  Radio,
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
  Target,
  AlertTriangle,
  Crown,
  Skull,
  Flame,
  Heart,
} from 'lucide-react';

export default function App() {
  const [isInGame, setIsInGame] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [worldSize, setWorldSize] = useState({ width: 4200, height: 4200 });
  const [is25DMode, setIs25DMode] = useState(true);
  const [isShortLandscape, setIsShortLandscape] = useState(() => {
    return typeof window !== 'undefined' && window.innerHeight <= 560 && window.innerWidth > window.innerHeight;
  });
  const [isAutoZoom, setIsAutoZoom] = useState(true);
  const [zoomScale, setZoomScale] = useState(0.75);

  // Dynamic Screen-Adaptive Battlefield Camera Zoom
  const getScreenAdaptiveZoom = () => {
    if (typeof window === 'undefined') return 0.75;
    const h = window.innerHeight;
    const w = window.innerWidth;
    if (h <= 450 && w > h) {
      // Mobile landscape screen (e.g. iPhone, Android height ~360-430px)
      return Math.min(0.60, Math.max(0.48, Math.round(((h / 700) * 0.75) * 100) / 100));
    } else if (h <= 600 && w > h) {
      return Math.min(0.70, Math.max(0.55, Math.round(((h / 720) * 0.75) * 100) / 100));
    } else {
      return 0.75;
    }
  };

  const effectiveZoomScale = isAutoZoom ? getScreenAdaptiveZoom() : zoomScale;
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

  // Dedicated Game Modes State: Battle Royale, Team Deathmatch, Boss Raid
  const [storm, setStorm] = useState<StormZone | null>(null);
  const [teamScore, setTeamScore] = useState<TeamScore | null>(null);
  const [boss, setBoss] = useState<BossInfo | null>(null);
  const [bases, setBases] = useState<BaseZone[]>([]);
  const [aliveCount, setAliveCount] = useState<number>(0);
  const [totalParticipants, setTotalParticipants] = useState<number>(0);
  const [brWinner, setBrWinner] = useState<{ id: string; name: string; color: string; kills: number } | null>(null);

  const [isScoreboardOpen, setIsScoreboardOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isControlsModalOpen, setIsControlsModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getIsMuted());
  const [botCount, setBotCount] = useState(7);

  // Cosmetics & Workshop state
  const [userSkin, setUserSkin] = useState<TankSkinId>(() => (localStorage.getItem('tank_skin') as TankSkinId) || 'DEFAULT');
  const [userTrail, setUserTrail] = useState<BulletTrailId>(() => (localStorage.getItem('tank_trail') as BulletTrailId) || 'STANDARD');
  const [userDecal, setUserDecal] = useState<RoofDecalId>(() => (localStorage.getItem('tank_decal') as RoofDecalId) || 'FLAG_VIETNAM');
  const [isGarageOpen, setIsGarageOpen] = useState(false);

  // Audio Settings & BGM state
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [musicVol, setMusicVol] = useState(Math.round(sounds.getMusicVolume() * 100));
  const [sfxVol, setSfxVol] = useState(Math.round(sounds.getSfxVolume() * 100));
  const [voiceEnabled, setVoiceEnabled] = useState(sounds.getVoiceEnabled());
  const [isMusicPlaying, setIsMusicPlaying] = useState(sounds.getIsMusicPlaying());

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

  // Tank Aiming & Firing Mode: 'MOVEMENT' (Classic Tank 1990) | 'MOUSE' (Modern 360°)
  const [aimMode, setAimMode] = useState<AimMode>(() => {
    return (localStorage.getItem('tank_aim_mode') as AimMode) || 'MOVEMENT';
  });
  const aimModeRef = useRef<AimMode>(aimMode);
  useEffect(() => {
    aimModeRef.current = aimMode;
    localStorage.setItem('tank_aim_mode', aimMode);
  }, [aimMode]);

  const lastMoveAngleRef = useRef<number>(0);

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

  // Calculate turret angle from WASD movement directions (Tank 1990 style)
  const updateAimAngleFromMovement = useCallback(() => {
    if (aimModeRef.current !== 'MOVEMENT') return false;

    const { up, down, left, right } = inputStateRef.current;
    let dx = 0;
    let dy = 0;
    if (left) dx -= 1;
    if (right) dx += 1;
    if (up) dy -= 1;
    if (down) dy += 1;

    if (dx !== 0 || dy !== 0) {
      const angle = Math.atan2(dy, dx);
      lastMoveAngleRef.current = angle;
      if (inputStateRef.current.turretAngle !== angle) {
        inputStateRef.current.turretAngle = angle;
        return true;
      }
    }
    return false;
  }, []);

  // Track player profile for joining/reconnecting
  const profileRef = useRef<{
    name: string;
    color: string;
    tankClass: TankClass;
    mode: GameMode;
    botCount: number;
    roomId?: string;
    team?: Team;
    skinId?: TankSkinId;
    bulletTrail?: BulletTrailId;
    roofDecal?: RoofDecalId;
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

  // Viewport resize tracking for short landscape mobile scaling
  useEffect(() => {
    const handleViewport = () => {
      const isShort = window.innerHeight <= 560 && window.innerWidth > window.innerHeight;
      setIsShortLandscape(isShort);
    };
    handleViewport();
    window.addEventListener('resize', handleViewport);
    window.addEventListener('orientationchange', handleViewport);
    return () => {
      window.removeEventListener('resize', handleViewport);
      window.removeEventListener('orientationchange', handleViewport);
    };
  }, []);

  const prevBossAliveRef = useRef(false);

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
            sounds.announce(
              `Weather change: ${cfg.name}`,
              `Thời tiết chiến trường: ${cfg.vietnameseName}! ${cfg.description}`
            );
            return nextIdx;
          });
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // AFK Tab-out notice state
  const [afkNotice, setAfkNotice] = useState<string | null>(null);

  // Auto-dismiss weather change announcement banner after 5 seconds
  useEffect(() => {
    if (weatherToast) {
      const t = setTimeout(() => {
        setWeatherToast(null);
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [weatherToast]);

  // 30-Second Tab-Out / Window Blur Auto-Kick Protection
  const afkTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isInGame) {
      if (afkTimerRef.current) {
        clearTimeout(afkTimerRef.current);
        afkTimerRef.current = null;
      }
      return;
    }

    const startAfkCountdown = () => {
      if (!afkTimerRef.current) {
        afkTimerRef.current = setTimeout(() => {
          setIsInGame(false);
          setAfkNotice('⚠️ Bạn đã bị ngắt kết nối về Sảnh chờ do chuyển tab / rời cửa sổ game quá 30 giây!');
          sounds.playExplosion();
          afkTimerRef.current = null;
        }, 30000); // 30 seconds
      }
    };

    const cancelAfkCountdown = () => {
      if (afkTimerRef.current) {
        clearTimeout(afkTimerRef.current);
        afkTimerRef.current = null;
        setWeatherToast({
          name: 'CẢNH BÁO HOẠT ĐỘNG',
          icon: '⚠️',
          description: 'Bạn vừa quay lại tab game! Nếu rời tab quá 30 giây sẽ tự động ngắt kết nối.',
          themeColor: '#f59e0b',
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        startAfkCountdown();
      } else {
        cancelAfkCountdown();
      }
    };

    const handleBlur = () => {
      startAfkCountdown();
    };

    const handleFocus = () => {
      cancelAfkCountdown();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      if (afkTimerRef.current) {
        clearTimeout(afkTimerRef.current);
        afkTimerRef.current = null;
      }
    };
  }, [isInGame]);

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

      // Tactical Voice Announcer & SFX
      if (skill === 'BOOST') {
        sounds.playPowerUp();
        sounds.announce('Nitro Boost Activated!', 'Kích hoạt Tăng Tốc!');
      } else if (skill === 'SHIELD') {
        sounds.playPowerUp();
        sounds.announce('Energy Shield Online!', 'Kích hoạt Khiên Chắn Năng Lượng!');
      } else if (skill === 'MINE') {
        sounds.playHit();
        sounds.announce('Tactical Mine Deployed!', 'Đã rải Mìn Chiến Thuật!');
      } else if (skill === 'BARRAGE') {
        sounds.playShoot(true);
        sounds.announce('Artillery Barrage Fired!', 'Khai hỏa Bão Lửa Pháo Kích!');
      }
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

              // Unpack Game Mode State
              if (msg.snapshot.storm) setStorm(msg.snapshot.storm);
              if (msg.snapshot.teamScore) setTeamScore(msg.snapshot.teamScore);
              setBoss(msg.snapshot.boss || null);
              if (msg.snapshot.bases) setBases(msg.snapshot.bases);
              if (msg.snapshot.aliveCount !== undefined) setAliveCount(msg.snapshot.aliveCount);
              if (msg.snapshot.totalParticipants !== undefined) setTotalParticipants(msg.snapshot.totalParticipants);
              setBrWinner(msg.snapshot.brWinner || null);
              if (msg.snapshot.mode) setGameMode(msg.snapshot.mode);

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

              // Unpack Game Mode State on each tick
              if (msg.snapshot.storm) setStorm(msg.snapshot.storm);
              if (msg.snapshot.boss) {
                if (!prevBossAliveRef.current && msg.snapshot.boss.isAlive) {
                  sounds.playExplosion();
                  sounds.announce(
                    'Warning! World Boss Leviathan has arrived!',
                    'Cảnh báo chiến trường! Siêu Boss Thiết Giáp Leviathan đã xuất hiện!'
                  );
                }
                prevBossAliveRef.current = !!msg.snapshot.boss.isAlive;
                setBoss(msg.snapshot.boss);
              } else {
                prevBossAliveRef.current = false;
                setBoss(null);
              }
              if (msg.snapshot.aliveCount !== undefined) setAliveCount(msg.snapshot.aliveCount);
              if (msg.snapshot.totalParticipants !== undefined) setTotalParticipants(msg.snapshot.totalParticipants);
              setBrWinner(msg.snapshot.brWinner || null);
              if (msg.snapshot.mode) setGameMode(msg.snapshot.mode);
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

  const handleSelectPerk = useCallback((perkId: PerkId) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'SELECT_PERK',
          perkId,
        })
      );
    }
  }, []);

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
        setIsAutoZoom(false);
        setZoomScale((prev: number) => Math.max(0.45, Math.round((prev - 0.1) * 100) / 100));
        return;
      }
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        setIsAutoZoom(false);
        setZoomScale((prev: number) => Math.min(1.25, Math.round((prev + 0.1) * 100) / 100));
        return;
      }
      if (e.key === '0') {
        e.preventDefault();
        setIsAutoZoom(true);
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

      // Tactical Skill Shortcuts: Shift (Boost), Q/F (Shield), E (Mine), R (Barrage)
      if (e.key === 'Shift' || k === 'shift') {
        e.preventDefault();
        handleUseSkill('BOOST');
        return;
      }
      if (k === 'q' || k === 'f') {
        e.preventDefault();
        handleUseSkill('SHIELD');
        return;
      }
      if (k === 'e') {
        e.preventDefault();
        handleUseSkill('MINE');
        return;
      }
      if (k === 'r') {
        e.preventDefault();
        handleUseSkill('BARRAGE');
        return;
      }

      // Hotkey C: Toggle Aim Mode (Movement Direction vs Mouse Look 360°)
      if (k === 'c') {
        e.preventDefault();
        const nextMode = aimModeRef.current === 'MOVEMENT' ? 'MOUSE' : 'MOVEMENT';
        setAimMode(nextMode);
        sounds.playPowerUp();
        setWeatherToast({
          name: nextMode === 'MOVEMENT' ? 'BẮN THEO HƯỚNG XE' : 'BẮN THEO CHUỘT 360°',
          icon: nextMode === 'MOVEMENT' ? '🎯' : '🖱️',
          description: nextMode === 'MOVEMENT'
            ? 'Pháo tự động nhắm theo hướng xe chạy (Tank 1990). Bấm Space / J / Chuột để bắn!'
            : 'Pháo xoay tự do 360° theo con trỏ chuột.',
          themeColor: nextMode === 'MOVEMENT' ? '#10b981' : '#38bdf8',
        });
        return;
      }

      let changed = false;

      // Primary Cannon Firing with Spacebar or J Key
      if (e.code === 'Space' || k === 'j') {
        e.preventDefault();
        if (!inputStateRef.current.isFiring) {
          inputStateRef.current.isFiring = true;
          changed = true;
        }
      }

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
        if (aimModeRef.current === 'MOVEMENT') {
          updateAimAngleFromMovement();
        }
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
      if (e.code === 'Space' || k === 'j') {
        if (inputStateRef.current.isFiring) {
          inputStateRef.current.isFiring = false;
          changed = true;
        }
      }

      if (changed) {
        if (aimModeRef.current === 'MOVEMENT') {
          updateAimAngleFromMovement();
        }
        sendInput();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isChatOpen, sendInput, updateAimAngleFromMovement]);

  // Handle Mouse Movement and Firing
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (aimModeRef.current === 'MOVEMENT') {
      // In Movement Aim mode, mouse look is disabled so nòng pháo locks to movement
      return;
    }
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
    spectator: boolean = false,
    team?: Team,
    skinId?: TankSkinId,
    bulletTrail?: BulletTrailId,
    roofDecal?: RoofDecalId
  ) => {
    setGameMode(mode);
    setBotCount(selectedBots);
    setIsSpectator(spectator);
    if (spectator) {
      setSpectatorTargetId('free');
    }

    if (skinId) setUserSkin(skinId);
    if (bulletTrail) setUserTrail(bulletTrail);
    if (roofDecal) setUserDecal(roofDecal);

    const finalSkin = skinId || userSkin;
    const finalTrail = bulletTrail || userTrail;
    const finalDecal = roofDecal || userDecal;

    profileRef.current = {
      name,
      color,
      tankClass,
      mode,
      botCount: selectedBots,
      roomId: customRoomId || 'public',
      team,
      skinId: finalSkin,
      bulletTrail: finalTrail,
      roofDecal: finalDecal,
    };

    // Auto-start procedural epic military battle BGM
    sounds.startBgm();

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
          team,
          skinId: finalSkin,
          bulletTrail: finalTrail,
          roofDecal: finalDecal,
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

  const handleSaveCosmetics = (cosmetics: {
    skinId: TankSkinId;
    bulletTrail: BulletTrailId;
    roofDecal: RoofDecalId;
  }) => {
    setUserSkin(cosmetics.skinId);
    setUserTrail(cosmetics.bulletTrail);
    setUserDecal(cosmetics.roofDecal);
    localStorage.setItem('tank_skin', cosmetics.skinId);
    localStorage.setItem('tank_trail', cosmetics.bulletTrail);
    localStorage.setItem('tank_decal', cosmetics.roofDecal);

    profileRef.current.skinId = cosmetics.skinId;
    profileRef.current.bulletTrail = cosmetics.bulletTrail;
    profileRef.current.roofDecal = cosmetics.roofDecal;

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'UPDATE_COSMETICS',
          skinId: cosmetics.skinId,
          bulletTrail: cosmetics.bulletTrail,
          roofDecal: cosmetics.roofDecal,
        })
      );
    }
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

  if (!isInGame) {
    return (
      <div className="relative w-screen h-screen overflow-x-hidden bg-slate-950 font-sans select-none flex flex-col">
        {/* Fullscreen Orientation Guard for Mobile: Restricts to Landscape mode */}
        <OrientationGuard />

        {/* AFK Kicked Notice Banner */}
        {afkNotice && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 animate-in fade-in slide-in-from-top-4 duration-300 max-w-md w-[92%] pointer-events-auto">
            <div className="flex items-center justify-between gap-3 bg-slate-950/95 border-2 border-rose-500 text-white p-3.5 rounded-2xl shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
                <span className="text-xs font-bold leading-snug text-rose-200">{afkNotice}</span>
              </div>
              <button
                onClick={() => setAfkNotice(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer shrink-0"
                title="Đóng thông báo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <HomePage
          onJoin={handleJoinGame}
          onlineCount={lobbyInfo.publicOnlineCount}
          isSocketConnected={isSocketConnected}
          publicPlayers={lobbyInfo.publicPlayers}
          initialMode={gameMode}
          currentWeather={WEATHER_CYCLE[currentWeatherIndex]}
          ping={ping}
          aimMode={aimMode}
          onAimModeChange={setAimMode}
        />
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none flex flex-col">
      {/* Fullscreen Orientation Guard for Mobile: Restricts to Landscape mode */}
      <OrientationGuard />

      {/* 1. Universal Top Bar (DLAND TANK) */}
      {showTopBar && (
        <header className={`${
          isShortLandscape ? 'h-9 px-1.5 sm:px-3' : 'h-14 px-3 sm:px-5'
        } bg-slate-900/95 border-b border-slate-800/80 flex items-center justify-between z-30 shrink-0 select-none backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150`}>
          {/* Left: 1. Tiêu đề DLAND TANK & 2. Số người chơi */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <span className={`${isShortLandscape ? 'text-xs' : 'text-base sm:text-lg'} font-black tracking-tight text-white font-mono flex items-center gap-1 sm:gap-2`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              DLAND TANK
            </span>

            {/* Số người chơi */}
            <div
              className={`flex items-center gap-1 px-1.5 py-0.5 sm:py-1 rounded-lg bg-slate-800/80 border border-slate-700/70 font-semibold text-slate-200 shadow-sm ${
                isShortLandscape ? 'text-[10px]' : 'text-xs'
              }`}
              title="Số người chơi đang trực tuyến"
            >
              <Users className="w-3 h-3 text-sky-400" />
              <span>
                {gameMode === 'PUBLIC'
                  ? `${Math.max(tanks.filter((t) => !t.isBot).length, lobbyInfo.publicOnlineCount, isInGame ? 1 : 0)} Xe`
                  : `${tanks.length || (isInGame ? 1 : 0)} Xe`}
              </span>
            </div>
          </div>

          {/* Center: 3. Đổi kích thước (Adaptive Screen Zoom) & 4. Ping */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Đổi kích thước */}
            <div
              className="flex items-center bg-slate-800/90 rounded-lg px-1 py-0.5 border border-slate-700/80 text-[10px] sm:text-xs shadow-sm"
              title="Tỉ lệ hiển thị chiến trường (Tự động thích ứng màn hình hoặc chỉnh tay)"
            >
              <button
                onClick={() => {
                  setIsAutoZoom(false);
                  setZoomScale((prev: number) => Math.max(0.48, Math.round(((isAutoZoom ? effectiveZoomScale : prev) - 0.08) * 100) / 100));
                }}
                className="p-0.5 sm:p-1 hover:text-white text-slate-400 rounded cursor-pointer transition-colors"
                title="Thu nhỏ (-)"
              >
                <Minus className="w-3 h-3" />
              </button>
              <select
                value={isAutoZoom ? 'AUTO' : zoomScale}
                onChange={(e) => {
                  if (e.target.value === 'AUTO') {
                    setIsAutoZoom(true);
                  } else {
                    setIsAutoZoom(false);
                    setZoomScale(Number(e.target.value));
                  }
                }}
                className="bg-transparent text-sky-300 font-mono text-[10px] sm:text-xs font-bold px-0.5 cursor-pointer focus:outline-none text-center"
              >
                <option value="AUTO" className="bg-slate-900 text-amber-300 font-bold">
                  Auto ({Math.round(effectiveZoomScale * 100)}%)
                </option>
                <option value={0.5} className="bg-slate-900 text-slate-200">50%</option>
                <option value={0.6} className="bg-slate-900 text-slate-200">60%</option>
                <option value={0.67} className="bg-slate-900 text-slate-200">67%</option>
                <option value={0.75} className="bg-slate-900 text-slate-200">75% (Chuẩn)</option>
                <option value={0.9} className="bg-slate-900 text-slate-200">90%</option>
                <option value={1.0} className="bg-slate-900 text-slate-200">100%</option>
                <option value={1.25} className="bg-slate-900 text-slate-200">125%</option>
              </select>
              <button
                onClick={() => {
                  setIsAutoZoom(false);
                  setZoomScale((prev: number) => Math.min(1.25, Math.round(((isAutoZoom ? effectiveZoomScale : prev) + 0.08) * 100) / 100));
                }}
                className="p-0.5 sm:p-1 hover:text-white text-slate-400 rounded cursor-pointer transition-colors"
                title="Phóng to (+)"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Ping */}
            <div
              className={`flex items-center gap-1 rounded-lg bg-slate-800/80 border border-slate-700/70 font-mono tabular-nums shadow-sm ${
                isShortLandscape ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
              }`}
              title="Độ trễ mạng qua WebSocket (Ping)"
            >
              <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${ping < 80 ? 'bg-emerald-400 animate-pulse' : ping < 150 ? 'bg-amber-400' : 'bg-rose-400'}`} />
              <span className={ping < 80 ? 'text-emerald-400 font-bold' : ping < 150 ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold'}>
                {ping}ms
              </span>
            </div>

            {/* Dynamic Weather Ambient Status */}
            <div
              className={`flex items-center gap-1 rounded-lg bg-slate-800/80 border border-slate-700/70 font-mono shadow-sm select-none ${
                isShortLandscape ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
              }`}
              title={`Thời tiết chiến trường: ${WEATHER_CONFIGS[WEATHER_CYCLE[currentWeatherIndex]].vietnameseName}`}
            >
              <span className="text-xs sm:text-sm">{WEATHER_CONFIGS[WEATHER_CYCLE[currentWeatherIndex]].icon}</span>
              <span className="text-slate-200 font-bold hidden lg:inline">
                {WEATHER_CONFIGS[WEATHER_CYCLE[currentWeatherIndex]].vietnameseName}
              </span>
            </div>
          </div>

          {/* Right: Loa, Âm thanh, Gara xe, Help, Đổi xe, Khán giả, Thoát, Ẩn thanh */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Quick Aim Mode Toggle: Movement Direction (Tank 1990) vs Mouse 360° */}
            <button
              type="button"
              onClick={() => {
                const nextMode = aimMode === 'MOVEMENT' ? 'MOUSE' : 'MOVEMENT';
                setAimMode(nextMode);
                sounds.playPowerUp();
                setWeatherToast({
                  name: nextMode === 'MOVEMENT' ? 'BẮN THEO HƯỚNG XE' : 'BẮN THEO CHUỘT 360°',
                  icon: nextMode === 'MOVEMENT' ? '🎯' : '🖱️',
                  description: nextMode === 'MOVEMENT'
                    ? 'Pháo tự động nhắm theo hướng xe chạy (Tank 1990). Bấm Space / J / Chuột để bắn!'
                    : 'Pháo xoay tự do 360° theo con trỏ chuột.',
                  themeColor: nextMode === 'MOVEMENT' ? '#10b981' : '#38bdf8',
                });
              }}
              className={`flex items-center gap-1 font-bold rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95 border ${
                isShortLandscape ? 'px-1.5 py-1 text-[10px]' : 'px-2.5 py-1.5 text-xs'
              } ${
                aimMode === 'MOVEMENT'
                  ? 'bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border-emerald-500/60'
                  : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border-sky-500/40'
              }`}
              title="Đổi chế độ ngắm bắn: Theo hướng di chuyển (Tank 1990) / Theo chuột 360° (Phím tắt C)"
            >
              <Target className="w-3 h-3 text-emerald-400" />
              <span className="hidden xl:inline">{aimMode === 'MOVEMENT' ? 'Bắn Hướng Xe' : 'Bắn Chuột 360°'}</span>
              <span className="xl:hidden">{aimMode === 'MOVEMENT' ? 'Hướng' : 'Chuột'}</span>
              {!isShortLandscape && (
                <kbd className="px-1 py-0.2 bg-slate-900/90 border border-slate-700 rounded text-[9px] text-amber-300 font-mono">C</kbd>
              )}
            </button>

            {/* Gara Tùy Biến Xe Tăng & Skin Ngoại Trang */}
            <button
              onClick={() => setIsGarageOpen(true)}
              className={`flex items-center gap-1 font-bold text-fuchsia-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-fuchsia-500/50 hover:border-fuchsia-400 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                isShortLandscape ? 'px-1.5 py-1 text-[10px]' : 'px-2.5 py-1.5 text-xs'
              }`}
              title="Gara Tùy Biến Xe Tăng & Skin Ngoại Trang"
            >
              <Palette className="w-3 h-3 text-fuchsia-400" />
              <span>Gara</span>
            </button>

            {/* Quick Mute Loa */}
            <button
              onClick={handleToggleMute}
              className={`rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/70 shadow-sm ${
                isShortLandscape ? 'p-1' : 'p-2'
              }`}
              title={isMuted ? 'Bật âm thanh (Loa)' : 'Tắt âm thanh (Loa)'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-sky-400" />}
            </button>

            {/* Help */}
            <button
              onClick={() => setIsControlsModalOpen(true)}
              className={`rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/70 shadow-sm ${
                isShortLandscape ? 'p-1' : 'p-2'
              }`}
              title="Hướng dẫn & Phím tắt (Help)"
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
            </button>

            {/* Đổi xe */}
            <button
              onClick={() => setIsInGame(false)}
              className={`flex items-center gap-1 font-bold text-amber-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-amber-500/50 hover:border-amber-400 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                isShortLandscape ? 'px-1.5 py-1 text-[10px]' : 'px-2.5 py-1.5 text-xs'
              }`}
              title="Đổi loại xe tăng hoặc đổi chế độ"
            >
              <Shield className="w-3 h-3 text-amber-400" />
              <span>Đổi Xe</span>
            </button>

            {/* Chuyển đổi Khán Giả / Tham Chiến */}
            <button
              onClick={() => handleToggleSpectator()}
              className={`flex items-center gap-1 font-bold rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95 border ${
                isShortLandscape ? 'px-1.5 py-1 text-[10px]' : 'px-2.5 py-1.5 text-xs'
              } ${
                isSpectator
                  ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-400 shadow-sky-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white border-sky-500/40'
              }`}
              title={isSpectator ? 'Tham gia chiến đấu ngay' : 'Chuyển sang chế độ khán giả xem trận'}
            >
              {isSpectator ? <Swords className="w-3 h-3 text-white" /> : <Eye className="w-3 h-3 text-sky-400" />}
              <span>{isSpectator ? 'Vào Đấu' : 'Xem Trận'}</span>
            </button>

            {/* Thoát Game / Rời Trận */}
            <button
              onClick={handleExitGame}
              className={`flex items-center gap-1 font-bold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/50 hover:border-rose-400 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                isShortLandscape ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'
              }`}
              title="Thoát trận đấu và quay về sảnh chờ"
            >
              <LogOut className="w-3 h-3 text-rose-400" />
              <span>{isShortLandscape ? 'Thoát' : 'Thoát Game'}</span>
            </button>

            {/* Ẩn thanh */}
            <button
              onClick={() => setShowTopBar(false)}
              className={`rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/70 shadow-sm ${
                isShortLandscape ? 'p-1' : 'px-2.5 py-1.5 text-xs flex items-center gap-1'
              }`}
              title="Ẩn thanh công cụ (Phím U)"
            >
              <ChevronUp className="w-3.5 h-3.5 text-sky-400" />
              {!isShortLandscape && <span className="hidden md:inline">Ẩn Thanh (U)</span>}
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
            Zoom {Math.round(effectiveZoomScale * 100)}%
          </div>

          <div
            className="bg-slate-900/90 border border-slate-700/80 text-slate-300 px-2.5 py-1 rounded-full text-[11px] font-mono shadow-xl backdrop-blur-md flex items-center gap-1.5 select-none"
            title={`Thời tiết: ${WEATHER_CONFIGS[WEATHER_CYCLE[currentWeatherIndex]].vietnameseName}`}
          >
            <span>{WEATHER_CONFIGS[WEATHER_CYCLE[currentWeatherIndex]].icon}</span>
            <span>{WEATHER_CONFIGS[WEATHER_CYCLE[currentWeatherIndex]].vietnameseName}</span>
          </div>

          <button
            onClick={() => setIsGarageOpen(true)}
            className="flex items-center gap-1 bg-fuchsia-950/80 hover:bg-fuchsia-900 border border-fuchsia-500/60 text-fuchsia-300 px-2.5 py-1 rounded-full text-xs shadow-xl backdrop-blur-md cursor-pointer transition-all active:scale-95"
            title="Mở Gara Tùy Biến Xe Tăng"
          >
            <Palette className="w-3 h-3 text-fuchsia-400" />
            <span>Gara</span>
          </button>

          <button
            onClick={() => setIsAudioSettingsOpen(true)}
            className="flex items-center gap-1 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/60 text-amber-300 px-2.5 py-1 rounded-full text-xs shadow-xl backdrop-blur-md cursor-pointer transition-all active:scale-95"
            title="Tùy chỉnh Âm thanh"
          >
            <Sliders className="w-3 h-3 text-amber-400" />
            <span>Âm Thanh</span>
          </button>

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
          zoomScale={effectiveZoomScale}
          isSpectator={isSpectator}
          spectatorTargetId={spectatorTargetId}
          freeCameraPos={freeCameraPos}
          onSelectSpectatorTarget={(id) => setSpectatorTargetId(id)}
          currentWeather={WEATHER_CYCLE[currentWeatherIndex]}
          focusBeacon={focusBeacon}
          onPanCamera={handlePanCamera}
          onFocusWorldPos={handleFocusWorldPos}
          isFreeCameraActive={isFreeCameraActive}
          storm={storm}
          boss={boss}
          bases={bases}
          gameMode={gameMode}
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

        {/* Top-Center Dedicated Game Mode Tactical Status Widget */}
        {isInGame && (
          <div className={`absolute left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex flex-col items-center gap-1 max-w-xl w-[94%] sm:w-auto ${
            isShortLandscape ? 'top-1' : 'top-2.5 sm:top-3'
          }`}>
            {/* 1. BATTLE ROYALE MODE HUD */}
            {(gameMode === 'BATTLE_ROYALE' || (storm && storm.active)) && (
              <div className="flex flex-col items-center gap-1">
                <div className={`bg-slate-950/92 border border-purple-500/70 shadow-2xl shadow-purple-500/20 backdrop-blur-md rounded-2xl flex items-center ${
                  isShortLandscape ? 'px-2 py-0.5 gap-2 text-[10px]' : 'px-3.5 py-1.5 gap-2.5 sm:gap-3.5 text-xs'
                }`}>
                  <div className="flex items-center gap-1 text-purple-300 font-mono font-black tracking-tight whitespace-nowrap">
                    <Zap className={`${isShortLandscape ? 'w-3 h-3' : 'w-4 h-4'} text-purple-400 animate-pulse`} />
                    <span>BO G.Đ {storm?.phase || 1}</span>
                  </div>

                  <div className="h-3 w-px bg-slate-800" />

                  {storm?.isShrinking ? (
                    <div className="text-amber-300 font-bold flex items-center gap-1 animate-pulse whitespace-nowrap">
                      <AlertTriangle className={`${isShortLandscape ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-400`} />
                      <span>THU HẸP! ({Math.round(storm.currentRadius)}m)</span>
                    </div>
                  ) : (
                    <div className="text-sky-300 font-mono whitespace-nowrap">
                      <span>Co: </span>
                      <strong className="text-white font-bold">{Math.round(storm?.phaseTimeLeft || 60)}s</strong>
                      <span className="text-slate-400 text-[9px] ml-0.5">({Math.round(storm?.currentRadius || 2400)}m)</span>
                    </div>
                  )}

                  <div className="h-3 w-px bg-slate-800" />

                  <div className="flex items-center gap-1 text-emerald-300 font-mono font-bold whitespace-nowrap">
                    <Users className={`${isShortLandscape ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-emerald-400`} />
                    <span>{aliveCount || tanks.filter((t) => !t.isDead).length}/{totalParticipants || tanks.length} Xe</span>
                  </div>
                </div>

                {myTank?.inStorm && !myTank.isDead && (
                  <div className="bg-rose-950/95 border border-rose-500 text-rose-200 px-2.5 py-0.5 rounded-full text-[10px] font-black animate-bounce shadow-xl flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span>⚠️ NGOÀI VÒNG BO (-{Math.round(storm?.dps || 5)} HP/s)!</span>
                  </div>
                )}
              </div>
            )}

            {/* 2. TEAM DEATHMATCH MODE HUD */}
            {gameMode === 'TEAM_DEATHMATCH' && teamScore && (
              <div className="flex flex-col items-center gap-1">
                <div className={`bg-slate-950/92 border border-slate-700/80 shadow-2xl backdrop-blur-md rounded-2xl flex flex-col items-center ${
                  isShortLandscape ? 'px-2.5 py-1 min-w-[230px] gap-1 text-[10px]' : 'px-4 py-2 min-w-[290px] sm:min-w-[360px] gap-1.5 text-xs'
                }`}>
                  <div className="w-full flex items-center justify-between font-mono font-black">
                    <div className="flex items-center gap-1 text-rose-400">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <span>ĐỎ: {teamScore.red}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700/60">
                      30 KILLS
                    </span>
                    <div className="flex items-center gap-1 text-sky-400">
                      <span>XANH: {teamScore.blue}</span>
                      <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                    </div>
                  </div>

                  {/* Dual tug-of-war bar towards 30 kills */}
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                    <div
                      className="h-full bg-rose-600 transition-all duration-300"
                      style={{ width: `${Math.min(50, (teamScore.red / 30) * 50)}%` }}
                    />
                    <div className="flex-1 bg-slate-950" />
                    <div
                      className="h-full bg-sky-600 transition-all duration-300 ml-auto"
                      style={{ width: `${Math.min(50, (teamScore.blue / 30) * 50)}%` }}
                    />
                  </div>

                  {myTank?.inHealingBase && (
                    <div className="text-[10px] text-emerald-300 font-bold flex items-center gap-1 animate-pulse">
                      <span>💚 Hồi máu trong căn cứ (+10 HP/s)</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. BOSS RAID MODE HUD */}
            {(gameMode === 'BOSS_RAID' || (boss && boss.isAlive)) && (
              <div className="flex flex-col items-center gap-1">
                {boss && boss.isAlive ? (
                  <div className={`bg-slate-950/95 border border-amber-500/80 shadow-2xl shadow-amber-500/20 backdrop-blur-md rounded-2xl flex flex-col items-center ${
                    isShortLandscape ? 'px-2.5 py-1 min-w-[240px] gap-1 text-[10px]' : 'px-4 py-2 min-w-[300px] sm:min-w-[420px] gap-1.5 text-xs'
                  }`}>
                    <div className="w-full flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-400 font-mono font-black">
                        <Skull className={`${isShortLandscape ? 'w-3 h-3' : 'w-4 h-4'} text-amber-400 animate-bounce`} />
                        <span>BOSS LEVIATHAN</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">
                        {Math.ceil(boss.hp)} / {boss.maxHp} HP
                      </span>
                    </div>

                    {/* Boss HP Bar */}
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-amber-500/40 p-0.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-400 transition-all duration-150"
                        style={{ width: `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950/90 border border-amber-500/40 px-2.5 py-1 rounded-xl text-[10px] sm:text-xs flex items-center gap-1.5 text-amber-300 shadow-lg">
                    <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      Boss hồi sinh: <strong className="text-white font-mono">{Math.round(boss?.respawnTimeLeft || 0)}s</strong>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Winner Winner Chicken Dinner Modal Celebration */}
        {brWinner && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-b from-amber-950/90 via-slate-900 to-slate-950 border-2 border-amber-400 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl shadow-amber-500/30 space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center animate-bounce">
                <Crown className="w-10 h-10 text-amber-300" />
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase font-mono font-bold text-amber-400 tracking-widest">
                  BATTLE ROYALE CHAMPION
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white font-mono">
                  WINNER WINNER CHICKEN DINNER!
                </h2>
              </div>
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-amber-500/40 text-left space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 font-mono">Chiến binh chiến thắng:</span>
                  <span className="font-bold text-amber-300 text-base">{brWinner.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Tổng số hạ gục:</span>
                  <span className="font-mono text-emerald-400 font-bold">{brWinner.kills} hạ gục</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 animate-pulse">
                🔄 Trận đấu sinh tồn mới sẽ tự động tái thiết lập trong giây lát...
              </p>
            </div>
          </div>
        )}

        {/* Team Deathmatch Winner Modal Celebration */}
        {teamScore && teamScore.winner && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-300">
            <div
              className={`border-2 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-4 ${
                teamScore.winner === 'RED'
                  ? 'bg-rose-950/90 border-rose-500 shadow-rose-500/30'
                  : 'bg-sky-950/90 border-sky-500 shadow-sky-500/30'
              }`}
            >
              <div className="mx-auto w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-4xl animate-bounce">
                🏆
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-mono">
                {teamScore.winner === 'RED' ? '🔴 ĐỘI ĐỎ CHIẾN THẮNG!' : '🔵 ĐỘI XANH CHIẾN THẮNG!'}
              </h2>
              <p className="text-xs text-slate-300">
                Đã hoàn thành xuất sắc 30 điểm hạ gục trước đối phương!
              </p>
              <p className="text-xs text-slate-400 animate-pulse font-mono">
                🔄 Vòng đấu mới sẽ tự động bắt đầu sau giây lát...
              </p>
            </div>
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
                    storm={storm}
                    boss={boss}
                    bases={bases}
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
                  storm={storm}
                  boss={boss}
                  bases={bases}
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
            <div className={`z-20 flex flex-col gap-1.5 pointer-events-none ${
              isShortLandscape ? 'absolute top-11 left-3' : 'absolute bottom-4 left-4 gap-3'
            }`}>
              {/* Player Tank Health & Shield Gauge with Hide/Show */}
              {myTank && (
                <>
                  {showStats ? (
                    isShortLandscape ? (
                      <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl px-2.5 py-1 shadow-xl backdrop-blur-md pointer-events-auto select-none flex items-center gap-2 text-xs font-mono">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            myTank.isDead
                              ? 'bg-rose-500'
                              : myTank.hp < myTank.maxHp * 0.3
                              ? 'bg-rose-500 animate-pulse'
                              : myTank.shield > 0
                              ? 'bg-sky-400 animate-pulse'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <span className="font-bold text-white whitespace-nowrap">
                          HP {Math.max(0, Math.ceil(myTank.hp))}/{myTank.maxHp}
                        </span>
                        <span className="text-slate-600">|</span>
                        <span className="text-emerald-400 font-bold whitespace-nowrap">⚔️ {myTank.kills}</span>
                        <span className="text-slate-600">|</span>
                        <span className="text-amber-400 font-bold whitespace-nowrap">🔥 {myTank.streak}</span>
                        <button
                          onClick={() => setShowStats(false)}
                          className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer ml-1"
                          title="Ẩn status"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
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
                  )
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
            <div className={`absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-in fade-in duration-200 ${
              isShortLandscape ? 'bottom-1 scale-75 sm:scale-85 origin-bottom' : 'bottom-4 slide-in-from-bottom-3'
            }`}>
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

            {/* Roguelike Level Up Perk Choice Modal Overlay */}
            {myTank && myTank.pendingPerkChoices && myTank.pendingPerkChoices.length > 0 && !isSpectator && (
              <PerkSelectModal
                level={myTank.level || 1}
                perkChoices={myTank.pendingPerkChoices}
                onSelectPerk={handleSelectPerk}
              />
            )}
          </>
        )}
      </div>



      {/* 4. Controls & Help Modal */}
      <HelpModal isOpen={isControlsModalOpen} onClose={() => setIsControlsModalOpen(false)} />

      {/* 5. In-Game Garage / Skin Workshop Modal */}
      <GarageModal
        isOpen={isGarageOpen}
        onClose={() => setIsGarageOpen(false)}
        tankClass={profileRef.current.tankClass}
        currentSkin={userSkin}
        currentTrail={userTrail}
        currentDecal={userDecal}
        tankColor={profileRef.current.color}
        onSaveCosmetics={handleSaveCosmetics}
      />

      {/* 6. In-Game Audio & Tactical Announcer Settings Modal */}
      {isAudioSettingsOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">ÂM THANH CHIẾN TRƯỜNG</h3>
                  <p className="text-[11px] text-slate-400">Tùy chỉnh nhạc nền chiến trận & giọng đọc chiến sự</p>
                </div>
              </div>
              <button
                onClick={() => setIsAudioSettingsOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 1. Epic Military Battle BGM Slider */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-amber-400" />
                    <span>Nhạc Nền Chiến Trận (BGM)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const isPlaying = sounds.toggleMusic();
                      setIsMusicPlaying(isPlaying);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                      isMusicPlaying
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {isMusicPlaying ? 'Đang Phát 🔊' : 'Đang Tắt 🔇'}
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={musicVol}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMusicVol(val);
                    sounds.setMusicVolume(val / 100);
                  }}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Im lặng</span>
                  <span className="text-amber-300 font-bold">{musicVol}%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* 2. Sound Effects (SFX) Slider */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-sky-400" />
                    <span>Hiệu Ứng Bắn & Đạn Pháo (SFX)</span>
                  </span>
                  <span className="font-mono text-sky-300 text-xs font-bold">{sfxVol}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sfxVol}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSfxVol(val);
                    sounds.setSfxVolume(val / 100);
                  }}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              {/* 3. Tactical Voice Announcer Toggle */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Giọng Phát Thanh Viên (Voice)</div>
                    <div className="text-[10px] text-slate-400">Đọc chuỗi hạ gục, thời tiết, boss xuất hiện, kỹ năng</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !voiceEnabled;
                    setVoiceEnabled(next);
                    sounds.setVoiceEnabled(next);
                    if (next) {
                      sounds.announce('Tactical Announcer Activated', 'Đã kích hoạt giọng phát thanh viên chiến trường!');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                    voiceEnabled
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {voiceEnabled ? 'BẬT' : 'TẮT'}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAudioSettingsOpen(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Đóng Cài Đặt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
