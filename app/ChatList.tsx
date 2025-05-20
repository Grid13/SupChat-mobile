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
import { SafeAreaView } from "react-native-safe-area-context";
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
      const response = await fetch("http://192.168.163.30:5263/api/User/Mp", {
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
        userId: user.id,
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
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity onPress={toggleSearch}>
          <Icon name="search" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
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
          contentContainerStyle={{ paddingBottom: 30, paddingTop: 10 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    position: "relative",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineDot: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#34C759",
  },
  messageContent: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  preview: {
    fontSize: 14,
    color: "#666",
  },
  searchContainer: {
    overflow: "hidden",
  },
  searchInput: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 10,
  },
});

export default ChatList;
