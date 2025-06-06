// hooks/useChatSocket.ts
import { useEffect, useRef, useState } from "react";
import {
  HubConnectionBuilder,
  HubConnection,
  LogLevel,
  HttpTransportType,
} from "@microsoft/signalr";
import { Platform } from "react-native";

export interface ChatMessageDto {
  id: number;
  content: string;
  sendDate: string;
  senderId: number;
  receiverId: number;
  channelId: number;
  parentId: number;
}

type UseChatSocketProps = {
  token: string;
  conversationWithUserId: number;
  onReceive: (msg: ChatMessageDto) => void;
};

export const useChatSocket = ({
  token,
  conversationWithUserId,
  onReceive,
}: UseChatSocketProps) => {
  const connectionRef = useRef<HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const baseUrl =
      Platform.OS === "android"
        ? "http://10.0.2.2:5263/chatHub"
        : "http://192.168.1.10:5263/chatHub";

    const conn = new HubConnectionBuilder()
      .withUrl(baseUrl, {
        accessTokenFactory: () => token,
        transport: HttpTransportType.LongPolling,
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    conn.on("OnMessageReceived", onReceive);
    conn.on("OnUserConnected", (userId: string) =>
      console.log("OnUserConnected:", userId)
    );
    conn.on("OnUserJoinedChannel", (channelId: string) =>
      console.log("OnUserJoinedChannel:", channelId)
    );
    conn.onclose(() => setIsConnected(false));

    conn
      .start()
      .then(() => {
        setIsConnected(true);
        return conn.invoke("JoinChannel", conversationWithUserId);
      })
      .catch((err) => console.error("SignalR connection failed:", err));

    connectionRef.current = conn;
    return () => {
      conn.stop();
      connectionRef.current = null;
    };
  }, [token, conversationWithUserId, onReceive]);

  const sendMessage = async (content: string): Promise<ChatMessageDto> => {
    const res = await fetch(
      `http://192.168.1.10:5263/api/Message/PostForUser`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, receiverId: conversationWithUserId }),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Erreur API: ${text}`);
    }
    return (await res.json()) as ChatMessageDto;
  };

  return { isConnected, sendMessage };
};
