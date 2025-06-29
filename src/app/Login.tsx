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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    setErrorMessage("");
    setEmailError(false);
    setPasswordError(false);

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      setEmailError(!email);
      setPasswordError(!password);
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage("Please enter a valid email address.");
      setEmailError(true);
      return;
    }

    try {
      setLoading(true);

      const formBody = new URLSearchParams();
      formBody.append("email", email);
      formBody.append("password", password);
      formBody.append("grant_type", "password");
      const response = await fetch(`http://${ipAddress}:5263/api/Authorization/Login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: formBody.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.detail || "Unexpected error");
        return;
      }

      const token = data?.accessToken;

      if (token) {
        dispatch(loginSuccess({ user: { email }, token }));
        router.push("/(tabs)/Chat");
      } else {
        setErrorMessage("Invalid credentials.");
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubRedirectLogin = async () => {
    try {
      const redirectUri = Linking.createURL("ChatList");
      const loginUrl = `http://${ipAddress}:5263/api/Authorization/login/github?returnUrl=${encodeURIComponent(
        redirectUri
      )}`;

      const result = await WebBrowser.openAuthSessionAsync(loginUrl, redirectUri);

      if (result.type === "success" && result.url) {
      const url = new URL(result.url);
      
      const token = url.searchParams.get("ACCESS_TOKEN");
        if (token) {
          dispatch(loginSuccess({ user: { email: "github_user" }, token }));
          router.push("/(tabs)/Chat");
        } else {
          setErrorMessage("No token found in response.");
        }
      } else {
        setErrorMessage("Authentication cancelled or failed.");
      }
    } catch (error: any) {
      setErrorMessage(error.message);
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
          <TouchableOpacity style={styles.switchButton} onPress={() => router.push("/Register")}>
            <Text style={styles.switchText}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={[styles.input, emailError && styles.inputError]}
          placeholder="Email"
          value={email}
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
        />
        <TextInput
          style={[styles.input, passwordError && styles.inputError]}
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

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

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
  inputError: {
    borderColor: "red",
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
  errorText: {
    color: "red",
    marginBottom: 12,
    textAlign: "center",
  },
});
