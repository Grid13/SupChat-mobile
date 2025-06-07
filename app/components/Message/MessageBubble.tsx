// MessageBubble.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

interface MessageBubbleProps {
  text: string;
  time: string;
  isSender: boolean;
  avatar?: string;
  onLongPress?: () => void;
  parentId?: number | null;
  parentText?: string | null;
  attachments?: string[]; // URLs d’images
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  text,
  time,
  isSender,
  avatar,
  onLongPress,
  parentText,
  attachments,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onLongPress={onLongPress}
      style={[
        styles.container,
        isSender ? styles.senderContainer : styles.receiverContainer,
      ]}
    >
      <View
        style={[
          styles.bubbleContainer,
          isSender ? styles.senderBubbleContainer : styles.receiverBubbleContainer,
        ]}
      >
        {parentText && (
          <View style={styles.replyIndicator}>
            <Text style={styles.replyIndicatorText} numberOfLines={1}>
              {parentText}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.bubble,
            isSender ? styles.senderBubble : styles.receiverBubble,
          ]}
        >
          {text !== '' && (
            <Text
              style={[
                styles.text,
                isSender ? { color: 'white' } : { color: 'black' },
              ]}
            >
              {text}
            </Text>
          )}

          {/* → NOUVEAU : affichage des images reçues */}
          {attachments && attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {attachments.map((uri, idx) => (
                <Image
                  key={idx}
                  source={{ uri }}
                  style={styles.attachmentImage}
                  resizeMode="cover"
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.timeContainer}>
          <Text
            style={[
              styles.time,
              isSender ? styles.senderTime : styles.receiverTime,
            ]}
          >
            {time}
          </Text>
        </View>
      </View>

      {isSender && avatar && (
        <Image source={{ uri: avatar }} style={styles.avatar} />
      )}
    </TouchableOpacity>
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

  replyIndicator: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
    maxWidth: 240,
  },
  replyIndicatorText: {
    fontSize: 12,
    color: '#555',
  },

  bubble: {
    maxWidth: 280,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    flexShrink: 1,
  },
  senderBubble: {
    backgroundColor: '#6C8AF5',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 15,
    borderBottomLeftRadius: 15,
  },
  receiverBubble: {
    backgroundColor: '#EBEBEB',
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },

  text: {
    fontSize: 16,
    flexWrap: 'wrap',
    textAlign: 'left',
  },

  timeContainer: { marginTop: 4, alignItems: 'flex-end' },
  time: { fontSize: 12, color: 'gray' },
  senderTime: { marginRight: 10 },
  receiverTime: { marginLeft: 10 },

  // → NOUVEAU : style du conteneur des images
  attachmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 6,
  },
  attachmentImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
    marginRight: 6,
    marginTop: 4,
    backgroundColor: '#eee',
  },
});

export default MessageBubble;
