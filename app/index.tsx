import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useForm } from "react-hook-form";
import Register from "./components/Register"; // Import du composant Register
import Login from "./components/Login"; // Import du composant Login

export default function App() {
  const [isSignUp, setIsSignUp] = useState(false); // État pour savoir si on est en inscription ou connexion

  // Formulaire React Hook Form
  const { control, handleSubmit, formState: { errors }, reset } = useForm();

  // Fonction onSubmit générique qui réinitialise les champs
  const onSubmit = () => {
    reset();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isSignUp ? "👋 Welcome !" : "👋 Welcome Back !"}</Text>
      <Text style={styles.subtitle}>
        Please enter your {isSignUp ? "register" : "login"} informations
      </Text>

      {/* Switch pour choisir Inscription/Connexion */}
      <View style={styles.switchContainer}>
        <TouchableOpacity
          style={[styles.switchButton, !isSignUp && styles.activeTab]}
          onPress={() => setIsSignUp(false)}
        >
          <Text style={!isSignUp ? styles.activeText : styles.inactiveText}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switchButton, isSignUp && styles.activeTab]}
          onPress={() => setIsSignUp(true)}
        >
          <Text style={isSignUp ? styles.activeText : styles.inactiveText}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      {/* Affichage du composant selon le mode (Inscription ou Connexion) */}
      {isSignUp ? (
        <Register control={control} handleSubmit={handleSubmit} errors={errors} onSubmit={onSubmit} />
      ) : (
        <Login control={control} handleSubmit={handleSubmit} errors={errors} onSubmit={onSubmit} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center" },
  subtitle: { textAlign: "center", marginBottom: 20, color: "#777" },
  switchContainer: { flexDirection: "row", marginBottom: 15, justifyContent: "center" },
  switchButton: { padding: 10, paddingHorizontal: 40 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: "#6A5ACD" },
  activeText: { fontWeight: "bold", color: "#6A5ACD" },
  inactiveText: { color: "#777" },
});