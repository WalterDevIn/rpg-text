import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useMobileContext } from "../app/MobileContext.js";
import { clearActiveSession, clearEncounterDraft, loadActiveSession } from "../storage/serverStorage.js";
import { createEncounterDraft } from "../state/encounterDraft.js";
import { PrimaryButton } from "../components/PrimaryButton.js";
import { StatusMessage } from "../components/StatusMessage.js";
import { styles } from "../theme/styles.js";

export function HomeScreen({ navigation }) {
  const { service, setDraft } = useMobileContext();
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { loadActiveSession().then(async (saved) => { if (!saved) return; try { const current = await service.getCombatSession(saved.sessionId); if (current.status === "FINISHED" || current.snapshot?.status === "FINISHED") { await clearActiveSession(); setNotice("The previous combat has finished."); return; } const missing = await service.getCombatEvents(saved.sessionId, { since: saved.nextEventCursor ?? 0 }); setSession({ ...saved, ...current, events: missing.events ?? [], nextEventCursor: missing.nextEventCursor ?? saved.nextEventCursor ?? 0 }); } catch (nextError) { if (nextError.status === 404 || nextError.code === "SESSION_NOT_FOUND") { await clearActiveSession(); setNotice("The previous combat is no longer available. The server may have restarted."); } else setError(nextError.message); } }).catch((nextError) => setError(nextError.message)).finally(() => setLoading(false)); }, [service]);
  function continueCombat() { if (session?.sessionId) navigation.navigate("Combat", { sessionId: session.sessionId, snapshot: session.snapshot, events: session.events ?? [], scenario: session.scenario }); }
  function newCombat() { const begin = async () => { await clearEncounterDraft(); setDraft(createEncounterDraft()); navigation.navigate("NewCombatParticipants"); }; if (session) Alert.alert("Start a new combat?", "This replaces the local recovery reference. The server combat is not deleted.", [{ text: "Cancel", style: "cancel" }, { text: "Continue", onPress: begin }]); else begin(); }
  return <SafeAreaView style={styles.safe}><ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <Text style={styles.eyebrow}>RPG TEXT / HOME</Text><Text style={styles.title}>Choose your next scene.</Text>
    <Text style={styles.subtitle}>The server is authoritative. This device stores only a recoverable session reference and setup draft.</Text>
    {loading ? <ActivityIndicator color="#62e6ff" /> : session ? <View style={styles.card}><Text style={styles.cardTitle}>Continue combat</Text><Text style={styles.cardBody}>{session.snapshot?.participants?.length ?? 0} participants · {session.snapshot?.status ?? "ACTIVE"}</Text><PrimaryButton title="Continue combat" onPress={continueCombat} /></View> : <Text style={styles.status}>No active combat session found.</Text>}
    <PrimaryButton title="New combat" onPress={newCombat} />
    <PrimaryButton title="Creation hub" onPress={() => navigation.navigate("CreationHub")} />
    <PrimaryButton title="Settings" onPress={() => navigation.navigate("Settings")} />
    <StatusMessage error message={error} />
    <StatusMessage message={notice} />
  </ScrollView></SafeAreaView>;
}
