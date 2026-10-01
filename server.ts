import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GameEngine } from './server/gameEngine';
import { ClientMessage, ServerMessage } from './src/types/game';

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
  // 1. FFA Public Arena (Pure PvP)
  const publicGame = new GameEngine(0, 'PUBLIC');
  publicGame.setMaxBots(0);
  rooms.set('public', {
    id: 'public',
    game: publicGame,
    clients: new Set<WebSocket>(),
    isCustomAI: false,
  });

  // 2. Battle Royale Arena (Vòng Bo Sinh Tồn với bot lấp đầy 10 xe)
  const brGame = new GameEngine(9, 'BATTLE_ROYALE');
  brGame.setMaxBots(9);
  rooms.set('br', {
    id: 'br',
    game: brGame,
    clients: new Set<WebSocket>(),
    isCustomAI: false,
  });

  // 3. Team Deathmatch Arena (🔴 Đỏ vs 🔵 Xanh 30 Kills)
  const tdmGame = new GameEngine(8, 'TEAM_DEATHMATCH');
  tdmGame.setMaxBots(8);
  rooms.set('tdm', {
    id: 'tdm',
    game: tdmGame,
    clients: new Set<WebSocket>(),
    isCustomAI: false,
  });

  // 4. Boss Raid Leviathan (Săn Siêu Boss Thế Giới)
  const bossGame = new GameEngine(6, 'BOSS_RAID');
  bossGame.setMaxBots(6);
  rooms.set('boss', {
    id: 'boss',
    game: bossGame,
    clients: new Set<WebSocket>(),
    isCustomAI: false,
  });

  // Track socket to room & player ID
  const socketRooms = new Map<WebSocket, string>();
  const socketPlayers = new Map<WebSocket, string>();

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
          });
        }
      }
    }
    return {
      type: 'LOBBY_STATE',
      totalSockets: wss.clients.size,
      publicOnlineCount: publicPlayers.length,
      publicPlayers,
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
            const cleanRoom = (msg.roomId || '').trim().toLowerCase().slice(0, 24);

            let targetRoomId = 'public';
            if (isAIMode) {
              targetRoomId = `ai_${playerId}`;
            } else if (mode === 'BATTLE_ROYALE') {
              targetRoomId = cleanRoom ? `br_${cleanRoom}` : 'br';
            } else if (mode === 'TEAM_DEATHMATCH') {
              targetRoomId = cleanRoom ? `tdm_${cleanRoom}` : 'tdm';
            } else if (mode === 'BOSS_RAID') {
              targetRoomId = cleanRoom ? `boss_${cleanRoom}` : 'boss';
            } else {
              targetRoomId = cleanRoom || 'public';
            }

            let targetRoom = rooms.get(targetRoomId);
            if (!targetRoom) {
              let desiredBots = 0;
              if (isAIMode) {
                desiredBots = typeof msg.botCount === 'number' ? Math.max(0, Math.min(14, msg.botCount)) : 5;
              } else if (mode === 'BATTLE_ROYALE') {
                desiredBots = 9;
              } else if (mode === 'TEAM_DEATHMATCH') {
                desiredBots = 8;
              } else if (mode === 'BOSS_RAID') {
                desiredBots = 6;
              }
              const newGame = new GameEngine(desiredBots, mode);
              newGame.setMaxBots(desiredBots);
              targetRoom = {
                id: targetRoomId,
                game: newGame,
                clients: new Set(),
                isCustomAI: isAIMode,
              };
              rooms.set(targetRoomId, targetRoom);
            } else {
              if (isAIMode && typeof msg.botCount === 'number') {
                targetRoom.game.setMaxBots(msg.botCount);
              }
            }

            targetRoom.clients.add(ws);
            socketRooms.set(ws, targetRoomId);

            if (!msg.isSpectator) {
              targetRoom.game.addPlayer(playerId, msg.name, msg.color, msg.tankClass, false, msg.team);
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
            if (currentRoom && typeof msg.count === 'number') {
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
        }
      } catch (err) {
        console.error('Error handling WS message:', err);
      }
    });

    const cleanup = () => {
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
