// hooks/useChannelSocket.ts
import { useEffect, useCallback } from "react";
import { HubConnection } from "@microsoft/signalr";

const ipAddress = process.env.EXPO_PUBLIC_IP_ADDRESS;

export interface ChannelMessageDto {
  id: number;
  content: string;
  sendDate: string;
  senderId: number;
  channelId: number;
  parentId?: number;
  attachments?: string[];
}

type UseChannelSocketProps = {
  connection: HubConnection | null;
  channelId: number;
  onReceive: (msg: ChannelMessageDto) => void;
  onUpdate?: (msg: any) => void;
  onDelete?: (id: number) => void;
  onReactionAdded?: (reaction: {
    id: number;
    content: string;
    messageId: number;
    senderId: number;
  }) => void;
  onReactionDeleted?: (messageId: number, reactionId: number) => void;
  token: string;
};

const useChannelSocket = ({
  connection,
  channelId,
  onReceive,
  onUpdate,
  onDelete,
  onReactionAdded,
  onReactionDeleted,
  token,
}: UseChannelSocketProps) => {
  // Abonnement aux events du channel
  useEffect(() => {
    if (!connection || !channelId) return;

    connection.on("OnMessageReceived", (msg) => {
      console.log("[SignalR] OnMessageReceived:", msg);
      onReceive(msg);
    });
    if (onUpdate) connection.on("onmessageupdated", onUpdate);
    if (onDelete) connection.on("onmessagedeleted", onDelete);
    if (onReactionAdded) {
      connection.on("OnReactionAdded", onReactionAdded);
    }

    if (onReactionDeleted) {
      connection.on("OnReactionDeleted", onReactionDeleted);
    }

    // Join le channel côté SignalR
    console.log("[SignalR] JoinChannel called for channelId:", channelId);
    connection.invoke("JoinChannel", channelId).catch(() => {});

    return () => {
      connection.off("OnMessageReceived", onReceive);
      if (onUpdate) connection.off("onmessageupdated", onUpdate);
      if (onDelete) connection.off("onmessagedeleted", onDelete);
      if (onReactionAdded) connection.off("OnReactionAdded", onReactionAdded);
      if (onReactionDeleted) connection.off("OnReactionDeleted", onReactionDeleted);
      // Optionnel: LeaveChannel si besoin
      console.log("[SignalR] LeaveChannel called for channelId:", channelId);
      connection.invoke("LeaveChannel", channelId).catch(() => {});
    };
  }, [connection, channelId, onReceive, onUpdate, onDelete, onReactionAdded, onReactionDeleted]);

  // Envoi d'un message dans le channel via l'API REST
  const sendMessage = useCallback(
    async (content: string): Promise<ChannelMessageDto> => {
      console.log(
        "[API] Sending message to channelId:",
        channelId,
        "content:",
        content
      );
      const res = await fetch(
        `http://${ipAddress}:5263/api/Message/PostForChannel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content, channelId }),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erreur API: ${text}`);
      }
      const data = await res.json();
      console.log("[API] Message sent response:", data);
      return data as ChannelMessageDto;
    },
    [token, channelId]
  );

  return { sendMessage };
};

export default useChannelSocket;
