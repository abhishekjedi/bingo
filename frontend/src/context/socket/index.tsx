import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth";
import { SocketContextType, SocketManagerProps } from "./socket.manager.types";

export const SocketContext = createContext<SocketContextType | null>(null);

const socketServerURL =
  import.meta.env.VITE_SOCKET_SERVER_URL || "ws://localhost:8080";

function SocketManager({ children }: SocketManagerProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(`${socketServerURL}?token=${token}`);

    if (!ws) return;
    ws.onopen = () => {
      setSocket(ws);
    };

    ws.onclose = () => {
      setSocket(null);
    };

    return () => {
      ws.close();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export default SocketManager;
