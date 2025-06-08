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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
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

// Définition du type pour messages et séparateurs

type MessageItem =
  | { type: 'message'; text: string; time: string; isSender: boolean; avatar: string }
  | { type: 'separator'; label: string };

const WorkspaceChat: React.FC = () => {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { id, name, avatar } = useLocalSearchParams();
  const avatarUrl = Array.isArray(avatar) ? avatar[0] : avatar || "";
  const token = useSelector((state: RootState) => state.auth.token);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // Récupère la liste des canaux du workspace
  const fetchChannels = useCallback(async () => {
    setChannelsLoading(true);
    try {
      const res = await fetch(
        `http://192.168.1.10:5263/api/Workspace/${id}/Channels`,
        { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } }
      );
      const txt = await res.text();
      let json: any = [];
      try { json = JSON.parse(txt); } catch {}
      const list: Channel[] = Array.isArray(json)
        ? json
        : Array.isArray(json.value)
        ? json.value
        : Array.isArray(json.valueOrDefault)
        ? json.valueOrDefault
        : [];
      setChannels(list);
      if (!selectedChannel && list.length) setSelectedChannel(list[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setChannelsLoading(false);
    }
  }, [id, token, selectedChannel]);

  // Récupère l'ID utilisateur courant
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://192.168.1.10:5263/api/Account/Me", {
          headers: { Accept: "*/*", Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setUserId(data.applicationUser?.id || null);
      } catch {
        setUserId(null);
      }
    })();
  }, [token]);

  // Charge les canaux au montage
  useEffect(() => { fetchChannels(); }, [fetchChannels]);

  // Récupère les messages pour le canal sélectionné
  useEffect(() => {
    console.log("selectedChannel:", selectedChannel, "userId:", userId);
    if (!selectedChannel || userId === null) {
      console.log("Fetch not called: selectedChannel or userId missing");
      return;
    }
    let active = true;
    (async () => {
      setMessagesLoading(true);
      try {
        const url = `http://192.168.1.10:5263/api/Message/ByChannel?channelId=${selectedChannel.id}&pageNumber=1&pageSize=50`;
        console.log("About to fetch messages from:", url);
        const res = await fetch(url, {
          headers: { Accept: "text/plain", Authorization: `Bearer ${token}` },
        });
        const txt = await res.text();
        let json: any = [];
        try { json = JSON.parse(txt); } catch {}
        console.log("Fetched messages raw response:", json);
        let arr: any[] = Array.isArray(json)
          ? json
          : Array.isArray(json.value)
          ? json.value
          : Array.isArray(json.valueOrDefault)
          ? json.valueOrDefault
          : [];
        arr = arr.slice().reverse();

        // Formatage date/heure et groupement par jour
        const formatted: MessageItem[] = [];
        let currentDay: string | null = null;
        arr.forEach(msg => {
          const day = format(new Date(msg.sendDate), "d MMMM yyyy", { locale: fr });
          if (day !== currentDay) {
            formatted.push({ type: "separator", label: day });
            currentDay = day;
          }
          formatted.push({
            type: "message",
            text: msg.content,
            time: `${new Date(msg.sendDate).getHours().toString().padStart(2, '0')}h${new Date(
              msg.sendDate
            )
              .getMinutes()
              .toString()
              .padStart(2, '0')}`,
            isSender: msg.senderId === userId,
            avatar: msg.senderId === userId ? "" : avatarUrl,
          });
        });

        if (active) setMessages(formatted);
      } catch (err: any) {
        console.error("Error fetching messages:", err);
        Alert.alert("Erreur API", err.message || "Impossible de charger les messages");
      } finally {
        active && setMessagesLoading(false);
      }
    })();
    return () => { active = false; };
  }, [selectedChannel, userId, token, avatarUrl]);

  // Scroll vers le bas à chaque nouveau message
  useEffect(() => { scrollViewRef.current?.scrollToEnd({ animated: true }); }, [messages]);

  // Gère le geste pour ouvrir/fermer le drawer
  const onHandlerStateChange = ({ nativeEvent }: any) => {
    if (nativeEvent.state === State.END) {
      if (nativeEvent.translationX > 20) setDrawerVisible(true);
      if (nativeEvent.translationX < -20) setDrawerVisible(false);
    }
  };

  // Envoi d'un message localement
  const handleSend = (text: string) => {
    const now = new Date();
    const day = format(now, "d MMMM yyyy", { locale: fr });
    const time = `${now.getHours().toString().padStart(2, '0')}h${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    setMessages(prev => {
      const copy = [...prev];
      if (!copy.find(m => m.type === "separator" && m.label === day)) {
        copy.push({ type: "separator", label: day });
      }
      copy.push({ type: "message", text, time, isSender: true, avatar: "" });
      return copy;
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top","bottom"]}>
      <PanGestureHandler onHandlerStateChange={onHandlerStateChange} activeOffsetX={10}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <View style={styles.container}>
            <WorkspaceDrawer
              visible={drawerVisible}
              onClose={() => setDrawerVisible(false)}
              onChannelPress={ch => {
                setSelectedChannel(ch);
                setDrawerVisible(false);
              }}
              workspaceId={Number(id)}
              workspaceName={name as string}
              channels={channels}
              loading={channelsLoading}
              selectedChannelId={selectedChannel?.id}
              onChannelCreated={fetchChannels}
            />
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMenuVisible(true)}>
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.channelName}>
                  {selectedChannel?.name || "Choisir un channel"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setMenuVisible(true)}>
                <Ionicons name="search" size={22} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginLeft: 10 }}>
                <MaterialIcons name="more-vert" size={22} />
              </TouchableOpacity>
            </View>
            <ScrollView
              ref={scrollViewRef}
              style={styles.chat}
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
              keyboardShouldPersistTaps="handled"
            >
              {messagesLoading ? (
                <Text style={styles.loadingText}>Chargement…</Text>
              ) : (
                messages.map((msg, idx) =>
                  msg.type === "separator" ? (
                    <View key={idx} style={styles.separatorContainer}>
                      <View style={styles.line} />
                      <Text style={styles.separatorText}>{msg.label}</Text>
                      <View style={styles.line} />
                    </View>
                  ) : (
                    <MessageBubble key={idx} {...msg} />
                  )
                )
              )}
            </ScrollView>
            <ChatInput
              onSend={handleSend}
              replyTo={null}
              onCancelReply={() => {}}
              editing={null}
              onSaveEdit={() => {}}
              onCancelEdit={() => {}}
            />
            <DropdownMenu
              visible={menuVisible}
              onClose={() => setMenuVisible(false)}
              onViewInfo={() => {
                setMenuVisible(false);
                setInfoVisible(true);
              }}
            />
            <WorkspaceInfoSheet
              visible={infoVisible}
              onClose={() => setInfoVisible(false)}
              workspaceName={name as string} />
          </View>
        </KeyboardAvoidingView>
      </PanGestureHandler>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginHorizontal: 10 },
  name: { fontWeight: "bold", fontSize: 16 },
  channelName: { fontSize: 13, color: "#4F8CFF" },
  chat: { flex: 1 },
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

export default WorkspaceChat;