import React, { useState, useEffect } from "react";
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
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "./store/store"; // ajuste selon ton chemin

const ChatList: React.FC = () => {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);

  const [users, setUsers] = useState<any[]>([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const animatedHeight = useState(new Animated.Value(0))[0];

  const toggleSearch = () => {
    setSearchVisible((prev) => {
      const toValue = !prev ? 50 : 0;
      Animated.timing(animatedHeight, {
        toValue,
        duration: 200,
        useNativeDriver: false,
        easing: Easing.out(Easing.ease),
      }).start();
      return !prev;
    });
  };

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const response = await fetch("http://192.168.202.30:5263/api/User/Mp", {
        headers: {
          Accept: "text/plain",
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();
      const json = JSON.parse(text);

      if (Array.isArray(json)) {
        setUsers(json);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (err: any) {
      console.error("Error fetching users:", err);
      Alert.alert("API Error", err.message || "Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.firstName?.toLowerCase().includes(searchText.toLowerCase())
  );

  const handlePress = (user: any) => {
    router.push({
      pathname: "/ChatScreen",
      params: {
        name: user.firstName,
        avatar: user.image,
      },
    });
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => handlePress(item)}>
      <View style={styles.messageRow}>
        <Image
          source={{ uri: item.image || "https://randomuser.me/api/portraits/women/10.jpg" }}
          style={styles.avatar}
        />
        {item.status === "Online" && <View style={styles.onlineDot} />}
        <View style={styles.messageContent}>
          <Text style={styles.name}>{item.firstName}</Text>
          <Text style={styles.preview}>{item.statusLocalized}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity onPress={toggleSearch}>
          <Icon name="search" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.searchContainer, { height: animatedHeight }]}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un prénom..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </Animated.View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA", paddingHorizontal: 15 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold" },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    position: "relative",
  },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  onlineDot: {
    position: "absolute",
    left: 42,
    top: 38,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "green",
    borderWidth: 2,
    borderColor: "white",
  },
  messageContent: {
    flex: 1,
    marginLeft: 12,
  },
  name: { fontWeight: "bold", fontSize: 15 },
  preview: { color: "#666", fontSize: 13 },
  searchContainer: {
    overflow: "hidden",
  },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderColor: "#ccc",
    borderWidth: 1,
  },
});

export default ChatList;
