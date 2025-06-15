
const ipAddress = process.env.EXPO_PUBLIC_IP_ADDRESS;

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "./store/store";
import { logout } from "./store/authSlice";
import { useRouter } from "expo-router";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';

const SettingsScreen = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [hideEmail, setHideEmail] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [disableNotif, setDisableNotif] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [uploading, setUploading] = useState(false);
  const [profileImageBase64, setProfileImageBase64] = useState<string | null>(null);
  const [ownedBots, setOwnedBots] = useState<any[]>([]);
  const [botNameModalVisible, setBotNameModalVisible] = useState(false);
  const [botName, setBotName] = useState('');
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [editedFirstName, setEditedFirstName] = useState(profile?.firstName || "");
  const [editedLastName, setEditedLastName] = useState(profile?.lastName || "");
  const [editedUsername, setEditedUsername] = useState(profile?.applicationUser?.username || "");
  const [editedLanguage, setEditedLanguage] = useState(profile?.language || "English");

  const fetchProfile = async () => {
    if (!token) return;

    try {
      const response = await fetch(`http://${ipAddress}:5263/api/Account/Me`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const json = await response.json();
      setProfile({
        email: json.email || "unknown@example.com",
        phone: json.phoneNumber || "Not provided",
        firstName: json.applicationUser?.firstName || "Unknown",
        lastName: json.applicationUser?.lastName || "-",
        image:
          json.applicationUser?.profilePictureId
            ? `http://${ipAddress}:5263/api/Attachment/${json.applicationUser.profilePictureId}`
            : "https://ui-avatars.com/api/?name=" +
              encodeURIComponent(json.applicationUser?.firstName || "User"),
        status: json.applicationUser?.statusLocalized || "Unknown",
        language: json.applicationUser?.languageLocalized || "English",
        theme: json.applicationUser?.themeLocalized || "Light",
        applicationUser: json.applicationUser,
      });
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to load profile");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  useEffect(() => {
    const fetchProfileImage = async () => {
      if (profile?.image && profile.image.startsWith('http://'+ipAddress+':5263/api/Attachment/')) {
        try {
          const res = await fetch(profile.image, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const blob = await res.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
              setProfileImageBase64(reader.result as string);
            };
            reader.readAsDataURL(blob);
          } else {
            setProfileImageBase64(null);
          }
        } catch (e) {
          setProfileImageBase64(null);
        }
      } else {
        setProfileImageBase64(null);
      }
    };
    fetchProfileImage();
  }, [profile?.image, token]);

  const handleChangePassword = async () => {
    if (!token) return;
    if (newPassword !== confirmNewPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }
    const userId = profile?.applicationUser?.id;
    if (!userId) {
      return Alert.alert("Error", "User ID not found");
    }
    try {
      const response = await fetch(`http://${ipAddress}:5263/api/User/${userId}/Password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });
      if (!response.ok) throw new Error(`Error ${response.status}`);
      Alert.alert("Success", "Password changed successfully");
      setShowPasswordModal(false);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to change password");
    }
  };

  const handleExportData = async () => {
    if (!token) return;
    try {
      const downloadUrl = 'http://'+ipAddress+':5263/api/User/Export';
      const fileUri = FileSystem.documentDirectory + 'export-user-data.zip';
      const response = await FileSystem.downloadAsync(downloadUrl, fileUri, {
        headers: {
          Accept: '*/*',
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status !== 200) throw new Error('Failed to download export file');
      Alert.alert('Success', 'Your data has been exported.');
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(response.uri);
      } else {
        Alert.alert('File saved', `File saved to: ${response.uri}`);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to export data');
    }
  };

  const handlePickProfileImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setUploading(true);
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop() || 'profile.jpg';
        const formData = new FormData();
        formData.append('file', {
          uri,
          name: filename,
          type: 'image/jpeg',
        } as any);
        const res = await fetch('http://'+ipAddress+':5263/api/Attachment?attachmentType=ProfilePicture', {
          method: 'POST',
          headers: {
            Accept: 'text/plain',
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        const imageUrl = `http://${ipAddress}:5263/api/Attachment/${data.id}`;
        const userId = profile?.applicationUser?.id;
        if (userId && data.id) {
          const patchRes = await fetch(`http://${ipAddress}:5263/api/User/${userId}/ProfilePicture`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ attachmentId: data.id }),
          });
          if (!patchRes.ok) {
            Alert.alert('Error', 'Failed to update profile picture on server');
          }
        }
        setProfile((p: any) => {
          const next = { ...p, image: imageUrl };
          return next;
        });
        await fetchProfile();
        Alert.alert('Success', 'Profile picture updated!');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile picture');
    } finally {
      setUploading(false);
    }
  };

  const fetchOwnedBots = async () => {
    if (!token) return;
    try {
      const response = await fetch(`http://${ipAddress}:5263/api/Bot/GetOwnedBots`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const json = await response.json();
      setOwnedBots(json);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to load bots");
    }
  };

  const fetchBotDetails = async (botId: number) => {
    if (!token) return;
    try {
      const response = await fetch(`http://${ipAddress}:5263/api/Bot/${botId}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const json = await response.json();
      Alert.alert("Bot Details", `Client ID: ${json.clientId}\nClient Secret: ${json.clientSecret}`);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to fetch bot details");
    }
  };

  const deleteBot = async (botId: number) => {
    if (!token) return;
    const confirm = await new Promise(resolve => {
      Alert.alert(
        "Confirm",
        "Are you sure you want to delete this bot? This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
          { text: "Delete", style: "destructive", onPress: () => resolve(true) },
        ]
      );
    });
    if (!confirm) return;

    try {
      const response = await fetch(`http://${ipAddress}:5263/api/Bot/${botId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error(`Error ${response.status}`);
      Alert.alert("Success", "Bot deleted successfully");
      fetchOwnedBots();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to delete bot");
    }
  };

  const createBot = async (name: string) => {
    if (!token) return;
    try {
      const response = await fetch(`http://${ipAddress}:5263/api/Bot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error(`Error ${response.status}`);
      Alert.alert("Success", "Bot created successfully");
      setBotNameModalVisible(false);
      setBotName('');
      fetchOwnedBots();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to create bot");
    }
  };

  const handleEditProfile = async () => {
    if (!token) return;
    const userId = profile?.applicationUser?.id;
    if (!userId) {
      return Alert.alert("Error", "User ID not found");
    }
    try {
      const response = await fetch(`http://${ipAddress}:5263/api/User/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: editedFirstName,
          lastName: editedLastName,
          username: editedUsername,
          language: editedLanguage,
        }),
      });
      if (!response.ok) throw new Error(`Error ${response.status}`);
      Alert.alert("Success", "Profile updated successfully");
      setEditProfileModalVisible(false);
      fetchProfile();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to update profile");
    }
  };

  useEffect(() => {
    fetchOwnedBots();
  }, [token]);

  return (
    <View style={{ flex: 1 }}>
      {showPasswordModal && (
        <View style={styles.globalModalOverlay}>
          <View style={styles.blurBackground} />
          <View style={styles.securityModalCard}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              secureTextEntry
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]} onPress={handleChangePassword}>
                <Text style={styles.primaryButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.deleteBtn, { flex: 1 }]} onPress={() => setShowPasswordModal(false)}>
                <Text style={styles.deleteText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {editProfileModalVisible && (
        <Modal visible={editProfileModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.botNameModal}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TextInput
                style={styles.botNameInput}
                value={editedFirstName}
                onChangeText={setEditedFirstName}
                placeholder="First Name"
              />
              <TextInput
                style={styles.botNameInput}
                value={editedLastName}
                onChangeText={setEditedLastName}
                placeholder="Last Name"
              />
              <TextInput
                style={styles.botNameInput}
                value={editedUsername}
                onChangeText={setEditedUsername}
                placeholder="Username"
              />
              <TextInput
                style={styles.botNameInput}
                value={editedLanguage}
                onChangeText={setEditedLanguage}
                placeholder="Language"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setEditProfileModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.createButton]}
                  onPress={handleEditProfile}
                >
                  <Text style={styles.createButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      <ScrollView contentContainerStyle={styles.container}>
        {/* PROFILE CARD */}
        <View style={styles.card}>
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <TouchableOpacity onPress={handlePickProfileImage} disabled={uploading} style={{}}>
              {/* Use base64 image if available, else fallback to profile.image */}
              <View style={{ position: 'relative' }}>
                {profileImageBase64 ? (
                  <Image source={{ uri: profileImageBase64 }} style={styles.avatar} />
                ) : (
                  <Image source={{ uri: profile?.image }} style={styles.avatar} />
                )}
                {/* Black and white pencil icon in lower right, over the avatar */}
                <View style={styles.pencilIconAbsolute}>
                  <Image
                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/84/84380.png' }}
                    style={styles.pencilIcon}
                  />
                </View>
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>
            {profile?.firstName} {profile?.lastName}
          </Text>
          <Text style={styles.role}>{profile?.status}</Text>
          <Text style={styles.location}>{profile?.language}</Text>
        </View>

        {/* PERSONAL INFO */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {renderRow("Firstname", profile?.firstName)}
          {renderRow("Lastname", profile?.lastName)}
          {renderRow("Phone", profile?.phone)}
          {renderRow("Language", profile?.language)}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              setEditedFirstName(profile?.firstName || "");
              setEditedLastName(profile?.lastName || "");
              setEditedUsername(profile?.applicationUser?.username || "");
              setEditedLanguage(profile?.language || "English");
              setEditProfileModalVisible(true);
            }}
          >
            <Text style={styles.editText}>✏️ Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* CUSTOM INFO */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Custom Information</Text>
          {renderRow("Email", profile?.email)}
          {renderRow("Theme", profile?.theme)}
        </View>

        {/* NOTIFICATIONS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {renderSwitch("Disable notifications", disableNotif, setDisableNotif)}
          {renderSwitch("Push notifications", pushNotif, setPushNotif)}
          {renderSwitch("Email notifications", emailNotif, setEmailNotif)}
        </View>

        {/* SECURITY */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Security</Text>
          {renderSwitch("Hide email address", hideEmail, setHideEmail)}

          <View style={styles.subCard}>
            <View style={styles.row}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{profile?.email}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Password</Text>
              <Text style={styles.value}>********</Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowPasswordModal(true)}
            >
              <Text style={styles.editText}>✏️ Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BOT SECTION */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Owned Bots</Text>
          <TouchableOpacity 
            style={[styles.primaryButton, { marginBottom: 10 }]} 
            onPress={() => setBotNameModalVisible(true)}
          >
            <Text style={styles.primaryButtonText}>🤖 Add Bot</Text>
          </TouchableOpacity>
          {ownedBots.length > 0 ? (
            ownedBots.map((bot) => (
              <View key={bot.id} style={styles.row}>
                <Text style={styles.label}>{bot.userUsername}</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => fetchBotDetails(bot.id)}
                  >
                    <Text style={styles.primaryButtonText}>View Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteBot(bot.id)}
                    style={{ padding: 5 }}
                  >
                    <Image
                      source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1828/1828843.png' }}
                      style={styles.deleteIcon}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.value}>No bots found</Text>
          )}
        </View>
        {/* Bot name modal */}
        {botNameModalVisible && (
          <Modal visible={botNameModalVisible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.botNameModal}>
                <Text style={styles.modalTitle}>Name your bot</Text>
                <TextInput
                  style={styles.botNameInput}
                  value={botName}
                  onChangeText={setBotName}
                  placeholder="Enter bot name"
                  autoFocus
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setBotNameModalVisible(false);
                      setBotName('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.createButton]}
                    onPress={() => {
                      if (botName.trim()) {
                        createBot(botName.trim());
                      }
                    }}
                  >
                    <Text style={styles.createButtonText}>Create</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* ACTIONS */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => {
              dispatch(logout());
              router.replace("/Login");
            }}
          >
            <Text style={styles.logoutText}>Log Out ↩️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={async () => {
              const userId = profile?.applicationUser?.id;
              if (!userId) {
                Alert.alert("Error", "User ID not found");
                return;
              }
              const confirm = await new Promise(resolve => {
                Alert.alert(
                  "Confirm",
                  "Delete your account? This action cannot be undone.",
                  [
                    { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
                    { text: "Delete", style: "destructive", onPress: () => resolve(true) },
                  ]
                );
              });
              if (!confirm) return;
              try {
                const response = await fetch(
                  `http://${ipAddress}:5263/api/User/${userId}`,
                  {
                    method: "DELETE",
                    headers: {
                      Accept: "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );
                if (!response.ok) throw new Error(`Error ${response.status}`);
                dispatch(logout());
                router.replace("/Login");
              } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to delete account";
                Alert.alert("Error", message);
              }
            }}
          >
            <Text style={styles.deleteText}>🗑️ Delete Account</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleExportData}
          >
            <Text style={styles.primaryButtonText}>Export my data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const renderRow = (label: string, value: string) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const renderSwitch = (
  label: string,
  value: boolean,
  onValueChange: (val: boolean) => void
) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Switch value={value} onValueChange={onValueChange} trackColor={{ true: "#6B8AFD" }} />
  </View>
);

export default SettingsScreen;

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#F8F9FC" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  subCard: {
    backgroundColor: "#fdfdfd",
    borderRadius: 10,
    padding: 12,
    marginTop: 15,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  pencilIconAbsolute: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    zIndex: 10,
  },
  pencilIcon: {
    width: 20,
    height: 20,
    tintColor: '#000',
  },
  name: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 4 },
  role: { fontSize: 16, textAlign: "center", color: "#666" },
  location: { fontSize: 14, textAlign: "center", color: "#999", marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10, color: "#000" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    alignItems: "center",
  },
  label: { fontSize: 14, color: "#666" },
  value: { fontSize: 14, fontWeight: "600", color: "#000" },
  editButton: { alignSelf: "flex-end", marginTop: 10 },
  editText: { color: "#6B8AFD", fontWeight: "bold" },
  googleBtn: {
    padding: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
  },
  githubBtn: {
    padding: 8,
    backgroundColor: "#6B8AFD",
    borderRadius: 6,
  },
  linkText: { color: "#333", fontWeight: "600" },
  linkedText: { color: "#fff", fontWeight: "600" },
  actions: {
    marginTop: 10,
    gap: 10,
    alignItems: "center",
  },
  logoutBtn: {
    padding: 10,
    width: "100%",
    alignItems: "center",
  },
  logoutText: {
    color: "#6B8AFD",
    fontWeight: "600",
  },
  deleteBtn: {
    padding: 10,
    width: "100%",
    alignItems: "center",
  },
  deleteText: {
    color: "#e74c3c",
    fontWeight: "600",
  },
  securityModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  securityModalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    elevation: 6,
    alignItems: 'center',
    zIndex: 201,
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 199,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#000",
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
    width: "100%",
  },
  primaryButton: {
    backgroundColor: "#6B8AFD",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  globalModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  deleteIcon: {
    width: 20,
    height: 20,
    tintColor: '#e74c3c', 
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  botNameModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    elevation: 6,
    alignItems: 'center',
  },
  botNameInput: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
    width: "100%",
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
  },
  createButton: {
    backgroundColor: '#6B8AFD',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
