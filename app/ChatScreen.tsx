// ChatScreen.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert, Text } from 'react-native';
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

const ChatScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const token = useSelector((s: RootState) => s.auth.token)!;
  const otherUserId = Number(params.userId);
  const avatar = params.avatar as string;

  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  // Keep a stable ref to myUserId so handleReceive stays the same
  const myUserIdRef = useRef<number | null>(null);
  useEffect(() => {
    myUserIdRef.current = myUserId;
  }, [myUserId]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, '0')}h${d.getMinutes().toString().padStart(2, '0')}`;
  };

  // Fetch current user
  useEffect(() => {
    fetch('http://192.168.163.30:5263/api/Account/Me', {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then(r => r.json())
      .then(d => {
        console.log('Me →', d);
        setMyUserId(d.applicationUser?.id ?? null);
      })
      .catch(console.error);
  }, [token]);

  // Fetch existing 1-on-1 messages
  useEffect(() => {
    if (!myUserId) return;
    fetch(
      `http://192.168.163.30:5263/api/Message/ByUser?userId=${otherUserId}&pageNumber=1&pageSize=50`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then(r => r.json())
      .then((payload: ChatMessageDto[]) => {
        const sorted = [...payload].sort(
          (a, b) => new Date(a.sendDate).getTime() - new Date(b.sendDate).getTime()
        );
        const uiMessages = sorted.map(msg => ({
          type: 'message' as const,
          text: msg.content,
          time: formatTime(msg.sendDate),
          isSender: msg.senderId === myUserId,
          avatar: msg.senderId === myUserId ? '' : avatar,
        }));
        setMessages(uiMessages);
      })
      .catch(e => Alert.alert('Erreur chargement', e.message));
  }, [myUserId, otherUserId, token, avatar]);

  // onReceive callback for new incoming private messages
  const handleReceive = useCallback(
    (msg: ChatMessageDto) => {
      setMessages(prev => [
        ...prev,
        {
          type: 'message' as const,
          text: msg.content,
          time: formatTime(msg.sendDate),
          isSender: msg.senderId === myUserIdRef.current,
          avatar: msg.senderId === myUserIdRef.current ? '' : avatar,
        },
      ]);
    },
    [avatar]
  );

  const { isConnected, sendMessage } = useChatSocket(token, handleReceive);

  const handleSend = async (text: string) => {
    // Optimistic UI update
    setMessages(prev => [
      ...prev,
      {
        type: 'message' as const,
        text,
        time: formatTime(new Date().toISOString()),
        isSender: true,
        avatar: '',
      },
    ]);
    try {
      await sendMessage(otherUserId, text);
    } catch (e: any) {
      Alert.alert('Erreur envoi', e.message);
    }
  };

  // Auto-scroll on new messages
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <Header name={params.name as string} avatar={avatar} />
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
          >
            {messages.map((msg, i) =>
              msg.type === 'separator' ? (
                <View key={i} style={styles.separatorContainer}>
                  <View style={styles.line} />
                  <Text style={styles.separatorText}>{msg.text}</Text>
                  <View style={styles.line} />
                </View>
              ) : (
                <MessageBubble key={i} {...msg} />
              )
            )}
          </ScrollView>
          <ChatInput onSend={handleSend} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  separatorContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  separatorText: { marginHorizontal: 10, fontSize: 12, color: '#888' },
  line: { flex: 1, height: 1, backgroundColor: '#444', opacity: 0.5 },
});

export default ChatScreen;
