import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

interface InputFieldProps {
  label?: string; // 🔁 Désormais optionnel
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  error?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  error,
}) => {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        placeholderTextColor="#999"
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 12, width: "100%" },
  label: { fontSize: 16, fontWeight: "bold", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputError: { borderColor: "red" },
  error: { color: "red", fontSize: 12, marginTop: 4 },
});

export default InputField;
