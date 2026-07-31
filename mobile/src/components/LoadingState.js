import { ActivityIndicator, SafeAreaView, Text, View } from "react-native";
import { colors } from "../theme/colors.js";
import { styles } from "../theme/styles.js";

export function LoadingState({ label = "Loading interface" }) {
  return <SafeAreaView style={styles.safe}><View style={styles.loadingScreen}><Text style={styles.loadingMark}>RPG TEXT</Text><ActivityIndicator color={colors.cyan} style={{ marginTop: 14 }} /><Text style={styles.status}>{label}</Text></View></SafeAreaView>;
}
