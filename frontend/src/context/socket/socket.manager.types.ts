export type SocketManagerProps = {
  children: React.ReactNode;
};

// eslint-disable-next-line
export type ServerMessage = Record<string, any> & { type: string };

// eslint-disable-next-line
export type ClientMessage = Record<string, any> & { type: string };

export type SocketContextType = {
  connected: boolean;
  send: (message: ClientMessage) => void;
  subscribe: (listener: (message: ServerMessage) => void) => () => void;
};
