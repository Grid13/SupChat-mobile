import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface MessageBubbleProps {
  text: string;
  time: string;
  isSender: boolean;
  avatar?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ text, time, isSender, avatar }) => {
  return (
    <View style={[styles.container, isSender ? styles.senderContainer : styles.receiverContainer]}>
      <View style={[styles.bubbleContainer, isSender ? styles.senderBubbleContainer : styles.receiverBubbleContainer]}>
        <View style={styles.timeContainer}>
          <Text style={[styles.time, isSender ? styles.senderTime : styles.receiverTime]}>{time}</Text>
        </View>
        <View style={[styles.bubble, isSender ? styles.senderBubble : styles.receiverBubble]}>
          <Text style={styles.text}>{text}</Text>
        </View>
      </View>
      {isSender && avatar && <Image source={{ uri: avatar }} style={styles.avatar} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 5 },
  senderContainer: { justifyContent: 'flex-end', alignSelf: 'flex-end' },
  receiverContainer: { justifyContent: 'flex-start', alignSelf: 'flex-start' },
  avatar: { width: 30, height: 30, borderRadius: 15, marginHorizontal: 5 },
  bubbleContainer: { flexDirection: 'column', alignItems: 'flex-end' },
  senderBubbleContainer: { alignItems: 'flex-end' },
  receiverBubbleContainer: { alignItems: 'flex-start' },
  bubble: { 
    maxWidth: 300,  // Ajustement pour éviter une largeur trop grande
    paddingVertical: 6, // Diminue la hauteur de la bulle
    paddingHorizontal: 12,
    borderRadius: 15,
    flexShrink: 1, // Permet de s’adapter sans forcer la hauteur
  },
  senderBubble: {
    backgroundColor: '#6C8AF5', 
    borderTopRightRadius: 2, 
    borderBottomRightRadius: 15, 
    borderBottomLeftRadius: 15 
  },
  receiverBubble: {
    backgroundColor: '#F1F1F1', 
    borderTopLeftRadius: 2, 
    borderBottomLeftRadius: 15, 
    borderBottomRightRadius: 15 
  },
  text: { 
    fontSize: 16, 
    color: 'white', 
    flexWrap: 'wrap', 
    textAlign: 'left',
  },
  timeContainer: { marginBottom: 2 },
  time: { fontSize: 12, color: 'gray' },
  senderTime: { alignSelf: 'flex-end', marginRight: 10 },
  receiverTime: { alignSelf: 'flex-start', marginLeft: 10 },
});

export default MessageBubble;
