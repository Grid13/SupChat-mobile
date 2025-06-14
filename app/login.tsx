import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import { loginSuccess } from "./store/authSlice";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import dotenv from 'dotenv';

const ipAddress = process.env.EXPO_PUBLIC_IP_ADDRESS;
WebBrowser.maybeCompleteAuthSession();

const Login = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [email, setEmail] = useState("admin@supchat.com");
  const [password, setPassword] = useState("Soleil123!");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      const formBody = new URLSearchParams();
      formBody.append("email", email);
      formBody.append("password", password);
      formBody.append("grant_type", "password");
      console.log("IP Address:", ipAddress);
      const response = await fetch("http://"+ipAddress+":5263/api/Authorization/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "text/plain",
        },
        body: formBody.toString(),
      });

      const text = await response.text();

      if (!response.ok) throw new Error("Server error: " + response.status);

      const data = JSON.parse(text);
      const token = data?.accessToken;

      if (token) {
        dispatch(loginSuccess({ user: { email }, token }));
        router.push("/(tabs)/Chat");
      } else {
        throw new Error("Invalid credentials.");
      }
    } catch (error: any) {
      Alert.alert("Login Error", error.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubRedirectLogin = async () => {
    try {
      const redirectUri = Linking.createURL("ChatList");
      const loginUrl = `http://`+ipAddress+`:5263/api/Authorization/login/github?returnUrl=${encodeURIComponent(
        redirectUri
      )}`;

      const result = await WebBrowser.openAuthSessionAsync(loginUrl, redirectUri);

      if (result.type === "success" && result.url) {
      const url = new URL(result.url);
      
      // Log the full URL to debug
      console.log("Full redirect URL:", result.url);
      console.log("Search params:", url.searchParams.toString());
      console.log("Hash:", url.hash);
      
      const token = url.searchParams.get("ACCESS_TOKEN");

        // const url = new URL(result.url);
        // const token = url.searchParams.get("ACCESS_TOKEN") || url.hash.split("=")[1];
        if (token) {
          dispatch(loginSuccess({ user: { email: "github_user" }, token }));
          router.push("/(tabs)/Chat");
        } else {
          Alert.alert("GitHub Login", "No token found in response.");
        }
      } else {
        Alert.alert("GitHub Login", "Authentication cancelled or failed.");
      }
    } catch (error: any) {
      Alert.alert("GitHub Auth Error", error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back ! 👋</Text>
        <Text style={styles.subtitle}>Please enter your login informations</Text>

        <View style={styles.switchContainer}>
          <TouchableOpacity style={styles.switchButton}>
            <Text style={styles.activeSwitchText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.switchButton} onPress={() => router.push("/register")}>
            <Text style={styles.switchText}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <View style={styles.rememberRow}>
          <Switch value={remember} onValueChange={setRemember} />
          <Text style={styles.rememberText}>Remember me</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
          <Text style={styles.primaryButtonText}>{loading ? "Loading..." : "CONTINUE"}</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.orText}>Or Connect With</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialButton} onPress={handleGitHubRedirectLogin}>
            <Image
              source={{ uri: "https://img.icons8.com/ios-filled/50/github.png" }}
              style={styles.socialIcon}
            />
            <Text style={styles.socialText}>GitHub</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#E9EBF0",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },
  switchContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F1F1",
    borderRadius: 8,
    marginBottom: 20,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  activeSwitchText: {
    color: "#000",
    fontWeight: "700",
  },
  switchText: {
    color: "#999",
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  rememberText: {
    color: "#000",
  },
  primaryButton: {
    backgroundColor: "#6B8AFD",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#ccc",
  },
  orText: {
    marginHorizontal: 10,
    color: "#999",
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  socialButton: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    gap: 6,
    flex: 1,
  },
  socialIcon: {
    width: 20,
    height: 20,
  },
  socialText: {
    color: "#000",
    fontWeight: "600",
  },
});
