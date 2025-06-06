// useChatMessages.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { HubConnection } from "@microsoft/signalr";
import { createChatConnection } from "./useSocketConnexion";

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
  onReceive: (message: ChatMessageDto) => void
) => {
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<HubConnection | null>(null);

  // 1) Démarrage / arrêt de la connexion SignalR, dès que token est disponible
  useEffect(() => {
    if (!token) {
      // Si pas de token, ne rien faire (considérons qu’on est pas encore loggué)
      return;
    }

    // Crée et configure la connexion (mais ne la démarre pas encore)
    const connection = createChatConnection(token, onReceive);
    connectionRef.current = connection;

    // Sur reconnection automatique, si la reprise a réussi, on passe isConnected à true
    connection.onreconnected(() => {
      setIsConnected(true);
    });
    // Si la connexion est fermée (erreur, logout, etc.), on passe isConnected à false
    connection.onclose(() => {
      setIsConnected(false);
    });
    // Lorsqu’on tente de reconnecter, on peut passer à false
    connection.onreconnecting(() => {
      setIsConnected(false);
    });

    // Démarre réellement la connexion
    connection
      .start()
      .then(() => {
        console.log("✅ Connected to chatHub via Hook");
        setIsConnected(true);
      })
      .catch((err) => {
        console.error("❌ SignalR connection error:", err);
      });

    // Au démontage / logout, on arrête la connexion 
    return () => {
      connection.stop();
      connectionRef.current = null;
      setIsConnected(false);
    };
  }, [token, onReceive]);

  // 2) Fonction pour envoyer un message à un utilisateur donné via HTTP
  const sendMessage = useCallback(
    async (receiverId: number, content: string): Promise<ChatMessageDto> => {
      // Même logique qu’auparavant : on appelle l’API REST pour poster le message
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
}
