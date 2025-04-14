import React, { useState } from "react";
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
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

const initialMessages = [
  {
    id: "1",
    name: "NainnMaboul",
    message: "peut être qu'on...",
    time: "21h12",
    avatar: "https://randomuser.me/api/portraits/women/10.jpg",
    isOnline: true,
  },
  {
    id: "2",
    name: "Isabelle czenanovitch",
    message: "Lorem ipsum dolor sit amet, c",
    time: "21h12",
    avatar: "https://randomuser.me/api/portraits/women/20.jpg",
    isOnline: true,
  },
  ...new Array(8).fill(null).map((_, i) => ({
    id: `${i + 3}`,
    name: "NainnMaboul",
    message: "peut être qu'on...",
    time: "21h12",
    avatar: `https://randomuser.me/api/portraits/women/${i + 30}.jpg`,
    isOnline: true,
  })),
];

const ChatList: React.FC = () => {
  const router = useRouter();
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

  const filteredMessages = initialMessages.filter((msg) =>
    msg.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handlePress = (item: any) => {
    router.push({
      pathname: "/ChatScreen",
      params: {
        name: item.name,
        avatar: item.avatar,
      },
    });
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => handlePress(item)}>
      <View style={styles.messageRow}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        {item.isOnline && <View style={styles.onlineDot} />}
        <View style={styles.messageContent}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.preview}>{item.message}</Text>
        </View>
        <Text style={styles.time}>{item.time}</Text>
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
          placeholder="Rechercher un nom..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </Animated.View>

      <FlatList
        data={filteredMessages}
        keyExtractor={(item) => item.id}
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
  time: { color: "#999", fontSize: 12, marginLeft: 5 },
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