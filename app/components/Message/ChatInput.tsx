// ChatInput.tsx
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

  // Nouvelles props pour l’édition
  editing: { id: number; text: string } | null;
  onSaveEdit: (newText: string) => void;
  onCancelEdit: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  replyTo,
  onCancelReply,
  editing,
  onSaveEdit,
  onCancelEdit,
}) => {
  // Si on édite, on pré-remplit l’input avec le texte existant
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
      // Si on est en mode édition, on sauvegarde la modification
      onSaveEdit(trimmed);
    } else {
      // Sinon, on envoie un nouveau message ou une réponse
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
      {/* Si on est en mode « répondre » ET PAS en mode édition, on affiche le bandeau « Répondre à » */}
      {replyTo && !editing && (
        <View style={styles.replyContainer}>
          <Text style={styles.replyText} numberOfLines={1}>
            Répondre à : {replyTo.text}
          </Text>
          <TouchableOpacity onPress={onCancelReply} style={styles.cancelButton}>
            <Text style={styles.cancelText}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Si on est en mode édition, on affiche un bandeau spécial */}
      {editing && (
        <View style={[styles.replyContainer, { backgroundColor: '#ffeeba' }]}>
          <Text style={[styles.replyText, { fontWeight: 'bold' }]} numberOfLines={1}>
            Modification : {editing.text}
          </Text>
          <TouchableOpacity onPress={cancelAllModes} style={styles.cancelButton}>
            <Text style={styles.cancelText}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={cancelAllModes} disabled={!editing && !replyTo}>
          <Icon
            name={editing || replyTo ? 'close-circle-outline' : 'plus-circle-outline'}
            size={28}
            color={editing || replyTo ? '#E53935' : '#5C6BC0'}
          />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
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
  },
  // Bandeau « Répondre à » et « Modification »
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
  },
  cancelButton: {
    marginLeft: 8,
    padding: 4,
  },
  cancelText: {
    fontSize: 18,
    color: '#555',
  },
});
