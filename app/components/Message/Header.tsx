import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import Icon from "react-native-vector-icons/MaterialIcons";
import MenuIcon from "react-native-vector-icons/MaterialCommunityIcons";

interface HeaderProps {
  name: string;
  avatar: string;
}

const Header: React.FC<HeaderProps> = ({ name, avatar }) => {
  const router = useRouter();

  const handleSearch = () => {
    Alert.alert("Recherche", "Fonction de recherche à implémenter");
  };

  const handleMenu = () => {
    Alert.alert("Options", "Menu contextuel à venir");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
        <Icon name="arrow-back" size={24} color="#007AFF" />
      </TouchableOpacity>

      <Image source={{ uri: avatar }} style={styles.avatar} />
      <Text style={styles.name}>{name}</Text>

      <View style={styles.rightIcons}>
        <TouchableOpacity onPress={handleSearch} style={styles.iconButton}>
          <Icon name="search" size={22} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleMenu} style={styles.iconButton}>
          <MenuIcon name="dots-vertical" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// TODO : Add shared workspaces section
  {/* Shared workspaces
      <View style={styles.sharedSection}>
        <View style={styles.sharedAvatars}>
          <Image source={{ uri: avatar as string }} style={styles.sharedImage} />
          <Image source={{ uri: avatar as string }} style={styles.sharedImage} />
          <Image source={{ uri: avatar as string }} style={styles.sharedImage} />
        </View>
        <Text style={styles.sharedText}>3 common workspaces</Text>
        <TouchableOpacity style={styles.blockBtn}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons name="block" size={16} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "bold", marginLeft: 5 }}>Block</Text>
          </View>
        </TouchableOpacity>
      </View> */}


const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  iconButton: {
    paddingHorizontal: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 8,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
    color: "#000",
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default Header;
