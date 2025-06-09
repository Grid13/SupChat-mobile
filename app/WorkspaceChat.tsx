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
import { useProfileImage } from "./hooks/useProfileImage";

// MessageItem type for WorkspaceChat
// Copied from ChatScreen.tsx and adapted for channel messages

type MessageItem =
  | { type: 'separator'; label: string }
  | {
      type: 'message';
      id?: number;
      text: string;
      time: string;
      isSender: boolean;
      avatar?: string;
      parentId?: number;
      parentText?: string | null;
      attachments?: string[];
    };

// Add these types at the top with other types
type UnifiedSearchResult = {
  channelList: Array<{
    id: number;
    name: string;
    visibility: string;
    visibilityLocalized: string;
    workspaceId: number;
  }>;
  userList: Array<{
    id: number;
    firstName: string;
    lastName: string | null;
    status: string;
    statusLocalized: string;
    profilePictureId?: string;
  }>;
  messageList: Array<{
    id: number;
    content: string;
    sendDate: string;
    senderId: number;
    senderApplicationUserUsername: string;
    channelId: number;
    parentId: number;
  }>;
  attachmentList: Array<{
    id: string;
    name: string;
    type: string;
    typeLocalized: string;
    ownerId: number;
  }>;
};

const WorkspaceChat: React.FC = () => {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { id, name, avatar } = useLocalSearchParams();
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
  const [unifiedSearchResults, setUnifiedSearchResults] = useState<UnifiedSearchResult | null>(null);

  // Compute workspaceAvatar using profile picture if available, with hook for protected images
  let workspaceAvatarUrl = typeof avatar === 'string' && avatar
    ? avatar
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(name as string || 'Workspace')}`;
  const tokenStr = token || "";
  const avatarBase64 = useProfileImage(
    workspaceAvatarUrl.startsWith("http://192.168.1.161:5263/api/Attachment/")
      ? workspaceAvatarUrl
      : undefined,
    tokenStr
  );
  const workspaceAvatar = avatarBase64 || workspaceAvatarUrl;

  // Récupère la liste des canaux du workspace
  const fetchChannels = useCallback(async () => {
    setChannelsLoading(true);
    try {
      const res = await fetch(
        `http://192.168.1.161:5263/api/Workspace/${id}/Channels`,
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
        const res = await fetch("http://192.168.1.161:5263/api/Account/Me", {
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
        const url = `http://192.168.1.161:5263/api/Message/ByChannel?channelId=${selectedChannel.id}&pageNumber=1&pageSize=50`;
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
            id: msg.id,
            text: msg.content,
            time: `${new Date(msg.sendDate).getHours().toString().padStart(2, '0')}h${new Date(msg.sendDate).getMinutes().toString().padStart(2, '0')}`,
            isSender: msg.senderId === userId,
            avatar: msg.senderId === userId ? '' : workspaceAvatar,
            parentId: msg.parentId,
            attachments: msg.attachments,
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
  }, [selectedChannel, userId, token, workspaceAvatar]);

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
        `http://192.168.1.161:5263/api/Attachment?attachmentType=ChannelMessage`,
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
        "http://192.168.1.161:5263/api/Message/PostInChannel",
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
        "http://192.168.1.161:5263/api/Message/PostInChannel",
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

  // Replace the existing handleSearch with this one
  const handleSearch = async (text: string) => {
    setSearchText(text);
    if (!text.trim()) {
      setSearchResults([]);
      setUnifiedSearchResults(null);
      return;
    }
    setSearchLoading(true);
    try {
      const url = `http://192.168.1.161:5263/api/Workspace/${id}/UnifiedSearch?search=${encodeURIComponent(text)}&pageNumber=1&pageSize=10`;
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      // Filter out current user from userList
      if (data.userList) {
        data.userList = data.userList.filter((user: { id: number }) => user.id !== userId);
      }
      setUnifiedSearchResults(data);
    } catch (err) {
      console.error('Search failed:', err);
      setUnifiedSearchResults(null);
    } finally {
      setSearchLoading(false);
    }
  };

  // Add this handler
  const handleSearchResultPress = (channelId: number, messageId?: number) => {
    const channel = channels.find(c => c.id === channelId);
    if (channel) {
      setSelectedChannel(channel);
      setShowSearch(false);
      if (messageId) {
        // Let the UI update first, then scroll
        setTimeout(() => scrollToMessage(messageId), 300);
      }
    }
  };

  // Add state debug effect
  useEffect(() => {
    console.log('infoVisible state changed:', infoVisible);
  }, [infoVisible]);

  const handleAvatarPress = () => {
    console.log('Avatar pressed, current infoVisible:', infoVisible);
    setInfoVisible(true);
    console.log('Set infoVisible to true');
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
          id: msg.id,
          text: msg.content,
          time,
          isSender: msg.senderId === userId,
          avatar: msg.senderId === userId ? '' : workspaceAvatar,
          parentId: msg.parentId,
          attachments: msg.attachments,
        });
        return copy;
      });
    },
    [selectedChannel, userId, workspaceAvatar]
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
              {/* Avatar button now opens workspace info */}
              <TouchableOpacity 
                onPress={handleAvatarPress}
                activeOpacity={0.7}
                style={{ padding: 5 }} // Add padding to increase touch target
              >
                <Image source={{ uri: workspaceAvatar }} style={styles.avatar} />
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
            {/* Workspace info sheet */}
            <WorkspaceInfoSheet
              visible={infoVisible}
              onClose={() => {
                console.log('Closing info sheet');
                setInfoVisible(false);
              }}
              workspaceName={typeof name === "string" ? name : ""}
              workspaceId={Number(id)}
            />
            {/* DropdownMenu for 3-dot button */}
            <DropdownMenu
              visible={menuVisible}
              onClose={() => setMenuVisible(false)}
            />

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
                        placeholder="Search messages, channels, users..."
                        style={{ fontSize: 16, padding: 0 }}
                      />
                    </View>
                  </View>
                </View>
                
                {searchLoading && <Text style={{ marginTop: 8, color: '#888' }}>Searching...</Text>}
                
                {!searchLoading && unifiedSearchResults && (
                  <ScrollView style={{ marginTop: 8 }}>
                    {/* Users section */}
                    {unifiedSearchResults.userList.length > 0 && (
                      <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Users</Text>
                        {unifiedSearchResults.userList.map((user) => {
                          const userAvatar = user.profilePictureId 
                            ? `http://192.168.1.161:5263/api/Attachment/${user.profilePictureId}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName || 'User')}`;
                          
                          return (
                            <View
                              key={user.id}
                              style={{ 
                                backgroundColor: '#fff',
                                padding: 12,
                                borderRadius: 8,
                                marginBottom: 8,
                                flexDirection: 'row',
                                alignItems: 'center'
                              }}
                            >
                              <Image 
                                source={{ uri: userAvatar }}
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 20,
                                  marginRight: 12
                                }}
                              />
                              <View>
                                <Text style={{ fontWeight: '500' }}>
                                  {user.firstName} {user.lastName}
                                </Text>
                                <Text style={{ fontSize: 12, color: '#888' }}>
                                  {user.statusLocalized}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* Messages section - existing code */}
                    {unifiedSearchResults.messageList.length > 0 && (
                      <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Messages</Text>
                        {unifiedSearchResults.messageList.map((msg) => {
                          const channel = channels.find(c => c.id === msg.channelId);
                          return (
                            <TouchableOpacity
                              key={msg.id}
                              onPress={() => handleSearchResultPress(msg.channelId, msg.id)}
                              style={{ 
                                backgroundColor: '#fff',
                                padding: 12,
                                borderRadius: 8,
                                marginBottom: 8 
                              }}
                            >
                              <Text numberOfLines={2}>{msg.content}</Text>
                              <View style={{ 
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: 4
                              }}>
                                <Text style={{ fontSize: 12, color: '#888' }}>
                                  by {msg.senderApplicationUserUsername}
                                </Text>
                                <Text style={{ 
                                  fontSize: 12, 
                                  color: '#6B8AFD',
                                  fontWeight: '500'
                                }}>
                                  #{channel?.name || 'unknown'}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}

                    {/* Channels section - existing code */}
                    {unifiedSearchResults.channelList.length > 0 && (
                      <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Channels</Text>
                        {unifiedSearchResults.channelList.map((channel) => (
                          <TouchableOpacity
                            key={channel.id}
                            onPress={() => handleSearchResultPress(channel.id)}
                            style={{ 
                              backgroundColor: '#fff',
                              padding: 12,
                              borderRadius: 8,
                              marginBottom: 8 
                            }}
                          >
                            <Text style={{ fontWeight: '500' }}>#{channel.name}</Text>
                            <Text style={{ fontSize: 12, color: '#888' }}>
                              {channel.visibilityLocalized}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </ScrollView>
                )}

                {!searchLoading && (!unifiedSearchResults || 
                  (unifiedSearchResults.messageList.length === 0 && 
                   unifiedSearchResults.channelList.length === 0 &&
                   unifiedSearchResults.userList.length === 0)) && 
                   searchText && (
                  <Text style={{ marginTop: 8, color: '#888' }}>No results found</Text>
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
              editing={editing}
              onCancelReply={() => setReplyTo(null)}
              onSaveEdit={() => {}}
              onCancelEdit={() => setEditing(null)}
            />
          </View>
        </KeyboardAvoidingView>
      </PanGestureHandler>
    </SafeAreaView>
  );
};

export default WorkspaceChat;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#eeeeee",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333333",
  },
  channelName: {
    fontSize: 14,
    color: "#666666",
  },
  chat: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingText: {
    textAlign: "center",
    padding: 16,
    color: "#888888",
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#eeeeee",
  },
  separatorText: {
    paddingHorizontal: 8,
    fontSize: 13,
    color: "#888888",
  },
});