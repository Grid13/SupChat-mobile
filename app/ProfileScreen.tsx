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
} from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "./store/store";

const SettingsScreen = () => {
  const token = useSelector((state: RootState) => state.auth.token);

  const [profile, setProfile] = useState<any>(null);
  const [hideEmail, setHideEmail] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [disableNotif, setDisableNotif] = useState(false);

  const fetchProfile = async () => {
    if (!token) return;

    try {
      const response = await fetch("http://192.168.163.30:5263/api/Account/Me", {
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
      });
    } catch (err: any) {
      console.error("Failed to load profile:", err);
      Alert.alert("Error", err.message || "Unable to load profile");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  return (
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
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editText}>✏️ Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.subCard}>
          <Text style={[styles.label, { marginBottom: 10 }]}>Linked account</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity style={styles.googleBtn}>
              <Text style={styles.linkText}>🔗 Connect</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.githubBtn}>
              <Text style={styles.linkedText}>🟦 Linked</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ACTIONS */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Log Out ↩️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => Alert.alert("Confirm", "Delete your account?")}
        >
          <Text style={styles.deleteText}>🗑️ Delete Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
});
