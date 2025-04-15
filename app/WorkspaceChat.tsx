import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MessageBubble from './components/Message/MessageBubble';
import ChatInput from './components/Message/ChatInput';
import DropdownMenu from './components/DropdownMenu';
import WorkspaceInfoSheet from './components/WorkspaceInfoSheet';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const WorkspaceChat = () => {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const { name, avatar } = useLocalSearchParams();

  const [messages, setMessages] = useState([
    { id: 1, text: "Salut à tous 👋", time: "12h30", isSender: false },
    { id: 2, text: "Hey !", time: "12h31", isSender: true },
    { id: 3, text: "Vous êtes dispo pour le projet ?", time: "12h33", isSender: false },
  ]);

  const [menuVisible, setMenuVisible] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const handleSend = (text: string) => {
    const newMsg = {
      id: messages.length + 1,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSender: true,
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/Workspaces")}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Image source={{ uri: avatar as string }} style={styles.avatar} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ flex: 1 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.status}>
            5 members • <Text style={{ color: 'green' }}>2 online</Text>
          </Text>
        </TouchableOpacity>

        <Ionicons name="search" size={22} color="black" style={{ marginHorizontal: 10 }} />
        <MaterialIcons name="more-vert" size={22} color="black" />
      </View>

      {/* Messages */}
      <ScrollView ref={scrollViewRef} style={styles.chat}>
        <Text style={styles.dateLabel}>Today</Text>
        {messages.map((msg) => {
          const isSender = msg.isSender;
          return (
            <View
              key={msg.id}
              style={{
                flexDirection: "row",
                justifyContent: isSender ? "flex-end" : "flex-start",
                alignItems: "flex-end",
                marginBottom: 8,
              }}
            >
              {!isSender && (
                <Image
                  source={{ uri: avatar as string }}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    marginRight: 8,
                    alignSelf: "flex-end",
                  }}
                />
              )}
              <MessageBubble
                text={msg.text}
                time={msg.time}
                isSender={isSender}
              />
            </View>
          );
        })}
      </ScrollView>

      {/* Input */}
      <ChatInput onSend={handleSend} />

      {/* Dropdown + Info Sheet */}
      <DropdownMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onViewInfo={() => {
            setMenuVisible(false);
            setShowInfo(true);
        }}
        />
      <WorkspaceInfoSheet
        visible={showInfo}
        onClose={() => setShowInfo(false)}
        workspaceName={name as string}
        />



    </View>
  );
};

export default WorkspaceChat;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row", alignItems: "center", padding: 10,
    borderBottomWidth: 1, borderColor: "#ddd",
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginHorizontal: 10 },
  name: { fontWeight: "bold", fontSize: 16 },
  status: { fontSize: 12, color: "#555" },
  chat: {
    flex: 1,
    padding: 10,
  },
  dateLabel: {
    textAlign: "left",
    fontWeight: "bold",
    fontSize: 13,
    color: "#444",
    marginVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 5,
  },
});
