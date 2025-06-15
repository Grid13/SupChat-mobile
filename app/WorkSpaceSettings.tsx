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
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "./store/store";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { useProfileImage } from "./hooks/useProfileImage";
import optionsSections from "./Permission"; // Ensure permissions are imported
import { Picker } from "@react-native-picker/picker"; // Import Picker
import axios from 'axios';
import dotenv from 'dotenv';
const ipAddress = process.env.EXPO_PUBLIC_IP_ADDRESS;




type Workspace = {
  id: number;
  name: string;
  description: string;
  visibility: "Public" | "Private";
};

type Role = {
  id: number;
  name: string;
  hierarchy: number;
  workspaceId: number;
};

type PermissionOption = {
  key: string;
  label: string;
  description: string;
  permission: number | number[];
};

type PermissionSection = {
  title: string;
  options: PermissionOption[];
};

type RoleMember = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  status: string;
  statusLocalized: string;
  theme: string;
  themeLocalized: string;
  language: string;
  languageLocalized: string;
  profilePictureId: string;
};

type Permission = {
  id: number;
  workspaceRoleId: number;
  permissionId: number;
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
  const [roles, setRoles] = useState<Role[]>([]);
  const [newRole, setNewRole] = useState<Role>({
    id: 0,
    name: '',
    hierarchy: 0,
    workspaceId: Number(id),
  });
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [roleMembers, setRoleMembers] = useState<RoleMember[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [newMembers, setNewMembers] = useState<number[]>([]);
  const [nonMembers, setNonMembers] = useState<RoleMember[]>([]);
  const [editRoleModalVisible, setEditRoleModalVisible] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);
  const [editedRoleName, setEditedRoleName] = useState<string>("");
  const [editedPermissions, setEditedPermissions] = useState<number[]>([]);
  const [selectedPermission, setSelectedPermission] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `http://${ipAddress}:5263/api/Workspace/${id}`,
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
          setImageUri(`http://${ipAddress}:5263/api/Attachment/${data.profilePictureId}`);
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
        const uploadUrl = 'http://'+ipAddress+':5263/api/Attachment?attachmentType=ProfilePicture';
        console.log("Uploading image to Attachment endpoint...", uploadUrl);
        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers:
           {
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
          const patchUrl = `http://${ipAddress}:5263/api/Workspace/${id}/ProfilePicture`;
          console.log("Patching workspace profile picture:", patchUrl, "with attachmentId:", data.id);
          const patchRes = await fetch(
            patchUrl,
            {
              method: "PATCH",
              headers:
               {
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
          setImageUri(`http://${ipAddress}:5263/api/Attachment/${data.id}`);
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
        `http://${ipAddress}:5263/api/Workspace/${id}`,
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
      Alert.alert("Erreur", err instanceof Error ? err.message : "Une erreur inconnue s'est produite");
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
        `http://${ipAddress}:5263/api/Workspace/${id}`,
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

  // Fetch roles on component mount
  useEffect(() => {
    console.log('Fetching roles for workspaceId:', id); // Log workspace ID
    (async () => {
      try {
        const res = await fetch(`http://${ipAddress}:5263/api/Workspace/${id}/Roles`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data: Role[] = await res.json();
        console.log('Roles fetched successfully:', data); // Log fetched roles
        setRoles(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error('Failed to fetch roles:', errorMessage); // Log error
        Alert.alert("Erreur", errorMessage || "Impossible de charger les rôles");
      }
    })();
  }, [id, token]);

  const addRole = async () => {
    try {
      const res = await fetch(`http://${ipAddress}:5263/api/Workspace/${id}/Roles`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newRole),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data: Role = await res.json();
      setRoles((prevRoles) => [...prevRoles, data]);
      setNewRole({ id: 0, name: '', hierarchy: 0, workspaceId: Number(id) });
      Alert.alert("Succès", "Rôle ajouté avec succès");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      Alert.alert("Erreur", errorMessage || "Impossible d'ajouter le rôle");
    }
  };

  const togglePermission = (permission: number | number[]) => {
    if (Array.isArray(permission)) {
      setSelectedPermissions((prev) => {
        const newPermissions = permission.filter((p) => !prev.includes(p));
        return [...prev.filter((p) => !permission.includes(p)), ...newPermissions];
      });
    } else {
      setSelectedPermissions((prev) => {
        if (prev.includes(permission)) {
          return prev.filter((p) => p !== permission);
        } else {
          return [...prev, permission];
        }
      });
    }
  };

  const isPermissionSelected = (permission: number | number[]) => {
    if (Array.isArray(permission)) {
      return permission.every((p) => selectedPermissions.includes(p));
    }
    return selectedPermissions.includes(permission);
  };

  const fetchRoleMembers = async (roleId: number) => {
    try {
      const res = await fetch(
        `http://${ipAddress}:5263/api/Workspace/${workspace.id}/Roles/${roleId}/Members`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setRoleMembers(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      Alert.alert("Erreur", errorMessage || "Impossible de charger les membres du rôle");
    }
  };

  const fetchNonMembers = async (roleId: number) => {
    try {
      const res = await fetch(
        `http://${ipAddress}:5263/api/Workspace/${workspace.id}/Roles/${roleId}/NonMembers`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setNonMembers(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      Alert.alert("Erreur", errorMessage || "Impossible de charger les non-membres du rôle");
    }
  };

  const assignRoleToMembers = async (roleId: number, members: number[]) => {
    if (!roleId || members.length === 0) return;

    try {
      const requestBody = { members };
      const requestUrl = `http://${ipAddress}:5263/api/Workspace/${workspace.id}/Roles/${roleId}/Members`;

      const res = await fetch(requestUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Erreur ${res.status}`);
      }

      Alert.alert("Succès", "Rôle assigné aux membres avec succès");
      await fetchRoleMembers(roleId);
      await fetchNonMembers(roleId);
    } catch (err) {
      Alert.alert("Erreur", err instanceof Error ? err.message : "Une erreur inconnue s'est produite");
    }
  };

  const handleAddMember = (memberId: number) => {
    if (!selectedRoleId) return;

    setNewMembers((prev) => {
      const updatedMembers = [...prev, memberId];
      assignRoleToMembers(selectedRoleId, updatedMembers); // Trigger role assignment after state update
      return updatedMembers;
    });

    setNonMembers((prev) => prev.filter((nm) => nm.id !== memberId));
  };

  const removeRoleFromMember = async (memberId: number) => {
    if (!selectedRoleId) return;
    try {
      const requestUrl = `http://${ipAddress}:5263/api/Workspace/${workspace.id}/Roles/${selectedRoleId}/Members/${memberId}`;

      console.log("Request URL:", requestUrl);

      const res = await fetch(requestUrl, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("DELETE response status", res.status);

      if (!res.ok) throw new Error(`Erreur ${res.status}`);

      Alert.alert("Succès", "Rôle retiré du membre avec succès");
      fetchRoleMembers(selectedRoleId); // Refresh members list
      fetchNonMembers(selectedRoleId); // Refresh non-members list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      Alert.alert("Erreur", errorMessage || "Impossible de retirer le rôle");
    }
  };

  const toggleEditedPermission = (permission: number | number[]) => {
    if (Array.isArray(permission)) {
      setEditedPermissions((prev) => {
        const newPermissions = permission.filter((p) => !prev.includes(p));
        return [...prev.filter((p) => !permission.includes(p)), ...newPermissions];
      });
    } else {
      setEditedPermissions((prev) =>
        prev.includes(permission)
          ? prev.filter((p) => p !== permission)
          : [...prev, permission]
      );
    }
  };

  const addPermission = () => {
    if (selectedPermission && !editedPermissions.includes(selectedPermission)) {
      setEditedPermissions((prev) => [...prev, selectedPermission]);
      setSelectedPermission(null); // Reset dropdown after adding
    }
  };

  const updateRolePermissions = async () => {
    if (!roleToEdit) return;

    try {
      const res = await fetch(
        `http://${ipAddress}:5263/api/Workspace/${workspace.id}/Roles/${roleToEdit.id}`,
        {
          method: "PATCH",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editedRoleName,
            hierarchy: roleToEdit.hierarchy,
            permissionsIds: editedPermissions,
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Erreur ${res.status}`);
      }

      const updatedRole = await res.json();
      setRoles((prevRoles) =>
        prevRoles.map((r) => (r.id === roleToEdit.id ? updatedRole : r))
      );
      setEditRoleModalVisible(false);
      Alert.alert("Succès", "Rôle mis à jour avec succès");
    } catch (err) {
      Alert.alert("Erreur", err instanceof Error ? err.message : "Une erreur inconnue s'est produite");
    }
  };

  // Fetch permissions for a role
  const fetchRolePermissions = async (workspaceId: number, roleId: number) => {
    try {
      const res = await fetch(
        `http://${ipAddress}:5263/api/Workspace/${workspaceId}/Roles/${roleId}/Permissions`,
        {
          headers: {
            Accept: "text/plain",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      return data.map((permission: { permissionId: number }) => permission.permissionId);
    } catch (err) {
      Alert.alert("Erreur", err instanceof Error ? err.message : "Impossible de charger les permissions du rôle");
      return [];
    }
  };

  // Preselect permissions when opening the edit role modal
  const openEditRoleModal = async (roleId: number) => {
    if (!roleId) {
      console.error("Invalid roleId provided:", roleId);
      return;
    }
    try {
      const preselectedPermissions = await fetchRolePermissions(Number(id), roleId);
      setEditedPermissions(preselectedPermissions); // Preselect permissions
      setRoleToEdit(roles.find((role) => role.id === roleId) || null); // Set role to edit
      setEditedRoleName(roles.find((role) => role.id === roleId)?.name || ""); // Set role name
      setSelectedRoleId(roleId);
      setEditRoleModalVisible(true);
    } catch (err) {
      console.error("Failed to fetch permissions for role:", err);
    }
  };

  // Render permissions in the modal
  const renderPermissions = () => {
    return optionsSections.map((section) => (
      <View key={section.title} style={styles.permissionSection}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        {section.options.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.permissionOption,
              Array.isArray(option.permission)
                ? option.permission.every((p) => editedPermissions.includes(p)) && styles.permissionOptionActive
                : editedPermissions.includes(option.permission) && styles.permissionOptionActive,
            ]}
            onPress={() => toggleEditedPermission(option.permission)}
          >
            <Text
              style={[
                styles.permissionOptionText,
                (Array.isArray(option.permission)
                  ? option.permission.every((p) => editedPermissions.includes(p))
                  : editedPermissions.includes(option.permission)) && { color: "#000" },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    ));
  };

  const handleEditRole = (roleId: number) => {
    if (!roleId) {
        console.error('Invalid roleId provided:', roleId); // Log invalid roleId
        return;
    }
    console.log('Handle edit role for roleId:', roleId); // Log roleId
    setSelectedRoleId(roleId); // Set the selected role ID
    setEditRoleModalVisible(true); // Open the modal
};

  // Ensure roles are displayed correctly and allow selection
  const renderRoles = () => {
    if (roles.length === 0) {
        console.log('No roles available to render'); // Log if no roles are available
        return <Text style={styles.label}>Aucun rôle disponible</Text>;
    }
    console.log('Rendering roles:', roles); // Log roles being rendered
    return roles.map((role) => (
        <TouchableOpacity
            key={role.id}
            style={[
                styles.option,
                selectedRoleId === role.id && styles.optionActive,
            ]}
            onPress={() => {
                console.log('Role selected:', role); // Log selected role
                setSelectedRoleId(role.id);
                fetchRoleMembers(role.id);
                fetchNonMembers(role.id);
            }}
        >
            <Text style={styles.optionText}>{role.name}</Text>
        </TouchableOpacity>
    ));
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
          <TouchableOpacity onPress={pickImage} style={styles.logoWrapper} disabled={loading}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoPlaceholder]} />
            )
            }
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

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Rôles</Text>
          {roles.map((role) => (
            <View key={role.id} style={styles.roleItem}>
              <Text style={styles.roleName}>{role.name}</Text>
              <Text style={styles.roleHierarchy}>Hiérarchie: {role.hierarchy}</Text>
              <TouchableOpacity
                style={styles.editIcon}
                onPress={() => {
                  setRoleToEdit(role);
                  setEditedRoleName(role.name);
                  setEditRoleModalVisible(true);
                }}
              >
                <MaterialIcons name="edit" size={20} color="#4F8CFF" />
              </TouchableOpacity>
            </View>
          ))}
          <TextInput
            style={styles.input}
            placeholder="Nom du rôle"
            value={newRole.name}
            onChangeText={(text) => setNewRole((prev) => ({ ...prev, name: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Hiérarchie"
            keyboardType="numeric"
            value={newRole.hierarchy ? newRole.hierarchy.toString() : ''}
            onChangeText={(text) => {
              const parsedValue = parseInt(text, 10);
              setNewRole((prev) => ({ ...prev, hierarchy: isNaN(parsedValue) ? 0 : parsedValue }));
            }}
          />
          <TouchableOpacity style={styles.button} onPress={addRole}>
            <Text style={styles.buttonText}>Ajouter un rôle</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Assignation de rôles</Text>
          <Text style={styles.label}>Sélectionner un rôle</Text>
          {renderRoles()}
          {selectedRoleId && (
            <View>
              <Text style={styles.label}>Non-membres disponibles</Text>
              {nonMembers.map((nonMember) => (
                <View key={nonMember.id} style={styles.memberItem}>
                  <Text>{nonMember.username}</Text>
                  <TouchableOpacity
                    style={styles.addButton} // New button style
                    onPress={() => {
                      setNewMembers((prev) => {
                        const updatedMembers = [...prev, nonMember.id];
                        assignRoleToMembers(selectedRoleId!, updatedMembers); // Pass roleId and updatedMembers
                        return updatedMembers;
                      });
                      setNonMembers((prev) => prev.filter((nm) => nm.id !== nonMember.id));
                    }}
                  >
                    <Text style={styles.addButtonText}>Ajouter</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <Text style={styles.label}>Membres du rôle</Text>
              {roleMembers.map((member) => (
                <View key={member.id} style={styles.memberItem}>
                  <Text>{member.username}</Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => {
                      removeRoleFromMember(member.id);
                      setRoleMembers((prev) => prev.filter((m) => m.id !== member.id));
                    }}
                  >
                    <Text style={styles.removeButtonText}>Retirer</Text>
                  </TouchableOpacity>
                </View>
              ))}

            </View>
          )}
        </View>

        <Modal
          visible={editRoleModalVisible}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.smallModalContent}>
              <ScrollView contentContainerStyle={styles.scrollableModal}>
                <Text style={styles.modalTitle}>Modifier le rôle</Text>
                <TextInput
                  style={styles.input}
                  value={editedRoleName}
                  onChangeText={setEditedRoleName}
                  placeholder="Nom du rôle"
                />
                {renderPermissions()}
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={updateRolePermissions}
                >
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => setEditRoleModalVisible(false)}
                >
                  <Text style={styles.deleteButtonText}>Annuler</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  sectionContainer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  roleItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  roleName: {
    fontSize: 16,
    fontWeight: "600",
  },
  roleHierarchy: {
    fontSize: 14,
    color: "#666",
  },
  editIcon: {
    marginLeft: "auto",
    backgroundColor: "#E0E0E0",
    borderRadius: 12,
    padding: 4,
  },
  memberItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  removeButton: {
    backgroundColor: "#FF4D4F",
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginLeft: "auto",
    alignSelf: "center", // Adjusted alignment to center vertically
  },
  removeButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  addButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginLeft: "auto",
    alignSelf: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  modalContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  smallModalContent: {
    width: "90%",
    maxHeight: "70%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
    elevation: 5,
  },
  scrollableModal: {
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  permissionSection: {
    marginBottom: 16,
  },
  permissionOption: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#6B8AFD",
    borderRadius: 6,
    marginBottom: 8,
  },
  permissionOptionActive: {
    backgroundColor: "#6B8AFD",
  },
  permissionOptionText: {
    color: "#6B8AFD",
    fontWeight: "600",
  },
  picker: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
  },
  permissionList: {
    marginTop: 16,
  },
  permissionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  permissionText: {
    flex: 1,
    fontSize: 14,
  },
  actionText: {
    color: "#4F8CFF",
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 16,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});