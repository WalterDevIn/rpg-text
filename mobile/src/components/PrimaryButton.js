import { Pressable, Text } from "react-native";
import { styles } from "../theme/styles.js";

export function PrimaryButton({ title, onPress, disabled = false }) {
  return <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} style={[styles.button, disabled && styles.buttonDisabled]}><Text style={styles.buttonText}>{title}</Text></Pressable>;
}
