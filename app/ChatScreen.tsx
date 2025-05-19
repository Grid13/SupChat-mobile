import React, { useState, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Text,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSelector } from "react-redux";
import Header from "./components/Message/Header";
import MessageBubble from "./components/Message/MessageBubble";
import ChatInput from "./components/Message/ChatInput";
import { RootState } from "./store/store";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type MessageItem =
  | {
      type: "message";
      text: string;
      time: string;
      isSender: boolean;
      avatar: string;
    }
  | {
      type: "separator";
      label: string;
    };

const ChatScreen: React.FC = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const params = useLocalSearchParams();
  const token = useSelector((state: RootState) => state.auth.token);

  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const avatar = Array.isArray(params.avatar) ? params.avatar[0] : params.avatar;
  const otherUserId = Array.isArray(params.userId) ? params.userId[0] : params.userId;

  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(false);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}h${minutes}`;
  };

  const formatDay = (isoDate: string) => {
    const date = new Date(isoDate);
    return format(date, "d MMMM yyyy", { locale: fr });
  };

  // 1. Récupération de ton propre userId
  const fetchMyUserId = async () => {
    try {
      const res = await fetch("http://192.168.202.30:5263/api/Account/Own", {
        headers: {
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setMyUserId(data?.applicationUser?.id ?? null);
    } catch (err) {
      setMyUserId(null);
    }
  };

  const fetchMessages = async () => {
    if (!otherUserId) {
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `http://192.168.202.30:5263/api/Message/ByUser?userId=${otherUserId}&pageNumber=1&pageSize=50`,
        {
          headers: {
            Accept: "text/plain",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const text = await response.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        json = [];
      }

      let messageArr = Array.isArray(json)
        ? json
        : Array.isArray(json.value)
        ? json.value
        : Array.isArray(json.valueOrDefault)
        ? json.valueOrDefault
        : [];

      const grouped: MessageItem[] = [];
      let currentLabel: string | null = null;
      let dailyMessages: MessageItem[] = [];

      for (const msg of messageArr) {
        const label = formatDay(msg.sendDate);

        const message: MessageItem = {
          type: "message",
          text: msg.content,
          time: formatTime(msg.sendDate),
          isSender: msg.senderId === myUserId,
          avatar: msg.senderId === myUserId ? "" : avatar || "",
        };

        if (label !== currentLabel && dailyMessages.length > 0) {
          grouped.push({ type: "separator", label: currentLabel! });
          grouped.push(...dailyMessages);
          dailyMessages = [];
        }

        currentLabel = label;
        dailyMessages.push(message);
      }

      if (dailyMessages.length > 0 && currentLabel) {
        grouped.push({ type: "separator", label: currentLabel });
        grouped.push(...dailyMessages);
      }

      setMessages(grouped);
    } catch (err: any) {
      Alert.alert("API Error", err.message || "Failed to load messages.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Envoi local (juste pour le test d'affichage)
  const handleSend = (message: string) => {
    const newMsg: MessageItem = {
      type: "message",
      text: message,
      time: formatTime(new Date().toISOString()),
      isSender: true,
      avatar: "",
    };
    setMessages((prev) => [...prev, newMsg]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  useEffect(() => {
    fetchMyUserId();
  }, []);

  useEffect(() => {
    if (myUserId !== null && otherUserId) {
      fetchMessages();
    }
  }, [myUserId, otherUserId]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <Header name={name || ""} avatar={avatar || ""} />
        <ScrollView ref={scrollViewRef} style={styles.messages}>
          {loading ? (
            <Text style={{ color: "#888", marginTop: 30, alignSelf: "center" }}>Chargement…</Text>
          ) : (
            messages.map((msg, idx) =>
              msg.type === "separator" ? (
                <View key={`sep-${idx}`} style={styles.separatorContainer}>
                  <View style={styles.line} />
                  <Text style={styles.separatorText}>{msg.label}</Text>
                  <View style={styles.line} />
                </View>
              ) : (
                <MessageBubble key={`msg-${idx}`} {...msg} />
              )
            )
          )}
        </ScrollView>
        <ChatInput onSend={handleSend} />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  messages: { flex: 1, padding: 10 },
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
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#444",
    opacity: 0.5,
  },
});

export default ChatScreen;
