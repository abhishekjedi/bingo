import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AuthContext } from "../auth";
import {
  ClientMessage,
  ServerMessage,
  SocketContextType,
  SocketManagerProps,
} from "./socket.manager.types";

export const SocketContext = createContext<SocketContextType>({
  connected: false,
  send: () => {},
  subscribe: () => () => {},
});

const socketServerURL =
  import.meta.env.VITE_SOCKET_SERVER_URL || "ws://localhost:8080";

const RECONNECT_DELAY_MS = 1500;

function SocketManager({ children }: SocketManagerProps) {
  const { token } = useContext(AuthContext);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Set<(message: ServerMessage) => void>>(new Set());
  const queueRef = useRef<ClientMessage[]>([]);

  const subscribe = useCallback((listener: (message: ServerMessage) => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const send = useCallback((message: ClientMessage) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
      return;
    }
    queueRef.current.push(message);
  }, []);

  useEffect(() => {
    if (!token) return;

    let disposed = false;
    let reconnectTimer: number | undefined;

    const connect = () => {
      if (disposed) return;

      const ws = new WebSocket(`${socketServerURL}?token=${token}`);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        const pending = queueRef.current;
        queueRef.current = [];
        pending.forEach((message) => ws.send(JSON.stringify(message)));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as ServerMessage;
          listenersRef.current.forEach((listener) => listener(message));
        } catch {
          console.error("could not parse server message");
        }
      };

      ws.onclose = () => {
        setConnected(false);
        socketRef.current = null;
        if (!disposed) {
          reconnectTimer = window.setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };

      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      disposed = true;
      window.clearTimeout(reconnectTimer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ connected, send, subscribe }}>
      {children}
    </SocketContext.Provider>
  );
}

export default SocketManager;
