import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GameEngine } from './server/gameEngine';
import {
  ClientMessage,
  ServerMessage,
  MatchType,
  TankSkinId,
  BulletTrailId,
  RoofDecalId,
  RankTier,
  TankClass,
  QueueMatchedPlayer,
  Team,
} from './src/types/game';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  interface Room {
    id: string;
    game: GameEngine;
    clients: Set<WebSocket>;
    isCustomAI: boolean;
  }

  const rooms = new Map<string, Room>();

  // Pre-provision dedicated multiplayer arenas
  // 1. FFA Public Online Arena (100% Human PvP - 0 bots)
  const publicGame = new GameEngine(0, 'PUBLIC');
  publicGame.setMaxBots(0);
  rooms.set('public', {
    id: 'public',
    game: publicGame,
    clients: new Set<WebSocket>(),
    isCustomAI: false,
  });
  rooms.set('public_user', {
    id: 'public_user',
    game: publicGame,
    clients: new Set<WebSocket>(),
    isCustomAI: false,
  });

  // 1b. FFA Public AI Practice Arena (8 Bot AI)
  const publicAiGame = new GameEngine(8, 'PUBLIC');
  publicAiGame.setMaxBots(8);
  rooms.set('public_ai', {
    id: 'public_ai',
    game: publicAiGame,
    clients: new Set<WebSocket>(),
    isCustomAI: true,
  });

  // 2. Battle Royale Arena (100% Người chơi thật - 0 bot AI)
  const brGame = new GameEngine(0, 'BATTLE_ROYALE');
  brGame.setMaxBots(0);
  rooms.set('br', {
    id: 'br',
    game: brGame,
    clients: new Set<WebSocket>(),
    isCustomAI: false,
  });

  // 3. Team Deathmatch Arena (100% Human vs Human - 0 bots)
  const tdmGame = new GameEngine(0, 'TEAM_DEATHMATCH');
  tdmGame.setMaxBots(0);
  rooms.set('tdm', {
    id: 'tdm',
    game: tdmGame,
    clients: new Set<WebSocket>(),
    isCustomAI: false,
  });

  // 4. Boss Raid Leviathan (100% Người chơi thật hợp sức săn Boss - 0 bot AI)
  const bossGame = new GameEngine(0, 'BOSS_RAID');
  bossGame.setMaxBots(0);
  rooms.set('boss', {
    id: 'boss',
    game: bossGame,
    clients: new Set<WebSocket>(),
    isCustomAI: false,
  });

  // Dedicated Ranked Arenas (Đấu Xếp Hạng RP)
  const rankedPublicGame = new GameEngine(0, 'PUBLIC');
  rankedPublicGame.setMaxBots(0);
  rooms.set('ranked_public', {
    id: 'ranked_public',
    game: rankedPublicGame,
    clients: new Set<WebSocket>(),
    isCustomAI: false,
  });

  const rankedBrGame = new GameEngine(0, 'BATTLE_ROYALE');
  rankedBrGame.setMaxBots(0);
  rooms.set('ranked_br', {
    id: 'ranked_br',
    game: rankedBrGame,
    clients: new Set<WebSocket>(),
    isCustomAI: false,
  });

  const rankedTdmGame = new GameEngine(0, 'TEAM_DEATHMATCH');
  rankedTdmGame.setMaxBots(0);
  rooms.set('ranked_tdm', {
    id: 'ranked_tdm',
    game: rankedTdmGame,
    clients: new Set<WebSocket>(),
    isCustomAI: false,
  });

  // Track socket to room & player ID
  const socketRooms = new Map<WebSocket, string>();
  const socketPlayers = new Map<WebSocket, string>();

  // ==========================================
  // 6-PLAYER 3V3 MATCHMAKING QUEUE (CASUAL & RANKED)
  // ==========================================
  interface QueuedPlayer {
    ws: WebSocket;
    playerId: string;
    matchType: MatchType;
    name: string;
    color: string;
    tankClass: TankClass;
    skinId?: TankSkinId;
    bulletTrail?: BulletTrailId;
    roofDecal?: RoofDecalId;
    rankTier?: RankTier;
    rankRp?: number;
    queuedAt: number;
  }

  const matchmakingQueues: Record<MatchType, Map<WebSocket, QueuedPlayer>> = {
    CASUAL: new Map<WebSocket, QueuedPlayer>(),
    RANKED: new Map<WebSocket, QueuedPlayer>(),
  };

  function broadcastQueueStatus(matchType: MatchType) {
    const queue = matchmakingQueues[matchType];
    const now = Date.now();
    const playerList: QueueMatchedPlayer[] = Array.from(queue.values()).map((p, idx) => ({
      id: p.playerId,
      name: p.name,
      color: p.color,
      tankClass: p.tankClass,
      rankRp: p.rankRp,
      rankTier: p.rankTier,
      team: (idx % 2 === 0 ? 'RED' : 'BLUE') as Team,
      isBot: false,
    }));

    for (const [clientWs, p] of queue) {
      if (clientWs.readyState === WebSocket.OPEN) {
        const elapsed = Math.max(0, Math.floor((now - p.queuedAt) / 1000));
        const statusMsg: ServerMessage = {
          type: 'QUEUE_STATUS',
          matchType,
          inQueue: true,
          currentCount: queue.size,
          targetCount: 6,
          elapsedSeconds: elapsed,
          estimatedSeconds: Math.max(5, 30 - elapsed),
          players: playerList,
        };
        clientWs.send(JSON.stringify(statusMsg));
      }
    }
  }

  function createMatch(matchType: MatchType, fillWithBots: boolean = false) {
    const queue = matchmakingQueues[matchType];
    if (queue.size === 0) return;
    if (!fillWithBots && queue.size < 6) return;

    // Pull players from queue
    const matchedPlayers: QueuedPlayer[] = [];
    for (const [ws, player] of queue) {
      matchedPlayers.push(player);
      queue.delete(ws);
      if (matchedPlayers.length === 6) break;
    }

    // Bot names and classes to fill remaining slots if < 6
    const botFillers: Array<{
      id: string;
      name: string;
      color: string;
      tankClass: TankClass;
      skinId: TankSkinId;
      bulletTrail: BulletTrailId;
      roofDecal: RoofDecalId;
      rankTier: RankTier;
      rankRp: number;
    }> = [
      { id: `bot_q1_${Date.now()}`, name: 'Alpha Pháo Thủ', color: '#ef4444', tankClass: 'STRIKER', skinId: 'CAMO_WOODLAND', bulletTrail: 'DRAGON_FIRE', roofDecal: 'MILITARY_STAR', rankTier: 'SILVER', rankRp: 350 },
      { id: `bot_q2_${Date.now()}`, name: 'Bravo Trinh Sát', color: '#3b82f6', tankClass: 'SCOUT', skinId: 'ARCTIC_FROST', bulletTrail: 'FROST_SNOW', roofDecal: 'FLAG_VIETNAM', rankTier: 'GOLD', rankRp: 720 },
      { id: `bot_q3_${Date.now()}`, name: 'Charlie Thiết Giáp', color: '#ef4444', tankClass: 'JUGGERNAUT', skinId: 'VOLCANIC_MAGMA', bulletTrail: 'PURPLE_LIGHTNING', roofDecal: 'TIGER_BEAST', rankTier: 'GOLD', rankRp: 810 },
      { id: `bot_q4_${Date.now()}`, name: 'Delta Do Thám', color: '#3b82f6', tankClass: 'SCOUT', skinId: 'NEON_CYBERPUNK', bulletTrail: 'CYAN_LASER', roofDecal: 'DRAGON_CREST', rankTier: 'PLATINUM', rankRp: 1150 },
      { id: `bot_q5_${Date.now()}`, name: 'Echo Hỏa Lực', color: '#ef4444', tankClass: 'STRIKER', skinId: 'ROYAL_GOLD', bulletTrail: 'STANDARD', roofDecal: 'PIRATE_SKULL', rankTier: 'DIAMOND', rankRp: 1540 },
    ];

    const matchRoomId = `match_${matchType.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const matchGame = new GameEngine(0, 'TEAM_DEATHMATCH');
    // Ranked & Casual matches are 100% human vs human (no bots)
    matchGame.setMaxBots(0);

    const redTeam: QueueMatchedPlayer[] = [];
    const blueTeam: QueueMatchedPlayer[] = [];

    // Assign human players to teams alternating
    matchedPlayers.forEach((p, index) => {
      const team: Team = index % 2 === 0 ? 'RED' : 'BLUE';
      const playerInfo: QueueMatchedPlayer = {
        id: p.playerId,
        name: p.name,
        color: team === 'RED' ? '#ef4444' : '#3b82f6',
        tankClass: p.tankClass,
        rankRp: p.rankRp,
        rankTier: p.rankTier,
        team,
        isBot: false,
      };
      if (team === 'RED') redTeam.push(playerInfo);
      else blueTeam.push(playerInfo);
    });

    rooms.set(matchRoomId, {
      id: matchRoomId,
      game: matchGame,
      clients: new Set<WebSocket>(),
      isCustomAI: false,
    });

    // Send MATCH_FOUND notification to all human players
    matchedPlayers.forEach((p, index) => {
      if (p.ws.readyState === WebSocket.OPEN) {
        const myTeam: Team = index % 2 === 0 ? 'RED' : 'BLUE';
        const foundMsg: ServerMessage = {
          type: 'QUEUE_MATCH_FOUND',
          matchType,
          roomId: matchRoomId,
          myTeam,
          redTeam,
          blueTeam,
          countdown: 3,
        };
        p.ws.send(JSON.stringify(foundMsg));
      }
    });

    // Update remaining queue
    broadcastQueueStatus(matchType);
  }

  // Periodic Queue Tick (Every 1 second update timers and check for 6 players)
  setInterval(() => {
    for (const mType of ['CASUAL', 'RANKED'] as MatchType[]) {
      const q = matchmakingQueues[mType];
      if (q.size > 0) {
        if (q.size >= 6) {
          createMatch(mType);
        } else {
          broadcastQueueStatus(mType);
        }
      }
    }
  }, 1000);

  function getLobbyStatePayload(): ServerMessage {
    const publicRoom = rooms.get('public');
    const publicPlayers: any[] = [];
    if (publicRoom) {
      for (const tank of publicRoom.game.getTanks().values()) {
        if (!tank.isBot) {
          publicPlayers.push({
            id: tank.id,
            name: tank.name,
            color: tank.color,
            tankClass: tank.tankClass,
            kills: tank.kills,
            score: tank.score,
            rankTier: tank.rankTier,
            rankRp: tank.rankRp,
          });
        }
      }
    }

    const customRoomsList: any[] = [];
    for (const [rId, room] of rooms) {
      if (room.isCustomAI && !rId.startsWith('ai_')) {
        let humanCount = 0;
        let botCount = 0;
        for (const t of room.game.getTanks().values()) {
          if (t.isBot) botCount++;
          else humanCount++;
        }
        customRoomsList.push({
          id: rId,
          name: rId.replace(/^(custom_|phong_|boss_|tdm_|br_)/, 'PHÒNG-').toUpperCase(),
          playerCount: humanCount,
          botCount,
          hasBoss: !!room.game.getBoss()?.isAlive,
          mode: room.game.getMode ? room.game.getMode() : 'PUBLIC',
          weather: room.game.getWeather ? room.game.getWeather() : 'RAIN',
        });
      }
    }

    return {
      type: 'LOBBY_STATE',
      totalSockets: wss.clients.size,
      publicOnlineCount: publicPlayers.length,
      publicPlayers,
      customRooms: customRoomsList,
    };
  }

  function broadcastLobbyState() {
    const data = JSON.stringify(getLobbyStatePayload());
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  function broadcastRoom(roomId: string, msg: ServerMessage) {
    const room = rooms.get(roomId);
    if (!room) return;
    const data = JSON.stringify(msg);
    for (const client of room.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  // Real-time WebSocket connection handling
  wss.on('connection', (ws: WebSocket) => {
    const playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    socketPlayers.set(ws, playerId);

    // Send real-time lobby stats immediately upon connection
    ws.send(JSON.stringify(getLobbyStatePayload()));
    broadcastLobbyState();

    ws.on('message', (raw: string) => {
      try {
        const msg: ClientMessage = JSON.parse(raw.toString());
        const currentRoomId = socketRooms.get(ws);
        const currentRoom = currentRoomId ? rooms.get(currentRoomId) : undefined;

        switch (msg.type) {
          case 'JOIN': {
            // If already in a room, leave old room first
            if (currentRoom && currentRoomId) {
              currentRoom.game.removePlayer(playerId);
              currentRoom.clients.delete(ws);
              if (currentRoom.isCustomAI && currentRoom.clients.size === 0) {
                rooms.delete(currentRoomId);
              }
            }

            const mode = msg.mode || 'PUBLIC';
            const isAIMode = mode === 'AI';
            const isRanked = msg.matchType === 'RANKED';
            const cleanRoom = (msg.roomId || '').trim().toLowerCase().slice(0, 32);

            let targetRoomId = isRanked ? 'ranked_public' : 'public';
            if (msg.roomId && rooms.has(msg.roomId)) {
              targetRoomId = msg.roomId;
            } else if (cleanRoom && (cleanRoom.startsWith('custom_') || cleanRoom.startsWith('phong_') || cleanRoom.startsWith('phong-') || (cleanRoom !== 'public' && cleanRoom !== 'public_user' && cleanRoom !== 'public_ai'))) {
              targetRoomId = cleanRoom.startsWith('custom_') || cleanRoom.startsWith('phong_') ? cleanRoom : `custom_${cleanRoom}`;
            } else if (isAIMode) {
              targetRoomId = `ai_${playerId}`;
            } else if (mode === 'BATTLE_ROYALE') {
              targetRoomId = cleanRoom ? `br_${cleanRoom}` : (isRanked ? 'ranked_br' : 'br');
            } else if (mode === 'TEAM_DEATHMATCH') {
              targetRoomId = cleanRoom ? `tdm_${cleanRoom}` : (isRanked ? 'ranked_tdm' : 'tdm');
            } else if (mode === 'BOSS_RAID') {
              targetRoomId = cleanRoom ? `boss_${cleanRoom}` : (isRanked ? 'ranked_boss' : 'boss');
            } else {
              targetRoomId = cleanRoom ? (isRanked ? `ranked_${cleanRoom}` : cleanRoom) : (isRanked ? 'ranked_public' : 'public');
            }

            let targetRoom = rooms.get(targetRoomId);
            if (!targetRoom) {
              const isCustomRoom = isAIMode || targetRoomId.startsWith('custom_') || targetRoomId.startsWith('phong_') || !!msg.enableBoss;
              let desiredBots = 0;
              if (typeof msg.botCount === 'number') {
                desiredBots = Math.max(0, Math.min(14, msg.botCount));
              } else if (isAIMode) {
                desiredBots = 5;
              }
              const newGame = new GameEngine(desiredBots, mode);
              newGame.setMaxBots(desiredBots);
              if (msg.enableBoss || mode === 'BOSS_RAID') {
                newGame.setBossEnabled(true, msg.bossHp || 1000);
              }
              if (msg.initialWeather) {
                newGame.setWeather(msg.initialWeather);
              }
              targetRoom = {
                id: targetRoomId,
                game: newGame,
                clients: new Set(),
                isCustomAI: isCustomRoom,
              };
              rooms.set(targetRoomId, targetRoom);
            } else {
              if (typeof msg.botCount === 'number' && msg.botCount > 0) {
                targetRoom.game.setMaxBots(msg.botCount);
              }
              if (msg.enableBoss) {
                targetRoom.game.setBossEnabled(true, msg.bossHp || 1000);
              }
              if (msg.initialWeather) {
                targetRoom.game.setWeather(msg.initialWeather);
              }
            }

            targetRoom.clients.add(ws);
            socketRooms.set(ws, targetRoomId);

            if (!msg.isSpectator) {
              targetRoom.game.addPlayer(
                playerId,
                msg.name,
                msg.color,
                msg.tankClass,
                false,
                msg.team,
                msg.skinId,
                msg.bulletTrail,
                msg.roofDecal,
                msg.matchType,
                msg.rankTier,
                msg.rankRp
              );
            }

            // Send full initial state
            const initPayload: ServerMessage = {
              type: 'INIT',
              ...targetRoom.game.getInitData(playerId),
              roomId: targetRoomId,
            };
            ws.send(JSON.stringify(initPayload));

            broadcastLobbyState();
            break;
          }

          case 'SET_SPECTATOR': {
            if (currentRoom && currentRoomId) {
              if (msg.isSpectator) {
                currentRoom.game.removePlayer(playerId);
              } else {
                currentRoom.game.addPlayer(
                  playerId,
                  msg.name || 'Chiến Binh',
                  msg.color || '#2563eb',
                  msg.tankClass || 'STRIKER',
                  false
                );
              }
              broadcastLobbyState();
            }
            break;
          }

          case 'INPUT': {
            if (currentRoom) {
              currentRoom.game.setInput(playerId, {
                up: !!msg.up,
                down: !!msg.down,
                left: !!msg.left,
                right: !!msg.right,
                turretAngle: Number(msg.turretAngle) || 0,
                isFiring: !!msg.isFiring,
              });
              if (msg.skillTrigger) {
                currentRoom.game.useSkill(playerId, msg.skillTrigger);
              }
            }
            break;
          }

          case 'USE_SKILL': {
            if (currentRoom && msg.skill) {
              currentRoom.game.useSkill(playerId, msg.skill);
            }
            break;
          }

          case 'UPGRADE_SKILL': {
            if (currentRoom && msg.skill) {
              currentRoom.game.upgradeSkill(playerId, msg.skill);
            }
            break;
          }

          case 'RESPAWN': {
            if (currentRoom) {
              currentRoom.game.respawnPlayer(playerId);
            }
            break;
          }

          case 'CHAT': {
            if (currentRoom && currentRoomId) {
              const chatMsg = currentRoom.game.addChatMessage(playerId, msg.text);
              if (chatMsg) {
                broadcastRoom(currentRoomId, {
                  type: 'CHAT',
                  message: chatMsg,
                });
              }
            }
            break;
          }

          case 'PING': {
            const pongMsg: ServerMessage = {
              type: 'PONG',
              clientTimestamp: msg.timestamp,
              serverTimestamp: Date.now(),
            };
            ws.send(JSON.stringify(pongMsg));
            break;
          }

          case 'TOGGLE_BOTS': {
            if (currentRoom && currentRoom.isCustomAI && typeof msg.count === 'number') {
              const clamped = Math.max(0, Math.min(14, Math.round(msg.count)));
              currentRoom.game.setMaxBots(clamped);
            }
            break;
          }

          case 'SELECT_PERK': {
            if (currentRoom && msg.perkId) {
              currentRoom.game.selectPerk(playerId, msg.perkId);
            }
            break;
          }

          case 'UPDATE_COSMETICS': {
            if (currentRoom) {
              currentRoom.game.updateCosmetics(playerId, {
                skinId: msg.skinId,
                bulletTrail: msg.bulletTrail,
                roofDecal: msg.roofDecal,
              });
            }
            break;
          }

          case 'TEAM_PING': {
            if (currentRoom) {
              const snapshot = currentRoom.game.getSnapshot();
              const senderTank = snapshot.tanks.find((t) => t.id === playerId);
              const senderTeam = senderTank?.team || 'NONE';
              const senderName = senderTank?.name || 'Đồng đội';
              const beaconMsg: ServerMessage = {
                type: 'TEAM_BEACON',
                x: msg.x,
                y: msg.y,
                timestamp: Date.now(),
                pingType: msg.pingType || 'ATTACK',
                senderName,
                senderId: playerId,
                team: senderTeam,
              };
              const payload = JSON.stringify(beaconMsg);
              for (const client of currentRoom.clients) {
                if (client.readyState === WebSocket.OPEN) {
                  const targetPid = socketPlayers.get(client);
                  if (targetPid) {
                    const targetTank = snapshot.tanks.find((t) => t.id === targetPid);
                    // Broadcast to same team, or to all if FFA / spectator
                    if (senderTeam === 'NONE' || !targetTank || targetTank.team === senderTeam || targetTank.team === 'NONE') {
                      client.send(payload);
                    }
                  }
                }
              }
            }
            break;
          }

          case 'SET_WEATHER': {
            if (currentRoom && msg.weather) {
              currentRoom.game.setWeather(msg.weather);
            }
            break;
          }

          case 'QUEUE_JOIN': {
            const mType: MatchType = msg.matchType === 'RANKED' ? 'RANKED' : 'CASUAL';
            // Remove from both queues first
            matchmakingQueues.CASUAL.delete(ws);
            matchmakingQueues.RANKED.delete(ws);

            matchmakingQueues[mType].set(ws, {
              ws,
              playerId,
              matchType: mType,
              name: msg.name || 'Chiến Binh',
              color: msg.color || (mType === 'RANKED' ? '#f59e0b' : '#38bdf8'),
              tankClass: msg.tankClass || 'STRIKER',
              skinId: msg.skinId,
              bulletTrail: msg.bulletTrail,
              roofDecal: msg.roofDecal,
              rankTier: msg.rankTier,
              rankRp: msg.rankRp,
              queuedAt: Date.now(),
            });

            // If queue reaches 6 players, create 3v3 match immediately!
            if (matchmakingQueues[mType].size >= 6) {
              createMatch(mType);
            } else {
              broadcastQueueStatus(mType);
            }
            break;
          }

          case 'QUEUE_LEAVE': {
            matchmakingQueues.CASUAL.delete(ws);
            matchmakingQueues.RANKED.delete(ws);
            const cancelStatus: ServerMessage = {
              type: 'QUEUE_STATUS',
              matchType: 'CASUAL',
              inQueue: false,
              currentCount: 0,
              targetCount: 6,
              elapsedSeconds: 0,
              estimatedSeconds: 0,
              players: [],
            };
            ws.send(JSON.stringify(cancelStatus));
            broadcastQueueStatus('CASUAL');
            broadcastQueueStatus('RANKED');
            break;
          }

          case 'QUEUE_AUTO_FILL_BOTS': {
            if (matchmakingQueues.RANKED.has(ws)) {
              createMatch('RANKED', true);
            } else if (matchmakingQueues.CASUAL.has(ws)) {
              createMatch('CASUAL', true);
            }
            break;
          }
        }
      } catch (err) {
        console.error('Error handling WS message:', err);
      }
    });

    const cleanup = () => {
      // Clean up from matchmaking queues
      matchmakingQueues.CASUAL.delete(ws);
      matchmakingQueues.RANKED.delete(ws);
      broadcastQueueStatus('CASUAL');
      broadcastQueueStatus('RANKED');

      const roomId = socketRooms.get(ws);
      if (roomId) {
        const room = rooms.get(roomId);
        if (room) {
          room.game.removePlayer(playerId);
          room.clients.delete(ws);
          if (room.isCustomAI && room.clients.size === 0) {
            rooms.delete(roomId);
          }
        }
      }
      socketRooms.delete(ws);
      socketPlayers.delete(ws);
      broadcastLobbyState();
    };

    ws.on('close', cleanup);
    ws.on('error', cleanup);
  });

  // Game loop tick (~33Hz = 30ms) for all active rooms
  let lastTick = Date.now();
  setInterval(() => {
    const now = Date.now();
    const dt = (now - lastTick) / 1000;
    lastTick = now;

    for (const [roomId, room] of rooms) {
      if (room.isCustomAI && room.clients.size === 0) {
        rooms.delete(roomId);
        continue;
      }

      room.game.update(dt);

      // Drain and broadcast real-time events (joins, leaves, kills, powerups) to room clients
      const newEvents = room.game.drainNewEvents();
      if (newEvents.length > 0) {
        for (const evt of newEvents) {
          const evtData = JSON.stringify({ type: 'EVENT', event: evt });
          for (const client of room.clients) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(evtData);
            }
          }
        }
      }

      const snapshot = room.game.getSnapshot();
      const tickMsg: ServerMessage = {
        type: 'TICK',
        snapshot,
      };
      const tickData = JSON.stringify(tickMsg);
      for (const client of room.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(tickData);
        }
      }
    }
  }, 30);

  // Serve app via Vite or static
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Tank Arena server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
