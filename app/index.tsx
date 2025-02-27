import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import axios from "axios";
import Register from "./components/Connexion/Register";
import Login from "./components/Connexion/Login";
import * as yup from "yup";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation, NavigationProp } from '@react-navigation/native'; // Ajoute NavigationProp ici
import Nav from './Nav'; // Assurez-vous que ce chemin est correct

const Stack = createNativeStackNavigator();

// Définit les types pour la navigation
type RootStackParamList = {
  Home: undefined;
  Nav: undefined;
};

// Schéma de validation pour l'inscription et la connexion
const signInSchema = yup.object().shape({
  // TODO : A remettre en place
  // email: yup.string().email("Email invalide").required("Email obligatoire"),
  // password: yup.string().min(6, "Min. 6 caractères").required("Mot de passe obligatoire"),
  email: yup.string().min(0, "Email invalide").required("Email obligatoire"),
  password: yup.string().min(0, "Min. 6 caractères").required("Mot de passe obligatoire"),
});

const signUpSchema = yup.object().shape({
  email: yup.string().email("Email invalide").required("Email obligatoire"),
  username: yup.string().min(3, "Min. 3 caractères").required("Nom d'utilisateur obligatoire"),
  password: yup.string().min(6, "Min. 6 caractères").required("Mot de passe obligatoire"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Les mots de passe ne correspondent pas")
    .required("Confirmation obligatoire"),
});

interface FormData {
  email: string;
  username?: string;
  password: string;
  confirmPassword?: string;
}

export default function App() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>(); // Utilise les types ici
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(isSignUp ? signUpSchema : signInSchema),
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
    navigation.navigate('Nav'); // Naviguer vers Nav directement sans validation
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isSignUp ? "Welcome !" : "Welcome Back !"} 👋</Text>
      <Text style={styles.subtitle}>
        Please enter your {isSignUp ? "register" : "login"} informations
      </Text>

      {/* Toggle Sign In / Sign Up */}
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

      {/* Afficher le formulaire en fonction de l'état isSignUp */}
      {isSignUp ? (
        <Register control={control} handleSubmit={handleSubmit} errors={errors} onSubmit={onSubmit} />
      ) : (
        <Login control={control} handleSubmit={handleSubmit} errors={errors} onSubmit={onSubmit} />
      )}

      {/* Affichage des erreurs */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Indicateur de chargement */}
      {isLoading && <ActivityIndicator size="large" color="#6A5ACD" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center", backgroundColor: "#f5f5f5" },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center" },
  subtitle: { textAlign: "center", marginBottom: 20, color: "#777" },
  switchContainer: { flexDirection: "row", marginBottom: 15, justifyContent: "center" },
  switchButton: { padding: 10, paddingHorizontal: 40 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: "#6A5ACD" },
  activeText: { fontWeight: "bold", color: "#6A5ACD" },
  inactiveText: { color: "#777" },
  errorText: { color: "red", textAlign: "center", marginTop: 10 },
});