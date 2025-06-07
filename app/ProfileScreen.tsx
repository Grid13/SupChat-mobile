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
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "./store/store";
import { logout } from "./store/authSlice";
import { useRouter } from "expo-router";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

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

  const fetchProfile = async () => {
    if (!token) return;

    try {
      const response = await fetch("http://192.168.1.10:5263/api/Account/Me", {
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
          json.applicationUser?.image ||
          "https://ui-avatars.com/api/?name=" +
            encodeURIComponent(json.applicationUser?.firstName || "User"),
        status: json.applicationUser?.statusLocalized || "Unknown",
        language: json.applicationUser?.languageLocalized || "English",
        theme: json.applicationUser?.themeLocalized || "Light",
        applicationUser: json.applicationUser, // <-- add this line
      });
    } catch (err: any) {
      console.error("Failed to load profile:", err);
      Alert.alert("Error", err.message || "Unable to load profile");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

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
      const response = await fetch(`http://192.168.1.10:5263/api/User/${userId}/Password`, {
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
      console.error("Failed to change password:", err);
      Alert.alert("Error", err.message || "Unable to change password");
    }
  };

  const handleExportData = async () => {
    if (!token) return;
    try {
      const downloadUrl = 'http://192.168.1.10:5263/api/User/Export';
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
      console.error('Export failed:', err);
      Alert.alert('Error', err.message || 'Failed to export data');
    }
  };

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
      <ScrollView contentContainerStyle={styles.container}>
        {/* PROFILE CARD */}
        <View style={styles.card}>
          <Image source={{ uri: profile?.image }} style={styles.avatar} />
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

        {/* ACTIONS */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => {
              dispatch(logout());
              router.replace("/login");
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
                  `http://192.168.1.10:5263/api/User/${userId}`,
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
                router.replace("/login");
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
    alignSelf: "center",
    marginBottom: 12,
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
  // New styles for centered modal
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
});
