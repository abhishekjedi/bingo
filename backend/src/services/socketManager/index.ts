import { WebSocket } from "ws";
import { User } from "../auth/auth.types";
import { RoomEnvelope } from "../roomBus/roomBus.types";

class SocketManager {
  private static instance: SocketManager;
  private interestedSockets: Map<string, User[]>;
  private userRoomMapping: Map<string, string>;

  private constructor() {
    this.interestedSockets = new Map<string, User[]>();
    this.userRoomMapping = new Map<string, string>();
  }

  static getInstance() {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  addUser(user: User, roomId: string) {
    const previousRoom = this.userRoomMapping.get(user.userId);
    if (previousRoom && previousRoom !== roomId) {
      this.removeUserFromRoom(user.userId, previousRoom);
    }

    const room = (this.interestedSockets.get(roomId) || []).filter(
      (existing) => existing.userId !== user.userId
    );
    room.push(user);
    this.interestedSockets.set(roomId, room);
    this.userRoomMapping.set(user.userId, roomId);
  }

  getRoomOfUser(userId: string) {
    return this.userRoomMapping.get(userId);
  }

  getUsersInRoom(roomId: string) {
    return this.interestedSockets.get(roomId) || [];
  }

  deliver(envelope: RoomEnvelope) {
    const users = this.interestedSockets.get(envelope.roomId);
    if (!users || users.length === 0) {
      return;
    }

    users.forEach((user) => {
      const payload = envelope.payloads
        ? envelope.payloads[user.userId]
        : envelope.message;

      if (payload) {
        this.sendToUser(user, payload);
      }
    });
  }

  sendToUser(user: User, message: string) {
    if (user.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    user.socket.send(message);
  }

  removeUser(user: User) {
    const roomId = this.userRoomMapping.get(user.userId);
    if (!roomId) {
      return;
    }

    const room = this.interestedSockets.get(roomId) || [];
    const current = room.find((u) => u.userId === user.userId);
    if (current && current.socket !== user.socket) {
      return;
    }

    this.removeUserFromRoom(user.userId, roomId);
    this.userRoomMapping.delete(user.userId);
  }

  clearRoom(roomId: string) {
    const room = this.interestedSockets.get(roomId) || [];
    room.forEach((user) => this.userRoomMapping.delete(user.userId));
    this.interestedSockets.delete(roomId);
  }

  private removeUserFromRoom(userId: string, roomId: string) {
    const room = this.interestedSockets.get(roomId) || [];
    const remainingUsers = room.filter((u) => u.userId !== userId);
    if (remainingUsers.length === 0) {
      this.interestedSockets.delete(roomId);
      return;
    }
    this.interestedSockets.set(roomId, remainingUsers);
  }
}

export const socketManager = SocketManager.getInstance();
