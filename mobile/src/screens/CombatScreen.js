import { useEffect, useMemo, useRef, useState } from "react";
import { AppState, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StatusBar, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMobileContext } from "../app/MobileContext.js";
import { mergeCombatEvents } from "../utilities/combatEvents.js";
import { createLocalCommandMessage, groupCombatMessages, toCombatMessages } from "../utilities/combatPresentation.js";
import { colors } from "../theme/colors.js";
import { styles } from "../theme/styles.js";
import { PrimaryButton } from "../components/PrimaryButton.js";
import { StatusMessage } from "../components/StatusMessage.js";

export function CombatScreen({ route, navigation }) {
  const { service } = useMobileContext();
  const { sessionId, scenario } = route.params;
  const insets = useSafeAreaInsets();
  const [snapshot, setSnapshot] = useState(route.params.snapshot);
  const [events, setEvents] = useState(mergeCombatEvents([], route.params.events ?? []));
  const [cursor, setCursor] = useState(maxSequence(route.params.events ?? []));
  const [draft, setDraft] = useState("");
  const [interpretation, setInterpretation] = useState(null);
  const [interpreting, setInterpreting] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const requestVersion = useRef(0);
  const localMessageCounter = useRef(0);
  const listRef = useRef(null);
  const nearBottom = useRef(true);

  useEffect(() => {
    if (!draft.trim()) { setInterpretation(null); setInterpreting(false); return undefined; }
    const version = ++requestVersion.current;
    setInterpreting(true);
    const timer = setTimeout(async () => {
      try {
        const result = await service.interpretCombatCommand(sessionId, draft);
        if (version === requestVersion.current) { setInterpretation(result); setInterpreting(false); }
      } catch (nextError) {
        if (version === requestVersion.current) { setError(nextError); setInterpreting(false); }
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [draft, service, sessionId]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") reload(); });
    return () => subscription.remove();
  }, [cursor, service, sessionId]);

  const active = useMemo(() => snapshot.participants.find((participant) => participant.entityId === snapshot.activeEntityId), [snapshot]);
  const disconnected = error?.code === "NETWORK_ERROR";
  const canSubmit = interpretation?.status === "RESOLVED" && !pending && !disconnected && active?.controller === "manual" && snapshot.status === "ACTIVE";
  const messages = useMemo(() => groupCombatMessages(toCombatMessages(events, snapshot)), [events, snapshot]);

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
    const submittingActor = active;
    setPending(true); setError(null);
    try {
      const result = await service.executeCombatCommand(sessionId, originalText);
      const localSequence = `${cursor}.${++localMessageCounter.current}`;
      setSnapshot(result.snapshot);
      setEvents((current) => mergeCombatEvents(current, [createLocalCommandMessage({ actor: submittingActor, sequence: localSequence, text: originalText })]));
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
  function openOverview() { Keyboard.dismiss(); setOverviewOpen(true); }

  return <View style={[styles.safe, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" backgroundColor={colors.background} />
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
      <View style={styles.combatTopBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Open combat overview" onPress={openOverview} style={styles.iconButton}><Text style={styles.menuIcon}>☰</Text></Pressable>
        <Text numberOfLines={1} style={styles.combatTopTitle}>{scenario?.name ?? "Encounter"}</Text>
      </View>
      <FlatList
        ref={listRef}
        style={styles.chatList}
        contentContainerStyle={styles.chatContent}
        data={messages}
        keyExtractor={(item) => item.id ? String(item.id) : String(item.sequence)}
        renderItem={({ item }) => <Message item={item} />}
        ListEmptyComponent={<StatusMessage message="Waiting for combat events..." />}
        onScroll={(event) => {
          const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
          nearBottom.current = contentSize.height - (layoutMeasurement.height + contentOffset.y) < 72;
        }}
        scrollEventThrottle={100}
        onContentSizeChange={() => { if (nearBottom.current) listRef.current?.scrollToEnd({ animated: true }); }}
      />
      <View style={[styles.composerArea, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {active?.controller !== "manual" && snapshot.status === "ACTIVE" ? <StatusMessage message="The server is resolving the creature turn..." /> : null}
        {snapshot.status === "FINISHED" ? <><StatusMessage message="Combat finished." /><PrimaryButton title="Return to setup" onPress={returnToSetup} /></> : <>
          {interpreting ? <StatusMessage message="Interpreting..." /> : null}
          {interpretation ? <Interpretation interpretation={interpretation} onSuggestion={suggestion} /> : null}
          <View style={styles.commandRow}>
            <TextInput
              style={styles.commandInput}
              value={draft}
              onChangeText={setDraft}
              placeholder="Escribe una acción..."
              placeholderTextColor={colors.muted}
              autoCapitalize="sentences"
              autoCorrect={false}
              returnKeyType="send"
              blurOnSubmit
              onSubmitEditing={() => { if (canSubmit) submit(); }}
              editable={!pending && !disconnected && active?.controller === "manual" && snapshot.status === "ACTIVE"}
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Send command" onPress={submit} disabled={!canSubmit} style={[styles.sendButton, !canSubmit && styles.buttonDisabled]}><Text style={styles.sendIcon}>↑</Text></Pressable>
          </View>
          {error ? <><StatusMessage error message={error.message} /><PrimaryButton title="Retry session" onPress={reload} disabled={pending} /></> : null}
        </>}
      </View>
    </KeyboardAvoidingView>
    <CombatOverview visible={overviewOpen} onClose={() => setOverviewOpen(false)} snapshot={snapshot} scenario={scenario} insets={insets} />
  </View>;
}

function Message({ item }) {
  const isDice = item.senderKind === "dice";
  return <View style={[styles.message, item.alignment === "right" ? styles.messageRight : styles.messageLeft, isDice && styles.messageDice]}>
    {item.showSenderLabel ? <Text style={styles.messageSender}>{item.senderName}</Text> : null}
    <Text style={styles.messageText}>{item.text}</Text>
  </View>;
}

function Interpretation({ interpretation, onSuggestion }) {
  const message = { RESOLVED: "Resolved", INCOMPLETE: "Choose a target", AMBIGUOUS: "Multiple targets match", UNSUPPORTED: "This command is unsupported", INVALID_CONTEXT: "Invalid combat context" }[interpretation.status] ?? interpretation.status;
  const options = [...(interpretation.missing ?? []).flatMap((item) => item.suggestions ?? []), ...(interpretation.ambiguities ?? []).flatMap((item) => item.options ?? [])];
  return <View><Text style={{ color: interpretation.status === "RESOLVED" ? colors.green : colors.orange, marginTop: 6 }}>{message}{interpretation.intent?.type ? ` · ${interpretation.intent.type}` : ""}</Text>{options.map((option) => <Pressable key={option.referenceId ?? option.name} onPress={() => onSuggestion(option.name)}><Text style={{ color: colors.cyan, paddingVertical: 5 }}>Use {option.name}</Text></Pressable>)}</View>;
}

function CombatOverview({ visible, onClose, snapshot, scenario, insets }) {
  const characters = snapshot.participants.filter((participant) => participant.identity.kind === "character");
  const friendly = snapshot.participants.filter((participant) => participant.identity.kind !== "character" && !isHostile(participant));
  const hostile = snapshot.participants.filter(isHostile);
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
    <Pressable style={styles.overviewBackdrop} onPress={onClose} accessibilityLabel="Close combat overview">
      <Pressable style={[styles.overviewPanel, { marginTop: insets.top + 8, marginBottom: Math.max(insets.bottom, 8) }]} onPress={(event) => event.stopPropagation()}>
        <View style={styles.overviewHeader}><Text style={styles.overviewTitle}>Combat overview</Text><Pressable accessibilityRole="button" accessibilityLabel="Close combat overview" onPress={onClose} style={styles.closeButton}><Text style={styles.closeText}>×</Text></Pressable></View>
        <ScrollView contentContainerStyle={styles.overviewContent}>
          <Text style={styles.overviewMeta}>ROUND {snapshot.round} · {snapshot.status}{activeLabel(snapshot)}</Text>
          <OverviewSection title="Characters" participants={characters} activeEntityId={snapshot.activeEntityId} />
          <OverviewSection title="Friendly" participants={friendly} activeEntityId={snapshot.activeEntityId} />
          <OverviewSection title="Hostile" participants={hostile} activeEntityId={snapshot.activeEntityId} hostile />
          <Text style={styles.overviewSectionTitle}>Scenario</Text>
          <Text style={styles.overviewName}>{scenario?.name ?? "Encounter"}</Text>
          {scenario?.description ? <Text style={styles.overviewBody}>{scenario.description}</Text> : null}
          {scenario?.startingDistance ? <Text style={styles.overviewBody}>Distance: {scenario.startingDistance} ft</Text> : null}
        </ScrollView>
      </Pressable>
    </Pressable>
  </Modal>;
}

function OverviewSection({ title, participants, activeEntityId, hostile = false }) {
  if (!participants.length) return null;
  return <View><Text style={[styles.overviewSectionTitle, hostile && { color: colors.red }]}>{title}</Text>{participants.map((participant) => <View key={participant.entityId} style={styles.overviewParticipant}><View style={{ flex: 1 }}><Text style={styles.overviewName}>{participant.identity.name}</Text><Text style={styles.overviewBody}>{participant.controller === "manual" ? "Player controlled" : "Server controlled"}{participant.entityId === activeEntityId ? " · Active" : ""}</Text></View><Text style={[styles.overviewBody, participant.defeated && { color: colors.red }]}>{participant.defeated ? "Defeated" : `${participant.health.current} / ${participant.health.max} HP`}</Text></View>)}</View>;
}

function activeLabel(snapshot) {
  const active = snapshot.participants.find((participant) => participant.entityId === snapshot.activeEntityId);
  return active ? ` · Active: ${active.identity.name}` : "";
}

function isHostile(participant) {
  const faction = String(participant.faction ?? "").toLowerCase();
  return faction === "monsters" || faction === "hostiles" || faction === "enemies" || faction === "enemy";
}

function maxSequence(events) { return events.reduce((max, event) => Math.max(max, Number(event.sequence) || 0), 0); }
