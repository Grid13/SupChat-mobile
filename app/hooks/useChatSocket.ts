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
  parentId?: number;
}

/**
 * Hook to manage private chat socket connection and messaging
 * @param token JWT authentication token
 * @param onReceive Callback invoked when a new ChatMessageDto is received
 * @returns { isConnected: boolean, sendMessage: (userId: number, content: string) => Promise<ChatMessageDto> }
 */
const useChatSocket = (
  token: string,
  onReceive: (message: ChatMessageDto) => void
) => {
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    const connect = async () => {
      const transport =
        Platform.OS === "web"
          ? HttpTransportType.WebSockets
          : HttpTransportType.LongPolling;

      const connection = new HubConnectionBuilder()
        .withUrl("http://192.168.1.10:5263/chatHub", {
          accessTokenFactory: () => token,
          transport,
        })
        .configureLogging(LogLevel.Information)
        .withAutomaticReconnect()
        .build();

      connectionRef.current = connection;

      // Connection lifecycle handlers
      connection.onreconnecting((error) => {
        console.warn("SignalR reconnecting:", error);
        setIsConnected(false);
      });

      connection.onreconnected((connectionId) => {
        console.log("SignalR reconnected, connectionId:", connectionId);
        setIsConnected(true);
      });

      connection.onclose((error) => {
        console.warn("SignalR connection closed:", error);
        setIsConnected(false);
      });

      // Subscribe to incoming private messages
      connection.on(
        "OnMessageReceived",
        (message: ChatMessageDto) => {
          onReceive(message);
        }
      );

      try {
        await connection.start();
        console.log("✅ Connected to chatHub");
        setIsConnected(true);
      } catch (err) {
        console.error("❌ SignalR connection error:", err);
      }
    };

    connect();

    return () => {
      connectionRef.current?.stop();
    };
  }, [token, onReceive]);

  /**
   * Send a private message to a specific user via HTTP API
   * @param receiverId ID of the user to send the message to
   * @param content Message content
   * @returns Promise resolving to the sent ChatMessageDto
   */
  const sendMessage = async (
    receiverId: number,
    content: string
  ): Promise<ChatMessageDto> => {
    const res = await fetch(
      `http://192.168.1.10:5263/api/Message/PostForUser`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, receiverId }),
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

export default useChatSocket;
