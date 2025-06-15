import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  launchImageLibraryAsync,
  requestMediaLibraryPermissionsAsync,
  ImagePickerResult,
} from "expo-image-picker";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { useRouter } from "expo-router";
import dotenv from 'dotenv';

const ipAddress = process.env.EXPO_PUBLIC_IP_ADDRESS;
console.log("IP Address:", ipAddress);

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
};

type AvailableWorkspace = {
  id: number;
  name: string;
  image?: string | null;
  visibility: string;
  visibilityLocalized?: string;
  ownerId: string;
};

const CreateWorkspaceModal: React.FC<Props> = ({ visible, onClose, onCreated }) => {
  const token = useSelector((state: RootState) => state.auth.token);
  const router = useRouter();

  const [tab, setTab] = useState<"create" | "join">("create");

  // Create tab state
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<"Public" | "Private">("Public");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profilePictureId, setProfilePictureId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Join tab state
  const [available, setAvailable] = useState<AvailableWorkspace[]>([]);
  const [loadingJoinList, setLoadingJoinList] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission requise", "Autorisez l'accès à la galerie pour ajouter une image.");
      }
    })();
  }, []);

  useEffect(() => {
    if (tab === "create") {
      setName("");
      setVisibility("Public");
      setSelectedImage(null);
      setProfilePictureId(null);
    } else {
      fetchAvailableWorkspaces();
    }
  }, [tab]);

  const fetchAvailableWorkspaces = async () => {
    setLoadingJoinList(true);
    try {
      const response = await fetch(`http://${ipAddress}:5263/api/Workspace/Available`, {
        headers: { Accept: "text/plain", Authorization: `Bearer ${token}` },
      });
      const text = await response.text();
      let json;
      try { json = JSON.parse(text); } catch { json = []; }
      const arr = Array.isArray(json)
        ? json
        : Array.isArray(json.value) ? json.value
        : Array.isArray(json.valueOrDefault) ? json.valueOrDefault
        : [];
      setAvailable(arr);
    } catch {
      setAvailable([]);
    } finally {
      setLoadingJoinList(false);
    }
  };

  const handleJoin = async (workspace: AvailableWorkspace) => {
    Alert.alert(
      "Rejoindre ce workspace ?",
      `Tu vas rejoindre "${workspace.name}".`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Rejoindre",
          onPress: async () => {
            try {
              setLoadingJoinList(true);
              const res = await fetch(
                `http://${ipAddress}:5263/api/Workspace/${workspace.id}/Join`,
                { method: "POST", headers: { Accept: "text/plain", Authorization: `Bearer ${token}` } }
              );
              if (!res.ok) throw new Error("Erreur lors de la demande de rejoindre.");
              Alert.alert("Tu as rejoint le workspace !", workspace.name);
              onClose(); onCreated();
              setTimeout(() => router.push({
                pathname: "/WorkspaceChat",
                params: {
                  id: String(workspace.id),
                  name: workspace.name,
                  avatar:
                    workspace.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(workspace.name)}`,
                },
              }), 200);
            } catch (err: any) {
              Alert.alert("Erreur", err.message || "Impossible de rejoindre.");
            } finally { setLoadingJoinList(false); }
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    const result: ImagePickerResult = await launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!('canceled' in result) || !result.canceled) {
      const uri = Array.isArray((result as any).assets)
        ? (result as any).assets[0].uri
        : (result as any).uri;
      if (uri) {
        setSelectedImage(uri);
        uploadImage(uri);
      }
    }
  };

  const uploadImage = async (uri: string) => {
    setUploadingImage(true);
    try {
      const form = new FormData();
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image';
      form.append('file', { uri, name: filename, type } as any);

      const res = await fetch(
        `http://${ipAddress}:5263/api/Attachment?attachmentType=ProfilePicture`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          body: form,
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Erreur upload image');
      }
      const data = await res.json();
      setProfilePictureId(data.id);
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible d’uploader l’image.');
      setSelectedImage(null);
    } finally { setUploadingImage(false); }
  };

  const createWorkspace = async () => {
    if (!name.trim()) return Alert.alert("Champ requis", "Le nom est obligatoire");
    if (uploadingImage) return Alert.alert("Veuillez patienter", "L'image est en cours d'upload.");
    try {
      setLoading(true);
      const body: any = { name: name.trim(), visibility };
      if (profilePictureId) body.profilePictureId = profilePictureId;
      console.log("IP Address:", ipAddress);

      const response = await fetch(`http://${ipAddress}:5263/api/Workspace`, {
        method: "POST",
        headers: {
          Accept: "text/plain",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Erreur réseau");
      }

      Alert.alert("Succès ✅", "Workspace créé !");
      setName(""); setVisibility("Public"); setSelectedImage(null); setProfilePictureId(null);
      onCreated(); onClose();
    } catch (err: any) {
      Alert.alert("Erreur", err.message);
    } finally { setLoading(false); }
  };

  const modalStyle = [ styles.modal, tab === "join" && styles.modalJoin ];

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={modalStyle}>
          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === "create" && styles.activeTab]}
              onPress={() => setTab("create")}
            >
              <Text style={[styles.tabText, tab === "create" && styles.activeTabText]}>
                Créer un workspace
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === "join" && styles.activeTab]}
              onPress={() => setTab("join")}
            >
              <Text style={[styles.tabText, tab === "join" && styles.activeTabText]}>
                Rejoindre un workspace
              </Text>
            </TouchableOpacity>
          </View>

          {/* CREATE */}
          {tab === "create" && (
            <>
              <Text style={styles.title}>Nouveau Workspace</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage} disabled={uploadingImage}>
                {selectedImage ? (
                  <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={40} color="#777" />
                    <Text style={{ marginTop: 4, color: "#777" }}>Ajouter une image</Text>
                  </View>
                )}
                {uploadingImage && <ActivityIndicator style={StyleSheet.absoluteFill} />}
              </TouchableOpacity>
              <TextInput
                placeholder="Nom du workspace"
                style={styles.input}
                value={name}
                onChangeText={setName}
              />
              <View style={styles.visibilityContainer}>
                <Text style={styles.label}>Visibilité :</Text>
                <TouchableOpacity
                  style={[
                    styles.visibilityOption,
                    visibility === "Public" && styles.activeOption,
                  ]}
                  onPress={() => setVisibility("Public")}
                >
                  <Text style={styles.optionText}>Public</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.visibilityOption,
                    visibility === "Private" && styles.activeOption,
                  ]}
                  onPress={() => setVisibility("Private")}
                >
                  <Text style={styles.optionText}>Private</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancel} onPress={onClose}>
                  <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirm}
                  onPress={createWorkspace}
                  disabled={loading || uploadingImage}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.confirmText}>
                    {loading ? "Création..." : "Créer"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* JOIN */}
          {tab === "join" && (
            <View style={{ flex: 1, minHeight: 300 }}>
              <Text style={styles.title}>Workspaces publics disponibles</Text>
              {loadingJoinList ? (
                <ActivityIndicator size="large" style={{ marginVertical: 20 }} />
              ) : available.length === 0 ? (
                <Text style={{ color: "#999", marginVertical: 16, textAlign: "center" }}>
                  Aucun workspace public trouvé。
                </Text>
              ) : (
                <ScrollView style={{ maxHeight: 290 }}>
                  {available.map((ws) => (
                    <TouchableOpacity
                      key={ws.id}
                      style={styles.wsItem}
                      onPress={() => handleJoin(ws)}
                    >
                      <Image
                        source={{ uri:
                            ws.image ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(ws.name)}`
                        }}
                        style={styles.wsAvatar}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.wsName}>{ws.name}</Text>
                        <Text style={styles.wsVisibility}>{ws.visibilityLocalized || ws.visibility}</Text>
                      </View>
                      <Ionicons name="arrow-forward" size={20} color="#4F8CFF" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancel} onPress={onClose}>
                  <Text style={styles.cancelText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default CreateWorkspaceModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#0006",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "93%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 10,
    minHeight: 280,
    maxHeight: 480,
  },
  modalJoin: {
    minHeight: 400,
    maxHeight: 650,
  },
  tabs: {
    flexDirection: "row",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderColor: "#eee",
    flexWrap: "nowrap",
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    flexWrap: "nowrap",
  },
  tabText: {
    fontSize: 15,
    color: "#777",
    fontWeight: "600",
    textAlign: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderColor: "#4F8CFF",
  },
  activeTabText: {
    color: "#4F8CFF",
  },
  title: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  imagePicker: {
    alignSelf: "center",
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    color: "#000",
  },
  visibilityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  label: {
    fontWeight: "600",
    color: "#000",
  },
  visibilityOption: {
    borderWidth: 1,
    borderColor: "#000",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 3,
  },
  activeOption: {
    backgroundColor: "#6B8AFD",
    borderColor: "#6B8AFD",
  },
  optionText: {
    color: "#000",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  cancel: {
    padding: 10,
  },
  cancelText: {
    color: "#999",
    fontWeight: "600",
  },
  confirm: {
    flexDirection: "row",
    backgroundColor: "#6B8AFD",
    borderRadius: 6,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  confirmText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 6,
  },
  wsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    backgroundColor: "#f3f7ff",
    borderRadius: 8,
    marginBottom: 9,
    gap: 13,
  },
  wsAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: "#eee",
  },
  wsName: {
    fontWeight: "600",
    color: "#222",
    fontSize: 15,
  },
  wsVisibility: {
    fontSize: 12,
    color: "#666",
  },
});
