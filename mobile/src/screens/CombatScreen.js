import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, AppState, FlatList, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, Text, TextInput, View } from "react-native";
import { useMobileContext } from "../app/MobileContext.js";
import { mergeCombatEvents, eventMessage } from "../utilities/combatEvents.js";
import { colors } from "../theme/colors.js";
import { styles } from "../theme/styles.js";
import { PrimaryButton } from "../components/PrimaryButton.js";
import { StatusMessage } from "../components/StatusMessage.js";

export function CombatScreen({ route, navigation }) {
  const { service } = useMobileContext();
  const { sessionId, scenario } = route.params;
  const [snapshot, setSnapshot] = useState(route.params.snapshot);
  const [events, setEvents] = useState(mergeCombatEvents([], route.params.events ?? []));
  const [cursor, setCursor] = useState(maxSequence(route.params.events ?? []));
  const [draft, setDraft] = useState("");
  const [interpretation, setInterpretation] = useState(null);
  const [interpreting, setInterpreting] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const requestVersion = useRef(0);
  const localMessageCounter = useRef(0);

  useEffect(() => {
    if (!draft.trim()) { setInterpretation(null); setInterpreting(false); return undefined; }
    const version = ++requestVersion.current;
    setInterpreting(true);
    const timer = setTimeout(async () => {
      try {
        const result = await service.interpretCombatCommand(sessionId, draft);
        if (version === requestVersion.current) { setInterpretation(result); setInterpreting(false); }
      } catch (nextError) { if (version === requestVersion.current) { setError(nextError); setInterpreting(false); } }
    }, 280);
    return () => clearTimeout(timer);
  }, [draft, service, sessionId]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") reload(); });
    return () => subscription.remove();
  }, [cursor, service, sessionId]);

  const active = useMemo(() => snapshot.participants.find((participant) => participant.entityId === snapshot.activeEntityId), [snapshot]);
  const canSubmit = interpretation?.status === "RESOLVED" && !pending && active?.controller === "manual" && snapshot.status === "ACTIVE";

  async function reload() {
    try {
      const current = await service.getCombatSession(sessionId);
      const missing = await service.getCombatEvents(sessionId, { since: cursor });
      setSnapshot(current.snapshot); appendEvents(missing.events ?? []);
      setError(null);
    } catch (nextError) { setError(nextError); }
  }

  function appendEvents(nextEvents) {
    setEvents((current) => mergeCombatEvents(current, nextEvents));
    setCursor((current) => Math.max(current, maxSequence(nextEvents)));
  }

  async function submit() {
    if (!canSubmit) return;
    const originalText = draft;
    setPending(true); setError(null);
    try {
      const localSequence = `${cursor}.${++localMessageCounter.current}`;
      setSnapshot(result.snapshot);
      setEvents((current) => mergeCombatEvents(current, [{ sequence: localSequence, local: true, origin: "player", text: originalText }]));
      appendEvents(result.events ?? []);
      setDraft(""); setInterpretation(null);
    } catch (nextError) {
      setError(nextError);
      if (nextError.data?.interpretation) setInterpretation(nextError.data.interpretation);
      if (nextError.data?.snapshot) setSnapshot(nextError.data.snapshot);
      if (nextError.data?.events) appendEvents(nextError.data.events);
    } finally { setPending(false); }
  }

  function suggestion(name) { setDraft(draft.match(/\b(?:al|a|la|el)\s+[^,.!?]*$/i) ? draft.replace(/\b(?:al|a|la|el)\s+[^,.!?]*$/i, `al ${name}`) : `${draft.trim()} ${name}`.trim()); }
  function returnToSetup() { navigation.replace("Setup"); }
  const messages = events.map((event) => ({ id: String(event.sequence), origin: event.local ? "player" : event.origin ?? (event.type === "DICE_ROLLED" ? "dice" : "dm"), text: event.local ? event.text : eventMessage(event), event }));

  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
    <View style={styles.content}><Text style={styles.eyebrow}>RPG TEXT / COMBAT</Text><Text style={styles.title}>{scenario?.name ?? "Encounter"}</Text><Text style={styles.status}>ROUND {snapshot.round} · {snapshot.status} · ACTIVE {active?.identity?.name ?? "NONE"}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 12 }}>{snapshot.participants.map((participant) => <View key={participant.entityId} style={{ borderWidth: 1, borderColor: participant.entityId === snapshot.activeEntityId ? colors.cyan : colors.border, padding: 8, minWidth: 105 }}><Text style={{ color: participant.faction === "monsters" ? colors.red : colors.green, fontSize: 12 }}>{participant.identity.name}</Text><Text style={styles.cardBody}>{participant.health.current}/{participant.health.max} HP{participant.defeated ? " · DEFEATED" : ""}</Text></View>)}</View>
    </View>
    <FlatList style={{ flex: 1, paddingHorizontal: 18 }} contentContainerStyle={{ paddingBottom: 12 }} data={messages} keyExtractor={(item) => item.id} renderItem={({ item }) => <Message item={item} />} ListEmptyComponent={<StatusMessage message="Waiting for combat events..." />} />
    <View style={{ padding: 14, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
      {active?.controller !== "manual" && snapshot.status === "ACTIVE" ? <StatusMessage message="The server is resolving the creature turn..." /> : null}
      {snapshot.status === "FINISHED" ? <><StatusMessage message="Combat finished." /><PrimaryButton title="Return to setup" onPress={returnToSetup} /></> : <>
        <TextInput style={[styles.input, { minHeight: 52 }]} value={draft} onChangeText={setDraft} placeholder="Ataco al goblin..." placeholderTextColor={colors.muted} multiline editable={!pending && active?.controller === "manual" && snapshot.status === "ACTIVE" && !error?.code?.includes("NETWORK")} returnKeyType="send" onSubmitEditing={submit} />
        {interpreting ? <StatusMessage message="Interpreting..." /> : null}
        {interpretation ? <Interpretation interpretation={interpretation} onSuggestion={suggestion} /> : null}
        <PrimaryButton title={pending ? "Sending..." : "Send command"} onPress={submit} disabled={!canSubmit} />
        {error ? <><StatusMessage error message={error.message} /><PrimaryButton title="Retry session" onPress={reload} disabled={pending} /></> : null}
      </>}
    </View>
  </KeyboardAvoidingView></SafeAreaView>;
}

function Message({ item }) { return <View style={{ alignSelf: item.origin === "player" ? "flex-end" : "flex-start", maxWidth: "90%", borderLeftWidth: 2, borderLeftColor: item.origin === "dice" ? colors.violet : item.origin === "player" ? colors.cyan : colors.border, padding: 10, marginBottom: 9, backgroundColor: colors.surface }}><Text style={{ color: colors.muted, fontSize: 10, textTransform: "uppercase" }}>{item.origin}</Text><Text style={{ color: colors.text, lineHeight: 20, marginTop: 4 }}>{item.text}</Text></View>; }
function Interpretation({ interpretation, onSuggestion }) { const message = { RESOLVED: "Resolved", INCOMPLETE: "Choose a target", AMBIGUOUS: "Multiple targets match", UNSUPPORTED: "This command is unsupported", INVALID_CONTEXT: "Invalid combat context" }[interpretation.status] ?? interpretation.status; const options = [...(interpretation.missing ?? []).flatMap((item) => item.suggestions ?? []), ...(interpretation.ambiguities ?? []).flatMap((item) => item.options ?? [])]; return <View><Text style={{ color: interpretation.status === "RESOLVED" ? colors.green : colors.orange, marginTop: 8 }}>{message}{interpretation.intent?.type ? ` · ${interpretation.intent.type}` : ""}</Text>{options.map((option) => <Pressable key={option.referenceId ?? option.name} onPress={() => onSuggestion(option.name)}><Text style={{ color: colors.cyan, paddingVertical: 7 }}>Use {option.name}</Text></Pressable>)}</View>; }
function maxSequence(events) { return events.reduce((max, event) => Math.max(max, Number(event.sequence) || 0), 0); }
