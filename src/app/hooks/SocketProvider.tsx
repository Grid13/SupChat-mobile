import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { createChatConnection } from "./useSocketConnexion";
import type { ChatMessageDto } from "./useChatSocket";
import { HubConnection } from "@microsoft/signalr";

interface NotificationModel {
  Id: number;
  Content: string;
  Type: string; 
  TypeLocalized: string;
  IsActive: boolean;
  MessageId: number;
  UserId: string;
}

type SocketContextType = {
  connection: HubConnection | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useSelector((s: RootState) => s.auth.token);
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    if (!token) return;

    const connection = createChatConnection(token, (msg: ChatMessageDto) => {
    });
    connectionRef.current = connection;

    connection.onreconnected(() => setIsConnected(true));
    connection.onclose(() => setIsConnected(false));
    connection.onreconnecting(() => setIsConnected(false));

    connection.on("OnNotificationReceived", (notification: NotificationModel) => {
    });
    

    connection
      .start()
      .then(() => setIsConnected(true))
      .catch(() => setIsConnected(false));

    return () => {
      connection.stop();
      connectionRef.current = null;
      setIsConnected(false);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ connection: connectionRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be utilisé dans SocketProvider");
  return ctx;
};
