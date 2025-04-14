import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type WorkspaceItem = {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  initials: string;
};

const classes: WorkspaceItem[] = [
  {
    id: "1",
    title: "Points Communication",
    subtitle: "Thierry henry",
    color: "#6B8AFD",
    initials: "📣",
  },
  {
    id: "2",
    title: "3PROJ",
    subtitle: "Martin le goat, jb le raciste",
    color: "#6A5ACD",
    initials: "3",
  },
  {
    id: "3",
    title: "Chez adrien",
    subtitle: "M. isabelle, Mr. czenanovitch",
    color: "#1abc9c",
    initials: "BD",
  },
];

const teams: WorkspaceItem[] = [
  {
    id: "4",
    title: "Supinfo Campus Lille",
    subtitle: "Clement, Caroline ",
    color: "#e74c3c",
    initials: "SC",
  },
];

const WorkspaceList: React.FC = () => {
    const router = useRouter();
  
    const renderItem = ({ item }: { item: WorkspaceItem }) => (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() =>
          router.push({
            pathname: "/WorkspaceChat",
            params: {
              name: item.title,
              avatar: "https://randomuser.me/api/portraits/women/10.jpg", // à personnaliser
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
      </TouchableOpacity>
    );
  
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>MP</Text>
            </View>
            <Text style={styles.headerTitle}>Équipes</Text>
          </View>
          <MaterialIcons name="menu" size={24} color="#000" />
        </View>
  
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={{ marginRight: 10 }} />
          <TextInput placeholder="Rechercher" placeholderTextColor="#999" style={styles.searchInput} />
        </View>
  
        {/* Sections */}
        <Text style={styles.sectionTitle}>Classes</Text>
        <FlatList
          data={classes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
  
        <Text style={styles.sectionTitle}>Équipes</Text>
        <FlatList
          data={teams}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </View>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    marginTop: 20,
  },
  itemContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F3F3",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
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
