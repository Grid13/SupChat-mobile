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

  const [userId, setUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);

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

  const fetchUserId = async () => {
    try {
      const res = await fetch("http://192.168.202.30:5263/Own", {
        headers: {
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setUserId(data?.id ?? null);
    } catch (err) {
      console.error("Failed to fetch user ID:", err);
      setUserId(null);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch("http://192.168.202.30:5263/api/Message", {
        headers: {
          Accept: "text/plain",
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();
      const json = JSON.parse(text);

      if (!Array.isArray(json)) throw new Error("Invalid message format");

      const grouped: MessageItem[] = [];
      let currentLabel: string | null = null;
      let dailyMessages: MessageItem[] = [];

      for (const msg of json) {
        const label = formatDay(msg.sendDate);

        const message: MessageItem = {
          type: "message",
          text: msg.content,
          time: formatTime(msg.sendDate),
          isSender: msg.senderId === userId,
          avatar: msg.senderId === userId ? "" : avatar || "",
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
      console.error("Error fetching messages:", err);
      Alert.alert("API Error", err.message || "Failed to load messages.");
    }
  };

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
    fetchUserId();
  }, []);

  useEffect(() => {
    if (userId !== null) {
      fetchMessages();
    }
  }, [userId]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <Header name={name || ""} avatar={avatar || ""} />
        <ScrollView ref={scrollViewRef} style={styles.messages}>
          {messages.map((msg, idx) =>
            msg.type === "separator" ? (
              <View key={`sep-${idx}`} style={styles.separatorContainer}>
                <View style={styles.line} />
                <Text style={styles.separatorText}>{msg.label}</Text>
                <View style={styles.line} />
              </View>
            ) : (
              <MessageBubble key={`msg-${idx}`} {...msg} />
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
