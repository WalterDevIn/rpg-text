import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, Text, TextInput, View } from "react-native";
import { useMobileContext } from "../app/MobileContext.js";
import { normalizeMobileApiBaseUrl } from "../services/mobileApi.js";
import { loadServerUrl, saveServerUrl } from "../storage/serverStorage.js";
import { colors } from "../theme/colors.js";
import { styles } from "../theme/styles.js";
import { PrimaryButton } from "../components/PrimaryButton.js";
import { StatusMessage } from "../components/StatusMessage.js";

export function ConnectionScreen({ navigation }) {
  const { setApiBaseUrl } = useMobileContext();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    loadServerUrl().then((stored) => {
      if (!active) return;
      if (stored) { setUrl(stored); check(stored, true); } else setLoading(false);
    }).catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function check(value = url, automatic = false) {
    setChecking(true); setError(null);
    try {
      const normalized = normalizeMobileApiBaseUrl(value);
      const api = (await import("../services/mobileApi.js")).createMobileApi(normalized);
      await api.getHealth();
      await saveServerUrl(normalized);
      setApiBaseUrl(normalized);
      navigation.replace("Setup");
    } catch (nextError) {
      if (!automatic || nextError.code !== "NETWORK_ERROR") setError(nextError.message ?? "Connection failed.");
    } finally { setLoading(false); setChecking(false); }
  }

  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}><View style={styles.content}>
    <Text style={styles.eyebrow}>RPG TEXT / MOBILE</Text>
    <Text style={styles.title}>Server connection</Text>
    <Text style={styles.subtitle}>Connect this device to the authoritative RPG Text server. Use a reachable HTTPS URL or a local network address.</Text>
    <Text style={styles.label}>Server URL</Text>
    <TextInput style={styles.input} value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="https://your-server.example" placeholderTextColor={colors.muted} editable={!checking} />
    <PrimaryButton title={checking ? "Checking..." : "Check connection"} onPress={() => check()} disabled={checking || !url.trim()} />
    {loading || checking ? <ActivityIndicator color={colors.cyan} style={{ marginTop: 18 }} /> : null}
    <StatusMessage message={error} error />
    <StatusMessage message="The mobile app does not run a local server. Configure the address exposed to this device." />
  </View></KeyboardAvoidingView></SafeAreaView>;
}
