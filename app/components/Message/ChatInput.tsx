import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ChatInputProps {
  onSend: (message: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
  const [message, setMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  return (
    <View>
      {showMenu && (
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem}>
            <Icon name="file" size={22} color="#5C6BC0" />
            <Text style={styles.menuText}>Fichier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Icon name="image" size={22} color="#5C6BC0" />
            <Text style={styles.menuText}>Photo</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={toggleMenu}>
          <Icon name="plus-circle-outline" size={28} color="#5C6BC0" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Message ..."
          placeholderTextColor="#999"
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity onPress={handleSend}>
          <Icon name="send" size={24} color="#5C6BC0" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
  menuContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 10,
    padding: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  menuText: {
    marginLeft: 6,
    fontSize: 16,
    color: '#5C6BC0',
  },
});

export default ChatInput;
