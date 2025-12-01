import { Server, Socket } from "socket.io";
import { env } from "./config/env";

export interface RoomMetadata {
  title: string | null;
  createdAt: Date;
  hostId: string;
  locked?: boolean;
}

export interface UserData {
  roomId: string | null;
  username: string;
}

export class SocketServer {
  private io: Server;
  private rooms: Map<string, Set<string>> = new Map(); // roomId -> Set of socketIds
  private waitingParticipants: Map<string, Array<{ userId: string; username: string; joinedAt: Date }>> = new Map(); // roomId -> waiting list
  private users: Map<string, UserData> = new Map(); // socketId -> { roomId, username }
  private roomMetadata: Map<string, RoomMetadata> = new Map(); // roomId -> { title, createdAt, hostId }

  constructor(portOrIo: number | Server = 3001) {
    // Support both: port number (standalone) or Server instance (integrated with Next.js)
    if (typeof portOrIo === "number") {
      const allowedOrigins = env.ALLOWED_ORIGINS.length
        ? env.ALLOWED_ORIGINS
        : ["http://localhost:3000"];

      this.io = new Server(portOrIo, {
        cors: {
          origin: allowedOrigins,
          methods: ["GET", "POST"],
          credentials: true,
        },
        pingTimeout: 30000, // Reduced for faster detection
        pingInterval: 15000, // More frequent pings for faster connection
        transports: ["websocket", "polling"], // Support both but prefer websocket
        allowEIO3: true,
        connectTimeout: 20000, // Faster timeout for quicker connection
      });

      console.log(`✅ Socket.io signaling server running on port ${portOrIo}`);
    } else {
      // Integrated mode - use provided Server instance
      this.io = portOrIo;
      console.log(`✅ Socket.io integrated with Next.js server`);
    }

    this.setupEventHandlers();
    
    if (env.NODE_ENV === "production") {
      console.log(`🌐 Production mode: CORS origins => ${env.ALLOWED_ORIGINS.join(", ")}`);
    } else {
      console.log(`🔧 Development mode: CORS enabled for all origins`);
    }
  }

  private setupEventHandlers(): void {
    this.io.on("connection", (socket: Socket) => {
      console.log("User connected:", socket.id);
      this.users.set(socket.id, { roomId: null, username: `User-${socket.id.slice(0, 6)}` });

      socket.on("join-room", (roomId: string, username: string, meetingTitle?: string) => {
        this.handleJoinRoom(socket, roomId, username, meetingTitle);
      });

      socket.on("signal", (data: { to: string; signal: any }) => {
        this.handleSignal(socket, data);
      });

      socket.on("chat-message", (data: { message: string }) => {
        this.handleChatMessage(socket, data);
      });

      socket.on("remove-participant", (targetSocketId: string) => {
        this.handleRemoveParticipant(socket, targetSocketId);
      });

      socket.on("end-meeting", () => {
        this.handleEndMeeting(socket);
      });

      socket.on("disconnect", () => {
        this.handleDisconnect(socket);
      });

      // Collaborative IDE Events
      socket.on("code-change", (data: { code: string; roomId: string }) => {
        this.handleCodeChange(socket, data);
      });

      socket.on("sync-code", (data: { code: string; to: string }) => {
        this.handleSyncCode(socket, data);
      });

      socket.on("request-code", (roomId: string) => {
        this.handleRequestCode(socket, roomId);
      });

      socket.on("screen-share-status", (data: { isSharing: boolean; roomId: string }) => {
        this.handleScreenShareStatus(socket, data);
      });
    });
  }

  private handleScreenShareStatus(socket: Socket, data: { isSharing: boolean; roomId: string }): void {
    try {
      if (data.roomId) {
        socket.to(data.roomId).emit("user-screen-share-status", { 
          userId: socket.id, 
          isSharing: data.isSharing 
        });
      }
    } catch (error) {
      console.error("Error in screen-share-status:", error);
    }
  }

  private handleCodeChange(socket: Socket, data: { code: string; roomId: string }): void {
    try {
      if (data.roomId) {
        socket.to(data.roomId).emit("code-change", { code: data.code, from: socket.id });
      }
    } catch (error) {
      console.error("Error in code-change:", error);
    }
  }

  private handleSyncCode(socket: Socket, data: { code: string; to: string }): void {
    try {
      if (data.to) {
        this.io.to(data.to).emit("code-update", { code: data.code });
      }
    } catch (error) {
      console.error("Error in sync-code:", error);
    }
  }

  private handleRequestCode(socket: Socket, roomId: string): void {
    try {
      // Ask the host (or any other user) for the current code
      const room = this.rooms.get(roomId);
      if (room && room.size > 1) {
        // Find a user who is not the requester
        const otherUser = Array.from(room).find(id => id !== socket.id);
        if (otherUser) {
          this.io.to(otherUser).emit("request-code", { from: socket.id });
        }
      }
    } catch (error) {
      console.error("Error in request-code:", error);
    }
  }

  private handleJoinRoom(socket: Socket, roomId: string, username: string, meetingTitle?: string): void {
    try {
      // Leave previous room if any
      const userData = this.users.get(socket.id);
      if (userData && userData.roomId && userData.roomId !== roomId) {
        this.leaveRoom(socket, userData.roomId);
      }

      // Ensure room exists, create if new
      const isNewRoom = !this.rooms.has(roomId);
      if (isNewRoom) {
        this.rooms.set(roomId, new Set());
        this.roomMetadata.set(roomId, {
          title: meetingTitle || null,
          createdAt: new Date(),
          hostId: socket.id,
          locked: false,
        });
        console.log(`🏠 Room ${roomId} created. Host: ${socket.id} (${username})`);
      }

      const meta = this.roomMetadata.get(roomId);
      
      // If meeting is locked and this user is not the host, put them in waiting room
      if (meta?.locked && meta.hostId !== socket.id) {
        console.log(`🔒 Meeting locked. User ${socket.id} (${username}) placed in waiting room.`);
        const waitingList = this.waitingParticipants.get(roomId) || [];
        // Check if already in waiting list to avoid duplicates
        if (!waitingList.some(p => p.userId === socket.id)) {
          waitingList.push({ userId: socket.id, username, joinedAt: new Date() });
          this.waitingParticipants.set(roomId, waitingList);
        }
        
        // Notify host about waiting participants
        if (meta.hostId) {
          this.io.to(meta.hostId).emit('waiting-room-update', waitingList);
        }
        socket.emit('waiting-room', { message: 'The meeting is locked. You are in the waiting room.' });
        return; // CRITICAL: Return here so they don't join the room!
      }

      socket.join(roomId);

      const room = this.rooms.get(roomId);
      if (!room) {
        console.error(`Room ${roomId} not found after creation`);
        socket.emit('error', { message: 'Failed to join room' });
        return;
      }

      // Add user to room structures
      room.add(socket.id);
      this.users.set(socket.id, { roomId, username: username || `User-${socket.id.slice(0, 6)}` });

      console.log(`User ${socket.id} (${username}) joined room ${roomId}. Room now has ${room.size} users.`);

      // Send metadata (including host flag)
      if (meta) {
        const isHost = meta.hostId === socket.id;
        socket.emit('room-metadata', { ...meta, isHost });
      }

      // Send existing participants (excluding self)
      const otherUsers = Array.from(room).filter(id => id !== socket.id);
      socket.emit('room-users', otherUsers.map(id => ({
        id,
        username: this.users.get(id)?.username || `User-${id.slice(0, 6)}`,
        isHost: meta?.hostId === id,
      })));

      // Notify others about new participant
      socket.to(roomId).emit('user-joined', {
        id: socket.id,
        username: this.users.get(socket.id)?.username || `User-${socket.id.slice(0, 6)}`,
        isHost: meta?.hostId === socket.id,
      });
    } catch (error) {
      console.error('Error in join-room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  private handleSignal(socket: Socket, data: { to: string; signal: any }): void {
    try {
      if (data.to && data.signal) {
        this.io.to(data.to).emit("signal", {
          from: socket.id,
          signal: data.signal,
        });
      }
    } catch (error) {
      console.error("Error in signal:", error);
    }
  }

  private handleChatMessage(socket: Socket, data: { message: string }): void {
    try {
      const userData = this.users.get(socket.id);
      if (userData && userData.roomId) {
        const message = {
          id: `${socket.id}-${Date.now()}`,
          userId: socket.id,
          username: userData.username,
          message: data.message,
          timestamp: new Date(),
        };

        // Broadcast to all users in the room
        this.io.to(userData.roomId).emit("chat-message", message);
      }
    } catch (error) {
      console.error("Error in chat-message:", error);
    }
  }

  private handleRemoveParticipant(socket: Socket, targetSocketId: string): void {
    try {
      const userData = this.users.get(socket.id);
      if (!userData || !userData.roomId) {
        socket.emit("error", { message: "You are not in a room" });
        return;
      }

      const metadata = this.roomMetadata.get(userData.roomId);
      if (!metadata || metadata.hostId !== socket.id) {
        socket.emit("error", { message: "Only the host can remove participants" });
        return;
      }

      if (targetSocketId === socket.id) {
        socket.emit("error", { message: "You cannot remove yourself" });
        return;
      }

      const targetUser = this.users.get(targetSocketId);
      if (!targetUser || targetUser.roomId !== userData.roomId) {
        socket.emit("error", { message: "Participant not found in this room" });
        return;
      }

      console.log(`🚫 Host ${socket.id} removing participant ${targetSocketId} from room ${userData.roomId}`);

      // Notify the target user they've been removed
      this.io.to(targetSocketId).emit("participant-removed", {
        message: "You have been removed from the meeting by the host",
      });

      // Remove them from the room
      const targetSocket = this.io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        this.leaveRoom(targetSocket, userData.roomId);
      }

      // Notify host of success
      socket.emit("participant-removed-success", { targetSocketId });
    } catch (error) {
      console.error("Error in remove-participant:", error);
      socket.emit("error", { message: "Failed to remove participant" });
    }
  }

  private handleEndMeeting(socket: Socket): void {
    try {
      const userData = this.users.get(socket.id);
      if (!userData || !userData.roomId) {
        socket.emit("error", { message: "You are not in a room" });
        return;
      }

      const metadata = this.roomMetadata.get(userData.roomId);
      if (!metadata || metadata.hostId !== socket.id) {
        socket.emit("error", { message: "Only the host can end the meeting" });
        return;
      }

      console.log(`🏁 Host ${socket.id} ended meeting in room ${userData.roomId}`);

      // Notify all participants that meeting ended
      this.io.to(userData.roomId).emit("meeting-ended", {
        message: "The host has ended the meeting",
      });

      // Notify host of success
      socket.emit("meeting-ended-success", { message: "Meeting ended successfully" });

      // Clean up room
      const roomId = userData.roomId;
      const room = this.rooms.get(roomId);
      if (room) {
        // Remove all users from the room
        room.forEach((socketId) => {
          const targetSocket = this.io.sockets.sockets.get(socketId);
          if (targetSocket) {
            this.leaveRoom(targetSocket, roomId);
          }
        });
      }
    } catch (error) {
      console.error("Error in end-meeting:", error);
      socket.emit("error", { message: "Failed to end meeting" });
    }
  }

  private handleDisconnect(socket: Socket): void {
    console.log("User disconnected:", socket.id);
    const userData = this.users.get(socket.id);
    if (userData && userData.roomId) {
      const roomId = userData.roomId;
      const metadata = this.roomMetadata.get(roomId);
      const isHost = metadata?.hostId === socket.id;

      if (isHost) {
        // Host left - end meeting for all participants
        console.log(`🏠 Host ${socket.id} left room ${roomId}. Ending meeting for all participants.`);
        const room = this.rooms.get(roomId);
        if (room) {
          // Notify all participants that meeting ended
          socket.to(roomId).emit("meeting-ended", {
            message: "The host has left the meeting",
          });
        }
      }

      this.leaveRoom(socket, roomId);
    }
    this.users.delete(socket.id);
  }

  private leaveRoom(socket: Socket, roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room && socket) {
      room.delete(socket.id);
      socket.to(roomId).emit("user-left", socket.id);

      if (room.size === 0) {
        this.rooms.delete(roomId);
        this.roomMetadata.delete(roomId);
        console.log(`Room ${roomId} deleted (empty)`);
      } else {
        console.log(`User ${socket.id} left room ${roomId}. Room now has ${room.size} users.`);
      }
    }
  }

  public getIO(): Server {
    return this.io;
  }
}

