import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

interface SocialButtonProps {
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
}

const SocialButton: React.FC<SocialButtonProps> = ({ title, icon, color, onPress }) => {
  return (
    <TouchableOpacity style={[styles.button, { borderColor: color }]} onPress={onPress}>
      <FontAwesome name={icon as any} size={20} color={color} />
      <Text style={[styles.text, { color }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    justifyContent: "center",
    width: "48%",
  },
  text: { marginLeft: 10, fontSize: 16, fontWeight: "bold" },
});

export default SocialButton;
