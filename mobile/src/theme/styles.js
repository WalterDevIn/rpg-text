import { StyleSheet } from "react-native";
import { colors } from "./colors.js";

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 18, paddingBottom: 36 },
  safe: { flex: 1, backgroundColor: colors.background },
  eyebrow: { color: colors.cyan, fontSize: 11, letterSpacing: 2, textTransform: "uppercase" },
  title: { color: colors.text, fontSize: 30, fontWeight: "400", marginTop: 10, marginBottom: 8 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: 20 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: "400", marginTop: 24, marginBottom: 10 },
  label: { color: colors.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 7 },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, color: colors.text, padding: 13, fontSize: 15, borderRadius: 3 },
  button: { borderWidth: 1, borderColor: colors.orange, padding: 14, alignItems: "center", borderRadius: 3, marginTop: 14 },
  buttonText: { color: colors.orange, fontSize: 12, letterSpacing: 1, textTransform: "uppercase" },
  buttonDisabled: { opacity: 0.4 },
  error: { color: colors.red, borderLeftWidth: 2, borderLeftColor: colors.red, paddingLeft: 10, marginTop: 14, lineHeight: 20 },
  status: { color: colors.muted, marginTop: 12, lineHeight: 20 },
  card: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, borderRadius: 3, marginBottom: 9 },
  cardSelected: { borderColor: colors.cyan, backgroundColor: "#0b171b" },
  cardHostile: { borderColor: colors.red },
  cardTitle: { color: colors.text, fontSize: 16, marginBottom: 5 },
  cardBody: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  cardMeta: { color: colors.cyan, fontSize: 11, marginTop: 8 },
});
