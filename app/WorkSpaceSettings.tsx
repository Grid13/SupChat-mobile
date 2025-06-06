import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "./store/store";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";

type Workspace = {
  id: number;
  name: string;
  description: string;
  visibility: "Public" | "Private";
};

export default function WorkspaceSettings() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const token = useSelector((state: RootState) => state.auth.token);

  const [workspace, setWorkspace] = useState<Workspace>({
    id: Number(id),
    name: "",
    description: "",
    visibility: "Public",
  });
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `http://192.168.1.10:5263/api/Workspace/${id}`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        setWorkspace({
          id: data.id,
          name: data.name,
          description: data.description,
          visibility: data.visibility,
        });
        if (data.profilePictureUrl) {
          setImageUri(data.profilePictureUrl);
        }
      } catch (err: any) {
        Alert.alert("Erreur", err.message || "Impossible de charger le workspace");
      }
    })();
  }, [id, token]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.cancelled) {
        setImageUri(result.uri);
      }
    } catch (err: any) {
      Alert.alert("Erreur", "Impossible de sélectionner l'image");
    }
  };

  const save = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", workspace.name);
      formData.append("description", workspace.description);
      formData.append("visibility", workspace.visibility);
      if (imageUri && imageUri.startsWith("file://")) {
        const filename = imageUri.split('/').pop() || 'image.jpg';
        formData.append('logo', {
          uri: imageUri,
          name: filename,
          type: 'image/jpeg',
        } as any);
      }

      const res = await fetch(
        `http://192.168.1.10:5263/api/Workspace/${id}`,
        {
          method: "PATCH",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Erreur ${res.status}`);
      }
      Alert.alert("Succès", "Workspace mis à jour");
      router.back();
    } catch (err: any) {
      Alert.alert("Erreur", err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Attention",
      "Voulez-vous vraiment supprimer ce workspace ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: deleteWorkspace },
      ]
    );
  };

  const deleteWorkspace = async () => {
    setLoadingDelete(true);
    try {
      const res = await fetch(
        `http://192.168.1.10:5263/api/Workspace/${id}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      Alert.alert("Supprimé", "Workspace supprimé");
      router.back();
    } catch (err: any) {
      Alert.alert("Erreur", err.message);
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8F9FC" }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.logoWrapper}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoPlaceholder]} />
            )}
            <View style={styles.pencilIcon}>
              <MaterialIcons name="edit" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Paramètres du workspace</Text>

        <Text style={styles.label}>Nom</Text>
        <TextInput
          style={styles.input}
          value={workspace.name}
          onChangeText={(t) => setWorkspace((w) => ({ ...w, name: t }))}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          multiline
          value={workspace.description}
          onChangeText={(t) => setWorkspace((w) => ({ ...w, description: t }))}
        />

        <Text style={styles.label}>Visibilité</Text>
        <View style={styles.row}>
          {(["Public", "Private"] as const).map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.option,
                workspace.visibility === opt && styles.optionActive,
              ]}
              onPress={() =>
                setWorkspace((w) => ({ ...w, visibility: opt }))
              }
            >
              <Text
                style={[
                  styles.optionText,
                  workspace.visibility === opt && { color: "#fff" },
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]} 
          onPress={save} 
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, loadingDelete && { opacity: 0.6 }]}
          onPress={confirmDelete}
          disabled={loadingDelete}
        >
          <Text style={styles.deleteButtonText}>
            {loadingDelete ? "Suppression..." : "Supprimer le workspace"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  container: { padding: 20 },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoWrapper: {
    position: "relative",
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0E0E0',
  },
  logoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pencilIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4F8CFF',
    borderRadius: 12,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    marginBottom: 16,
  },
  option: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#6B8AFD",
    borderRadius: 6,
    alignItems: "center",
    marginRight: 10,
  },
  optionActive: {
    backgroundColor: "#6B8AFD",
  },
  optionText: {
    color: "#6B8AFD",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#4F8CFF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 30,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#FF4D4F",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
