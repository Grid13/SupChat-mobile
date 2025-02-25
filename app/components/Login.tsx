import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Controller } from "react-hook-form";
import InputField from "./InputField";

interface LoginProps {
  control: any;
  handleSubmit: any;
  errors: any;
  onSubmit: any;
}

const Login: React.FC<LoginProps> = ({ control, handleSubmit, errors, onSubmit }) => (
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

    <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)}>
      <Text style={styles.buttonText}>LOGIN</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  formContainer: { padding: 20, backgroundColor: "#f5f5f5" },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  button: { backgroundColor: "#6A5ACD", padding: 15, borderRadius: 5, alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default Login;
