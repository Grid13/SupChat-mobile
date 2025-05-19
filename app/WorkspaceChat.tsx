import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "./store/store";
import MessageBubble from "./components/Message/MessageBubble";
import ChatInput from "./components/Message/ChatInput";
import DropdownMenu from "./components/DropdownMenu";
import WorkspaceInfoSheet from "./components/WorkspaceInfoSheet";
import WorkspaceDrawer, { Channel } from "./components/WorkspaceDrawer";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type MessageItem =
  | {
      type: 'message';
      text: string;
      time: string;
      isSender: boolean;
      avatar: string;
    }
  | {
      type: 'separator';
      label: string;
    };

const WorkspaceChat = () => {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const { id, name, avatar } = useLocalSearchParams();
  const avatarUrl = Array.isArray(avatar) ? avatar[0] : avatar || "";
  const token = useSelector((state: RootState) => state.auth.token);

  // Channels list
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);

  // Channel selection & messages
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // UI
  const [menuVisible, setMenuVisible] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const [userId, setUserId] = useState<number | null>(null);

  // Fonction de reload utilisable à tout moment
  const fetchChannels = useCallback(async () => {
    setChannelsLoading(true);
    try {
      const response = await fetch(`http://192.168.202.30:5263/api/Workspace/${id}/Channels`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const text = await response.text();
      let json;
      try { json = JSON.parse(text); } catch { json = []; }
      let channelList: Channel[] = [];
      if (Array.isArray(json)) channelList = json;
      else if (Array.isArray(json.value)) channelList = json.value;
      else if (Array.isArray(json.valueOrDefault)) channelList = json.valueOrDefault;
      setChannels(channelList);
      // Par défaut, sélectionne le premier channel s'il existe
      if (channelList.length > 0 && !selectedChannel) {
        setSelectedChannel(channelList[0]);
      }
    } catch (err) {
      setChannels([]);
    } finally {
      setChannelsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token, selectedChannel]);

  // Précharge channels au mount
  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // Récupère l'userId (pour déterminer si sender)
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const res = await fetch("http://192.168.202.30:5263/api/Account/Own", {
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setUserId(data?.applicationUser?.id ?? null);
      } catch (err) {
        setUserId(null);
      }
    };
    fetchUserId();
  }, [token]);

  // Fetch les messages du channel sélectionné
  useEffect(() => {
    if (!selectedChannel || userId === null) {
      setMessages([]);
      return;
    }
    let isActive = true;
    const fetchMessages = async () => {
      setMessagesLoading(true);
      try {
        const url = `http://192.168.202.30:5263/api/Message/ByChannel?channelId=${selectedChannel.id}&pageNumber=1&pageSize=50`;
        const response = await fetch(url, {
          headers: {
            Accept: "text/plain",
            Authorization: `Bearer ${token}`,
          },
        });
        const text = await response.text();
        let json;
        try { json = JSON.parse(text); } catch { json = []; }
        // On gère le cas où la réponse est enveloppée dans un objet
        let messageArr = Array.isArray(json) ? json
          : (Array.isArray(json.value) ? json.value : (Array.isArray(json.valueOrDefault) ? json.valueOrDefault : []));
        // Regroupement par jour comme ChatScreen
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
        const grouped: MessageItem[] = [];
        let currentLabel: string | null = null;
        let dailyMessages: MessageItem[] = [];
        for (const msg of messageArr) {
          const label = formatDay(msg.sendDate);
          const message: MessageItem = {
            type: "message",
            text: msg.content,
            time: formatTime(msg.sendDate),
            isSender: msg.senderId === userId,
            avatar: msg.senderId === userId ? "" : avatarUrl,
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
        if (isActive) setMessages(grouped);
      } catch (err: any) {
        if (isActive) setMessages([]);
        Alert.alert("API Error", err.message || "Failed to load messages.");
      } finally {
        if (isActive) setMessagesLoading(false);
      }
    };
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannel, userId, token]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Swipe pour drawer
  const onHandlerStateChange = (event: any) => {
    const { state, translationX } = event.nativeEvent;
    if (state === State.END) {
      if (translationX > 20 && !drawerVisible) {
        setDrawerVisible(true);
      }
      if (translationX < -20 && drawerVisible) {
        setDrawerVisible(false);
      }
    }
  };

  // Changement de channel par le drawer
  const handleChannelPress = (ch: Channel) => {
    setSelectedChannel(ch);
    setDrawerVisible(false);
  };

  // Envoi d'un message (juste local, sans POST API)
  const handleSend = (message: string) => {
    const now = new Date();
    const dayLabel = format(now, "d MMMM yyyy", { locale: fr });
    const time = `${now.getHours().toString().padStart(2, "0")}h${now.getMinutes().toString().padStart(2, "0")}`;
    let newMessages = [...messages];
    // Ajoute un séparateur si on change de jour
    if (
      newMessages.length === 0 ||
      !newMessages.some(m => m.type === "separator" && m.label === dayLabel)
    ) {
      newMessages.push({ type: "separator", label: dayLabel });
    }
    newMessages.push({
      type: "message",
      text: message,
      time,
      isSender: true,
      avatar: "",
    });
    setMessages(newMessages);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Nom du channel actif à afficher dans le header
  const activeChannelName = selectedChannel ? selectedChannel.name : "Choisir un channel";

  return (
    <PanGestureHandler
      onHandlerStateChange={onHandlerStateChange}
      activeOffsetX={10}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <WorkspaceDrawer
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            onChannelPress={handleChannelPress}
            workspaceId={Number(id)}
            workspaceName={name as string}
            channels={channels}
            loading={channelsLoading}
            selectedChannelId={selectedChannel?.id}
            onChannelCreated={fetchChannels} // Rafraîchit la liste
          />

          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push("/(tabs)/Workspaces")}>
              <Ionicons name="arrow-back" size={24} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMenuVisible(true)}>
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ flex: 1 }}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.channelName}>
                {activeChannelName}
              </Text>
            </TouchableOpacity>
            <Ionicons name="search" size={22} color="black" style={{ marginHorizontal: 10 }} />
            <MaterialIcons name="more-vert" size={22} color="black" />
          </View>

          <ScrollView ref={scrollViewRef} style={styles.chat}>
            {messagesLoading ? (
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
      </KeyboardAvoidingView>
    </PanGestureHandler>
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
  channelName: { fontSize: 13, color: "#4F8CFF" },
  chat: { flex: 1, padding: 10 },
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
