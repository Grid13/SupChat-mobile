import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import EmojiPicker from 'rn-emoji-keyboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useSelector } from 'react-redux';
import Header from './components/Message/Header';
import MessageBubble from './components/Message/MessageBubble';
import ChatInput from './components/Message/ChatInput';
import { RootState } from './store/store';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-native-url-polyfill/auto';
import useChatSocket, { ChatMessageDto } from './hooks/useChatSocket';
import * as ImagePicker from 'expo-image-picker';
import MessageActionsModal from './components/Message/MessageActionsModal';
import dotenv from 'dotenv';

const ipAddress = process.env.EXPO_PUBLIC_IP_ADDRESS;


export interface LocalChatMessageDto {
  id: number;
  content: string;
  sendDate: string;
  senderId: number;
  parentId?: number;
  messageAttachments?: Array<{ attachmentId: string }>; 
}

type MessageItem =
  | { type: 'separator'; label: string }
  | {
      type: 'message';
      id: number;
      text: string;
      time: string;
      isSender: boolean;
      senderId: number;
      parentId?: number;
      attachments?: string[];
      reactions?: Array<{
        id: number;
        content: string;
        messageId: number;
        senderId: number;
      }>;
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
  const [replyTo, setReplyTo] = useState<{ id: number; text: string } | null>(null);


  const [editing, setEditing] = useState<{ id: number; text: string } | null>(null);

  const [drawerVisible, setDrawerVisible] = useState(false);

  const [drawerMessage, setDrawerMessage] = useState<{
    id: number;
    text: string;
    isSender: boolean;
  } | null>(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const appendEmojiRef = useRef<((emoji: string) => void) | undefined>(undefined);

  const scrollViewRef = useRef<ScrollView>(null);

  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    if (!isNaN(d.getTime())) {
      return `${d.getHours().toString().padStart(2, '0')}h${d
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
    }
    return '--:--';
  };
  const formatDay = (iso: string) =>
    format(new Date(iso), 'd MMMM yyyy', { locale: fr });

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`http://${ipAddress}:5263/api/Account/Me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await r.json();
        setMyUserId(d.applicationUser?.id ?? null);
      } catch (e) {
        console.error('fetch /Me failed:', e);
      }
    })();
  }, [token]);

  const fetchReactions = async (messageId: number): Promise<Array<{ id: number; content: string; messageId: number; senderId: number }>> => {
    try {
      const res = await fetch(`http://${ipAddress}:5263/api/Message/${messageId}/Reactions`, {
        headers: {
          Accept: 'text/plain',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Failed to fetch reactions (${res.status})`);
      const text = await res.text();
      return JSON.parse(text || '[]');
    } catch (e: any) {
      console.error('[ChatScreen] Error fetching reactions:', e);
      return [];
    }
  };

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://${ipAddress}:5263/api/Message/ByUser?userId=${otherUserId}&pageNumber=1&pageSize=50`,
        {
          headers: {
            Accept: 'text/plain',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const text = await res.text();
      const json = JSON.parse(text || '[]');
      const arr: LocalChatMessageDto[] = Array.isArray(json.value)
        ? json.value
        : (json.valueOrDefault || json);

      const grouped: MessageItem[] = [];
      let currLabel: string | null = null;
      let dayMsgs: MessageItem[] = [];

      arr.sort(
        (a, b) => new Date(a.sendDate).getTime() - new Date(b.sendDate).getTime()
      );
      for (const m of arr) {
        const label = formatDay(m.sendDate);
        if (currLabel && label !== currLabel) {
          grouped.push({ type: 'separator', label: currLabel });
          grouped.push(...dayMsgs);
          dayMsgs = [];
        }
        currLabel = label;

        const reactions = await fetchReactions(m.id);

        const attachments = await Promise.all(
          (m.messageAttachments || []).map(async (attachment: { attachmentId: string }) => {
            const attachmentRes = await fetch(`http://${ipAddress}:5263/api/Attachment/${attachment.attachmentId}`, {
              headers: {
                Accept: '*/*',
                Authorization: `Bearer ${token}`,
              },
            });
            if (attachmentRes.ok) {
              return attachmentRes.url;
            }
            return null;
          })
        );

        dayMsgs.push({
          type: 'message',
          id: m.id,
          text: m.content,
          time: formatTime(m.sendDate),
          isSender: m.senderId === myUserId,
          senderId: m.senderId,
          parentId: m.parentId,
          reactions,
          attachments: attachments.filter((url): url is string => url !== null),
        });
      }
      if (dayMsgs.length && currLabel) {
        grouped.push({ type: 'separator', label: currLabel });
        grouped.push(...dayMsgs);
      }
      setMessages(grouped);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
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
    async (m: ChatMessageDto) => {
      if (m.senderId === otherUserId) {
        const reactions = await fetchReactions(m.id);
        setMessages((prev) => [
          ...prev,
          {
            type: 'message',
            id: m.id,
            text: m.content,
            time: formatTime(m.sendDate),
            isSender: false,
            senderId: m.senderId,
            parentId: m.parentId,
            reactions, 
          },
        ]);
      }
    },
    [otherUserId, avatar]
  );
  const handleUpdate = useCallback(
    (updated: any) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.type === 'message' && msg.id === updated.id
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
        prev.filter((msg) => !(msg.type === 'message' && msg.id === id))
      );
    },
    []
  );

  const { isConnected, sendMessage } = useChatSocket(
    token!,
    handleReceive,
    handleUpdate,
    handleDelete
  );

  const onMessageLongPress = (
    msgId: number,
    msgText: string,
    isSender: boolean
  ) => {
    setDrawerMessage({ id: msgId, text: msgText, isSender });
    setDrawerVisible(true);
  };

  const deleteMessage = async (msgId: number) => {
    try {
      const res = await fetch(
        `http://${ipAddress}:5263/api/Message/${msgId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.ok) {
        setMessages((prev) =>
          prev.filter((m) => !(m.type === 'message' && m.id === msgId))
        );
      } else {
        Alert.alert(
          'Erreur serveur',
          `Impossible de supprimer (status ${res.status})`
        );
      }
    } catch (e: any) {
      console.error('[ChatScreen] Error deleting message:', e);
      Alert.alert('Erreur', e.message || 'Une erreur est survenue.');
    }
  };

  const saveEditedMessage = async (newText: string) => {
    if (!editing) return;
    const msgId = editing.id;
    try {
      const res = await fetch(
        `http://${ipAddress}:5263/api/Message/${msgId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: newText }),
        }
      );
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.type === 'message' && m.id === msgId) {
              return { ...m, text: newText };
            }
            return m;
          })
        );
        setEditing(null);
      } else {
        Alert.alert(
          'Erreur serveur',
          `Impossible de modifier (code ${res.status})`
        );
      }
    } catch (e: any) {
      console.error('[ChatScreen] Error saving edited message:', e);
      Alert.alert('Erreur', e.message || 'Une erreur est survenue.');
    }
  };

  const handleSend = async (text: string, parentId: number | null) => {
    if (editing) return;

    try {
      const body: {
        content: string;
        receiverId: number;
        parentId?: number;
      } = {
        content: text,
        receiverId: otherUserId,
      };
      if (parentId !== null) {
        body.parentId = parentId;
      }

      const res = await fetch(
        'http://'+ipAddress+':5263/api/Message/PostForUser',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );
      const returned = await res.json();
      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            type: 'message',
            id: returned.id,
            text: returned.content,
            time: formatTime(returned.sendDate),
            isSender: true,
            senderId: myUserId!,
            parentId: returned.parentId,
          },
        ]);
        setReplyTo(null);
      } else {
        Alert.alert('Erreur serveur', `Statut ${res.status}`);
      }
    } catch (e: any) {
      console.error('[ChatScreen] Error sending message:', e);
      Alert.alert('Erreur envoi', e.message || 'Une erreur est survenue.');
    }
  };

  const onReplyFromDrawer = () => {
    if (drawerMessage) {
      setReplyTo({ id: drawerMessage.id, text: drawerMessage.text });
    }
    setDrawerVisible(false);
  };

  const onEditFromDrawer = () => {
    if (drawerMessage && drawerMessage.isSender) {
      setEditing({ id: drawerMessage.id, text: drawerMessage.text });
    }
    setReplyTo(null);
    setDrawerVisible(false);
  };

  const onDeleteFromDrawer = () => {
    if (drawerMessage && drawerMessage.isSender) {
      deleteMessage(drawerMessage.id);
    }
    setDrawerVisible(false);
  };

  const onCancelFromDrawer = () => {
    setDrawerVisible(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Autorisez l’accès aux photos.');
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
        `http://${ipAddress}:5263/api/Attachment?attachmentType=Image`,
        {
          method: 'POST',
          headers:
           {
            Accept: 'text/plain',
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
      if (!up.ok) throw new Error(`Upload failed ${up.status}`);
      const { id: attachmentId } = await up.json();
      await sendImageMessage([attachmentId], [uri]);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  };

  const sendImageMessage = async (attachmentIds: string[], uris: string[]) => {
    const body: any = { content: '', receiverId: otherUserId, attachments: attachmentIds };
    if (replyTo) body.parentId = replyTo.id;
    try {
      const res = await fetch(
        'http://'+ipAddress+':5263/api/Message/PostForUser',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            type: 'message',
            id: msg.id,
            text: msg.content,
            time: formatTime(msg.sendDate),
            isSender: true,
            senderId: myUserId!, 
            parentId: msg.parentId,
            attachments: uris,
          },
        ]);
        setReplyTo(null);
      } else {
        throw new Error(`Status ${res.status}`);
      }
    } catch (e: any) {
      Alert.alert('Erreur envoi', e.message);
    }
  };

  const handleEmojiSelected = (emoji: string) => {
    setShowEmojiPicker(false);
    if (appendEmojiRef.current) {
      appendEmojiRef.current(emoji);
    }
  };

  const handleSearch = async (text: string) => {
    setSearchText(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(
        `http://${ipAddress}:5263/api/Message/SearchInUser?userId=${otherUserId}&search=${encodeURIComponent(text)}&pageNumber=1&pageSize=10`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const body = await res.text();
      if (!res.ok) {
        setSearchResults([]);
        return;
      }
      const data = JSON.parse(body);
      const formattedResults = Array.isArray(data)
        ? data.map((msg) => ({
            id: msg.id,
            content: msg.content,
            sendDate: msg.sendDate,
            senderId: msg.senderId,
            parentId: msg.parentId,
            attachments: msg.messageAttachments?.map((att: { attachment: { name: string } }) => att.attachment?.name) || [],
          }))
        : [];
      setSearchResults(formattedResults);
    } catch (e: any) {
      console.error('[ChatScreen] Error during search:', e);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const scrollToMessage = (msgId: number) => {
    const idx = messages.findIndex((m) => m.type === 'message' && m.id === msgId);
    if (idx !== -1 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: idx * 80, animated: true });
      }, 100);
    }
    setShowSearch(false);
    setSearchText('');
    setSearchResults([]);
  };

  const onAddReactionFromDrawer = (emoji: any) => {
    if (drawerMessage) {
      try {
        const sendReaction = async (messageId: number, emoji: string) => {
          const url = `http://${ipAddress}:5263/api/Message/${messageId}/Reactions`;
          const body = JSON.stringify({ content: emoji });
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body,
          });
          const responseText = await res.text();
          if (!res.ok) throw new Error(`Failed to add reaction (${res.status})`);
          return JSON.parse(responseText);
        };

        sendReaction(drawerMessage.id, emoji.emoji).then(reactionData => {
          setMessages(prev => {
            return prev.map(m => {
              if (m.type === 'message' && m.id === drawerMessage.id) {
                const updatedMessage = {
                  ...m,
                  reactions: [...(m.reactions || []), reactionData],
                };
                return updatedMessage;
              }
              return m;
            });
          });
        });
      } catch (e: any) {
        console.error('[ChatScreen] Error in onAddReactionFromDrawer:', e);
        Alert.alert('Erreur', e.message || 'Une erreur est survenue.');
      }
      setDrawerVisible(false);
      setShowEmojiPicker(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <Header name={params.name as string} avatar={avatar as string} onSearchPress={() => setShowSearch(true)} />

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
                      <Text style={{ fontSize: 12, color: '#888' }}>{formatDay(msg.sendDate)} à {formatTime(msg.sendDate)}</Text>
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
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
            keyboardShouldPersistTaps="handled"
          >
            {loading ? (
              <Text style={styles.loadingText}>Chargement…</Text>
            ) : (
              messages.map((msg, i) =>
                msg.type === 'separator' ? (
                  <View key={`sep-${i}`} style={styles.separatorContainer}>
                    <View style={styles.line} />
                    <Text style={styles.separatorText}>{msg.label}</Text>
                    <View style={styles.line} />
                  </View>
                ) : (
                  (() => {
                    let parentText: string | null = null;
                    if (msg.parentId && msg.parentId > 0) {
                      const parentMsg = messages.find(
                        (x) => x.type === 'message' && (x as any).id === msg.parentId
                      ) as { type: 'message'; id: number; text: string } | undefined;
                      parentText = parentMsg ? parentMsg.text : null;
                    }
                    return (
                      <MessageBubble
                        key={msg.id}
                        id={msg.id} 
                        text={msg.text}
                        time={msg.time}
                        isSender={msg.isSender}
                        senderId={msg.senderId} 
                        parentId={msg.parentId}
                        parentText={parentText}
                        attachments={msg.attachments}
                        reactions={msg.reactions} 
                        onLongPress={() =>
                          onMessageLongPress(msg.id, msg.text, msg.isSender)
                        }
                      />
                    );
                  })()
                )
              )
            )}
          </ScrollView>

          <ChatInput
            onSend={handleSend}
            onPickImage={pickImage}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            editing={editing}
            onSaveEdit={saveEditedMessage}
            onCancelEdit={() => setEditing(null)}
          />

          {/* Remplacer l'ancien Drawer Modal par celui-ci */}
          <MessageActionsModal
            visible={drawerVisible}
            onClose={onCancelFromDrawer}
            onReply={onReplyFromDrawer}
            onEdit={onEditFromDrawer}
            onDelete={onDeleteFromDrawer}
            onReaction={() => setShowEmojiPicker(true)}
            showEditDelete={drawerMessage?.isSender}
          />

          {/* Emoji Picker */}
          <EmojiPicker
            onEmojiSelected={onAddReactionFromDrawer}
            open={showEmojiPicker}
            onClose={() => setShowEmojiPicker(false)}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  loadingText: { color: '#888', marginTop: 30, alignSelf: 'center' },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    justifyContent: 'center',
  },
  separatorText: {
    marginHorizontal: 10,
    fontSize: 12,
    color: '#888',
  },
  line: { flex: 1, height: 1, backgroundColor: '#444', opacity: 0.5 },
});

export default ChatScreen;