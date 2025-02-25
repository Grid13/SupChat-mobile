import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch } from "react-native";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import InputField from "./components/InputField";
import SocialButton from "./components/SocialButton";

interface FormData {
  email: string;
  username?: string;
  password: string;
  confirmPassword?: string;
  rememberMe?: boolean;
}

// Schémas de validation
const signInSchema = yup.object().shape({
  email: yup.string().email("Email invalide").required("Email obligatoire"),
  password: yup.string().min(6, "Min. 6 caractères").required("Mot de passe obligatoire"),
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

export default function App() {
  const [isSignUp, setIsSignUp] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(isSignUp ? signUpSchema : signInSchema),
  });

  const onSubmit = (data: FormData) => {
    Alert.alert(isSignUp ? "Inscription réussie" : "Connexion réussie", JSON.stringify(data, null, 2));
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

      {/* Champs du formulaire */}
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <InputField
            label="Email"
            placeholder="Email"
            value={value}
            onChangeText={onChange}
            error={errors.email?.message}
          />
        )}
      />
      {isSignUp && (
        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, value } }) => (
            <InputField
              label="Username"
              placeholder="Username"
              value={value}
              onChangeText={onChange}
              error={errors.username?.message}
            />
          )}
        />
      )}
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <InputField
            label="Password"
            placeholder="Password"
            secureTextEntry
            value={value}
            onChangeText={onChange}
            error={errors.password?.message}
          />
        )}
      />
      {isSignUp && (
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value } }) => (
            <InputField
              label="Confirm"
              placeholder="Confirm Password"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              error={errors.confirmPassword?.message}
            />
          )}
        />
      )}

      {/* Checkbox "Remember me" pour Sign In */}
      {!isSignUp && (
        <View style={styles.rememberContainer}>
          <Controller
            control={control}
            name="rememberMe"
            render={({ field: { onChange, value } }) => (
              <Switch value={value} onValueChange={onChange} />
            )}
          />
          <Text style={styles.rememberText}>Remember me</Text>
        </View>
      )}

      {/* Bouton CONTINUE */}
      <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)}>
        <Text style={styles.buttonText}>CONTINUE</Text>
      </TouchableOpacity>

      {/* Boutons de connexion sociale */}
      <View style={styles.socialContainer}>
        <SocialButton title="Google" icon="google" color="#DB4437" onPress={() => Alert.alert("Google Connect")} />
        <SocialButton title="Facebook" icon="facebook" color="#1877F2" onPress={() => Alert.alert("Facebook Connect")} />
      </View>
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
  button: { backgroundColor: "#6A5ACD", padding: 15, borderRadius: 5, alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  socialContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  rememberContainer: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  rememberText: { marginLeft: 8, fontSize: 16 },
});

export default App;
