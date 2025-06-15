import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useMessageSender } from '../../hooks/useMessageSender';
import EmojiPicker from 'rn-emoji-keyboard';
import dotenv from 'dotenv';

const ipAddress = process.env.EXPO_PUBLIC_IP_ADDRESS;

interface MessageBubbleProps {
  text: string;
  time: string;
  isSender: boolean;
  senderId: number;
  parentId?: number;
  parentText?: string | null;
  attachments?: string[];
  onLongPress?: () => void;
  id?: number;
  reactions?: Array<{
    id: number;
    content: string;
    messageId: number;
    senderId: number;
  }>;
  onAddReaction?: (reaction: { id: number; content: string; messageId: number; senderId: number }) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  text,
  time,
  isSender,
  senderId,
  parentId,
  parentText,
  attachments,
  onLongPress,
  id,
  reactions = [],
  onAddReaction,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const token = useSelector((state: RootState) => state.auth.token) || ''; 
  const { avatarUrl } = useMessageSender(senderId, token);

  const [attachmentBase64, setAttachmentBase64] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const fetchAttachments = async () => {
      if (attachments && attachments.length > 0) {
        const updatedBase64: Record<string, string | null> = {};
        for (const uri of attachments) {
          try {
            const res = await fetch(uri, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const blob = await res.blob();
              const reader = new FileReader();
              reader.onloadend = () => {
                updatedBase64[uri] = reader.result as string;
                setAttachmentBase64((prev) => ({ ...prev, ...updatedBase64 }));
              };
              reader.readAsDataURL(blob);
            } else {
              updatedBase64[uri] = null;
              setAttachmentBase64((prev) => ({ ...prev, ...updatedBase64 }));
            }
          } catch (e) {
            updatedBase64[uri] = null;
            setAttachmentBase64((prev) => ({ ...prev, ...updatedBase64 }));
          }
        }
      }
    };
    fetchAttachments();
  }, [attachments, token]);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onLongPress={onLongPress}
      onPress={() => setIsOpen(true)}
      style={[
        styles.container,
        isSender ? styles.senderContainer : styles.receiverContainer,
      ]}
    >
      {!isSender && (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      )}
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
          {attachments && attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {attachments.map((uri, idx) => {
                const base64Uri = attachmentBase64[uri];
                return (
                  <Image
                    key={idx}
                    source={{ uri: base64Uri || uri }}
                    style={styles.attachmentImage}
                    resizeMode="cover"
                  />
                );
              })}
            </View>
          )}
          {reactions.length > 0 && (
            <View style={styles.reactionsDiscordStyle}>
              {Object.entries(
                reactions.reduce((acc, r) => {
                  if (!acc[r.content]) acc[r.content] = { count: 0, mine: false };
                  acc[r.content].count += 1;
                  if (r.senderId === senderId) acc[r.content].mine = true;
                  return acc;
                }, {} as Record<string, { count: number; mine: boolean }>),
              ).map(([emoji, { count, mine }]) => (
                <View
                  key={emoji}
                  style={[
                    styles.reactionDiscordBox,
                    mine && { backgroundColor: '#5865F2', borderColor: '#5865F2' },
                  ]}
                >
                  <Text style={styles.reactionDiscordEmoji}>{emoji}</Text>
                  <Text style={styles.reactionDiscordCount}>{count}</Text>
                </View>
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
      {isSender && (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
    maxWidth: '80%',
    paddingTop: 8, 
  },
  senderContainer: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },
  receiverContainer: {
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 8, 
    marginRight: 8,
    marginTop: 0,
    alignSelf: 'flex-start',
  },
  bubbleContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginTop: 2, 
  },
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

  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  reactionsContainerUnder: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
    marginLeft: 8,
    marginBottom: 2,
    alignItems: 'center',
  },
  reactionsOnBubble: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
    alignItems: 'center',
  },
  reaction: {
    fontSize: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  reactionsDiscordStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 0,
    gap: 6,
    flexWrap: 'wrap',
    maxWidth: '100%', 
  },
  reactionDiscordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23272f',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#444',
    minWidth: 32,
    justifyContent: 'center',
  },
  reactionDiscordEmoji: {
    fontSize: 13, 
    marginRight: 4,
    color: '#fff',
  },
  reactionDiscordCount: {
    fontSize: 12, 
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default MessageBubble;