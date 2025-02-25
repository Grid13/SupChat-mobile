import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Controller } from "react-hook-form";
import InputField from "./InputField";

interface LoginProps {
  control: any;
  handleSubmit: any;
  errors: any;
  onSubmit: any;
}

const Login: React.FC<LoginProps> = ({ control, handleSubmit, errors, onSubmit }) => {
  const [isLoading, setIsLoading] = useState(false); // État de chargement
  const [error, setError] = useState<string | null>(null); // Erreur potentielle de l'API

  const loginAPI = async (data: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://10.0.2.2:5263/connect/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": "fr",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        Alert.alert("Succès", "Connexion réussie !");
        // Réinitialisation des champs après succès
        onSubmit(); // Appel de la fonction de rappel pour réinitialiser le formulaire
      } else {
        throw new Error("Une erreur est survenue lors de la connexion.");
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
        name="password"
        render={({ field: { onChange, value } }) => (
          <InputField label="Password" placeholder="Password" secureTextEntry value={value} onChangeText={onChange} error={errors.password?.message} />
        )}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => handleSubmit(loginAPI)} // Utilisation de la fonction loginAPI pour envoyer les données
        disabled={isLoading}
      >
        {isLoading ? (
          <Text style={styles.buttonText}>Loading...</Text>
        ) : (
          <Text style={styles.buttonText}>LOGIN</Text>
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

export default Login;
