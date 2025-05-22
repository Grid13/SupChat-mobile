import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useSelector } from "react-redux";
import Header from "./components/Message/Header";
import MessageBubble from "./components/Message/MessageBubble";
import ChatInput from "./components/Message/ChatInput";
import { RootState } from "./store/store";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import "react-native-url-polyfill/auto";
import { useChatSocket, ChatMessageDto } from "./hooks/useChatSocket";

type MessageItem =
  | { type: "separator"; label: string }
  | {
      type: "message";
      text: string;
      time: string;
      isSender: boolean;
      avatar: string;
    };

const ChatScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const token = useSelector((s: RootState) => s.auth.token);
  const otherUserId = Number(
    Array.isArray(params.userId) ? params.userId[0] : params.userId
  );
  const avatar = Array.isArray(params.avatar)
    ? params.avatar[0]
    : params.avatar;

  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    if (!isNaN(d.getTime())) {
      return `${d.getHours().toString().padStart(2, "0")}h${d
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
    }
    const match = iso.match(/(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})\s*([AP]M)/);
    if (match) {
      let [_, month, day, year, hour, min, sec, ampm] = match;
      let h = parseInt(hour, 10);
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return `${h.toString().padStart(2, "0")}h${min.padStart(2, "0")}`;
    }
    return "--:--";
  };
  const formatDay = (iso: string) =>
    format(new Date(iso), "d MMMM yyyy", { locale: fr });

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("http://192.168.1.10:5263/api/Account/Me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await r.json();
        setMyUserId(d.applicationUser?.id ?? null);
      } catch (e) {
        console.error("fetch /Me failed:", e);
      }
    })();
  }, [token]);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://192.168.1.10:5263/api/Message/ByUser?userId=${otherUserId}&pageNumber=1&pageSize=50`,
        {
          headers: {
            Accept: "text/plain",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const text = await res.text();
      const json = JSON.parse(text || "[]");
      const arr: ChatMessageDto[] = Array.isArray(json.value)
        ? json.value
        : json.valueOrDefault || json;
      const grouped: MessageItem[] = [];
      let currLabel: string | null = null;
      let dayMsgs: MessageItem[] = [];
      arr.sort((a, b) => new Date(a.sendDate).getTime() - new Date(b.sendDate).getTime());
      arr.forEach((m) => {
        const label = formatDay(m.sendDate);
        if (currLabel && label !== currLabel) {
          grouped.push({ type: "separator", label: currLabel });
          grouped.push(...dayMsgs);
          dayMsgs = [];
        }
        currLabel = label;
        dayMsgs.push({
          type: "message",
          text: m.content,
          time: formatTime(m.sendDate),
          isSender: m.senderId === myUserId,
          avatar: m.senderId === myUserId ? "" : avatar || "",
        });
      });
      if (dayMsgs.length && currLabel) {
        grouped.push({ type: "separator", label: currLabel });
        grouped.push(...dayMsgs);
      }
      setMessages(grouped);
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    } finally {
      setLoading(false);
    }
  }, [otherUserId, token, myUserId, avatar]);

  useEffect(() => {
    if (myUserId && otherUserId) fetchMessages();
  }, [myUserId, otherUserId, fetchMessages]);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleReceive = useCallback(
    (m: ChatMessageDto) => {
      if (m.senderId === otherUserId) {
        setMessages((prev) => [
          ...prev,
          {
            type: "message",
            text: m.content,
            time: formatTime(m.sendDate),
            isSender: false,
            avatar: avatar || "",
          },
        ]);
      }
    },
    [otherUserId, avatar]
  );

  const { isConnected, sendMessage } = useChatSocket({
    token: token!,
    conversationWithUserId: otherUserId,
    onReceive: handleReceive,
  });

  const handleSend = async (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        type: "message",
        text,
        time: formatTime(new Date().toISOString()),
        isSender: true,
        avatar: "",
      },
    ]);
    try {
      await sendMessage(text);
    } catch (e: any) {
      Alert.alert("Échec de l’envoi", e.message || "Réessayez.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          <Header name={params.name as string} avatar={avatar as string} />
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
            keyboardShouldPersistTaps="handled"
          >
            {loading ? (
              <Text style={styles.loadingText}>Chargement…</Text>
            ) : (
              messages.map((msg, i) =>
                msg.type === "separator" ? (
                  <View key={i} style={styles.separatorContainer}>
                    <View style={styles.line} />
                    <Text style={styles.separatorText}>{msg.label}</Text>
                    <View style={styles.line} />
                  </View>
                ) : (
                  <MessageBubble key={i} {...msg} />
                )
              )
            )}
          </ScrollView>
          <ChatInput onSend={handleSend} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#fff" },
  loadingText: { color: "#888", marginTop: 30, alignSelf: "center" },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    justifyContent: "center",
  },
  separatorText: {
    marginHorizontal: 10,
    fontSize: 12,
    color: "#888",
  },
  line: { flex: 1, height: 1, backgroundColor: "#444", opacity: 0.5 },
});

export default ChatScreen;
