// chatSocketConnection.ts
import {
  HubConnectionBuilder,
  HubConnection,
  LogLevel,
  HttpTransportType,
} from "@microsoft/signalr";
import { Platform } from "react-native";

const ipAddress = process.env.EXPO_PUBLIC_IP_ADDRESS;


/**
 * Crée et configure une instance HubConnection pour le chat.
 * Ne démarre PAS automatiquement la connexion.
 * @param token Token JWT pour l’authentification SignalR
 * @param onReceive Callback appelé à chaque message reçu
 * @returns HubConnection configuré (mais non démarré)
 */
export const createChatConnection = (
  token: string,
  onReceive: (message: import("./useChatSocket").ChatMessageDto) => void
): HubConnection => {
  // Choix du transport en fonction de la plateforme
  const transport =
    Platform.OS === "web"
      ? HttpTransportType.WebSockets
      : HttpTransportType.LongPolling;

  const connection = new HubConnectionBuilder()
    .withUrl("http://"+ipAddress+":5263/chatHub", {
      accessTokenFactory: () => token,
      transport,
    })
    .configureLogging(LogLevel.Information)
    .withAutomaticReconnect()
    .build();

  // Gestion du cycle de vie
  connection.onreconnecting((error) => {
    console.warn("SignalR reconnecting:", error);
  });
  connection.onreconnected((connectionId) => {
    console.log("SignalR reconnected, connectionId:", connectionId);
  });
  connection.onclose((error) => {
    console.warn("SignalR connection closed:", error);
  });

  // Abonnement aux messages entrants
  // (Moved to useChatSocket/useChatMessages)

  return connection;
};
