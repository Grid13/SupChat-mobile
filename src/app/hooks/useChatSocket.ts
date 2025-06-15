import { useEffect, useRef, useState, useCallback } from "react";
import { HubConnection } from "@microsoft/signalr";
import { createChatConnection } from "./useSocketConnexion";
import dotenv from 'dotenv';

const ipAddress = process.env.EXPO_PUBLIC_IP_ADDRESS;

/**
 * Hook pour gérer la connexion SignalR et l’envoi/réception de messages.
 * Démarre la connexion seulement après que l’on ait un token (post-login).
 *
 * @param token Token JWT (string non vide après login)
 * @param onReceive Callback appelé à chaque nouveau ChatMessageDto reçu
 * @returns { isConnected, sendMessage }
 */
const useChatMessages = (
  token: string,
  onReceive: (message: ChatMessageDto) => void,
  onUpdate?: (message: any) => void,
  onDelete?: (id: number) => void,
  onReactionAdded?: (reaction: { id: number, content: string, messageId: number, senderId: number }) => void,
  onReactionDeleted?: (messageId: number, reactionId: number) => void
) => {
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    const connection = createChatConnection(token, () => {});
    connectionRef.current = connection;

    connection.on("OnMessageReceived", onReceive);
    if (onUpdate) {
      connection.on("onmessageupdated", onUpdate);
    }
    if (typeof onDelete === 'function') {
      connection.on("onmessagedeleted", onDelete);
    }
    if (onReactionAdded) {
      connection.on("OnReactionAdded", onReactionAdded);
    }
    if (onReactionDeleted) {
      connection.on("OnReactionDeleted", onReactionDeleted);
    }

    connection.onreconnected(() => {
      setIsConnected(true);
    });
    connection.onclose(() => {
      setIsConnected(false);
    });
    connection.onreconnecting(() => {
      setIsConnected(false);
    });

    connection
      .start()
      .then(() => {
        console.log("✅ Connected to chatHub via Hook");
        setIsConnected(true);
      })
      .catch((err) => {
        console.error("❌ SignalR connection error:", err);
      });

    return () => {
      connection.stop();
      connectionRef.current = null;
      setIsConnected(false);
    };
  }, [token, onReceive, onUpdate, onDelete, onReactionAdded, onReactionDeleted]);

  const sendMessage = useCallback(
    async (receiverId: number, content: string): Promise<ChatMessageDto> => {
      const res = await fetch(
        `http://${ipAddress}:5263/api/Message/PostForUser`,
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
    },
    [token]
  );

  return { isConnected, sendMessage };
};

export default useChatMessages;

export interface ChatMessageDto {
  id: number;
  content: string;
  sendDate: string;
  senderId: number;
  receiverId: number;
  parentId?: number;
  attachments?: string[];
}
