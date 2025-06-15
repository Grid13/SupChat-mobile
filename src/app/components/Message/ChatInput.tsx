import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ChatInputProps {
  onSend: (message: string, parentId: number | null) => void;
  replyTo: { id: number; text: string } | null;
  onCancelReply: () => void;
  editing: { id: number; text: string } | null;
  onSaveEdit: (newText: string) => void;
  onCancelEdit: () => void;
  onPickImage?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  replyTo,
  onCancelReply,
  editing,
  onSaveEdit,
  onCancelEdit,
  onPickImage,
}) => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (editing) {
      setMessage(editing.text);
    }
  }, [editing]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    if (editing) {
      onSaveEdit(trimmed);
    } else {
      onSend(trimmed, replyTo ? replyTo.id : null);
    }
    setMessage('');
  };

  const cancelAllModes = () => {
    if (editing) {
      onCancelEdit();
    }
    if (replyTo) {
      onCancelReply();
    }
    setMessage('');
  };

  return (
    <View>
      {replyTo && !editing && (
        <View style={styles.replyContainer}>
          <Text style={[styles.replyText, { fontSize: 16, letterSpacing: 0 }]} numberOfLines={1}>
            Reply to: {replyTo.text}
          </Text>
          <TouchableOpacity onPress={onCancelReply} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { fontSize: 18, letterSpacing: 0 }]}>×</Text>
          </TouchableOpacity>
        </View>
      )}
      {editing && (
        <View style={[styles.replyContainer, { backgroundColor: '#ffeeba' }]}>
          <Text style={[styles.replyText, { fontWeight: 'bold', fontSize: 16, letterSpacing: 0 }]} numberOfLines={1}>
            Modification : {editing.text}
          </Text>
          <TouchableOpacity onPress={cancelAllModes} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { fontSize: 18, letterSpacing: 0 }]}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputContainer}>
        {/* Image picker button */}
        {onPickImage && (
          <TouchableOpacity onPress={onPickImage} style={styles.imageButton}>
            <Icon name="image" size={26} color="#5C6BC0" />
          </TouchableOpacity>
        )}
        <TextInput
          style={[
            styles.input,
            { fontSize: 16, letterSpacing: 0 }
          ]}
          placeholder={editing ? 'Modifier votre message…' : 'Message…'}
          placeholderTextColor="#999"
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity onPress={handleSend}>
          <Icon
            name={editing ? 'check-circle-outline' : 'send'}
            size={24}
            color="#5C6BC0"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChatInput;

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f1f3f4',
    borderRadius: 20,
    marginHorizontal: 10,
    fontSize: 16, 
    color: '#333',
    letterSpacing: 0, 
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginHorizontal: 12,
    marginBottom: 6,
  },
  replyText: {
    flex: 1,
    fontStyle: 'italic',
    color: '#555',
    fontSize: 15, 
    letterSpacing: 0, 
  },
  cancelButton: {
    marginLeft: 8,
    padding: 4,
  },
  cancelText: {
    fontSize: 18, 
    color: '#555',
    letterSpacing: 0, 
  },
  imageButton: {
    marginRight: 6,
    padding: 2,
  },
});
