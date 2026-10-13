import { recordMatchCompletion, getPlayerStats, PlayerRecordStats } from './utils/playerStats';
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
  CustomRoomSummary,
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
  MatchType,
  RankTier,
  getRankFromRp,
  QueueMatchedPlayer,
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
import { FriendsModal } from './components/FriendsModal';
import { MatchmakingModal } from './components/MatchmakingModal';
import { InGameSettingsModal } from './components/InGameSettingsModal';
import { AccountModal } from './components/AccountModal';
import { UserAccount, getCurrentUser, saveCurrentUser } from './utils/auth';
import { OrientationGuard } from './components/OrientationGuard';
import { sounds } from './utils/audio';
import { haptics } from './utils/haptics';
import {
  Volume2,
  VolumeX,
  Palette,
  Gamepad2,
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
  Smartphone,
  Settings,
  MessageSquare,
} from 'lucide-react';

export default function App() {
  const [isInGame, setIsInGame] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [worldSize, setWorldSize] = useState({ width: 4200, height: 4200 });
  const [is25DMode, setIs25DMode] = useState(true);
  const [isMobilePortrait, setIsMobilePortrait] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isPortrait = window.innerHeight > window.innerWidth;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmall = window.innerWidth <= 768;
    return isPortrait && (isSmall || isTouch);
  });
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
    customRooms?: CustomRoomSummary[];
  }>({
    totalSockets: 0,
    publicOnlineCount: 0,
    publicPlayers: [],
    customRooms: [],
  });
  const [recentCombatEvent, setRecentCombatEvent] = useState<CombatEvent | null>(null);

  // Show/Hide UI Toggles
  // On mobile: ONLY the small map is displayed by default; notifications (killfeed),
  // lists (leaderboard/scoreboard), and detailed stats are hidden until user taps their buttons.
  const isMobileDevice = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth <= 768 ||
      (window.innerHeight <= 560 && window.innerWidth > window.innerHeight)
    );
  }, []);

  const [isMobile, setIsMobile] = useState(() => isMobileDevice());
  const lastReadChatCountRef = useRef(0);

  const [showTopBar, setShowTopBar] = useState(true);
  const [mapMode, setMapMode] = useState<'small' | 'large' | 'hidden'>('small');
  const [showLeaderboard, setShowLeaderboard] = useState(() => !isMobileDevice());
  const [showStats, setShowStats] = useState(() => !isMobileDevice());
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

  const unreadChatCount = isChatOpen
    ? 0
    : Math.max(0, chatMessages.length - lastReadChatCountRef.current);

  useEffect(() => {
    if (isChatOpen) {
      lastReadChatCountRef.current = chatMessages.length;
    }
  }, [isChatOpen, chatMessages.length]);

  const [isControlsModalOpen, setIsControlsModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getIsMuted());
  const [botCount, setBotCount] = useState(7);

  // Match Category: Ranked (RP) vs Casual
  const [matchType, setMatchType] = useState<MatchType>('CASUAL');
  const [playerRankRp, setPlayerRankRp] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tank_player_rp');
      return saved ? Number(saved) : 850;
    } catch {
      return 850;
    }
  });
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);

  // 6-Player 3v3 Matchmaking Queue State
  const [queueStatus, setQueueStatus] = useState<{
    inQueue: boolean;
    matchType: MatchType;
    currentCount: number;
    targetCount: number;
    elapsedSeconds: number;
    estimatedSeconds: number;
    players: QueueMatchedPlayer[];
  }>({
    inQueue: false,
    matchType: 'CASUAL',
    currentCount: 0,
    targetCount: 6,
    elapsedSeconds: 0,
    estimatedSeconds: 30,
    players: [],
  });

  const [matchFoundData, setMatchFoundData] = useState<{
    matchType: MatchType;
    roomId: string;
    myTeam: Team;
    redTeam: QueueMatchedPlayer[];
    blueTeam: QueueMatchedPlayer[];
    countdown: number;
  } | null>(null);

  // Cosmetics & Workshop state
  const [userSkin, setUserSkin] = useState<TankSkinId>(() => (localStorage.getItem('tank_skin') as TankSkinId) || 'DEFAULT');
  const [userTrail, setUserTrail] = useState<BulletTrailId>(() => (localStorage.getItem('tank_trail') as BulletTrailId) || 'STANDARD');
  const [userDecal, setUserDecal] = useState<RoofDecalId>(() => (localStorage.getItem('tank_decal') as RoofDecalId) || 'FLAG_VIETNAM');
  const [isGarageOpen, setIsGarageOpen] = useState(false);

  // Audio Settings & In-Game Settings Modal state
  const [isInGameSettingsOpen, setIsInGameSettingsOpen] = useState(false);
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
    tacticalTitle?: string;
    tacticalDesc?: string;
  } | null>(null);

  // User Account & Google Cloud Auth (Show login modal immediately on first visit)
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => getCurrentUser());
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(() => {
    try {
      const hasSeenLogin = localStorage.getItem('tank_auth_initial_shown');
      return !hasSeenLogin;
    } catch {
      return true;
    }
  });
  const [accountToast, setAccountToast] = useState<{ show: boolean; text: string } | null>(null);
  const [homePageTab, setHomePageTab] = useState<'home' | 'profile' | 'modes' | 'arsenal' | 'garage' | 'medals' | 'settings'>('home');

  // Spectator & Free Camera Panning States
  const [isSpectator, setIsSpectator] = useState(false);
  const [spectatorTargetId, setSpectatorTargetId] = useState<string | 'free'>('free');
  const [freeCameraPos, setFreeCameraPos] = useState({ x: 2100, y: 2100 });
  const [focusBeacon, setFocusBeacon] = useState<{
    x: number;
    y: number;
    timestamp: number;
    pingType?: 'ATTACK' | 'DEFEND' | 'GATHER';
    senderName?: string;
  } | null>(null);
  const [beaconAlert, setBeaconAlert] = useState<{
    senderName: string;
    pingLabel: string;
    pingType: 'ATTACK' | 'DEFEND' | 'GATHER';
    timestamp: number;
  } | null>(null);
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
    matchType?: MatchType;
    rankTier?: RankTier;
    rankRp?: number;
  }>({
    name: currentUser?.name || 'Chỉ Huy',
    color: '#2563eb',
    tankClass: 'STRIKER',
    mode: 'PUBLIC',
    botCount: 5,
    roomId: 'public',
    matchType: 'CASUAL',
    rankRp: 850,
  });

  // Synchronize profileRef.current.name with currentUser.name whenever logged-in user changes
  useEffect(() => {
    if (currentUser?.name) {
      profileRef.current.name = currentUser.name;
    }
  }, [currentUser?.name]);

  // Keep player RP synchronized from live tank state
  useEffect(() => {
    const myTank = tanks.find((t) => t.id === myPlayerId);
    if (myTank && typeof myTank.rankRp === 'number' && myTank.rankRp !== playerRankRp) {
      setPlayerRankRp(myTank.rankRp);
      try {
        localStorage.setItem('tank_player_rp', String(myTank.rankRp));
      } catch {
        // ignore
      }
    }
  }, [tanks, myPlayerId, playerRankRp]);

  // Keep isInGameRef synchronized and ensure clean mobile HUD on battle start
  useEffect(() => {
    isInGameRef.current = isInGame;
    if (isInGame && isMobileDevice()) {
      setShowLeaderboard(false);
      setShowKillfeed(false);
      setShowStats(false);
    }
  }, [isInGame, isMobileDevice]);

  // Viewport resize tracking for short landscape mobile scaling
  useEffect(() => {
    const handleViewport = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmall = window.innerWidth <= 768;
      setIsMobilePortrait(isPortrait && (isSmall || isTouch));
      const isShort = window.innerHeight <= 620 && window.innerWidth > window.innerHeight;
      setIsShortLandscape(isShort);
      setIsMobile(isTouch || isSmall || (window.innerHeight <= 620 && window.innerWidth > window.innerHeight));
    };
    handleViewport();
    window.addEventListener('resize', handleViewport);
    window.addEventListener('orientationchange', handleViewport);
    return () => {
      window.removeEventListener('resize', handleViewport);
      window.removeEventListener('orientationchange', handleViewport);
    };
  }, []);

  // Yêu cầu: Khi switch qua màn dọc thì ngắt kết nối vào lại home page
  useEffect(() => {
    if (isInGame && isMobilePortrait) {
      sounds.stopBgm();
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'LEAVE' }));
      }
      setIsInGame(false);
      setIsSpectator(false);
      setIsFreeCameraActive(false);
      setAccountToast({
        show: true,
        text: '📱 Đã ngắt kết nối và quay lại trang chủ do chuyển sang màn hình dọc.',
      });
      setTimeout(() => setAccountToast(null), 4000);
    }
  }, [isInGame, isMobilePortrait]);

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
              tacticalTitle: cfg.tacticalEffectTitle,
              tacticalDesc: cfg.tacticalEffectDesc,
            });
            sounds.playPowerUp();
            sounds.announce(
              `Weather change: ${cfg.name}`,
              `Thời tiết chiến trường: ${cfg.vietnameseName}! ${cfg.tacticalEffectTitle}. ${cfg.tacticalEffectDesc}`
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
        tacticalTitle: cfg.tacticalEffectTitle,
        tacticalDesc: cfg.tacticalEffectDesc,
      });
      sounds.playPowerUp();
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'SET_WEATHER', weather: nextWeatherType }));
      }
      return nextIdx;
    });
    setWeatherSecondsLeft(60);
  };

  const handleFocusWorldPos = (
    x: number,
    y: number,
    pingType: 'ATTACK' | 'DEFEND' | 'GATHER' = 'ATTACK'
  ) => {
    setFreeCameraPos({ x, y });
    setIsFreeCameraActive(true);
    setFocusBeacon({
      x,
      y,
      timestamp: Date.now(),
      pingType,
      senderName: profileRef.current.name,
    });
    sounds.playPowerUp();

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'TEAM_PING',
          x,
          y,
          pingType,
        })
      );
    }
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

  const handleUpgradeSkill = (skill: SkillType) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const msg: ClientMessage = {
        type: 'UPGRADE_SKILL',
        skill,
      };
      socketRef.current.send(JSON.stringify(msg));
      sounds.playPowerUp();
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
                customRooms: msg.customRooms || [],
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

              // Synchronize authoritative weather from server snapshot
              if (msg.snapshot.weather) {
                const w = msg.snapshot.weather;
                const wIdx = WEATHER_CYCLE.indexOf(w);
                if (wIdx !== -1 && wIdx !== currentWeatherIndex) {
                  setCurrentWeatherIndex(wIdx);
                  const cfg = WEATHER_CONFIGS[w];
                  setWeatherToast({
                    name: cfg.vietnameseName,
                    icon: cfg.icon,
                    description: cfg.description,
                    themeColor: cfg.themeColor,
                    tacticalTitle: cfg.tacticalEffectTitle,
                    tacticalDesc: cfg.tacticalEffectDesc,
                  });
                }
              }
              if (typeof msg.snapshot.weatherSecondsLeft === 'number') {
                setWeatherSecondsLeft(msg.snapshot.weatherSecondsLeft);
              }
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

            case 'QUEUE_STATUS': {
              setQueueStatus({
                inQueue: msg.inQueue,
                matchType: msg.matchType,
                currentCount: msg.currentCount,
                targetCount: msg.targetCount,
                elapsedSeconds: msg.elapsedSeconds,
                estimatedSeconds: msg.estimatedSeconds,
                players: msg.players || [],
              });
              if (!msg.inQueue) {
                setMatchFoundData(null);
              }
              break;
            }

            case 'QUEUE_MATCH_FOUND': {
              setMatchFoundData({
                matchType: msg.matchType,
                roomId: msg.roomId,
                myTeam: msg.myTeam,
                redTeam: msg.redTeam,
                blueTeam: msg.blueTeam,
                countdown: msg.countdown || 3,
              });
              sounds.playPowerUp();
              sounds.announce('Match Found! Preparing for battle...', 'Trận đấu 6 người đã tìm thấy! Chuẩn bị xung trận!');
              break;
            }

            case 'TEAM_BEACON': {
              setFocusBeacon({
                x: msg.x,
                y: msg.y,
                timestamp: msg.timestamp,
                pingType: msg.pingType || 'ATTACK',
                senderName: msg.senderName,
              });
              sounds.playRadioBeep();
              const pingLabel =
                msg.pingType === 'DEFEND'
                  ? 'PHÒNG THỦ VỊ TRÍ'
                  : msg.pingType === 'GATHER'
                  ? 'TẬP HỢP ĐỘI HÌNH'
                  : 'TẬP TRUNG HỎA LỰC';
              setBeaconAlert({
                senderName: msg.senderName,
                pingLabel,
                pingType: msg.pingType || 'ATTACK',
                timestamp: Date.now(),
              });
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

      // Hotkeys to Upgrade Skills (Cộng chiêu thức): 1 (Boost), 2 (Shield), 3 (Mine), 4 (Barrage)
      if (k === '1' || (e.ctrlKey && k === '1')) {
        const myT = tanks.find((t) => t.id === myPlayerId);
        if (myT && (myT.skillPoints || 0) > 0) {
          e.preventDefault();
          handleUpgradeSkill('BOOST');
          return;
        }
      }
      if (k === '2' || (e.ctrlKey && k === '2')) {
        const myT = tanks.find((t) => t.id === myPlayerId);
        if (myT && (myT.skillPoints || 0) > 0) {
          e.preventDefault();
          handleUpgradeSkill('SHIELD');
          return;
        }
      }
      if (k === '3' || (e.ctrlKey && k === '3')) {
        const myT = tanks.find((t) => t.id === myPlayerId);
        if (myT && (myT.skillPoints || 0) > 0) {
          e.preventDefault();
          handleUpgradeSkill('MINE');
          return;
        }
      }
      if (k === '4' || (e.ctrlKey && k === '4')) {
        const myT = tanks.find((t) => t.id === myPlayerId);
        if (myT && (myT.skillPoints || 0) > 0) {
          e.preventDefault();
          handleUpgradeSkill('BARRAGE');
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
    roofDecal?: RoofDecalId,
    chosenMatchType?: MatchType,
    enableBoss?: boolean,
    bossHp?: number,
    initialWeather?: WeatherType
  ) => {
    // Mobile Portrait Guard: Block entering game on portrait mode
    if (isMobilePortrait) {
      sounds.playRadioBeep();
      return;
    }

    const finalMatchType = chosenMatchType || matchType;
    setMatchType(finalMatchType);
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
    const currentRank = getRankFromRp(playerRankRp);

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
      matchType: finalMatchType,
      rankTier: currentRank.tier,
      rankRp: playerRankRp,
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
          matchType: finalMatchType,
          rankTier: currentRank.tier,
          rankRp: playerRankRp,
          enableBoss,
          bossHp,
          initialWeather,
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
    try {
      localStorage.setItem('tank_skin', cosmetics.skinId);
      localStorage.setItem('tank_trail', cosmetics.bulletTrail);
      localStorage.setItem('tank_decal', cosmetics.roofDecal);
    } catch (err) {
      console.warn('Failed to save to localStorage:', err);
    }
    profileRef.current.skinId = cosmetics.skinId;
    profileRef.current.bulletTrail = cosmetics.bulletTrail;
    profileRef.current.roofDecal = cosmetics.roofDecal;

    // Immediately update local tank state if alive/in-game
    setTanks((prev) =>
      prev.map((t) =>
        t.id === myPlayerId
          ? {
              ...t,
              skinId: cosmetics.skinId,
              bulletTrail: cosmetics.bulletTrail,
              roofDecal: cosmetics.roofDecal,
            }
          : t
      )
    );

    if (currentUser) {
      const updatedUser: UserAccount = {
        ...currentUser,
        skinId: cosmetics.skinId,
        bulletTrail: cosmetics.bulletTrail,
        roofDecal: cosmetics.roofDecal,
      };
      setCurrentUser(updatedUser);
      saveCurrentUser(updatedUser);
    }

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



  // Auto-join match when 6 players are found and countdown completes
  useEffect(() => {
    if (!matchFoundData) return;

    const timer = setTimeout(() => {
      handleJoinGame(
        profileRef.current.name,
        profileRef.current.color,
        profileRef.current.tankClass,
        'TEAM_DEATHMATCH',
        0,
        matchFoundData.roomId,
        false,
        matchFoundData.myTeam,
        profileRef.current.skinId || userSkin,
        profileRef.current.bulletTrail || userTrail,
        profileRef.current.roofDecal || userDecal,
        matchFoundData.matchType
      );
      setMatchFoundData(null);
      setQueueStatus((prev) => ({ ...prev, inQueue: false }));
    }, (matchFoundData.countdown || 3) * 1000);

    return () => clearTimeout(timer);
  }, [matchFoundData]);

  const handleStartQueue = (
    chosenMatchType: MatchType,
    playerName: string,
    playerColor: string,
    playerTankClass: TankClass,
    chosenSkin?: TankSkinId,
    chosenTrail?: BulletTrailId,
    chosenDecal?: RoofDecalId
  ) => {
    if (isMobilePortrait) {
      sounds.playRadioBeep();
      return;
    }
    const finalSkin = chosenSkin || userSkin;
    const finalTrail = chosenTrail || userTrail;
    const finalDecal = chosenDecal || userDecal;

    if (chosenSkin) setUserSkin(chosenSkin);
    if (chosenTrail) setUserTrail(chosenTrail);
    if (chosenDecal) setUserDecal(chosenDecal);

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      setMatchType(chosenMatchType);
      profileRef.current.name = playerName;
      profileRef.current.color = playerColor;
      profileRef.current.tankClass = playerTankClass;
      profileRef.current.matchType = chosenMatchType;
      profileRef.current.skinId = finalSkin;
      profileRef.current.bulletTrail = finalTrail;
      profileRef.current.roofDecal = finalDecal;
      profileRef.current.rankTier = getRankFromRp(playerRankRp).tier;
      profileRef.current.rankRp = playerRankRp;

      const queueMsg: ClientMessage = {
        type: 'QUEUE_JOIN',
        matchType: chosenMatchType,
        name: playerName,
        color: playerColor,
        tankClass: playerTankClass,
        skinId: finalSkin,
        bulletTrail: finalTrail,
        roofDecal: finalDecal,
        rankTier: getRankFromRp(playerRankRp).tier,
        rankRp: playerRankRp,
      };
      socketRef.current.send(JSON.stringify(queueMsg));
      setQueueStatus({
        inQueue: true,
        matchType: chosenMatchType,
        currentCount: 1,
        targetCount: 6,
        elapsedSeconds: 0,
        estimatedSeconds: 25,
        players: [
          {
            id: myPlayerId || 'me',
            name: playerName,
            color: playerColor,
            tankClass: playerTankClass,
            rankRp: playerRankRp,
            rankTier: getRankFromRp(playerRankRp).tier,
            team: 'RED',
            isBot: false,
          },
        ],
      });
      sounds.playPowerUp();
    }
  };

  const handleCancelQueue = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const cancelMsg: ClientMessage = { type: 'QUEUE_LEAVE' };
      socketRef.current.send(JSON.stringify(cancelMsg));
    }
    setQueueStatus((prev) => ({ ...prev, inQueue: false }));
    setMatchFoundData(null);
    sounds.playRadioBeep();
  };

  const handleAutoFillQueueBots = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const fillMsg: ClientMessage = { type: 'QUEUE_AUTO_FILL_BOTS' };
      socketRef.current.send(JSON.stringify(fillMsg));
      sounds.playPowerUp();
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

  const handleRecall = () => {
    sounds.playPowerUp();
    haptics.celebrate();
    if (myTank && !myTank.isDead) {
      const spawnX = myTank.team === 'RED' ? 300 : myTank.team === 'BLUE' ? worldSize.width - 300 : worldSize.width / 2;
      const spawnY = myTank.team === 'RED' ? 300 : myTank.team === 'BLUE' ? worldSize.height - 300 : worldSize.height / 2;
      myTank.x = spawnX;
      myTank.y = spawnY;
      myTank.hp = myTank.maxHp;
      myTank.shield = 100;
    }
    setWeatherToast({
      name: 'BIẾN VỀ CĂN CỨ',
      icon: '🌀',
      description: 'Đã dịch chuyển về căn cứ đồng minh và hồi phục toàn bộ Máu & Giáp!',
      themeColor: '#38bdf8',
    });
  };

  const handleQuickHeal = () => {
    sounds.playPowerUp();
    haptics.medium();
    if (myTank && !myTank.isDead) {
      myTank.hp = Math.min(myTank.maxHp, myTank.hp + 35);
    }
    setWeatherToast({
      name: 'BỔ TRỢ HỒI MÁU',
      icon: '💚',
      description: 'Hồi phục ngay +35 HP Máu xe tăng!',
      themeColor: '#10b981',
    });
  };

  const handleSignalPing = (type: 'ATTACK' | 'RETREAT' | 'GATHER') => {
    const text =
      type === 'ATTACK'
        ? '⚔️ [HIỆU LỆNH] Tấn công mục tiêu!'
        : type === 'RETREAT'
        ? '⚠️ [HIỆU LỆNH] Cảnh giác nguy hiểm, rút lui!'
        : '🚩 [HIỆU LỆNH] Toàn đội tập hợp!';
    handleSendMessage(text);
  };

  // Find my current tank
  const myTank = tanks.find((t) => t.id === myPlayerId);

  // Record match end stats (Wins, Losses, Kills, Deaths, Score, Streak)
  const recordedMatchRef = useRef<string | null>(null);
  useEffect(() => {
    if (!teamScore?.winner || !myTank) return;
    const matchKey = `${teamScore.winner}_${teamScore.red}_${teamScore.blue}`;
    if (recordedMatchRef.current === matchKey) return;
    recordedMatchRef.current = matchKey;

    const isWin = myTank.team === teamScore.winner;
    recordMatchCompletion({
      isRanked: matchType === 'RANKED',
      isWin,
      kills: myTank.kills || 0,
      deaths: myTank.deaths || 0,
      score: myTank.score || 0,
      streak: myTank.streak || 0,
    });
    console.log('[PlayerStats] Saved match result:', { isWin, kills: myTank.kills, score: myTank.score });
  }, [teamScore?.winner, myTank?.team, myTank?.kills, myTank?.deaths, myTank?.score, myTank?.streak, matchType]);

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
      <div className="relative w-screen h-[100dvh] max-h-[100dvh] h-screen overflow-hidden bg-slate-950 font-sans select-none flex flex-col">
        {/* Fullscreen Orientation Guard for Mobile: Prompts to rotate to landscape */}
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

        {/* Weather Tactical Transition Toast Banner */}
        {weatherToast && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 animate-in fade-in slide-in-from-top-4 duration-300 max-w-md w-[92%] pointer-events-auto">
            <div className="flex items-center justify-between gap-3 bg-slate-950/95 border-2 border-sky-500/80 text-white p-3 sm:p-3.5 rounded-2xl shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-2xl shrink-0 animate-bounce">{weatherToast.icon}</span>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-black text-white">{weatherToast.name}</span>
                    {weatherToast.tacticalTitle && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40">
                        {weatherToast.tacticalTitle}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs text-slate-300 font-medium leading-tight mt-0.5">
                    {weatherToast.tacticalDesc || weatherToast.description}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setWeatherToast(null)}
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
          customRooms={lobbyInfo.customRooms}
          initialMode={gameMode}
          currentWeather={WEATHER_CYCLE[currentWeatherIndex]}
          ping={ping}
          aimMode={aimMode}
          onAimModeChange={setAimMode}
          playerRankRp={playerRankRp}
          onUpdateRankRp={setPlayerRankRp}
          onStartQueue={handleStartQueue}
          userSkin={userSkin}
          userTrail={userTrail}
          userDecal={userDecal}
          onSaveCosmetics={handleSaveCosmetics}
          currentUser={currentUser}
          onOpenAccountModal={() => setIsAccountModalOpen(true)}
          onUserChange={(updated) => {
            setCurrentUser(updated);
            if (updated.rankRp) setPlayerRankRp(updated.rankRp);
            if (updated.skinId) setUserSkin(updated.skinId);
            if (updated.bulletTrail) setUserTrail(updated.bulletTrail);
            if (updated.roofDecal) setUserDecal(updated.roofDecal);
          }}
          initialTab={homePageTab}
        />

        {/* Account Toast Banner */}
        {accountToast?.show && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 animate-in fade-in slide-in-from-top-4 duration-300 max-w-md w-[92%] pointer-events-auto">
            <div className="bg-slate-950/95 border-2 border-emerald-500 text-emerald-200 font-mono font-bold text-xs p-3.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
              <span>{accountToast.text}</span>
              <button
                type="button"
                onClick={() => setAccountToast(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Account & Google Cloud Synchronization Modal */}
        <AccountModal
          isOpen={isAccountModalOpen}
          onClose={() => {
            try {
              localStorage.setItem('tank_auth_initial_shown', 'true');
            } catch (e) {}
            setIsAccountModalOpen(false);
          }}
          currentUser={currentUser}
          onUserChange={(updated) => {
            setCurrentUser(updated);
            if (updated.rankRp) setPlayerRankRp(updated.rankRp);
            if (updated.skinId) setUserSkin(updated.skinId);
            if (updated.bulletTrail) setUserTrail(updated.bulletTrail);
            if (updated.roofDecal) setUserDecal(updated.roofDecal);
          }}
          onToast={(text) => {
            setAccountToast({ show: true, text });
            setTimeout(() => setAccountToast(null), 3800);
          }}
          playerRankRp={playerRankRp}
          onOpenFullProfile={() => setHomePageTab('profile')}
        />

        {/* 6-Player 3v3 Matchmaking Waiting & Countdown Modal */}
        <MatchmakingModal
          isOpen={queueStatus.inQueue || !!matchFoundData}
          matchType={queueStatus.matchType}
          currentCount={queueStatus.currentCount}
          targetCount={queueStatus.targetCount}
          elapsedSeconds={queueStatus.elapsedSeconds}
          players={queueStatus.players}
          matchFoundData={matchFoundData}
          onCancel={handleCancelQueue}
          onAutoFillBots={handleAutoFillQueueBots}
        />
      </div>
    );
  }

  const currentRank = getRankFromRp(myTank?.rankRp ?? playerRankRp);

  return (
    <div className="relative w-screen h-[100dvh] max-h-[100dvh] h-screen overflow-hidden bg-slate-950 font-sans select-none flex flex-col">
      {/* Fullscreen Orientation Guard for Mobile: Restricts to Landscape mode */}
      <OrientationGuard />

      {/* Tactical Team Beacon Alert Banner */}
      {beaconAlert && Date.now() - beaconAlert.timestamp < 3800 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-none">
          <div
            className={`px-4 py-1.5 rounded-2xl border shadow-2xl backdrop-blur-md font-mono text-xs font-bold flex items-center gap-2 ${
              beaconAlert.pingType === 'DEFEND'
                ? 'bg-sky-950/95 border-sky-400 text-sky-200 shadow-sky-500/20'
                : beaconAlert.pingType === 'GATHER'
                ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200 shadow-emerald-500/20'
                : 'bg-amber-950/95 border-amber-400 text-amber-200 shadow-amber-500/20'
            }`}
          >
            <span className="animate-bounce">📍</span>
            <span className="text-white font-black">[{beaconAlert.senderName}]</span>
            <span>đã chỉ định {beaconAlert.pingLabel}!</span>
          </div>
        </div>
      )}

      {/* Weather Tactical Transition Toast Banner (In-game) */}
      {weatherToast && (
        <div className="fixed top-12 sm:top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-slate-950/95 border-2 border-sky-500/80 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300 max-w-[92vw] sm:max-w-md">
          <div className="text-2xl sm:text-3xl shrink-0 animate-bounce">{weatherToast.icon}</div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-white">{weatherToast.name}</span>
              {weatherToast.tacticalTitle && (
                <span className="text-[9px] sm:text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40">
                  {weatherToast.tacticalTitle}
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-300 font-medium leading-tight mt-0.5">
              {weatherToast.tacticalDesc || weatherToast.description}
            </p>
          </div>
          <button
            onClick={() => setWeatherToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer shrink-0 ml-auto"
            title="Đóng thông báo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Full-Screen Interactive Game Battlefield Canvas */}
      <div
        className="relative w-full h-full flex-1 overflow-hidden"
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

        {/* Top-Center Dedicated Game Mode Tactical Status Widget (Positioned cleanly below top match header, never overlapping) */}
        {isInGame && (
          <div className={`absolute left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex flex-col items-center gap-1 max-w-sm w-auto ${
            isShortLandscape ? 'top-9' : 'top-11 sm:top-12'
          }`}>
            {/* 1. BATTLE ROYALE MODE HUD */}
            {(gameMode === 'BATTLE_ROYALE' || (storm && storm.active)) && (
              <div className="flex flex-col items-center gap-1">
                <div className={`bg-slate-950/92 border border-purple-500/70 shadow-2xl shadow-purple-500/20 backdrop-blur-md rounded-xl flex items-center ${
                  isShortLandscape ? 'px-2 py-0.5 gap-1.5 text-[9px]' : 'px-3 py-1 gap-2 sm:gap-3 text-xs'
                }`}>
                  <div className="flex items-center gap-1 text-purple-300 font-mono font-black tracking-tight whitespace-nowrap">
                    <Zap className={`${isShortLandscape ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} text-purple-400 animate-pulse`} />
                    <span>BO G.Đ {storm?.phase || 1}</span>
                  </div>

                  <div className="h-3 w-px bg-slate-800" />

                  {storm?.isShrinking ? (
                    <div className="text-amber-300 font-bold flex items-center gap-1 animate-pulse whitespace-nowrap">
                      <AlertTriangle className={`${isShortLandscape ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-amber-400`} />
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
                    <Users className={`${isShortLandscape ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-emerald-400`} />
                    <span>{aliveCount || tanks.filter((t) => !t.isDead).length}/{totalParticipants || tanks.length} Xe</span>
                  </div>
                </div>

                {myTank?.inStorm && !myTank.isDead && (
                  <div className="bg-rose-950/95 border border-rose-500 text-rose-200 px-2 py-0.2 rounded-full text-[9px] font-black animate-bounce shadow-xl flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                    <span>⚠️ NGOÀI VÒNG BO (-{Math.round(storm?.dps || 5)} HP/s)!</span>
                  </div>
                )}
              </div>
            )}

            {/* 2. TEAM DEATHMATCH MODE HUD */}
            {gameMode === 'TEAM_DEATHMATCH' && teamScore && (
              <div className="flex flex-col items-center gap-1">
                <div className={`bg-slate-950/92 border border-slate-700/80 shadow-2xl backdrop-blur-md rounded-xl flex flex-col items-center ${
                  isShortLandscape ? 'px-2 py-0.5 min-w-[200px] gap-0.5 text-[9px]' : 'px-3 py-1 min-w-[240px] sm:min-w-[280px] gap-1 text-xs'
                }`}>
                  <div className="w-full flex items-center justify-between font-mono font-black">
                    <div className="flex items-center gap-1 text-rose-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      <span>ĐỎ: {teamScore.red}</span>
                    </div>
                    <span className="text-[8.5px] text-slate-400 font-bold px-1 py-0.2 rounded bg-slate-800 border border-slate-700/60">
                      30 KILLS
                    </span>
                    <div className="flex items-center gap-1 text-sky-400">
                      <span>XANH: {teamScore.blue}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                    </div>
                  </div>

                  {/* Dual tug-of-war bar towards 30 kills */}
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
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
                    <div className="text-[9px] text-emerald-300 font-bold flex items-center gap-1 animate-pulse">
                      <span>💚 Hồi máu trong căn cứ (+10 HP/s)</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. BOSS RAID MODE HUD - Compact and cleanly positioned beneath top bar */}
            {(gameMode === 'BOSS_RAID' || (boss && boss.isAlive)) && (
              <div className="flex flex-col items-center gap-0.5">
                {boss && boss.isAlive ? (
                  <div className={`bg-slate-950/95 border border-amber-500/80 shadow-2xl shadow-amber-500/20 backdrop-blur-md rounded-xl flex flex-col items-center ${
                    isShortLandscape ? 'px-2 py-0.5 min-w-[200px] max-w-[260px] gap-0.5 text-[9px]' : 'px-3 py-1 min-w-[240px] sm:min-w-[280px] max-w-xs gap-1 text-xs'
                  }`}>
                    <div className="w-full flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-400 font-mono font-black">
                        <Skull className={`${isShortLandscape ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} text-amber-400 animate-bounce`} />
                        <span>BOSS LEVIATHAN</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">
                        {Math.ceil(boss.hp)} / {boss.maxHp} HP
                      </span>
                    </div>

                    {/* Boss HP Bar */}
                    <div className="w-full h-1.5 sm:h-2 bg-slate-900 rounded-full overflow-hidden border border-amber-500/40 p-0.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-400 transition-all duration-150"
                        style={{ width: `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950/90 border border-amber-500/40 px-2 py-0.5 rounded-lg text-[9px] sm:text-xs flex items-center gap-1 text-amber-300 shadow-lg">
                    <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
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
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in zoom-in-95 duration-300 select-none">
            <div className={`bg-gradient-to-b from-amber-950/90 via-slate-900 to-slate-950 border-2 border-amber-400 rounded-2xl md:rounded-3xl my-auto ${
              isShortLandscape ? 'p-3 max-w-sm space-y-2 max-h-[82vh]' : 'p-6 sm:p-8 max-w-md space-y-4 max-h-[85vh]'
            } overflow-y-auto custom-scrollbar w-full text-center shadow-2xl shadow-amber-500/30`}>
              <div className={`mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center animate-bounce ${
                isShortLandscape ? 'w-10 h-10' : 'w-20 h-20'
              }`}>
                <Crown className={`${isShortLandscape ? 'w-5 h-5' : 'w-10 h-10'} text-amber-300`} />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] sm:text-xs uppercase font-mono font-bold text-amber-400 tracking-widest">
                  BATTLE ROYALE CHAMPION
                </span>
                <h2 className={`${isShortLandscape ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'} font-black text-white font-mono`}>
                  WINNER WINNER CHICKEN DINNER!
                </h2>
              </div>
              <div className={`bg-slate-950/80 rounded-xl border border-amber-500/40 text-left space-y-1 ${
                isShortLandscape ? 'p-2 text-xs' : 'p-4 text-sm space-y-2'
              }`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">Chiến binh chiến thắng:</span>
                  <span className="font-bold text-amber-300 text-sm">{brWinner.name}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Tổng số hạ gục:</span>
                  <span className="font-mono text-emerald-400 font-bold">{brWinner.kills} hạ gục</span>
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 animate-pulse">
                🔄 Trận đấu sinh tồn mới sẽ tự động tái thiết lập trong giây lát...
              </p>
            </div>
          </div>
        )}

        {/* Live Match Scoreboard Modal (TAB or click Trophy button) */}
        {isScoreboardOpen && (
          <Scoreboard
            entries={leaderboard}
            myPlayerId={myPlayerId}
            isExpanded={isScoreboardOpen}
            onToggleExpand={() => setIsScoreboardOpen(false)}
            onHide={() => setIsScoreboardOpen(false)}
            isShortLandscape={isShortLandscape}
          />
        )}

        {/* Team Deathmatch Winner & End Game Score Summary Modal */}
        {teamScore && teamScore.winner && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in zoom-in-95 duration-300">
            <div
              className={`border-2 rounded-2xl md:rounded-3xl ${
                isShortLandscape ? 'p-3 max-w-sm space-y-1.5 max-h-[96vh] overflow-y-auto' : 'p-5 sm:p-7 max-w-md space-y-3'
              } w-full text-center shadow-2xl ${
                teamScore.winner === 'RED'
                  ? 'bg-gradient-to-b from-[#2a0808] to-[#140404] border-rose-500 shadow-rose-500/30'
                  : 'bg-gradient-to-b from-[#08182b] to-[#040d17] border-sky-500 shadow-sky-500/30'
              }`}
            >
              <div className={`mx-auto rounded-2xl bg-white/10 flex items-center justify-center animate-bounce ${
                isShortLandscape ? 'w-9 h-9 text-xl' : 'w-14 h-14 text-3xl'
              }`}>
                🏆
              </div>

              <h2 className={`${isShortLandscape ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'} font-black text-white font-mono`}>
                {teamScore.winner === 'RED' ? '🔴 ĐỘI ĐỎ CHIẾN THẮNG!' : '🔵 ĐỘI XANH CHIẾN THẮNG!'}
              </h2>

              {/* Tỉ số chung cuộc */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2 flex items-center justify-around font-mono">
                <div className="text-center">
                  <span className="text-[9px] uppercase text-rose-400 font-bold block">Đội Đỏ</span>
                  <span className="text-lg font-black text-rose-400">{teamScore.red} Kills</span>
                </div>
                <div className="text-xs text-slate-500 font-bold">VS</div>
                <div className="text-center">
                  <span className="text-[9px] uppercase text-sky-400 font-bold block">Đội Xanh</span>
                  <span className="text-lg font-black text-sky-400">{teamScore.blue} Kills</span>
                </div>
              </div>

              {/* Thành tích cá nhân người chơi & Lưu thông tin */}
              {myTank && (
                <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-2.5 text-left space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Kết quả của bạn:</span>
                    <span className={`font-black ${myTank.team === teamScore.winner ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {myTank.team === teamScore.winner ? '🎉 CHIẾN THẮNG (+Điểm)' : '💀 THẤT BẠI'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>KDA / Điểm Trận:</span>
                    <span className="font-bold text-amber-300">
                      ⚔️ {myTank.kills} / 💀 {myTank.deaths} • ⭐ {myTank.score} Điểm
                    </span>
                  </div>
                  {matchType === 'RANKED' && (
                    <div className="flex items-center justify-between text-amber-300 pt-0.5 border-t border-slate-800">
                      <span>Xếp Hạng Rank:</span>
                      <span className="font-bold">{myTank.rankTier} ({myTank.rankRp} RP)</span>
                    </div>
                  )}
                  <div className="text-[9px] text-emerald-400 font-sans flex items-center gap-1 pt-0.5">
                    <span>✓ Đã lưu thông tin người chơi & thành tích vào hồ sơ</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsScoreboardOpen(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 rounded-lg px-3 py-1.5 text-xs font-mono font-bold cursor-pointer"
                >
                  Xem Bảng Điểm
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.stopBgm();
                    setIsInGame(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-1.5 text-xs font-mono font-bold cursor-pointer"
                >
                  Rời Trận / Về Sảnh
                </button>
              </div>

              <p className="text-[9.5px] text-slate-400 animate-pulse font-mono">
                🔄 Vòng đấu mới tự động reset sau giây lát...
              </p>
            </div>
          </div>
        )}



        {/* In-Game HUD Overlays */}
        {isInGame && (
          <>
            {/* TOP BAR: Clean MOBA Battle Header (Minimap on Left, Match Stats in Center, Controls on Right) */}
            <div className="absolute top-2 inset-x-2 sm:inset-x-3 z-20 pointer-events-none flex items-start justify-between">
              {/* TOP-LEFT: Radar Minimap + Killfeed Toggle */}
              <div className="flex flex-col gap-1 sm:gap-1.5 pointer-events-none">
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
                      currentWeather={WEATHER_CYCLE[currentWeatherIndex]}
                    />
                  </div>
                )}

                {mapMode === 'hidden' && (
                  <button
                    onClick={() => setMapMode('small')}
                    className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/85 hover:bg-slate-800 border border-sky-500/40 text-sky-300 px-2.5 py-1.5 rounded-lg shadow-lg text-xs backdrop-blur-sm cursor-pointer transition-all self-start active:scale-95"
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
                    currentWeather={WEATHER_CYCLE[currentWeatherIndex]}
                  />
                )}

                {/* Combat Killfeed Status with Show/Hide */}
                {showKillfeed ? (
                  <div className="flex flex-col gap-1 pointer-events-auto bg-slate-950/90 p-1.5 rounded-xl border border-slate-800 shadow-xl backdrop-blur-md max-w-xs animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pb-0.5 border-b border-slate-800/80">
                      <span className="flex items-center gap-1 text-sky-400 font-bold">
                        <Bell className="w-2.5 h-2.5 text-sky-400" />
                        <span>BÁO CÁO HẠ GỤC</span>
                      </span>
                      <button
                        onClick={() => setShowKillfeed(false)}
                        className="text-slate-400 hover:text-rose-400 p-0.5 rounded cursor-pointer hover:bg-slate-800"
                        title="Ẩn thông báo hạ gục (Phím K)"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="pointer-events-none">
                      <KillFeed events={events} isShortLandscape={isShortLandscape} />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowKillfeed(true)}
                    className="pointer-events-auto flex items-center gap-1 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg shadow-md text-[10px] sm:text-xs backdrop-blur-md cursor-pointer transition-all self-start active:scale-95"
                    title="Nhấn để mở thông báo hạ gục (Phím K)"
                  >
                    <Bell className="w-3 h-3 text-sky-400" />
                    <span className="font-mono font-bold">Chiến Báo</span>
                  </button>
                )}
              </div>

              {/* TOP-CENTER: Clean MOBA Match Header (Mode, KDA, Ping, Weather) */}
              <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2.5 bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-full px-2.5 sm:px-4 py-1 shadow-2xl animate-in fade-in duration-200">
                {/* Match Mode Badge */}
                <div className="flex items-center gap-1 text-[10px] sm:text-xs font-mono font-bold text-amber-300">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    {matchType === 'RANKED' ? '👑 RANK' : gameMode === 'PUBLIC' ? '⚔️ 5v5 MOBA' : '🛡️ CHIẾN TRƯỜNG'}
                  </span>
                </div>

                <div className="w-px h-3 bg-slate-800" />

                {/* Team / Match Live Score Indicator */}
                {teamScore && (gameMode === 'TEAM_DEATHMATCH' || matchType === 'RANKED') ? (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-mono font-black">
                    <span className={`px-1.5 py-0.2 rounded ${myTank?.team === 'RED' ? 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/50' : 'text-rose-400'}`}>
                      🔴 {teamScore.red}
                    </span>
                    <span className="text-slate-500 font-normal">:</span>
                    <span className={`px-1.5 py-0.2 rounded ${myTank?.team === 'BLUE' ? 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/50' : 'text-sky-400'}`}>
                      🔵 {teamScore.blue}
                    </span>
                  </div>
                ) : null}

                {/* Personal Tank Combat KDA & Score */}
                {myTank && (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-mono">
                    <span className="text-emerald-400 font-bold" title="Hạ gục (Kills)">⚔️ {myTank.kills}</span>
                    <span className="text-slate-600">/</span>
                    <span className="text-rose-400 font-bold" title="Bị hạ (Deaths)">💀 {myTank.deaths}</span>
                    <span className="text-slate-600">/</span>
                    <span className="text-amber-400 font-bold" title="Điểm số (Score)">⭐ {myTank.score || 0}</span>
                  </div>
                )}

                <div className="w-px h-3 bg-slate-800" />

                {/* Ping & Interactive Tactical Weather Badge */}
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-mono">
                  <span className={`flex items-center gap-1 font-bold ${ping < 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {ping}ms
                  </span>
                  <button
                    onClick={handleManualSwitchWeather}
                    className="pointer-events-auto flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/50 text-slate-200 cursor-pointer transition-all active:scale-95 shadow-sm"
                    title={`Thời tiết: ${WEATHER_CONFIGS[WEATHER_CYCLE[currentWeatherIndex]].vietnameseName} (${weatherSecondsLeft}s). Hiệu ứng: ${WEATHER_CONFIGS[WEATHER_CYCLE[currentWeatherIndex]].tacticalEffectDesc}. Click để chuyển thời tiết!`}
                  >
                    <span>{WEATHER_CONFIGS[WEATHER_CYCLE[currentWeatherIndex]].icon}</span>
                    <span className="text-[9px] font-bold text-sky-300 hidden sm:inline">
                      {WEATHER_CONFIGS[WEATHER_CYCLE[currentWeatherIndex]].tacticalEffectTitle.split(' ')[0]}
                    </span>
                    <span className="text-[8.5px] text-slate-400 font-mono">
                      {weatherSecondsLeft}s
                    </span>
                  </button>
                </div>
              </div>

              {/* TOP-RIGHT: Compact MOBA Control Cluster (Settings ⚙️, Scoreboard 🏆, Mute 🔊) */}
              <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5">
                {/* Settings Gear -> Opens InGameSettingsModal */}
                <button
                  onClick={() => setIsInGameSettingsOpen(true)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white flex items-center justify-center shadow-lg backdrop-blur-md cursor-pointer transition-all active:scale-95"
                  title="Cài đặt trận đấu (Âm thanh, ngắm bắn, thoát trận...)"
                >
                  <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                </button>

                {/* Scoreboard Modal Button */}
                <button
                  onClick={() => setIsScoreboardOpen(true)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-amber-500/50 text-amber-300 hover:text-amber-200 flex items-center justify-center shadow-lg backdrop-blur-md cursor-pointer transition-all active:scale-95"
                  title="Bảng điểm chi tiết (TAB)"
                >
                  <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                </button>

                {/* Quick Mute Toggle */}
                <button
                  onClick={handleToggleMute}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white flex items-center justify-center shadow-lg backdrop-blur-md cursor-pointer transition-all active:scale-95"
                  title={isMuted ? 'Bật âm thanh (Loa)' : 'Tắt âm thanh (Loa)'}
                >
                  {isMuted ? (
                    <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
                  )}
                </button>
              </div>
            </div>

            {/* TOP-RIGHT (MOBILE): HP Status Pill + Chat Icon Button (Below Settings Cluster) */}
            {isMobile && myTank && (
              <div
                className={`fixed z-30 pointer-events-auto select-none flex items-center gap-1.5 sm:gap-2 ${
                  isShortLandscape ? 'top-10 sm:top-11 right-2' : 'top-11 sm:top-12 right-2 sm:right-3'
                }`}
              >
                {/* Mobile HP Status Pill */}
                <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl px-2 sm:px-2.5 py-1 shadow-xl backdrop-blur-md flex items-center gap-2 text-xs font-mono">
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
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 leading-none">
                      <span className="font-bold text-white whitespace-nowrap text-[10px] sm:text-xs">
                        HP {Math.max(0, Math.ceil(myTank.hp))}/{myTank.maxHp}
                      </span>
                      {myTank.shield > 0 && (
                        <span className="text-sky-400 font-bold whitespace-nowrap text-[9px] sm:text-[10px] flex items-center gap-0.5">
                          <Shield className="w-2.5 h-2.5" />{myTank.shield}
                        </span>
                      )}
                      <span className="text-slate-600 text-[10px]">|</span>
                      <span className="text-emerald-400 font-bold whitespace-nowrap text-[9.5px] sm:text-[10px]">⚔️ {myTank.kills}</span>
                      <span className="text-slate-600 text-[10px]">|</span>
                      <span className="text-amber-400 font-bold whitespace-nowrap text-[9.5px] sm:text-[10px]">🔥 {myTank.streak}</span>
                    </div>
                    {/* Visual Mini Health Progress Bar */}
                    <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-150 ${
                          myTank.hp > myTank.maxHp * 0.5
                            ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                            : myTank.hp > myTank.maxHp * 0.25
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                            : 'bg-gradient-to-r from-rose-600 to-red-500 animate-pulse'
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, (myTank.hp / myTank.maxHp) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Mobile Chat Icon Button (💬) */}
                <button
                  type="button"
                  onTouchStart={(e) => {
                    e.preventDefault();
                    haptics.light();
                    setIsChatOpen(true);
                  }}
                  onClick={() => {
                    haptics.light();
                    setIsChatOpen(true);
                  }}
                  className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900/95 border-2 border-sky-500/80 hover:border-sky-400 text-sky-400 flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer"
                  title="Mở kênh chat chiến trường"
                >
                  <MessageSquare className="w-4 h-4 text-sky-300" />
                  {unreadChatCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse border border-slate-950">
                      {unreadChatCount > 9 ? '9+' : unreadChatCount}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* In-Game Chat: Desktop bottom-left or Mobile centered modal dialog */}
            <ChatBox
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              isChatOpen={isChatOpen}
              setIsChatOpen={setIsChatOpen}
              isMobile={isMobile}
            />

            {/* BOTTOM-LEFT: Tank Stats Gauge with Show/Hide (Desktop ONLY, never rendered on mobile) */}
            {!isMobile && (
              <div className={`z-20 flex flex-col pointer-events-none ${
                isShortLandscape ? 'absolute bottom-2 left-2 gap-1' : 'absolute bottom-3 left-3 sm:bottom-4 sm:left-4 gap-1.5 sm:gap-2'
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
                        className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/50 text-emerald-300 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl shadow-xl text-[10px] sm:text-xs backdrop-blur-md cursor-pointer transition-all self-start active:scale-95"
                        title="Nhấn phím H để mở thanh status"
                      >
                        <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-bold">STATUS:</span>
                        <span>HP {Math.max(0, Math.ceil(myTank.hp))}/{myTank.maxHp}</span>
                        {myTank.nextAmmoType && (
                          <span style={{ color: getAmmoInfo(myTank.nextAmmoType).color }}>
                            {getAmmoInfo(myTank.nextAmmoType).icon} {getAmmoInfo(myTank.nextAmmoType).name}
                          </span>
                        )}
                        <span className="text-slate-500 text-[9px] hidden sm:inline">(Phím H)</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* BOTTOM-CENTER: Tactical Skill Bar HUD for Desktop Keyboard */}
            <div className={`hidden md:block absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-in fade-in duration-200 ${
              isShortLandscape ? "bottom-1 scale-75 sm:scale-85 origin-bottom" : "bottom-4 slide-in-from-bottom-3"
            }`}>
              <SkillBarHUD
                myTank={myTank}
                onUseSkill={handleUseSkill}
                onUpgradeSkill={handleUpgradeSkill}
              />
            </div>

            {/* Mobile Virtual Controls: Liên Quân Mobile Style Joystick, Skills & Spells */}
            <VirtualJoystick
              myTank={myTank}
              aimMode={aimMode}
              onToggleAimMode={() => {
                const nextMode = aimMode === 'MOVEMENT' ? 'MOUSE' : 'MOVEMENT';
                setAimMode(nextMode);
                sounds.playPowerUp();
              }}
              onUseSkill={handleUseSkill}
              onUpgradeSkill={handleUpgradeSkill}
              onRecall={handleRecall}
              onQuickHeal={handleQuickHeal}
              onSignalPing={handleSignalPing}
              onOpenChat={() => setIsChatOpen(true)}
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
              isMobile={isMobile}
              isShortLandscape={isShortLandscape}
            />
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

      {/* 6. In-Game Settings & Tactical Customization Modal */}
      <InGameSettingsModal
        isOpen={isInGameSettingsOpen || isAudioSettingsOpen}
        onClose={() => {
          setIsInGameSettingsOpen(false);
          setIsAudioSettingsOpen(false);
        }}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        aimMode={aimMode}
        onToggleAimMode={() => {
          const nextMode = aimMode === 'MOVEMENT' ? 'MOUSE' : 'MOVEMENT';
          setAimMode(nextMode);
          sounds.playPowerUp();
          setWeatherToast({
            name: nextMode === 'MOVEMENT' ? 'BẮN THEO HƯỚNG XE' : 'BẮN THEO CHUỘT 360°',
            icon: nextMode === 'MOVEMENT' ? '🎯' : '🖱️',
            description: nextMode === 'MOVEMENT'
              ? 'Pháo tự động nhắm theo hướng xe chạy (Tank 1990). Bấm Space / J / Nút Bắn để bắn!'
              : 'Pháo xoay tự do 360° theo con trỏ chuột.',
            themeColor: nextMode === 'MOVEMENT' ? '#10b981' : '#38bdf8',
          });
        }}
        onOpenGarage={() => setIsGarageOpen(true)}
        onOpenHelp={() => setIsControlsModalOpen(true)}
        onExitGame={handleExitGame}
        isSpectator={isSpectator}
        onToggleSpectator={() => handleToggleSpectator()}
        isShortLandscape={isShortLandscape}
      />

      {/* 7. Friends & Party Hub Modal (In-Game / Universal) */}
      <FriendsModal
        isOpen={isFriendsOpen}
        onClose={() => setIsFriendsOpen(false)}
        myPlayerName={profileRef.current.name}
        myPlayerColor={profileRef.current.color}
        myTankClass={profileRef.current.tankClass}
        myRankRp={playerRankRp}
        onJoinFriendRoom={(friendRoomId, friendMode) => {
          handleJoinGame(
            profileRef.current.name,
            profileRef.current.color,
            profileRef.current.tankClass,
            friendMode,
            0,
            friendRoomId,
            false,
            profileRef.current.team,
            profileRef.current.skinId,
            profileRef.current.bulletTrail,
            profileRef.current.roofDecal,
            matchType
          );
        }}
      />

    </div>
  );
}
