type ExpiryHandler = (gameId: string, moveNumber: number) => Promise<void>;

class TurnTimer {
  private timers: Map<string, NodeJS.Timeout>;
  private onExpire: ExpiryHandler | null;

  constructor() {
    this.timers = new Map<string, NodeJS.Timeout>();
    this.onExpire = null;
  }

  setHandler(handler: ExpiryHandler) {
    this.onExpire = handler;
  }

  schedule(gameId: string, moveNumber: number, deadline: number | null) {
    this.clear(gameId);

    if (!deadline || !this.onExpire) {
      return;
    }

    const delay = Math.max(deadline - Date.now(), 0);
    const timer = setTimeout(() => {
      this.timers.delete(gameId);
      this.onExpire?.(gameId, moveNumber).catch((error) =>
        console.error("turn timer failed", error)
      );
    }, delay);

    this.timers.set(gameId, timer);
  }

  clear(gameId: string) {
    const timer = this.timers.get(gameId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(gameId);
    }
  }
}

export const turnTimer = new TurnTimer();
