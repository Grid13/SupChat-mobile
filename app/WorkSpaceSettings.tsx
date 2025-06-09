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
import { useProfileImage } from "./hooks/useProfileImage";

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
  const [profilePictureId, setProfilePictureId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `http://192.168.1.161:5263/api/Workspace/${id}`,
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
        if (data.profilePictureId) {
          setProfilePictureId(data.profilePictureId);
          setImageUri(`http://192.168.1.161:5263/api/Attachment/${data.profilePictureId}`);
        } else if (data.profilePictureUrl) {
          setImageUri(data.profilePictureUrl);
        }
      } catch (err: any) {
        Alert.alert("Erreur", err.message || "Impossible de charger le workspace");
      }
    })();
  }, [id, token]);

  // Use the custom hook for protected images
  const avatarBase64 = useProfileImage(imageUri || undefined, token || '');

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      console.log("ImagePicker result:", result);
      console.log("Workspace id:", id); // Log the workspace id
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setLoading(true);
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop() || 'workspace.jpg';
        const formData = new FormData();
        formData.append('file', {
          uri,
          name: filename,
          type: 'image/jpeg',
        } as any);
        // Use "Workspace" as the attachmentType for upload
        const uploadUrl = 'http://192.168.1.161:5263/api/Attachment?attachmentType=ProfilePicture';
        console.log("Uploading image to Attachment endpoint...", uploadUrl);
        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            Accept: 'text/plain',
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        console.log("Upload response status:", res.status);
        if (!res.ok) {
          const errorText = await res.text();
          console.log("Upload failed:", errorText);
          Alert.alert("Erreur upload", errorText);
          throw new Error('Upload failed');
        }
        const data = await res.json();
        console.log("Attachment upload response data:", data);
        if (data.id) {
          // PATCH workspace profile picture using the new endpoint
          const patchUrl = `http://192.168.1.161:5263/api/Workspace/${id}/ProfilePicture`;
          console.log("Patching workspace profile picture:", patchUrl, "with attachmentId:", data.id);
          const patchRes = await fetch(
            patchUrl,
            {
              method: "PATCH",
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                attachmentId: data.id,
              }),
            }
          );
          console.log("PATCH response status:", patchRes.status);
          if (!patchRes.ok) {
            const patchError = await patchRes.text();
            console.log("PATCH failed:", patchError);
            throw new Error('Failed to update workspace image');
          }
          setProfilePictureId(data.id);
          setImageUri(`http://192.168.1.161:5263/api/Attachment/${data.id}`);
          Alert.alert('Succès', 'Image du workspace mise à jour !');
        } else {
          console.log("No id returned from attachment upload.");
        }
      } else {
        console.log("ImagePicker canceled or no asset URI.");
      }
    } catch (err: any) {
      console.log("Erreur dans pickImage:", err);
      Alert.alert("Erreur", "Impossible de sélectionner ou mettre à jour l'image");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setLoading(true);
    try {
      // PATCH with JSON body (not FormData)
      const body: any = {
        name: workspace.name,
        description: workspace.description,
        visibility: workspace.visibility,
      };
      if (profilePictureId) body.profilePictureId = profilePictureId;
      const res = await fetch(
        `http://192.168.1.161:5263/api/Workspace/${id}`,
        {
          method: "PATCH",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
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
        `http://192.168.1.161:5263/api/Workspace/${id}`,
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

  // For avatarUri, use useProfileImage for protected images
  const avatarUri = avatarBase64 || imageUri || "https://ui-avatars.com/api/?name=" + encodeURIComponent(workspace.name || "Workspace");

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
          <TouchableOpacity onPress={pickImage} style={styles.logoWrapper} disabled={loading}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.logo} />
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
