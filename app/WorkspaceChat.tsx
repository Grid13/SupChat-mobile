import React, { useState, useRef, useEffect, useCallback, createRef } from "react";
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
  TextInput,
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
import useChannelSocket from "./hooks/useChannelSocket";
import { useSocket } from "./hooks/SocketProvider";
import * as ImagePicker from "expo-image-picker";

// Définition du type pour messages et séparateurs

type MessageItem =
  | { type: 'message'; text: string; time: string; isSender: boolean; avatar: string; parentId?: number; attachments?: string[] }
  | { type: 'separator'; label: string };

const WorkspaceChat: React.FC = () => {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { id, name, avatar } = useLocalSearchParams();
  const avatarUrl = Array.isArray(avatar) ? avatar[0] : avatar || "";
  const token = useSelector((state: RootState) => state.auth.token);
  const { connection } = useSocket();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // Pour la réponse à un message
  const [replyTo, setReplyTo] = useState<{ id: number; text: string } | null>(null);

  // Pour l'édition (optionnel, à adapter si besoin)
  const [editing, setEditing] = useState<{ id: number; text: string } | null>(null);

  // Recherche
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

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
    // console.log("selectedChannel:", selectedChannel, "userId:", userId);
    if (!selectedChannel || userId === null) {
      // console.log("Fetch not called: selectedChannel or userId missing");
      return;
    }
    let active = true;
    (async () => {
      setMessagesLoading(true);
      try {
        const url = `http://192.168.1.10:5263/api/Message/ByChannel?channelId=${selectedChannel.id}&pageNumber=1&pageSize=50`;
        // console.log("About to fetch messages from:", url);
        const res = await fetch(url, {
          headers: { Accept: "text/plain", Authorization: `Bearer ${token}` },
        });
        const txt = await res.text();
        let json: any = [];
        try { json = JSON.parse(txt); } catch {}
        // console.log("Fetched messages raw response:", json);
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

  // Picker d'image
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Autorisez l’accès aux photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled) return;
    const uri = result.assets && result.assets[0]?.uri;
    if (!uri) return;
    const name = uri.split('/').pop()!;
    const match = /\.(\w+)$/.exec(name);
    const type = match ? `image/${match[1]}` : 'image';
    const formData = new FormData();
    formData.append('file', { uri, name, type } as any);

    try {
      const up = await fetch(
        `http://192.168.1.10:5263/api/Attachment?attachmentType=ChannelMessage`,
        {
          method: "POST",
          headers: {
            Accept: "text/plain",
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
      if (!up.ok) throw new Error(`Upload failed ${up.status}`);
      const { id: attachmentId } = await up.json();
      await sendImageMessage([attachmentId], [uri]);
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    }
  };

  // Envoi d'un message avec pièce jointe
  const sendImageMessage = async (attachmentIds: string[], uris: string[]) => {
    if (!selectedChannel) return;
    const body: any = {
      content: "",
      channelId: selectedChannel.id,
      attachments: attachmentIds,
    };
    if (replyTo) body.parentId = replyTo.id;
    try {
      const res = await fetch(
        "http://192.168.1.10:5263/api/Message/PostInChannel",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );
      if (res.ok) {
        const msg = await res.json();
        // L'affichage du message sera géré par le SignalR (handleReceiveSocket)
        setReplyTo(null);
      } else {
        throw new Error(`Status ${res.status}`);
      }
    } catch (e: any) {
      Alert.alert("Erreur envoi", e.message);
    }
  };

  // Envoi d'un message texte (avec support reply)
  const handleSend = async (text: string) => {
    if (!selectedChannel) return;
    if (editing) return; // (optionnel: à adapter si édition)
    const body: any = {
      content: text,
      channelId: selectedChannel.id,
    };
    if (replyTo) body.parentId = replyTo.id;
    try {
      const res = await fetch(
        "http://192.168.1.10:5263/api/Message/PostInChannel",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );
      if (res.ok) {
        // Le message sera reçu via SignalR (handleReceiveSocket)
        setReplyTo(null);
      } else {
        Alert.alert("Erreur serveur", `Statut ${res.status}`);
      }
    } catch (e: any) {
      Alert.alert("Erreur envoi", e.message || "Une erreur est survenue.");
    }
  };

  // Handler pour la recherche dans le channel
  const handleSearch = async (text: string) => {
    setSearchText(text);
    if (!selectedChannel || !text.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const url = `http://192.168.1.10:5263/api/Message/SearchInChannel?channelId=${selectedChannel.id}&search=${encodeURIComponent(text)}&pageNumber=1&pageSize=10`;
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const body = await res.text();
      if (!res.ok) {
        setSearchResults([]);
        return;
      }
      const data = JSON.parse(body);
      setSearchResults(Array.isArray(data) ? data : data.value || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Ajoute un mapping id => ref pour chaque message
  const messageRefs = useRef<{ [id: number]: React.RefObject<View | null> }>(
    {}
  );

  // Scroll vers le message sélectionné
  const scrollToMessage = (msgId: number) => {
    const ref = messageRefs.current[msgId];
    if (ref && ref.current && scrollViewRef.current) {
      ref.current.measureLayout(
        scrollViewRef.current.getInnerViewNode(),
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y, animated: true });
        },
        () => {}
      );
    }
    setShowSearch(false);
    setSearchText('');
    setSearchResults([]);
  };

  // Ajoute le message reçu via SignalR dans la liste
  const handleReceiveSocket = useCallback(
    (msg: any) => {
      // Vérifie que le message est bien pour le channel courant
      if (!selectedChannel || msg.channelId !== selectedChannel.id) return;
      const day = format(new Date(msg.sendDate), "d MMMM yyyy", { locale: fr });
      const time = `${new Date(msg.sendDate).getHours().toString().padStart(2, '0')}h${new Date(
        msg.sendDate
      ).getMinutes().toString().padStart(2, '0')}`;
      setMessages(prev => {
        const copy = [...prev];
        if (!copy.find(m => m.type === "separator" && m.label === day)) {
          copy.push({ type: "separator", label: day });
        }
        copy.push({
          type: "message",
          text: msg.content,
          time,
          isSender: msg.senderId === userId,
          avatar: msg.senderId === userId ? "" : avatarUrl,
        });
        return copy;
      });
    },
    [selectedChannel, userId, avatarUrl]
  );

  // Abonnement au channel via SignalR
  useChannelSocket({
    connection,
    channelId: selectedChannel?.id ?? 0,
    onReceive: handleReceiveSocket,
    token: token || "",
  });

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
              <TouchableOpacity onPress={() => setShowSearch(true)}>
                <Ionicons name="search" size={22} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginLeft: 10 }}>
                <MaterialIcons name="more-vert" size={22} />
              </TouchableOpacity>
            </View>

            {/* Barre de recherche messages */}
            {showSearch && (
              <View style={{ flexDirection: 'column', backgroundColor: '#f5f5f5', padding: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => setShowSearch(false)} style={{ padding: 8 }}>
                    <Text style={{ fontSize: 18 }}>✕</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <View style={{ backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                      <TextInput
                        autoFocus
                        value={searchText}
                        onChangeText={handleSearch}
                        placeholder="Tapez un mot-clé..."
                        style={{ fontSize: 16, padding: 0 }}
                      />
                    </View>
                  </View>
                </View>
                {searchLoading && <Text style={{ marginTop: 8, color: '#888' }}>Recherche…</Text>}
                {!searchLoading && searchResults.length > 0 && (
                  <View style={{ marginTop: 8, backgroundColor: '#fff', borderRadius: 8 }}>
                    {searchResults.map((msg, i) => (
                      <TouchableOpacity
                        key={msg.id || i}
                        onPress={() => scrollToMessage(msg.id)}
                        style={{ padding: 10, borderBottomWidth: i < searchResults.length - 1 ? 1 : 0, borderColor: '#eee' }}
                      >
                        <Text numberOfLines={2} style={{ fontSize: 15 }}>{msg.content}</Text>
                        <Text style={{ fontSize: 12, color: '#888' }}>
                          {format(new Date(msg.sendDate), "d MMMM yyyy", { locale: fr })} à {`${new Date(msg.sendDate).getHours().toString().padStart(2, '0')}h${new Date(msg.sendDate).getMinutes().toString().padStart(2, '0')}`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {!searchLoading && searchText && searchResults.length === 0 && (
                  <Text style={{ marginTop: 8, color: '#888' }}>Aucun résultat</Text>
                )}
              </View>
            )}

            <ScrollView
              ref={scrollViewRef}
              style={styles.chat}
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
              keyboardShouldPersistTaps="handled"
            >
              {messagesLoading ? (
                <Text style={styles.loadingText}>Chargement…</Text>
              ) : (
                messages.map((msg, idx) => {
                  if (msg.type === "separator") {
                    return (
                      <View key={idx} style={styles.separatorContainer}>
                        <View style={styles.line} />
                        <Text style={styles.separatorText}>{msg.label}</Text>
                        <View style={styles.line} />
                      </View>
                    );
                  } else {
                    // Crée un ref pour chaque message par id
                    let ref = undefined;
                    if ((msg as any).id) {
                      if (!messageRefs.current[(msg as any).id]) {
                        messageRefs.current[(msg as any).id] = createRef<View>();
                      }
                      ref = messageRefs.current[(msg as any).id];
                    }
                    return (
                      <View ref={ref} key={(msg as any).id ?? idx}>
                        <MessageBubble {...msg} />
                      </View>
                    );
                  }
                })
              )}
            </ScrollView>
            <ChatInput
              onSend={handleSend}
              onPickImage={pickImage}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              editing={editing}
              onSaveEdit={() => {}} // à implémenter si édition
              onCancelEdit={() => setEditing(null)}
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