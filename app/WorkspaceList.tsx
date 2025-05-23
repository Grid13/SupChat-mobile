import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "./store/store";
import CreateWorkspaceModal from "./components/CreateWorkspaceModal";

type WorkspaceItem = {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  initials: string;
};

const WorkspaceList: React.FC = () => {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);

  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch(
        "http://192.168.1.10:5263/api/Workspace/Joined",
        {
          headers: {
            Accept: "text/plain",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const text = await response.text();
      const json = JSON.parse(text);

      if (Array.isArray(json)) {
        const transformed: WorkspaceItem[] = json.map((ws: any) => ({
          id: String(ws.id),
          title: ws.name || "Untitled",
          subtitle: ws.description || "No description",
          color: "#6B8AFD",
          initials: ws.name?.slice(0, 2).toUpperCase() || "WS",
        }));
        setWorkspaces(transformed);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (err: any) {
      console.error("Error fetching workspaces:", err);
      Alert.alert("API Error", err.message || "Unable to load workspaces");
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.title.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderItem = ({ item }: { item: WorkspaceItem }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() =>
        router.push({
          pathname: "/WorkspaceChat",
          params: {
            id: item.id,
            name: item.title,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
              item.title
            )}`,
          },
        })
      }
    >
      <View style={[styles.badge, { backgroundColor: item.color }]}>
        <Text style={styles.badgeText}>{item.initials}</Text>
      </View>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
      </View>
      <TouchableOpacity
        onPress={() => Alert.alert("Options", `Options pour ${item.title}`)}
      >
        <MaterialIcons name="more-vert" size={24} color="#000" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={{ color: "#fff", fontWeight: "bold" }}>WS</Text>
          </View>
          <Text style={styles.headerTitle}>Workspaces</Text>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle-outline" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#999"
          style={{ marginRight: 10 }}
        />
        <TextInput
          placeholder="Rechercher"
          placeholderTextColor="#999"
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Workspace list */}
      <FlatList
        data={filteredWorkspaces}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Modal */}
      <CreateWorkspaceModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreated={fetchWorkspaces}
      />
    </SafeAreaView>
  );
};

export default WorkspaceList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    backgroundColor: "#6B8AFD",
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  searchContainer: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: "#000",
  },
  itemContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F3F3",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "space-between",
  },
  badge: {
    width: 45,
    height: 45,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  itemSubtitle: {
    color: "#555",
    fontSize: 13,
  },
});