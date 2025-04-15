import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Switch, StyleSheet, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const handleLogin = () => {
    // Exemple de traitement
    router.push("/(tabs)/Chat");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome ! 👋</Text>
      <Text style={styles.subtitle}>Please enter your login informations</Text>

      <View style={styles.toggleContainer}>
        <TouchableOpacity style={styles.toggleActive}>
          <Text style={styles.toggleTextActive}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toggleInactive} onPress={() => router.push("/register")}>
          <Text style={styles.toggleTextInactive}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <View style={styles.rememberContainer}>
          <Switch value={remember} onValueChange={setRemember} />
          <Text style={styles.rememberText}>Remember me</Text>
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={handleLogin}>
          <Text style={styles.continueText}>CONTINUE</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.separatorContainer}>
        <View style={styles.separator} />
        <Text style={styles.orText}>Or Connect With</Text>
        <View style={styles.separator} />
      </View>

      <View style={styles.socialRow}>
        <TouchableOpacity style={styles.socialButton}>
          <Text>🟢 Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <Text>🔵 Facebook</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 50,
    minHeight: "100%",
  },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#888", marginBottom: 20, textAlign: "center" },
  toggleContainer: {
    flexDirection: "row", backgroundColor: "#eee", borderRadius: 10,
    marginBottom: 20, width: "100%", height: 45, overflow: "hidden",
  },
  toggleActive: { flex: 1, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  toggleInactive: { flex: 1, justifyContent: "center", alignItems: "center" },
  toggleTextActive: { fontWeight: "bold", color: "#000" },
  toggleTextInactive: { color: "#666" },
  form: { width: "100%" },
  input: {
    borderWidth: 1, borderColor: "#ccc", borderRadius: 6,
    paddingVertical: 10, paddingHorizontal: 12, fontSize: 16,
    marginBottom: 12, backgroundColor: "#fff",
  },
  rememberContainer: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  rememberText: { marginLeft: 10 },
  continueButton: {
    backgroundColor: "#6B8AFD", padding: 15, borderRadius: 8,
    width: "100%", alignItems: "center", marginTop: 10,
  },
  continueText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  separatorContainer: {
    flexDirection: "row", alignItems: "center", marginVertical: 15, width: "100%",
  },
  separator: { flex: 1, height: 1, backgroundColor: "#ccc" },
  orText: { marginHorizontal: 10, color: "#999" },
  socialRow: {
    flexDirection: "row", justifyContent: "space-between", width: "100%", gap: 10,
  },
  socialButton: {
    flex: 1, padding: 12, borderWidth: 1, borderColor: "#000",
    borderRadius: 6, alignItems: "center",
  },
});