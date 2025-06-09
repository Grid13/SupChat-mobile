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
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { useProfileImage } from '../../hooks/useProfileImage';

interface HeaderProps {
  name: string;
  avatar: string;
  onSearchPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({ name, avatar, onSearchPress }) => {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const avatarUri = useProfileImage(avatar, token || "") || avatar || "https://ui-avatars.com/api/?name=User";

  const handleSearch = () => {
    console.log('Header: onSearchPress is', typeof onSearchPress);
    if (onSearchPress) { 
      console.log('Header: calling onSearchPress');
      onSearchPress(); 
      return; 
    }
    Alert.alert("Erreur intégration", "La prop onSearchPress n'est pas transmise au Header. Vérifiez l'import et l'utilisation du composant Header dans votre écran.");
  };

  const handleMenu = () => {
    Alert.alert("Options", "Menu contextuel à venir");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
        <Icon name="arrow-back" size={24} color="#007AFF" />
      </TouchableOpacity>

      <Image source={{ uri: avatarUri }} style={styles.avatar} />
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
