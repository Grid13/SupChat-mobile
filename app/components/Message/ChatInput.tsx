import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ChatInputProps {
  onSend: (message: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <View style={styles.inputContainer}>
      <TouchableOpacity>
        <Icon name="plus" size={24} color="gray" />
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="Message ..."
        value={message}
        onChangeText={setMessage}
      />
      <TouchableOpacity onPress={handleSend}>
        <Icon name="send" size={24} color="#4f83cc" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderColor: '#ddd' },
  input: { flex: 1, paddingHorizontal: 10, backgroundColor: '#f9f9f9', borderRadius: 20, marginHorizontal: 10 },
});

export default ChatInput;
