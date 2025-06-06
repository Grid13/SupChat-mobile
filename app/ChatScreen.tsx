// ChatScreen.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Text,
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

  // 2) Charger l'historique des messages (avec id & parentId)
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
        : json.valueOrDefault || json;

      const grouped: MessageItem[] = [];
      let currLabel: string | null = null;
      let dayMsgs: MessageItem[] = [];

      arr.sort((a, b) => new Date(a.sendDate).getTime() - new Date(b.sendDate).getTime());
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

  // 4) Réception en temps réel via WebSocket (si configuré)
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
            parentId: m.parentId, // no ?? null
          },
        ]);
      }
    },
    [otherUserId, avatar]
  );
  const { isConnected, sendMessage } = useChatSocket(token!, handleReceive);

  // 5) Passer en mode « répondre » (appui long sur une bulle)
  const handleReply = (id: number, text: string) => {
    setReplyTo({ id, text });
  };

  // 6) Annuler la réponse
  const cancelReply = () => {
    setReplyTo(null);
  };

  // 7) Envoi d’un message : on n’envoie parentId QUE si replyTo existe
  const handleSend = async (text: string, parentId: number | null) => {
    try {
      // Construction conditionnelle du corps : on n'ajoute parentId que s'il est non-null
      const body: { content: string; receiverId: number; parentId?: number } = {
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
        // Récupère le message créé
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
            parentId: returned.parentId, // no ?? null
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <Header name={params.name as string} avatar={avatar as string} />

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
                    // On cherche le texte du message parent s'il y en a un
                    let parentText: string | null = null;
                    if (msg.parentId && msg.parentId > 0) {
                      const parentMsg = messages.find(
                        (x) => x.type === 'message' && x.id === msg.parentId
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
                        onLongPress={() => handleReply(msg.id, msg.text)}
                      />
                    );
                  })()
                )
              )
            )}
          </ScrollView>

          <ChatInput
            onSend={handleSend}
            replyTo={replyTo}
            onCancelReply={cancelReply}
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
