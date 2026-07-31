import { useEffect, useRef, useState } from "react";
import Constants from "expo-constants";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
import { useMobileContext } from "../app/MobileContext.js";
import { getAppVersion } from "../config/appMetadata.js";
import { checkServerHealth } from "../services/healthCheck.js";
import { normalizeMobileApiBaseUrl } from "../services/mobileApi.js";
import { predefinedServers } from "../services/serverOptions.js";
import { loadServerUrl, saveServerUrl } from "../storage/serverStorage.js";
import { colors } from "../theme/colors.js";
import { styles } from "../theme/styles.js";
import { PrimaryButton } from "../components/PrimaryButton.js";

const appVersion = getAppVersion(Constants);

export function ConnectionScreen({ navigation }) {
  const { setApiBaseUrl } = useMobileContext();
  const [url, setUrl] = useState(""); const [selection, setSelection] = useState("custom");
  const [loading, setLoading] = useState(true); const [checking, setChecking] = useState(false);
  const [diagnostic, setDiagnostic] = useState(null); const [detailsOpen, setDetailsOpen] = useState(false); const [success, setSuccess] = useState(null);
  const requestController = useRef(null);

  useEffect(() => {
    let active = true;
    loadServerUrl().then((stored) => { if (!active) return; if (stored) { let normalized = stored; try { normalized = normalizeMobileApiBaseUrl(stored); } catch {} setUrl(normalized); setSelection(predefinedServers.some((server) => server.address === normalized) ? predefinedServers[0].id : "custom"); check(stored); } else setLoading(false); }).catch(() => { if (active) setLoading(false); });
    return () => { active = false; requestController.current?.abort(); };
  }, []);

  async function check(value = url) {
    requestController.current?.abort();
    const controller = new AbortController(); requestController.current = controller;
    setChecking(true); setDiagnostic(null); setSuccess(null); setDetailsOpen(false);
    const result = await checkServerHealth(value, { signal: controller.signal });
    if (result.aborted) return;
    setChecking(false); setLoading(false);
    if (!result.ok) { setDiagnostic(result.diagnostic); return; }
    const normalized = new URL(value).origin;
    await saveServerUrl(normalized).catch(() => {}); setApiBaseUrl(normalized); setSuccess(`Connected · ${result.latencyMs} ms`); navigation.replace("Home");
  }

  function choosePredefined(server) { setSelection(server.id); setUrl(server.address); check(server.address); }
  function chooseCustom() { setSelection("custom"); setDiagnostic(null); }

  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={styles.eyebrow}>RPG TEXT / MOBILE</Text><Text style={styles.title}>Connect to server</Text><Text style={styles.subtitle}>Choose a configured development server or enter a reachable HTTP(S) address.</Text>
    <Text style={styles.sectionTitle}>Server</Text>
    {predefinedServers.map((server) => <Pressable key={server.id} accessibilityRole="button" accessibilityState={{ selected: selection === server.id }} onPress={() => choosePredefined(server)} style={[styles.serverOption, selection === server.id && styles.serverOptionSelected]}><Text style={styles.cardTitle}>{server.label}</Text><Text style={styles.cardBody}>{server.address}</Text></Pressable>)}
    <Pressable accessibilityRole="button" accessibilityState={{ selected: selection === "custom" }} onPress={chooseCustom} style={[styles.serverOption, selection === "custom" && styles.serverOptionSelected]}><Text style={styles.cardTitle}>Custom server</Text><Text style={styles.cardBody}>Use an editable server address.</Text></Pressable>
    <Text style={styles.label}>Server address</Text><TextInput style={styles.input} value={url} onChangeText={(value) => { setSelection("custom"); setUrl(value); setDiagnostic(null); }} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="https://your-server.example" placeholderTextColor={colors.muted} editable={!checking && selection === "custom"} />
    <PrimaryButton title={checking ? "Checking..." : "Test connection"} onPress={() => check()} disabled={checking || !url.trim()} />
    {loading || checking ? <ActivityIndicator color={colors.cyan} style={{ marginTop: 18 }} /> : null}
    {success ? <Text style={styles.connected}>{success}</Text> : null}
    {diagnostic ? <Diagnostic diagnostic={diagnostic} detailsOpen={detailsOpen} onToggle={() => setDetailsOpen((value) => !value)} onRetry={() => check()} onChange={() => { setDiagnostic(null); setSelection("custom"); }} /> : null}
    <Text style={styles.version}>App version {appVersion}</Text>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

function Diagnostic({ diagnostic, detailsOpen, onToggle, onRetry, onChange }) {
  return <View style={styles.diagnostic}><Text style={styles.diagnosticTitle}>{diagnostic.title}</Text><Text style={styles.error}>{diagnostic.message}</Text>{diagnostic.requestUrl ? <Text style={styles.diagnosticMeta}>Requested URL: {diagnostic.requestUrl}</Text> : null}{diagnostic.httpStatus ? <Text style={styles.diagnosticMeta}>HTTP {diagnostic.httpStatus}</Text> : null}<View style={styles.diagnosticActions}><PrimaryButton title="Retry" onPress={onRetry} /><PrimaryButton title="Change server" onPress={onChange} /></View>{diagnostic.code === "HTML_RESPONSE" || diagnostic.preview ? <><Pressable onPress={onToggle}><Text style={styles.detailsToggle}>{detailsOpen ? "Hide technical details" : "Show technical details"}</Text></Pressable>{detailsOpen ? <Text style={styles.diagnosticMeta}>Code: {diagnostic.code}{diagnostic.contentType ? ` · ${diagnostic.contentType}` : ""}{diagnostic.preview ? `\n${diagnostic.preview}` : ""}</Text> : null}</> : null}</View>;
}
