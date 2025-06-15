import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "./store/store";
import CreateWorkspaceModal from "./components/CreateWorkspaceModal";
import { useProfileImage } from "./hooks/useProfileImage";
import dotenv from 'dotenv';

const ipAddress = process.env.EXPO_PUBLIC_IP_ADDRESS;



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

  const WorkspaceAvatar = ({
    profilePictureId,
    name,
  }: {
    profilePictureId?: string;
    name: string;
  }) => {
    const imageUrl = profilePictureId
      ? `http://${ipAddress}:5263/api/Attachment/${profilePictureId}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
    const token = useSelector((state: RootState) => state.auth.token) || "";
    const avatarBase64 = useProfileImage(
      profilePictureId ? imageUrl : undefined,
      token
    );
    return (
      <View style={styles.badge}>
        <Text style={{ display: "none" }}>{name}</Text>
        <Text style={{ display: "none" }}>{profilePictureId}</Text>
        <Text style={{ display: "none" }}>{imageUrl}</Text>
        {profilePictureId && avatarBase64 ? (
          <View
            style={{
              width: 45,
              height: 45,
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <Image
              source={{ uri: avatarBase64 }}
              style={{ width: 45, height: 45, borderRadius: 10 }}
            />
          </View>
        ) : (
          <View
            style={{
              width: 45,
              height: 45,
              borderRadius: 10,
              backgroundColor: "#6B8AFD",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={styles.badgeText}>
              {name?.slice(0, 2).toUpperCase() || "WS"}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch(
        `http://${ipAddress}:5263/api/Workspace/Joined`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const json = await response.json();

      if (Array.isArray(json)) {
        const transformed: WorkspaceItem[] = json.map((ws: any) => ({
          id: String(ws.id),
          title: ws.name || "Untitled",
          subtitle: ws.description || "No description",
          color: "#6B8AFD",
          initials: ws.name?.slice(0, 2).toUpperCase() || "WS",
          profilePictureId: ws.profilePictureId,
          visibility: ws.visibility, // Added visibility field
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

  const renderItem = ({ item }: { item: WorkspaceItem & { profilePictureId?: string; visibility?: string } }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() =>
        router.push({
          pathname: "/WorkspaceChat",
          params: {
            id: item.id,
            name: item.title,
            avatar: item.profilePictureId
              ? `http://${ipAddress}:5263/api/Attachment/${item.profilePictureId}`
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title)}`,
          },
        })
      }
    >
      <WorkspaceAvatar name={item.title} profilePictureId={item.profilePictureId} />
      <View style={styles.workspaceContent}>
        <Text style={styles.workspaceTitle}>{item.title}</Text>
        <Text style={styles.workspaceSubtitle}>{item.subtitle}</Text>
      </View>
      {item.visibility === "Private" && (
        <Ionicons name="lock-closed" size={20} color="gray" style={styles.lockIcon} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Optionally, show a generic workspace icon here */}
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
  workspaceContent: {
    flex: 1,
  },
  workspaceTitle: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  workspaceSubtitle: {
    color: "#555",
    fontSize: 13,
  },
  lockIcon: {
    marginLeft: 10,
  },
});