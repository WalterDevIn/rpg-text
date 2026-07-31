import { Pressable, Text } from "react-native";
import { styles } from "../theme/styles.js";

export function PrimaryButton({ title, onPress, disabled = false, variant = "primary", compact = false }) {
  const variantStyle = { primary: styles.buttonPrimary, secondary: styles.buttonSecondary, ghost: styles.buttonGhost, danger: styles.buttonDanger }[variant] ?? styles.buttonPrimary;
  const textStyle = { primary: styles.buttonText, secondary: styles.buttonTextSecondary, ghost: styles.buttonTextGhost, danger: styles.buttonTextDanger }[variant] ?? styles.buttonText;
  return <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.button, variantStyle, compact && styles.buttonCompact, pressed && styles.buttonPressed, disabled && styles.buttonDisabled]}><Text style={[textStyle, disabled && styles.buttonTextDisabled]}>{title}</Text></Pressable>;
}
