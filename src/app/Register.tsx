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

const ipAddress = process.env.EXPO_PUBLIC_IP_ADDRESS;

const Register = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    // Generate random values for testing
    const randomUserName = `user_${Math.floor(Math.random() * 10000)}`;
    const randomEmail = `test_${Math.floor(Math.random() * 10000)}@example.com`;
    const randomPassword = `Pass${Math.floor(Math.random() * 10000)}!`;

    console.log("Generated random values:");
    console.log("Username:", randomUserName);
    console.log("Email:", randomEmail);
    console.log("Password:", randomPassword);

    setUserName(randomUserName);
    setEmail(randomEmail);
    setPassword(randomPassword);
    setConfirm(randomPassword);
  }, []);

  const handleRegister = async () => {
    // Vérification des champs requis
    if (!userName || !email || !password || !confirm) {
      Alert.alert("Champs manquants", "Veuillez remplir tous les champs.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Mot de passe différent", "Les mots de passe ne correspondent pas.");
      return;
    }

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

      console.log("Response status:", response.status);

      if (response.status === 201 || (response.ok && (await response.text()) === "true")) {
        // Automatically log in the user after successful registration
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
      } else {
        const errorText = await response.text();
        console.error("Erreur lors de l'inscription :", errorText);
        Alert.alert("Erreur d'inscription", errorText || "Une erreur est survenue.");
      }
    } catch (error) {
      console.error("Erreur lors de l'inscription :", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de l'inscription.");
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
          style={styles.input}
          placeholder="Username"
          value={userName}
          autoCapitalize="none"
          onChangeText={setUserName}
        />

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
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
          <Text style={styles.primaryButtonText}>CREATE ACCOUNT</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.orText}>Or Connect With</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialButton}>
            <Image
              source={{ uri: "https://img.icons8.com/color/48/google-logo.png" }}
              style={styles.socialIcon}
            />
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Image
              source={{ uri: "https://img.icons8.com/fluency/48/facebook-new.png" }}
              style={styles.socialIcon}
            />
            <Text style={styles.socialText}>Facebook</Text>
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
    justifyContent: "space-between",
    gap: 10,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    gap: 6,
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
