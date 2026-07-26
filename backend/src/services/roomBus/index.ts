import { createRedisClient, redis } from "../../clients/redis";
import { socketManager } from "../socketManager";
import { turnTimer } from "../turnTimer";
import { JoinEnvelope, RoomEnvelope, TimerEnvelope } from "./roomBus.types";

const ROOM_CHANNEL = "bingo:room";
const TIMER_CHANNEL = "bingo:timer";
const JOIN_CHANNEL = "bingo:join";

type JoinHandler = (envelope: JoinEnvelope) => void;

class RoomBus {
  private subscriber = createRedisClient("subscriber");
  private onJoin: JoinHandler | null = null;

  setJoinHandler(handler: JoinHandler) {
    this.onJoin = handler;
  }

  async start() {
    await this.subscriber.subscribe(ROOM_CHANNEL, TIMER_CHANNEL, JOIN_CHANNEL);

    this.subscriber.on("message", (channel, payload) => {
      try {
        if (channel === ROOM_CHANNEL) {
          socketManager.deliver(JSON.parse(payload) as RoomEnvelope);
          return;
        }

        if (channel === JOIN_CHANNEL) {
          this.onJoin?.(JSON.parse(payload) as JoinEnvelope);
          return;
        }

        const timer = JSON.parse(payload) as TimerEnvelope;
        turnTimer.schedule(timer.gameId, timer.moveNumber, timer.deadline);
      } catch (error) {
        console.error("failed to handle bus message", error);
      }
    });
  }

  broadcast(roomId: string, message: string) {
    return redis.publish(ROOM_CHANNEL, JSON.stringify({ roomId, message }));
  }

  broadcastPerUser(roomId: string, payloads: Record<string, string>) {
    return redis.publish(ROOM_CHANNEL, JSON.stringify({ roomId, payloads }));
  }

  sendToUser(roomId: string, userId: string, message: string) {
    return redis.publish(
      ROOM_CHANNEL,
      JSON.stringify({ roomId, payloads: { [userId]: message } })
    );
  }

  joinRoom(roomId: string, payloads: Record<string, string>) {
    return redis.publish(JOIN_CHANNEL, JSON.stringify({ roomId, payloads }));
  }

  scheduleTurn(gameId: string, moveNumber: number, deadline: number | null) {
    return redis.publish(
      TIMER_CHANNEL,
      JSON.stringify({ gameId, moveNumber, deadline })
    );
  }

  async stop() {
    await this.subscriber.quit();
  }
}

export const roomBus = new RoomBus();
