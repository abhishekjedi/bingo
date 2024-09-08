import { User } from "../auth/auth.types";

class SocketManager {
  private static instance: SocketManager;
  private interestedSockets: Map<string, User[]>;
  private userRoomMappping: Map<string, string>;

  private constructor() {
    this.interestedSockets = new Map<string, User[]>();
    this.userRoomMappping = new Map<string, string>();
  }

  static getInstance() {
    if (SocketManager.instance) {
      return SocketManager.instance;
    }

    SocketManager.instance = new SocketManager();
    return SocketManager.instance;
  }

  addUser(user: User, roomId: string) {
    this.interestedSockets.set(roomId, [
      ...(this.interestedSockets.get(roomId) || []),
      user,
    ]);
    this.userRoomMappping.set(user.userId, roomId);
  }

  broadcast(
    roomId: string,
    message?: string,
    generatePayloadBasedOnUser?: (user: User) => string
  ) {
    const users = this.interestedSockets.get(roomId);
    if (!users) {
      console.error("No users in room?", message);
      return;
    }

    users.forEach((user) => {
      if (!message && !generatePayloadBasedOnUser) {
        return;
      }

      if (generatePayloadBasedOnUser) {
        const payload = generatePayloadBasedOnUser(user);
        user.socket.send(payload);
      } else {
        user.socket.send(message || "");
      }
    });
  }

  sendToUser(user: User, message: string) {
    user.socket.send(message);
  }

  removeUser(user: User) {
    const roomId = this.userRoomMappping.get(user.userId);
    if (!roomId) {
      console.error("User was not interested in any room?");
      return;
    }
    const room = this.interestedSockets.get(roomId) || [];
    const remainingUsers = room.filter((u) => u.userId !== user.userId);
    this.interestedSockets.set(roomId, remainingUsers);
    if (this.interestedSockets.get(roomId)?.length === 0) {
      this.interestedSockets.delete(roomId);
    }
    this.userRoomMappping.delete(user.userId);
  }
}

export const socketManager = SocketManager.getInstance();
