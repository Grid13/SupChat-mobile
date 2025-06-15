import React, { useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, TextInput, Text, TouchableOpacity, Alert } from 'react-native';
import Header from './Header';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useLocalSearchParams } from 'expo-router';
import dotenv from 'dotenv';

const ipAddress = process.env.EXPO_PUBLIC_IP_ADDRESS;



const Screen: React.FC = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const params = useLocalSearchParams();
  const userId = Number(Array.isArray(params.userId) ? params.userId[0] : params.userId);
  const [messages, setMessages] = useState<{ text: string; time: string; isSender: boolean; avatar: string; id?: number }[]>([]);   const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const messageRefs = useRef<{ [id: number]: View | null }>({});

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}h${minutes}`;
  };

  const handleSend = (message: string) => {
    setMessages([...messages, { text: message, time: formatTime(new Date()), isSender: true, avatar: '' }]);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSearch = async () => {
    if (!searchText.trim() || !token || !userId) return;
    setSearchLoading(true);
    try {
      const response = await fetch(`http://${ipAddress}:5263/api/Message/SearchInUser?userId=${userId}&search=${encodeURIComponent(searchText)}&pageNumber=1&pageSize=10`, {
        headers: {
          Accept: 'text/plain',
          Authorization: `Bearer ${token}`,
        },
      });
      const text = await response.text();
      const json = JSON.parse(text || '[]');
      setSearchResults(Array.isArray(json) ? json : (json.valueOrDefault || []));
    } catch (e) {
      setSearchResults([]);
      Alert.alert('Erreur', 'Recherche impossible');
    } finally {
      setSearchLoading(false);
    }
  };

  const scrollToMessage = (id: number) => {
    const index = messages.findIndex(m => m.id === id);
    if (index !== -1 && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: index * 60, animated: true }); 
    }
    setShowSearch(false);
    setSearchResults([]);
    setSearchText('');
  };

  return (
    <View style={styles.container}>
      {/* Barre de recherche au-dessus */}
      {showSearch && (
        <View style={{ backgroundColor: '#fff', padding: 10, borderBottomWidth: 1, borderColor: '#eee' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, height: 40 }}
              placeholder="Rechercher un message..."
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoFocus
            />
            <TouchableOpacity onPress={() => setShowSearch(false)} style={{ marginLeft: 10 }}>
              <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>Annuler</Text>
            </TouchableOpacity>
          </View>
          {/* Résultats de recherche */}
          {searchLoading ? (
            <Text style={{ marginTop: 10, color: '#888' }}>Recherche...</Text>
          ) : (
            searchResults.length > 0 && (
              <View style={{ marginTop: 10 }}>
                {searchResults.map((msg, idx) => (
                  <TouchableOpacity key={msg.id} onPress={() => scrollToMessage(msg.id)} style={{ paddingVertical: 8 }}>
                    <Text numberOfLines={2} style={{ color: '#333' }}>{msg.content}</Text>
                    <Text style={{ color: '#888', fontSize: 12 }}>{msg.sendDate?.slice(0, 16).replace('T', ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )
          )}
        </View>
      )}
      {/* Header avec icône recherche */}
      <Header
        name={params.name as string || 'Chat'}
        avatar={params.avatar as string || ''}
        onSearchPress={() => setShowSearch(true)}
      />
      <ScrollView
        style={styles.chatContainer}
        ref={scrollViewRef}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {messages.map((msg, index) => (
          <View key={index} ref={ref => { if (msg.id) messageRefs.current[msg.id] = ref; }}>
            <MessageBubble text={msg.text} time={msg.time} isSender={msg.isSender} avatar={msg.avatar} />
          </View>
        ))}
      </ScrollView>
      <ChatInput
        onSend={handleSend}
        replyTo={null}
        onCancelReply={() => {}}
        editing={null}
        onSaveEdit={() => {}}
        onCancelEdit={() => {}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  chatContainer: { flex: 1, padding: 10 },
});

export default Screen;