import { Text, View } from "react-native";
import { styles } from "../theme/styles.js";

export function StatusMessage({ message, error = false }) {
  if (!message) return null;
  return <View><Text style={error ? styles.error : styles.status}>{message}</Text></View>;
}
