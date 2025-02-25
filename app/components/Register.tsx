import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import InputField from "./InputField";

// Schéma de validation pour l'inscription
const registerSchema = yup.object().shape({
  email: yup.string().email("Email invalide").required("Email obligatoire"),
  username: yup.string().min(3, "Min. 3 caractères").required("Nom d'utilisateur obligatoire"),
  password: yup.string().min(6, "Min. 6 caractères").required("Mot de passe obligatoire"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Les mots de passe ne correspondent pas")
    .required("Confirmation obligatoire"),
});

interface RegisterProps {
  control: any;
  handleSubmit: any;
  errors: any;
  onSubmit: any;
}

const Register: React.FC<RegisterProps> = ({ control, handleSubmit, errors, onSubmit }) => {
  const [isLoading, setIsLoading] = useState(false); // État de chargement
  const [error, setError] = useState<string | null>(null); // Erreur potentielle de l'API

  const registerAPI = async (data: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://10.0.2.2:5263/connect/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": "fr",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        Alert.alert("Succès", "Inscription réussie !");
        // Réinitialisation des champs après succès
        onSubmit(); // Appel de la fonction de rappel pour réinitialiser le formulaire
      } else {
        throw new Error("Une erreur est survenue lors de l'inscription.");
      }
    } catch (error: any) {
      setError(error.message); // Gestion de l'erreur
    } finally {
      setIsLoading(false); // Fin du chargement
    }
  };

  return (
    <View style={styles.formContainer}>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <InputField label="Email" placeholder="Email" value={value} onChangeText={onChange} error={errors.email?.message} />
        )}
      />
      <Controller
        control={control}
        name="username"
        render={({ field: { onChange, value } }) => (
          <InputField label="Username" placeholder="Username" value={value} onChangeText={onChange} error={errors.username?.message} />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <InputField label="Password" placeholder="Password" secureTextEntry value={value} onChangeText={onChange} error={errors.password?.message} />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, value } }) => (
          <InputField label="Confirm Password" placeholder="Confirm Password" secureTextEntry value={value} onChangeText={onChange} error={errors.confirmPassword?.message} />
        )}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => handleSubmit(registerAPI)} // Utilisation de la fonction registerAPI pour envoyer les données
        disabled={isLoading}
      >
        {isLoading ? (
          <Text style={styles.buttonText}>Loading...</Text>
        ) : (
          <Text style={styles.buttonText}>REGISTER</Text>
        )}
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: { padding: 20, backgroundColor: "#f5f5f5" },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  button: { backgroundColor: "#6A5ACD", padding: 15, borderRadius: 5, alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  errorText: { color: "red", textAlign: "center", marginTop: 10 },
});

export default Register;
