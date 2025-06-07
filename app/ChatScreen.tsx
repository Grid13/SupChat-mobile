// ChatScreen.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
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
import EmojiSelector, { Categories } from 'react-native-emoji-selector';

type MessageItem =
  | { type: 'separator'; label: string }
  | {
      type: 'message';
      id: number;
      text: string;
      time: string;
      isSender: boolean;
      avatar: string;
      parentId?: number;
      attachments?: string[]; // array of image URLs
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

  // État pour le mode édition
  const [editing, setEditing] = useState<{ id: number; text: string } | null>(null);

  // **États pour le drawer**
  const [drawerVisible, setDrawerVisible] = useState(false);
  // stocke { id, text, isSender } du message sur lequel on a fait un long-press
  const [drawerMessage, setDrawerMessage] = useState<{
    id: number;
    text: string;
    isSender: boolean;
  } | null>(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const appendEmojiRef = useRef<((emoji: string) => void) | undefined>(undefined);

  const scrollViewRef = useRef<ScrollView>(null);

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

  // 1) Récupérer l'ID de l'utilisateur connecté
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('http://192.168.1.10:5263/api/Account/Me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await r.json();
        setMyUserId(d.applicationUser?.id ?? null);
      } catch (e) {
        console.error('fetch /Me failed:', e);
      }
    })();
  }, [token]);

  // 2) Charger l'historique des messages
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://192.168.1.10:5263/api/Message/ByUser?userId=${otherUserId}&pageNumber=1&pageSize=50`,
        {
          headers: {
            Accept: 'text/plain',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const text = await res.text();
      const json = JSON.parse(text || '[]');
      const arr: ChatMessageDto[] = Array.isArray(json.value)
        ? json.value
        : (json.valueOrDefault || json);

      const grouped: MessageItem[] = [];
      let currLabel: string | null = null;
      let dayMsgs: MessageItem[] = [];

      arr.sort(
        (a, b) => new Date(a.sendDate).getTime() - new Date(b.sendDate).getTime()
      );
      arr.forEach((m) => {
        const label = formatDay(m.sendDate);
        if (currLabel && label !== currLabel) {
          grouped.push({ type: 'separator', label: currLabel });
          grouped.push(...dayMsgs);
          dayMsgs = [];
        }
        currLabel = label;
        dayMsgs.push({
          type: 'message',
          id: m.id,
          text: m.content,
          time: formatTime(m.sendDate),
          isSender: m.senderId === myUserId,
          avatar: m.senderId === myUserId ? '' : avatar || '',
          parentId: m.parentId,
        });
      });
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

  // 3) Scroll automatique à chaque nouveau message
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // 4) Gestion du WebSocket (ajout handleUpdate, handleDelete éventuellement)
  const handleReceive = useCallback(
    (m: ChatMessageDto) => {
      if (m.senderId === otherUserId) {
        setMessages((prev) => [
          ...prev,
          {
            type: 'message',
            id: m.id,
            text: m.content,
            time: formatTime(m.sendDate),
            isSender: false,
            avatar: avatar || '',
            parentId: m.parentId,
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

  // 5) Quand on fait un long-press, on ouvre le drawer
  const onMessageLongPress = (
    msgId: number,
    msgText: string,
    isSender: boolean
  ) => {
    setDrawerMessage({ id: msgId, text: msgText, isSender });
    setDrawerVisible(true);
  };

  // 6) Supprimer un message (même code qu’avant)
  const deleteMessage = async (msgId: number) => {
    try {
      const res = await fetch(
        `http://192.168.1.10:5263/api/Message/${msgId}`,
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
      Alert.alert('Erreur', e.message || 'Une erreur est survenue.');
    }
  };

  // 7) Enregistrer l’édition (PATCH)
  const saveEditedMessage = async (newText: string) => {
    if (!editing) return;
    const msgId = editing.id;
    try {
      const res = await fetch(
        `http://192.168.1.10:5263/api/Message/${msgId}`,
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
      Alert.alert('Erreur', e.message || 'Une erreur est survenue.');
    }
  };

  // 8) Envoi d’un nouveau message (ou réponse)
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
        'http://192.168.1.10:5263/api/Message/PostForUser',
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
        const returned: {
          id: number;
          content: string;
          sendDate: string;
          senderId: number;
          parentId: number;
        } = await res.json();

        setMessages((prev) => [
          ...prev,
          {
            type: 'message',
            id: returned.id,
            text: returned.content,
            time: formatTime(returned.sendDate),
            isSender: true,
            avatar: '',
            parentId: returned.parentId,
          },
        ]);
        setReplyTo(null);
      } else {
        Alert.alert('Erreur serveur', `Statut ${res.status}`);
      }
    } catch (e: any) {
      Alert.alert('Erreur envoi', e.message || 'Une erreur est survenue.');
    }
  };

  // 9) Handlers pour chaque action du drawer
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

  // Add image picker handler
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
        `http://192.168.1.10:5263/api/Attachment?attachmentType=ProfilePicture`,
        {
          method: 'POST',
          headers: {
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
        'http://192.168.1.10:5263/api/Message/PostForUser',
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
            avatar: '',
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

  // Handler to insert emoji into the input
  const handleEmojiSelected = (emoji: string) => {
    setShowEmojiPicker(false);
    if (appendEmojiRef.current) {
      appendEmojiRef.current(emoji);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <Header name={params.name as string} avatar={avatar as string} />

          {/* Emoji Selector UI */}
          {showEmojiPicker && (
            <View style={{ height: 320 }}>
              <EmojiSelector
                onEmojiSelected={handleEmojiSelected}
                category={Categories.all}
                showTabs={true}
                showSearchBar={true}
                showHistory={true}
                columns={8}
                placeholder="Search emoji..."
              />
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
                        text={msg.text}
                        time={msg.time}
                        isSender={msg.isSender}
                        avatar={msg.avatar}
                        parentId={msg.parentId}
                        parentText={parentText}
                        attachments={msg.attachments}
                        // On transmet isSender pour savoir si on peut modifier/supprimer
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
            onShowEmojiPicker={() => setShowEmojiPicker(true)}
            setAppendEmojiCallback={cb => { appendEmojiRef.current = cb; }}
          />

          {/* Drawer (Modal) */}
          <Modal
            visible={drawerVisible}
            animationType="slide"
            transparent
            onRequestClose={onCancelFromDrawer}
          >
            {/* Overlay semi-transparent */}
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={onCancelFromDrawer}
            />
            <View style={styles.drawerContainer}>
              <Text style={styles.drawerTitle}>Que voulez-vous faire ?</Text>

              {/* Toujours possible de répondre */}
              <TouchableOpacity
                style={styles.drawerButton}
                onPress={onReplyFromDrawer}
              >
                <Text style={styles.drawerButtonText}>Répondre</Text>
              </TouchableOpacity>

              {/* Affiché seulement si c’est VOTRE message */}
              {drawerMessage?.isSender && (
                <>
                  <TouchableOpacity
                    style={styles.drawerButton}
                    onPress={onEditFromDrawer}
                  >
                    <Text style={styles.drawerButtonText}>Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.drawerButton, styles.deleteButton]}
                    onPress={onDeleteFromDrawer}
                  >
                    <Text
                      style={[styles.drawerButtonText, styles.deleteText]}
                    >
                      Supprimer
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Annuler (toujours possible) */}
              <TouchableOpacity
                style={styles.drawerButton}
                onPress={onCancelFromDrawer}
              >
                <Text style={styles.drawerButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </Modal>
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

  // Overlay semi-transparente derrière le drawer
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  // Conteneur du drawer (au bas de l'écran)
  drawerContainer: {
    backgroundColor: '#fff',
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  drawerButton: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  drawerButtonText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  deleteButton: {
    borderColor: '#eee',
  },
  deleteText: {
    color: '#E53935',
    fontWeight: '600',
  },
});

export default ChatScreen;
