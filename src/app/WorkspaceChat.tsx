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
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "./store/store";
import MessageBubble from "./components/Message/MessageBubble";
import ChatInput from "./components/Message/ChatInput";
import DropdownMenu from "./components/DropdownMenu";
import WorkspaceDrawer, { Channel } from "./components/WorkspaceDrawer";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import useChannelSocket from "./hooks/useChannelSocket";
import { useSocket } from "./hooks/SocketProvider";
import * as ImagePicker from "expo-image-picker";
import { useProfileImage } from "./hooks/useProfileImage";
import MessageActionsModal from './components/Message/MessageActionsModal';
import EmojiPicker from "rn-emoji-keyboard";
import dotenv from "dotenv";

let PanGestureHandler: any = null;
let State: any = null;

if (Platform.OS !== 'web') {
  try {
    const gestureHandler = require('react-native-gesture-handler');
    PanGestureHandler = gestureHandler.PanGestureHandler;
    State = gestureHandler.State;
  } catch (error) {
    console.warn('react-native-gesture-handler not available');
  }
}

const ipAddress = process.env.EXPO_PUBLIC_IP_ADDRESS;

type MessageItem =
    | { type: "separator"; label: string }
    | {
  type: "message";
  id: number;
  text: string;
  time: string;
  isSender: boolean;
  senderId: number;
  parentId?: number;
  parentText?: string | null;
  attachments?: string[];
  reactions?: Array<{
    id: number;
    content: string;
    messageId: number;
    senderId: number;
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
  const [navDrawerVisible, setNavDrawerVisible] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: number; text: string } | null>(null);
  const [editing, setEditing] = useState<{ id: number; text: string } | null>(null);
  const [messageDrawerVisible, setMessageDrawerVisible] = useState(false);
  const [drawerMessage, setDrawerMessage] = useState<{
    id: number;
    text: string;
    isSender: boolean;
  } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  let workspaceAvatarUrl =
      typeof avatar === "string" && avatar
          ? avatar
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
              name as string || "Workspace"
          )}`;
  const tokenStr = token || "";
  const avatarBase64 = useProfileImage(
      workspaceAvatarUrl.startsWith(`http://${ipAddress}:5263/api/Attachment/`)
          ? workspaceAvatarUrl
          : undefined,
      tokenStr
  );
  const workspaceAvatar = avatarBase64 || workspaceAvatarUrl;

  const fetchChannels = useCallback(async () => {
    setChannelsLoading(true);
    try {
      const res = await fetch(
          `http://${ipAddress}:5263/api/Workspace/${id}/Channels`,
          { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } }
      );
      const txt = await res.text();
      let json: any = [];
      try {
        json = JSON.parse(txt);
      } catch {}
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

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleAvatarPress = () => {
  };

  const onHandlerStateChange = ({ nativeEvent }: any) => {
    if (nativeEvent.state === State?.END) {
      if (nativeEvent.translationX > 20) setNavDrawerVisible(true);
      if (nativeEvent.translationX < -20) setNavDrawerVisible(false);
    }
  };

  const toggleNavDrawer = () => {
    setNavDrawerVisible(!navDrawerVisible);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    if (!isNaN(d.getTime())) {
      return `${d.getHours().toString().padStart(2, "0")}h${d
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
    }
    return "--:--";
  };

  const formatDay = (iso: string) =>
      format(new Date(iso), "d MMMM yyyy", { locale: fr });

  const fetchMessages = useCallback(async () => {
    setMessagesLoading(true);
    try {
      if (!selectedChannel) {
        return;
      }

      const res = await fetch(
          `http://${ipAddress}:5263/api/Message/ByChannel?channelId=${selectedChannel.id}&pageNumber=1&pageSize=50`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
      );

      const arr: any[] = await res.json();

      const grouped: MessageItem[] = [];
      let currLabel: string | null = null;
      let dayMsgs: MessageItem[] = [];

      arr.sort(
          (a, b) => new Date(a.sendDate).getTime() - new Date(b.sendDate).getTime()
      );

      for (const m of arr) {
        const label = formatDay(m.sendDate);
        if (currLabel && label !== currLabel) {
          grouped.push({ type: "separator", label: currLabel });
          grouped.push(...dayMsgs);
          dayMsgs = [];
        }
        currLabel = label;

        let parentText = null;
        if (m.parentId) {
          try {
            const parentRes = await fetch(
                `http://${ipAddress}:5263/api/Message/${m.parentId}`,
                {
                  headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                }
            );
            if (parentRes.ok) {
              const parentData = await parentRes.json();
              parentText = parentData.content;
            }
          } catch (e) {
            console.warn(`[ParentFetch] Failed to fetch parent message ${m.parentId}`);
          }
        }

        const attachments = m.messageAttachments?.map((att: { attachmentId: string }) => {
          const url: string = `http://${ipAddress}:5263/api/Attachment/${att.attachmentId}`;
          return url;
        }) || [];

        dayMsgs.push({
          type: "message",
          id: m.id,
          text: m.content,
          time: formatTime(m.sendDate),
          isSender: m.senderId === userId,
          senderId: m.senderId,
          parentId: m.parentId,
          parentText,
          attachments: attachments.filter((url: string | null): url is string => url !== null),
        });
      }

      if (dayMsgs.length && currLabel) {
        grouped.push({ type: "separator", label: currLabel });
        grouped.push(...dayMsgs);
      }

      setMessages(grouped);
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    } finally {
      setMessagesLoading(false);
    }
  }, [selectedChannel, token, userId]);

  useEffect(() => {
    if (selectedChannel) fetchMessages();
  }, [selectedChannel, fetchMessages]);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    if (editing) return;

    try {
      const body: {
        content: string;
        channelId: number;
        parentId?: number;
      } = {
        content: text,
        channelId: selectedChannel!.id,
      };
      if (replyTo) {
        body.parentId = replyTo.id;
      }

      const res = await fetch(
          `http://${ipAddress}:5263/api/Message/PostInChannel`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          }
      );
      const returned = await res.json();
      if (res.ok) {
        let parentText = null;
        if (returned.parentId) {
          const parentRes = await fetch(
              `http://${ipAddress}:5263/api/Message/${returned.parentId}`,
              {
                headers: {
                  Accept: "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
          );
          if (parentRes.ok) {
            const parentData = await parentRes.json();
            parentText = parentData.content;
          }
        }

        setMessages((prev) => [
          ...prev,
          {
            type: "message",
            id: returned.id,
            text: returned.content,
            time: formatTime(returned.sendDate),
            isSender: true,
            senderId: userId!,
            parentId: returned.parentId,
            parentText,
          },
        ]);
        setReplyTo(null);
      } else {
        Alert.alert("Erreur serveur", `Statut ${res.status}`);
      }
    } catch (e: any) {
      Alert.alert("Erreur envoi", e.message || "Une erreur est survenue.");
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Autorisez l'accès aux photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled) return;
    const uri = result.assets && result.assets[0]?.uri;
    if (!uri) return;
    const name = uri.split("/").pop()!;
    const match = /\.(\w+)$/.exec(name);
    const type = match ? `image/${match[1]}` : "image";
    const formData = new FormData();
    formData.append("file", { uri, name, type } as any);

    try {
      const up = await fetch(
          `http://${ipAddress}:5263/api/Attachment?attachmentType=Image`,
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

  const sendImageMessage = async (attachmentIds: string[], uris: string[]) => {
    const body: any = { content: "", channelId: selectedChannel!.id, attachments: attachmentIds };
    if (replyTo) body.parentId = replyTo.id;
    try {
      const res = await fetch(
          `http://${ipAddress}:5263/api/Message/PostInChannel`,
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
        let parentText = null;
        if (msg.parentId) {
          const parentRes = await fetch(
              `http://${ipAddress}:5263/api/Message/${msg.parentId}`,
              {
                headers: {
                  Accept: "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
          );
          if (parentRes.ok) {
            const parentData = await parentRes.json();
            parentText = parentData.content;
          }
        }

        setMessages((prev) => [
          ...prev,
          {
            type: "message",
            id: msg.id,
            text: msg.content,
            time: formatTime(msg.sendDate),
            isSender: true,
            senderId: userId!,
            parentId: msg.parentId,
            parentText,
            attachments: uris,
          },
        ]);
        setReplyTo(null);
      } else {
        throw new Error(`Status ${res.status}`);
      }
    } catch (e: any) {
      Alert.alert("Erreur envoi", e.message);
    }
  };

  const onMessageLongPress = (
      msgId: number,
      msgText: string,
      isSender: boolean
  ) => {
    setDrawerMessage({ id: msgId, text: msgText, isSender });
    setMessageDrawerVisible(true);
  };

  const onReplyFromDrawer = () => {
    if (drawerMessage) {
      setReplyTo({ id: drawerMessage.id, text: drawerMessage.text });
    }
    setMessageDrawerVisible(false);
  };

  const onEditFromDrawer = () => {
    if (drawerMessage && drawerMessage.isSender) {
      setEditing({ id: drawerMessage.id, text: drawerMessage.text });
    }
    setReplyTo(null);
    setMessageDrawerVisible(false);
  };

  const onDeleteFromDrawer = () => {
    if (drawerMessage && drawerMessage.isSender) {
      deleteMessage(drawerMessage.id);
    }
    setMessageDrawerVisible(false);
  };

  const onCancelFromDrawer = () => {
    setMessageDrawerVisible(false);
  };

  const deleteMessage = async (msgId: number) => {
    try {
      const res = await fetch(
          `http://${ipAddress}:5263/api/Message/${msgId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
      );
      if (res.ok) {
        setMessages((prev) =>
            prev.filter((m) => !(m.type === "message" && m.id === msgId))
        );
      } else {
        Alert.alert(
            "Erreur serveur",
            `Impossible de supprimer (status ${res.status})`
        );
      }
    } catch (e: any) {
      Alert.alert("Erreur", e.message || "Une erreur est survenue.");
    }
  };

  const saveEditedMessage = async (newText: string) => {
    if (!editing) return;
    const msgId = editing.id;
    try {
      const res = await fetch(
          `http://${ipAddress}:5263/api/Message/${msgId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content: newText }),
          }
      );
      if (res.ok) {
        setMessages((prev) =>
            prev.map((m) => {
              if (m.type === "message" && m.id === msgId) {
                return { ...m, text: newText };
              }
              return m;
            })
        );
        setEditing(null);
      } else {
        Alert.alert(
            "Erreur serveur",
            `Impossible de modifier (code ${res.status})`
        );
      }
    } catch (e: any) {
      Alert.alert("Erreur", e.message || "Une erreur est survenue.");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`http://${ipAddress}:5263/api/Account/Me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setUserId(data.applicationUser?.id ?? null);
      } catch (err) {
        console.error("Failed to fetch user ID:", err);
      }
    })();
  }, [token]);

  const onAddReactionFromDrawer = async (emoji: any) => {
    if (drawerMessage) {
      try {
        const url = `http://${ipAddress}:5263/api/Message/${drawerMessage.id}/Reactions`;
        const body = JSON.stringify({ content: emoji.emoji });
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body,
        });
        const responseText = await res.text();
        if (!res.ok) throw new Error(`Failed to add reaction (${res.status})`);
        const reactionData = JSON.parse(responseText);

        setMessages((prev) =>
            prev.map((m) => {
              if (m.type === "message" && m.id === drawerMessage.id) {
                return {
                  ...m,
                  reactions: [...(m.reactions || []), reactionData],
                };
              }
              return m;
            })
        );
      } catch (e: any) {
        Alert.alert("Erreur", e.message || "Une erreur est survenue.");
      }
      setMessageDrawerVisible(false);
      setShowEmojiPicker(false);
    }
  };

  const handleReceiveSocket = useCallback(
      (msg: any) => {
        if (!selectedChannel || msg.channelId !== selectedChannel.id) return;

        setMessages((prev) => {
          if (prev.some((m) => m.type === "message" && m.id === msg.id)) {
            return prev;
          }

          const day = format(new Date(msg.sendDate), "d MMMM yyyy", { locale: fr });
          const time = `${new Date(msg.sendDate).getHours().toString().padStart(2, "0")}h${new Date(
              msg.sendDate
          ).getMinutes().toString().padStart(2, "0")}`;

          const copy = [...prev];
          if (!copy.find((m) => m.type === "separator" && m.label === day)) {
            copy.push({ type: "separator", label: day });
          }
          copy.push({
            type: "message",
            id: msg.id,
            text: msg.content,
            time,
            isSender: msg.senderId === userId,
            senderId: msg.senderId,
            parentId: msg.parentId,
            attachments: msg.messageAttachments?.map((att: any) => att.attachmentId) || [],
          });
          return copy;
        });
      },
      [selectedChannel, userId]
  );

  const handleUpdate = useCallback(
      (updated: any) => {
        setMessages((prev) =>
            prev.map((msg) =>
                msg.type === "message" && msg.id === updated.id
                    ? { ...msg, text: updated.content }
                    : msg
            )
        );
      },
      []
  );

  const handleDelete = useCallback(
      (id: number) => {
        setMessages((prev) =>
            prev.filter((msg) => !(msg.type === "message" && msg.id === id))
        );
      },
      []
  );

  useChannelSocket({
    connection,
    channelId: selectedChannel?.id ?? 0,
    onReceive: handleReceiveSocket,
    onUpdate: handleUpdate,
    onDelete: handleDelete,
    token: token || "",
  });

  const fetchChannelName = async (channelId: number, cache: Record<number, string>, token: string): Promise<string> => {
    if (cache[channelId]) return cache[channelId];
    try {
      const res = await fetch(`http://${ipAddress}:5263/api/Channel/${channelId}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Failed to fetch channel name for ID ${channelId}`);
      const data = await res.json();
      cache[channelId] = data.name;
      return data.name;
    } catch (error) {
      console.error(error);
      return `Channel ${channelId}`;
    }
  };

  const messageRefs = useRef<{ [id: number]: React.RefObject<View | null> }>({});

  const handleSearch = async (text: string) => {
    setSearchText(text);
    if (!id || !text.trim() || !token) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const url = `http://${ipAddress}:5263/api/Workspace/${id}/UnifiedSearch?search=${encodeURIComponent(text)}&pageNumber=1&pageSize=10`;
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
      const channelCache: Record<number, string> = {};
      const enrichedResults = await Promise.all(
        (data.messageList || []).map(async (msg: any) => {
          const channelName = await fetchChannelName(msg.channelId, channelCache, token);
          return {
            ...msg,
            channelName,
          };
        })
      );
      setSearchResults(enrichedResults);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const scrollToMessage = (msgId: number) => {
    const ref = messageRefs.current[msgId];
    if (ref && ref.current && scrollViewRef.current) {
      ref.current.measureLayout(
        scrollViewRef.current.getInnerViewNode(),
        (x: number, y: number) => {
          scrollViewRef.current?.scrollTo({ y, animated: true });
        },
        () => {}
      );
    }
    setShowSearch(false);
    setSearchText('');
    setSearchResults([]);
  };

  const renderMainContent = () => (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={styles.container}>
        <WorkspaceDrawer
          visible={navDrawerVisible}
          onClose={() => setNavDrawerVisible(false)}
          onChannelPress={(ch) => {
            setSelectedChannel(ch);
            setNavDrawerVisible(false);
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

          {Platform.OS === 'web' && (
            <TouchableOpacity onPress={toggleNavDrawer} style={{ marginRight: 12 }}>
              <Ionicons name="menu" size={24} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleAvatarPress}
            activeOpacity={0.7}
            style={{ padding: 5 }}
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
        <DropdownMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          workspaceId={Number(id)}
        />
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
          keyboardShouldPersistTaps="handled"
        >
          {messagesLoading ? (
            <Text style={styles.loadingText}>Chargement…</Text>
          ) : (
            [...new Map(messages.map((msg) => [msg.type === "message" ? msg.id : `${msg.type}-${msg.label}`, msg])).values()].map((msg, i) => {
              if (msg.type === "separator") {
                return (
                  <View key={`separator-${i}`} style={styles.separatorContainer}>
                    <View style={styles.line} />
                    <Text style={styles.separatorText}>{msg.label}</Text>
                    <View style={styles.line} />
                  </View>
                );
              } else if (msg.type === "message") {
                return (
                  <MessageBubble
                    key={`message-${msg.id}`}
                    {...msg}
                    onLongPress={() =>
                      onMessageLongPress(msg.id, msg.text, msg.isSender)
                    }
                  />
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
          onSaveEdit={(text) => saveEditedMessage(text)}
          onCancelEdit={() => setEditing(null)}
        />
        <MessageActionsModal
          visible={messageDrawerVisible}
          onClose={onCancelFromDrawer}
          onReply={onReplyFromDrawer}
          onEdit={onEditFromDrawer}
          onDelete={onDeleteFromDrawer}
          onReaction={() => setShowEmojiPicker(true)}
          showEditDelete={drawerMessage?.isSender}
        />
        <EmojiPicker
          onEmojiSelected={(emoji) => {
            setShowEmojiPicker(false);
            if (drawerMessage) {
              onAddReactionFromDrawer(emoji);
            }
          }}
          open={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
        />
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {Platform.OS !== 'web' && PanGestureHandler ? (
        <PanGestureHandler onHandlerStateChange={onHandlerStateChange} activeOffsetX={10}>
          {renderMainContent()}
        </PanGestureHandler>
      ) : (
        renderMainContent()
      )}
      {showSearch && (
        <View style={{ flexDirection: 'column', backgroundColor: '#f5f5f5', padding: 8, position: 'absolute', top: 110, left: 0, right: 0, zIndex: 1 }}>
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
                    {`${msg.channelName}, ${msg.senderApplicationUserUsername}`}
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
  loadingText: {
    textAlign: "center",
    padding: 16,
    color: "#999999",
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
    color: "#999999",
  },
});