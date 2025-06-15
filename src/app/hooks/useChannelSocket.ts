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
  useEffect(() => {
    if (!connection || !channelId) return;

    connection.on("OnMessageReceived", (msg) => {
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

 
    connection.invoke("JoinChannel", channelId).catch(() => {});

    return () => {
      connection.off("OnMessageReceived", onReceive);
      if (onUpdate) connection.off("onmessageupdated", onUpdate);
      if (onDelete) connection.off("onmessagedeleted", onDelete);
      if (onReactionAdded) connection.off("OnReactionAdded", onReactionAdded);
      if (onReactionDeleted) connection.off("OnReactionDeleted", onReactionDeleted);
      connection.invoke("LeaveChannel", channelId).catch(() => {});
    };
  }, [connection, channelId, onReceive, onUpdate, onDelete, onReactionAdded, onReactionDeleted]);

  const sendMessage = useCallback(
    async (content: string): Promise<ChannelMessageDto> => {
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
      return data as ChannelMessageDto;
    },
    [token, channelId]
  );

  return { sendMessage };
};

export default useChannelSocket;
