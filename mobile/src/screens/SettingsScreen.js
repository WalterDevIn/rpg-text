import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, Switch, Text, View } from "react-native";
import { useMobileContext } from "../app/MobileContext.js";
import { createMobilePresentationPreferences } from "../audio/audioPreferences.js";
import { clearActiveSession, clearLocalPreferences, clearServerUrl, loadActiveSession, loadServerUrl } from "../storage/serverStorage.js";
import { normalizeMobileApiBaseUrl } from "../services/mobileApi.js";
import { colors } from "../theme/colors.js";
import { styles } from "../theme/styles.js";
import { PrimaryButton } from "../components/PrimaryButton.js";
import { StatusMessage } from "../components/StatusMessage.js";

export function SettingsScreen({ navigation }) {
  const { service, apiBaseUrl, setApiBaseUrl } = useMobileContext();
  const preferences = useMemo(() => createMobilePresentationPreferences(), []);
  const [values, setValues] = useState(preferences.get()); const [serverUrl, setServerUrl] = useState(apiBaseUrl ?? "");
  const [status, setStatus] = useState(null); const [checking, setChecking] = useState(false); const [session, setSession] = useState(false);
  useEffect(() => { preferences.load().then(setValues); loadServerUrl().then((value) => value && setServerUrl(value)); loadActiveSession().then((value) => setSession(Boolean(value))); }, [preferences]);
  function update(next) { setValues(preferences.update(next)); }
  async function testConnection() { setChecking(true); setStatus(null); try { const normalized = normalizeMobileApiBaseUrl(serverUrl); const { createMobileApi } = await import("../services/mobileApi.js"); await createMobileApi(normalized).getHealth(); await import("../storage/serverStorage.js").then(({ saveServerUrl }) => saveServerUrl(normalized)); setApiBaseUrl(normalized); setServerUrl(normalized); setStatus("Connection healthy."); } catch (error) { setStatus(error.message); } finally { setChecking(false); } }
  function reset() { Alert.alert("Clear local preferences?", "This clears presentation preferences only. Server data and active combat are not deleted.", [{ text: "Cancel", style: "cancel" }, { text: "Clear", style: "destructive", onPress: async () => { await clearLocalPreferences(); setValues(preferences.defaults); setStatus("Local presentation preferences cleared."); } }]); }
  async function clearSession() { await clearActiveSession(); setSession(false); setStatus("The local recovery reference was cleared. The server session was not deleted."); }
  async function disconnect() { await clearServerUrl(); setApiBaseUrl(null); navigation.replace("Connection"); }
  return <SafeAreaView style={styles.safe}><ScrollView style={styles.screen} contentContainerStyle={styles.content}><Text style={styles.eyebrow}>RPG TEXT / SETTINGS</Text><Text style={styles.title}>Connection and presentation.</Text><Text style={styles.subtitle}>Settings are local to this device. Combat rules and session truth remain on the server.</Text>
    <Text style={styles.sectionTitle}>Audio</Text><SettingRow label="Sound enabled" value={values.soundEnabled} onChange={(value) => update({ soundEnabled: value })} /><View style={styles.volumeRow}><Text style={styles.overviewBody}>Master volume {Math.round(values.masterVolume * 100)}%</Text><View style={styles.volumeControls}><Pressable accessibilityRole="button" onPress={() => update({ masterVolume: Math.max(0, values.masterVolume - 0.1) })}><Text style={styles.volumeButton}>−</Text></Pressable><Pressable accessibilityRole="button" onPress={() => update({ masterVolume: Math.min(1, values.masterVolume + 0.1) })}><Text style={styles.volumeButton}>+</Text></Pressable></View></View>
    <Text style={styles.sectionTitle}>Presentation</Text><SettingRow label="Text animation" value={values.textAnimationEnabled} onChange={(value) => update({ textAnimationEnabled: value })} /><SettingRow label="Reduced motion" value={values.reducedMotion} onChange={(value) => update({ reducedMotion: value })} />
    <Text style={styles.sectionTitle}>Connection</Text><Text style={styles.label}>Current server URL</Text><Text style={styles.status}>{serverUrl || "Not connected"}</Text><PrimaryButton title={checking ? "Testing..." : "Test connection"} onPress={testConnection} disabled={checking || !serverUrl} /><PrimaryButton title="Change server" onPress={() => navigation.replace("Connection")} /><PrimaryButton title="Disconnect" onPress={disconnect} /><StatusMessage message={status} />
    <Text style={styles.sectionTitle}>Data</Text>{session ? <PrimaryButton title="Clear recovery reference" onPress={clearSession} /> : <Text style={styles.status}>No active recovery reference.</Text>}<PrimaryButton title="Clear local preferences" onPress={reset} /><PrimaryButton title="Back to home" onPress={() => navigation.goBack()} />
    {checking ? <ActivityIndicator color={colors.cyan} /> : null}
  </ScrollView></SafeAreaView>;
}

function SettingRow({ label, value, onChange }) { return <View style={styles.settingRow}><Text style={styles.overviewBody}>{label}</Text><Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ false: colors.border, true: colors.cyan }} thumbColor={colors.text} /></View>; }
