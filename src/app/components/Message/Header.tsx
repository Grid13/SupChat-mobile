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
import { MaterialIcons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { useProfileImage } from '../../hooks/useProfileImage';

const ipAddress = process.env.EXPO_PUBLIC_IP_ADDRESS;

interface HeaderProps {
  name: string;
  avatar: string;
  onSearchPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({ name, avatar, onSearchPress }) => {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);

  console.log("Header props:", { name, avatar, token });

  const avatarUri = avatar && avatar.startsWith(`http://${ipAddress}:5263/api/Attachment/`)
    ? avatar
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;

  console.log("Avatar URI:", avatarUri);

  const handleSearch = () => {
    if (onSearchPress) { 
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
        <MaterialIcons name="arrow-back" size={24} />
      </TouchableOpacity>

      <Image source={{ uri: avatarUri }} style={styles.avatar} />
      <Text style={styles.name}>{name}</Text>

      <View style={styles.rightIcons}>
        <TouchableOpacity onPress={handleSearch} style={styles.iconButton}>
          <MaterialIcons name="search" size={22} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleMenu} style={styles.iconButton}>
          <MaterialCommunityIcons name="dots-vertical" size={22} />
        </TouchableOpacity>
      </View>
    </View>
  );
};



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
