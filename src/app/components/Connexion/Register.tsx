import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import InputField from "./InputField";
import dotenv from "dotenv";

const ipAddress = process.env.EXPO_PUBLIC_IP_ADDRESS;

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

const Register: React.FC<RegisterProps> = ({ control, handleSubmit, errors, onSubmit }) => (
  <View style={styles.formContainer}>
    <Text style={styles.title}>Sign Up</Text>

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

    <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)}>
      <Text style={styles.buttonText}>REGISTER</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  formContainer: { padding: 20, backgroundColor: "#f5f5f5" },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  button: { backgroundColor: "#6A5ACD", padding: 15, borderRadius: 5, alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default Register;
