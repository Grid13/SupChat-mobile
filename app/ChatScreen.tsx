import React, { useState, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import Header from "./components/Message/Header";
import MessageBubble from "./components/Message/MessageBubble";
import ChatInput from "./components/Message/ChatInput";

const ChatScreen: React.FC = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const params = useLocalSearchParams();

  // 👇 Sécurité : string[] | string => string
  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const avatar = Array.isArray(params.avatar) ? params.avatar[0] : params.avatar;

  const [messages, setMessages] = useState([
    { text: "Salut !", time: "12h30", isSender: false, avatar: avatar || "" },
    { text: "Hello, comment tu vas ?", time: "12h31", isSender: true, avatar: "" },
  ]);

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}h${minutes}`;
  };

  const handleSend = (message: string) => {
    const newMsg = {
      text: message,
      time: formatTime(new Date()),
      isSender: true,
      avatar: "",
    };
    setMessages((prev) => [...prev, newMsg]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <Header name={name || ""} avatar={avatar || ""} />
        <ScrollView ref={scrollViewRef} style={styles.messages}>
          {messages.map((msg, idx) => (
            <MessageBubble key={idx} {...msg} />
          ))}
        </ScrollView>
        <ChatInput onSend={handleSend} />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  messages: { flex: 1, padding: 10 },
});

export default ChatScreen;
