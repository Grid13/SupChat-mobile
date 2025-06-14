import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import dotenv from 'dotenv';

const ipAddress = process.env.EXPO_PUBLIC_IP_ADDRESS;


type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
  workspaceId: number;
};

const CreateChannelModal: React.FC<Props> = ({ visible, onClose, onCreated, workspaceId }) => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<"Public" | "Private">("Public");
  const [loading, setLoading] = useState(false);

  const createChannel = async () => {
    if (!name.trim()) return Alert.alert("Champ requis", "Le nom est obligatoire");

    try {
      setLoading(true);

      const response = await fetch(`http://`+ipAddress+`:5263/api/Workspace/${workspaceId}/Channels`, {
        method: "POST",
        headers: {
          Accept: "text/plain",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim(), visibility }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Erreur réseau");
      }
      Alert.alert("Succès ✅", "Channel créé !");
      setName("");
      setVisibility("Public");
      onCreated();
      onClose();
    } catch (err: any) {
      Alert.alert("Erreur", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Nouveau Channel</Text>

          <TextInput
            placeholder="Nom du channel"
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

            <TouchableOpacity style={styles.confirm} onPress={createChannel} disabled={loading}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.confirmText}>{loading ? "Création..." : "Créer"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CreateChannelModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#0006",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
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
});
