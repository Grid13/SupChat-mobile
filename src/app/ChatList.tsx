import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "./store/store";
import dotenv from 'dotenv';

const ipAddress = process.env.EXPO_PUBLIC_IP_ADDRESS;



const ChatList: React.FC = () => {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);

  const [users, setUsers] = useState<any[]>([]); 
  const [allUsers, setAllUsers] = useState<any[]>([]); 
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const animatedHeight = useState(new Animated.Value(0))[0];
  const [newMessageVisible, setNewMessageVisible] = useState(false);

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch(`http://${ipAddress}:5263/api/User/Mp`, {
        headers: { Accept: "text/plain", Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      const json = JSON.parse(text);
      if (Array.isArray(json)) setUsers(json);
      else throw new Error("Invalid /User/Mp response");
    } catch (err: any) {
      console.error("Error fetching chats:", err);
      Alert.alert("API Error", err.message);
    }
  };

  const fetchAllUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch(
        `http://${ipAddress}:5263/api/User?pageNumber=1&pageSize=50`,
        { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = await res.json();
      if (Array.isArray(json)) setAllUsers(json);
      else throw new Error("Invalid /User response");
    } catch (err: any) {
      console.error("Error fetching all users:", err);
      Alert.alert("API Error", err.message);
    }
  };

  const fetchCurrentUser = async () => {
    if (!token) return;
    try {
      const res = await fetch(`http://${ipAddress}:5263/api/Account/Me`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const id = json.applicationUser?.id;
      setCurrentUserId(id ?? null);
    } catch (err: any) {
      console.error("Error fetching current user:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, [token]);

  const toggleSearch = () => {
    setSearchVisible(prev => {
      const toValue = prev ? 0 : 50;
      Animated.timing(animatedHeight, { toValue, duration: 200, useNativeDriver: false, easing: Easing.out(Easing.ease) }).start();
      return !prev;
    });
  };

  const toggleNewMessage = () => {
    if (!newMessageVisible) fetchAllUsers();
    setNewMessageVisible(v => !v);
  };

  const filteredChats = users.filter(u =>
    u.firstName?.toLowerCase().includes(searchText.toLowerCase())
  );

  const availableUsers = allUsers.filter(u => {
    if (u.id === currentUserId) return false;
    if (users.some(c => c.id === u.id)) return false;
    return true;
  }).filter(u =>
    u.firstName?.toLowerCase().includes(searchText.toLowerCase())
  );

  const handlePress = (user: any) => {
    router.push({ pathname: "/ChatScreen", params: { userId: user.id, name: user.firstName, avatar: user.image } });
  };

  const renderChatItem = ({ item }: { item: any }) => {
    const avatarUri = item.image || "https://ui-avatars.com/api/?name="+ encodeURIComponent(item.username || "User");
    console.log("Rendering chat item:", item.firstName);
    console.log("Avatar URI:", avatarUri);
    
    return (
      <TouchableOpacity onPress={() => handlePress(item)}>
        <View style={styles.messageRow}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
          {item.status === "Online" && <View style={styles.onlineDot} />}
          <View style={styles.messageContent}>
            <Text style={styles.name}>{item.firstName}</Text>
            <Text style={styles.preview}>{item.statusLocalized}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderNewUserItem = ({ item }: { item: any }) => {
    console.log("Rendering new user item:", item.firstName);
    const avatarUri = item.image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(item.firstName || "User");
    console.log("Avatar URI:", avatarUri);
    return (
      <TouchableOpacity onPress={() => { handlePress(item); setNewMessageVisible(false); }}>
        <View style={styles.messageRow}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
          {item.status === "Online" && <View style={styles.onlineDot} />}
          <View style={styles.messageContent}>
            <Text style={styles.name}>{item.firstName}</Text>
            <Text style={styles.preview}>{item.statusLocalized}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={toggleSearch} style={styles.iconButton}><Icon name="search" size={24} color="black" /></TouchableOpacity>
          <TouchableOpacity onPress={toggleNewMessage} style={styles.iconButton}><Icon name="add" size={24} color="black" /></TouchableOpacity>
        </View>
      </View>
      <Animated.View style={[styles.searchContainer, { height: animatedHeight }]}> 
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </Animated.View>
      {/* Main chat list */}
      <FlatList
        data={filteredChats}
        keyExtractor={item => item.id.toString()}
        renderItem={renderChatItem}
        contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
      />
      {/* Modal for new message */}
      <Modal visible={newMessageVisible} animationType="slide" onRequestClose={() => setNewMessageVisible(false)}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nouvelle conversation</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => setNewMessageVisible(false)}>
                <Icon name="close" size={24} />
              </TouchableOpacity>
            </View>
          </View>
          <FlatList
            data={availableUsers}
            keyExtractor={item => item.id.toString()}
            renderItem={renderNewUserItem}
            contentContainerStyle={{ padding: 15 }}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FAFAFA" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 15 },
  headerTitle: { fontSize: 22, fontWeight: "bold" },
  headerIcons: { flexDirection: "row" },
  iconButton: { marginLeft: 15 },
  searchContainer: { overflow: "hidden", paddingHorizontal: 15 },
  searchInput: { backgroundColor: "#FFF", borderRadius: 8, height: 40, paddingHorizontal: 12, marginBottom: 10 },
  messageRow: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  onlineDot: { position: "absolute", right: 5, bottom: 5, width: 12, height: 12, borderRadius: 6, backgroundColor: "#34C759" },
  messageContent: { marginLeft: 12, flex: 1 },
  name: { fontSize: 16, fontWeight: "bold" },
  preview: { fontSize: 14, color: "#666" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 15, borderBottomWidth: 1, borderColor: "#ddd" },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatList;