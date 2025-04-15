import React from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "expo-router";

const registerSchema = yup.object().shape({
  email: yup.string().email().required(),
  username: yup.string().min(3).required(),
  password: yup.string().min(6).required(),
  confirmPassword: yup.string().oneOf([yup.ref("password")]).required(),
});

const Register = () => {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(registerSchema) });

  const onSubmit = (data: any) => Alert.alert("Register", JSON.stringify(data));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome ! 👋</Text>
      <Text style={styles.subtitle}>Please enter your register informations</Text>

      <View style={styles.toggleContainer}>
        <TouchableOpacity style={styles.toggleInactive} onPress={() => router.push("/login")}>
          <Text style={styles.toggleTextInactive}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toggleActive}>
          <Text style={styles.toggleTextActive}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <TextInput style={styles.input} placeholder="Email" value={value} onChangeText={onChange} />
          )}
        />
        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, value } }) => (
            <TextInput style={styles.input} placeholder="Username" value={value} onChangeText={onChange} />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <TextInput style={styles.input} placeholder="Password" secureTextEntry value={value} onChangeText={onChange} />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value } }) => (
            <TextInput style={styles.input} placeholder="Confirm Password" secureTextEntry value={value} onChangeText={onChange} />
          )}
        />

        <TouchableOpacity style={styles.continueButton} onPress={handleSubmit(onSubmit)}>
          <Text style={styles.continueText}>CONTINUE</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.separatorContainer}>
        <View style={styles.separator} />
        <Text style={styles.orText}>Or Connect With</Text>
        <View style={styles.separator} />
      </View>

      <View style={styles.socialRow}>
        <TouchableOpacity style={styles.socialButton}>
          <Text>🟢 Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <Text>🔵 Facebook</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default Register;

// 🔁 Styles réutilisés (identiques à login.tsx pour parfaite symétrie)
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 50,
    minHeight: "100%",
  },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#888", marginBottom: 20, textAlign: "center" },
  toggleContainer: {
    flexDirection: "row", backgroundColor: "#eee", borderRadius: 10,
    marginBottom: 20, width: "100%", height: 45, overflow: "hidden",
  },
  toggleActive: { flex: 1, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  toggleInactive: { flex: 1, justifyContent: "center", alignItems: "center" },
  toggleTextActive: { fontWeight: "bold", color: "#000" },
  toggleTextInactive: { color: "#666" },
  form: { width: "100%" },
  input: {
    borderWidth: 1, borderColor: "#ccc", borderRadius: 6,
    paddingVertical: 10, paddingHorizontal: 12, fontSize: 16,
    marginBottom: 12, backgroundColor: "#fff",
  },
  continueButton: {
    backgroundColor: "#6B8AFD", padding: 15, borderRadius: 8,
    width: "100%", alignItems: "center", marginTop: 10,
  },
  continueText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  separatorContainer: {
    flexDirection: "row", alignItems: "center", marginVertical: 15, width: "100%",
  },
  separator: { flex: 1, height: 1, backgroundColor: "#ccc" },
  orText: { marginHorizontal: 10, color: "#999" },
  socialRow: {
    flexDirection: "row", justifyContent: "space-between", width: "100%", gap: 10,
  },
  socialButton: {
    flex: 1, padding: 12, borderWidth: 1, borderColor: "#000",
    borderRadius: 6, alignItems: "center",
  },
});