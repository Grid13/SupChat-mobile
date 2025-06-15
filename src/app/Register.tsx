import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import dotenv from "dotenv";
import { loginSuccess } from "./store/authSlice";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

const ipAddress = process.env.EXPO_PUBLIC_IP_ADDRESS;
WebBrowser.maybeCompleteAuthSession();

const Register = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmError, setConfirmError] = useState(false);
  const [errors, setErrors] = useState({ userName: "", email: "", password: "", confirm: "" });

  useEffect(() => {
    setUserName("");
    setEmail("");
    setPassword("");
    setConfirm("");
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateFields = () => {
    const newErrors = { userName: "", email: "", password: "", confirm: "" };

    if (!userName) newErrors.userName = "Le nom d'utilisateur est requis.";
    if (!email) {
      newErrors.email = "L'email est requis.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "L'email n'est pas valide.";
    }
    if (!password) {
      newErrors.password = "Le mot de passe est requis.";
    } else if (password.length < 8 || !/[A-Z]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères, une majuscule et un caractère spécial.";
    }
    if (!confirm) {
      newErrors.confirm = "La confirmation du mot de passe est requise.";
    } else if (password !== confirm) {
      newErrors.confirm = "Les mots de passe ne correspondent pas.";
    }

    setErrors(newErrors);

    return Object.values(newErrors).every((error) => error === "");
  };

  const handleRegister = async () => {
    setErrorMessage("");
    setEmailError(false);
    setPasswordError(false);
    setConfirmError(false);

    const newErrors = { userName: "", email: "", password: "", confirm: "" };

    if (!userName) newErrors.userName = "Le nom d'utilisateur est requis.";
    if (!email) newErrors.email = "L'email est requis.";
    if (!password) newErrors.password = "Le mot de passe est requis.";
    if (!confirm) newErrors.confirm = "La confirmation du mot de passe est requise.";

    setErrors(newErrors);

    if (!validateFields()) return;

    try {
      const body = {
        userName: userName,
        email: email,
        password: password,
      };

      const response = await fetch(`http://${ipAddress}:5263/api/Account/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.status === 201 || (response.ok && (await response.text()) === "true")) {
        const formBody = new URLSearchParams();
        formBody.append("email", email);
        formBody.append("password", password);
        formBody.append("grant_type", "password");

        const loginResponse = await fetch(`http://${ipAddress}:5263/api/Authorization/Login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "text/plain",
          },
          body: formBody.toString(),
        });

        const loginText = await loginResponse.text();

        if (!loginResponse.ok) throw new Error("Échec de la connexion après l'inscription.");

        const loginData = JSON.parse(loginText);
        const token = loginData?.accessToken;

        if (token) {
          dispatch(loginSuccess({ user: { email }, token }));
          router.push("/(tabs)/Chat");
        } else {
          throw new Error("Échec de la récupération du token après l'inscription.");
        }
      } else if (response.status === 409) {
        const errorData = await response.json();
        setErrorMessage(errorData.detail || "Une erreur est survenue.");
      } else {
        const errorText = await response.text();
        Alert.alert("Erreur d'inscription", errorText || "Une erreur est survenue.");
      }
    } catch (error) {
      Alert.alert("Erreur", "Une erreur est survenue lors de l'inscription.");
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
        <Text style={styles.title}>Create Account 🚀</Text>
        <Text style={styles.subtitle}>Please enter your information</Text>
        <View style={styles.switchContainer}>
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => router.push("/Login")}
          >
            <Text style={styles.switchText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.switchButton}>
            <Text style={styles.activeSwitchText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={[styles.input, errors.userName ? { borderColor: "red" } : {}]}
          placeholder="Username"
          value={userName}
          autoCapitalize="none"
          onChangeText={(text) => {
            setUserName(text);
            setErrors((prev) => ({ ...prev, userName: "" }));
          }}
        />
        {errors.userName && <Text style={styles.errorText}>{errors.userName}</Text>}

        <TextInput
          style={[styles.input, errors.email ? { borderColor: "red" } : {}]}
          placeholder="Email"
          value={email}
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={(text) => {
            setEmail(text);
            setErrors((prev) => ({ ...prev, email: "" }));
          }}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        <TextInput
          style={[styles.input, errors.password ? { borderColor: "red" } : {}]}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setErrors((prev) => ({ ...prev, password: "" }));
          }}
        />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

        <TextInput
          style={[styles.input, errors.confirm ? { borderColor: "red" } : {}]}
          placeholder="Confirm Password"
          secureTextEntry
          value={confirm}
          onChangeText={(text) => {
            setConfirm(text);
            setErrors((prev) => ({ ...prev, confirm: "" }));
          }}
        />
        {errors.confirm && <Text style={styles.errorText}>{errors.confirm}</Text>}

        <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
          <Text style={styles.primaryButtonText}>CREATE ACCOUNT</Text>
        </TouchableOpacity>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

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

export default Register;

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
    fontSize: 12,
    marginBottom: 8,
  },
});
