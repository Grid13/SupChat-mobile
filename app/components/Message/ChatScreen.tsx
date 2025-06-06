import React, { useState, useRef } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import Header from './Header';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<{ text: string; time: string; isSender: boolean; avatar: string }[]>([]); // Defined type for messages

  const scrollViewRef = useRef<ScrollView>(null);

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}h${minutes}`;
  };

  const handleSend = (message: string) => {
    setMessages([...messages, { text: message, time: formatTime(new Date()), isSender: true, avatar: '' }]); // Added avatar prop
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100); // Add a slight delay to ensure the message is rendered before scrolling
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.chatContainer}
        ref={scrollViewRef}
        contentContainerStyle={{ paddingBottom: 20 }} // Add padding to the bottom
      >
        {messages.map((msg, index) => (
          <MessageBubble key={index} text={msg.text} time={msg.time} isSender={msg.isSender} avatar={msg.avatar} />
        ))}
      </ScrollView>
      <ChatInput onSend={handleSend} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  chatContainer: { flex: 1, padding: 10 },
});

export default ChatScreen;