import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, AppState, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StatusBar, Switch, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMobileContext } from "../app/MobileContext.js";
import { mergeCombatEvents } from "../utilities/combatEvents.js";
import { annotationsToSegments, createLocalCommandMessage, groupCombatMessages, toCombatMessages } from "../utilities/combatPresentation.js";
import { createMobileAudioManager } from "../audio/audioManager.js";
import { createMobilePresentationPreferences } from "../audio/audioPreferences.js";
import { createMobilePresentationQueue } from "../audio/messagePresentationQueue.js";
import { SemanticInspector } from "../components/SemanticInspector.js";
import { SemanticText } from "../components/SemanticText.js";
import { colors } from "../theme/colors.js";
import { styles } from "../theme/styles.js";
import { PrimaryButton } from "../components/PrimaryButton.js";
import { StatusMessage } from "../components/StatusMessage.js";
import { clearActiveSession, saveActiveSession } from "../storage/serverStorage.js";

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
  const [inspector, setInspector] = useState(null);
  const [presentedRecords, setPresentedRecords] = useState([]);
  const [presentationPreferences, setPresentationPreferences] = useState(null);
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  const requestVersion = useRef(0);
  const localMessageCounter = useRef(0);
  const draftRef = useRef("");
  const programmaticDraft = useRef(false);
  const listRef = useRef(null);
  const nearBottom = useRef(true);
  const preferences = useMemo(() => createMobilePresentationPreferences(), []);
  const audioManager = useMemo(() => createMobileAudioManager({ preferences }), [preferences]);
  const presentationQueue = useMemo(() => createMobilePresentationQueue({
    audioManager,
    preferences,
    reducedMotion: systemReducedMotion,
    onChange: setPresentedRecords,
    onAnnounce: (message) => AccessibilityInfo.announceForAccessibility?.(message),
  }), [audioManager, preferences]);

  useEffect(() => {
    let active = true;
    preferences.load().then((values) => { if (active) setPresentationPreferences(values); });
    const unsubscribe = preferences.subscribe((values) => { if (active) setPresentationPreferences(values); });
    const reduceMotion = AccessibilityInfo.isReduceMotionEnabled?.();
    reduceMotion?.then((value) => { if (active) setSystemReducedMotion(Boolean(value)); });
    const motionSubscription = AccessibilityInfo.addEventListener?.("reduceMotionChanged", setSystemReducedMotion);
    return () => { active = false; unsubscribe(); motionSubscription?.remove?.(); };
  }, [preferences]);

  useEffect(() => {
    presentationQueue.enqueue(toCombatMessages(route.params.events ?? [], route.params.snapshot), { historical: true });
    return () => presentationQueue.dispose();
  }, [presentationQueue, route.params.events, route.params.snapshot]);

  useEffect(() => { presentationQueue.setReducedMotion(systemReducedMotion); }, [presentationQueue, systemReducedMotion]);

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
  const canSubmit = interpretation?.status === "RESOLVED" && !pending && !disconnected && active?.controller === "manual" && snapshot.status === "ACTIVE" && Boolean(draft.trim());
  const messages = useMemo(() => groupCombatMessages(toCombatMessages(presentedRecords, snapshot)), [presentedRecords, snapshot]);

  async function reload() {
    try {
      const current = await service.getCombatSession(sessionId);
      const missing = await service.getCombatEvents(sessionId, { since: cursor });
       setSnapshot(current.snapshot); appendEvents(missing.events ?? [], current.snapshot); await saveActiveSession({ sessionId, scenario, snapshot: current.snapshot, nextEventCursor: missing.nextEventCursor ?? cursor });
      setError(null);
    } catch (nextError) { setError(nextError); }
  }

  function appendEvents(nextEvents, nextSnapshot = snapshot) {
    setEvents((current) => mergeCombatEvents(current, nextEvents));
    setCursor((current) => Math.max(current, maxSequence(nextEvents)));
    presentationQueue.enqueue(toCombatMessages(nextEvents, nextSnapshot));
  }

  async function submit() {
    if (!canSubmit) return;
    const originalText = draft;
    const submittingActor = active;
    const submittedInterpretation = interpretation;
    setPending(true); setError(null);
    try {
      const result = await service.executeCombatCommand(sessionId, originalText);
      const localSequence = `${cursor}.${++localMessageCounter.current}`;
       setSnapshot(result.snapshot);
      const localMessage = createLocalCommandMessage({ actor: submittingActor, sequence: localSequence, text: originalText, interpretation: submittedInterpretation });
      setEvents((current) => mergeCombatEvents(current, [localMessage]));
      presentationQueue.enqueue([localMessage]);
       appendEvents(result.events ?? [], result.snapshot); await saveActiveSession({ sessionId, scenario, snapshot: result.snapshot, nextEventCursor: result.nextEventCursor ?? maxSequence(result.events ?? []) });
      setDraftValue(""); setInterpretation(null);
    } catch (nextError) {
      setError(nextError);
      if (nextError.data?.interpretation) setInterpretation(nextError.data.interpretation);
      if (nextError.data?.snapshot) setSnapshot(nextError.data.snapshot);
      if (nextError.data?.events) appendEvents(nextError.data.events, nextError.data.snapshot ?? snapshot);
    } finally { setPending(false); }
  }

  function setDraftValue(value) { programmaticDraft.current = true; draftRef.current = value; setDraft(value); setTimeout(() => { programmaticDraft.current = false; }, 0); }
  function handleDraftChange(value) {
    const previous = draftRef.current;
    draftRef.current = value;
    setDraft(value);
    if (!programmaticDraft.current && insertedText(previous, value)) audioManager.playInputCharacter();
    programmaticDraft.current = false;
  }
  function suggestion(name) {
    const replacement = draft.match(/\b(?:al|a|la|el)\s+[^,.!?]*$/i);
    setDraftValue(replacement ? `${draft.slice(0, replacement.index)}al ${name}` : `${draft.trim()} ${name}`.trim());
  }
  async function returnToHome() { if (snapshot.status === "FINISHED") await clearActiveSession(); navigation.replace("Home"); }
  function openOverview() { Keyboard.dismiss(); setOverviewOpen(true); }
  function updatePreference(next) { const values = preferences.update(next); setPresentationPreferences(values); if (next.textAnimationEnabled === false) presentationQueue.showAll(); }
  function openReference(reference) { setInspector(reference); }

  return <View style={[styles.safe, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" backgroundColor={colors.background} />
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
      <View style={styles.combatTopBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Open combat overview" onPress={openOverview} style={styles.iconButton}><Text style={styles.menuIcon}>☰</Text></Pressable>
        <Text numberOfLines={1} style={styles.combatTopTitle}>{scenario?.name ?? "Encounter"}</Text>
        {presentationQueue.isPresenting ? <Pressable accessibilityRole="button" accessibilityLabel="Skip message" onPress={() => presentationQueue.skip()} style={styles.skipButton}><Text style={styles.skipText}>Skip</Text></Pressable> : null}
      </View>
      <FlatList
        ref={listRef}
        style={styles.chatList}
        contentContainerStyle={styles.chatContent}
        data={messages}
        keyExtractor={(item) => item.id ? String(item.id) : String(item.sequence)}
        renderItem={({ item }) => <Message item={item} onReference={openReference} />}
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
        {snapshot.status === "FINISHED" ? <><StatusMessage message="Combat finished." /><PrimaryButton title="Return to home" onPress={returnToHome} /></> : <>
          {interpreting ? <StatusMessage message="Interpreting..." /> : null}
          {interpretation ? <Interpretation interpretation={interpretation} snapshot={snapshot} onSuggestion={suggestion} onReference={openReference} /> : null}
          <TextInput
            style={styles.commandInput}
            value={draft}
            onChangeText={handleDraftChange}
            placeholder="Escribe una acción..."
            placeholderTextColor={colors.muted}
            autoCapitalize="sentences"
            autoCorrect={false}
            returnKeyType="send"
            enterKeyHint="send"
            blurOnSubmit
            onSubmitEditing={() => { if (canSubmit) submit(); }}
            accessibilityLabel="Spanish combat command"
            accessibilityHint="Enter a Spanish combat command. When the command is resolved, press Send on the keyboard."
            editable={!pending && !disconnected && active?.controller === "manual" && snapshot.status === "ACTIVE"}
          />
          {canSubmit ? <Text style={styles.keyboardHint}>Press Send on the keyboard</Text> : null}
          {error ? <><StatusMessage error message={error.message} /><PrimaryButton title="Retry session" variant="secondary" onPress={reload} disabled={pending} /></> : null}
        </>}
      </View>
    </KeyboardAvoidingView>
    <CombatOverview visible={overviewOpen} onClose={() => setOverviewOpen(false)} onLeave={returnToHome} snapshot={snapshot} scenario={scenario} insets={insets} preferences={presentationPreferences} onPreferenceChange={updatePreference} />
    <SemanticInspector reference={inspector} onClose={() => setInspector(null)} insets={insets} />
  </View>;
}

function Message({ item, onReference }) {
  const segments = item.visibleSegments ?? item.segments ?? [{ text: item.text ?? "" }];
  const isDice = item.senderKind === "dice";
  const isCreature = item.senderKind === "actor:creature";
  return <View style={[styles.message, item.alignment === "right" ? styles.messageRight : styles.messageLeft, isDice && styles.messageDice, isCreature && styles.messageCreature, !item.showSenderLabel && styles.messageGrouped]} accessibilityLabel={item.phase === "complete" ? segments.map((segment) => segment.text ?? "").join("") : undefined}>
    {item.showSenderLabel ? <Text style={styles.messageSender}>{item.senderName}</Text> : null}
    <SemanticText segments={segments} references={item.references} onReference={onReference} style={styles.messageText} />
  </View>;
}

function Interpretation({ interpretation, snapshot, onSuggestion, onReference }) {
  const actor = snapshot.participants.find((participant) => participant.entityId === interpretation.intent?.actorId);
  const target = snapshot.participants.find((participant) => participant.entityId === interpretation.intent?.targetId);
  const message = { RESOLVED: "Resolved", INCOMPLETE: "Choose a target", AMBIGUOUS: "Multiple targets match", UNSUPPORTED: "This command is unsupported", INVALID_CONTEXT: "Invalid combat context" }[interpretation.status] ?? interpretation.status;
  const segments = annotationsToSegments(interpretation.originalText ?? "", interpretation.annotations ?? [], interpretation.references ?? {});
  const options = [...(interpretation.missing ?? []).flatMap((item) => item.suggestions ?? []), ...(interpretation.ambiguities ?? []).flatMap((item) => item.options ?? [])];
  return <View style={styles.interpretationBox}>
    {segments.length ? <SemanticText segments={segments} references={interpretation.references} onReference={onReference} accessibilityLabel="Authoritative semantic command preview" /> : null}
     <Text style={interpretation.status === "RESOLVED" ? styles.interpretationResolved : styles.interpretationWarning}>{message}{interpretation.intent?.type ? ` · ${interpretation.intent.type}` : ""}</Text>
    {actor ? <Text style={styles.interpretationDetail}>Actor: {actor.identity.name}</Text> : null}
    {target ? <Text style={styles.interpretationDetail}>Target: {target.identity.name}</Text> : null}
    {interpretation.message ? <Text style={styles.interpretationDetail}>{interpretation.message}</Text> : null}
    {options.map((option) => <Pressable key={option.referenceId ?? option.name} accessibilityRole="button" onPress={() => onSuggestion(option.name)} style={styles.suggestionChip}><Text style={styles.suggestionText}>{option.name}</Text>{option.description ? <Text style={styles.suggestionDetail}>{option.description}</Text> : null}</Pressable>)}
  </View>;
}

function CombatOverview({ visible, onClose, onLeave, snapshot, scenario, insets, preferences, onPreferenceChange }) {
  const characters = snapshot.participants.filter((participant) => participant.identity.kind === "character");
  const friendly = snapshot.participants.filter((participant) => participant.identity.kind !== "character" && !isHostile(participant));
  const hostile = snapshot.participants.filter(isHostile);
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
    <Pressable style={styles.overviewBackdrop} onPress={onClose} accessibilityLabel="Close combat overview">
      <Pressable style={[styles.overviewPanel, { marginTop: insets.top + 8, marginBottom: Math.max(insets.bottom, 8) }]} onPress={(event) => event.stopPropagation()} accessibilityViewIsModal>
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
           <PresentationSettings preferences={preferences} onChange={onPreferenceChange} />
           <PrimaryButton title="Return to home" onPress={onLeave} />
        </ScrollView>
      </Pressable>
    </Pressable>
  </Modal>;
}

function PresentationSettings({ preferences, onChange }) {
  if (!preferences) return null;
  return <View style={styles.presentationSettings}><Text style={styles.overviewSectionTitle}>Presentation</Text><SettingRow label="Sound" value={preferences.soundEnabled} onChange={(value) => onChange({ soundEnabled: value })} /><SettingRow label="Text animation" value={preferences.textAnimationEnabled} onChange={(value) => onChange({ textAnimationEnabled: value })} /><SettingRow label="Reduced motion" value={preferences.reducedMotion} onChange={(value) => onChange({ reducedMotion: value })} /><View style={styles.volumeRow}><Text style={styles.overviewBody}>Master volume {Math.round(preferences.masterVolume * 100)}%</Text><View style={styles.volumeControls}><Pressable accessibilityRole="button" accessibilityLabel="Decrease master volume" onPress={() => onChange({ masterVolume: Math.max(0, preferences.masterVolume - 0.1) })}><Text style={styles.volumeButton}>−</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Increase master volume" onPress={() => onChange({ masterVolume: Math.min(1, preferences.masterVolume + 0.1) })}><Text style={styles.volumeButton}>+</Text></Pressable></View></View></View>;
}

function SettingRow({ label, value, onChange }) { return <View style={styles.settingRow}><Text style={styles.overviewBody}>{label}</Text><Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ false: colors.border, true: colors.cyan }} thumbColor={colors.text} /></View>; }

function activeLabel(snapshot) { const active = snapshot.participants.find((participant) => participant.entityId === snapshot.activeEntityId); return active ? ` · Active: ${active.identity.name}` : ""; }
function isHostile(participant) { const faction = String(participant.faction ?? "").toLowerCase(); return faction === "monsters" || faction === "hostiles" || faction === "enemies" || faction === "enemy"; }
function OverviewSection({ title, participants, activeEntityId, hostile = false }) { if (!participants.length) return null; return <View><Text style={[styles.overviewSectionTitle, hostile && { color: colors.red }]}>{title}</Text>{participants.map((participant) => <View key={participant.entityId} style={styles.overviewParticipant}><View style={{ flex: 1 }}><Text style={styles.overviewName}>{participant.identity.name}</Text><Text style={styles.overviewBody}>{participant.controller === "manual" ? "Player controlled" : "Server controlled"}{participant.entityId === activeEntityId ? " · Active" : ""}</Text></View><Text style={[styles.overviewBody, participant.defeated && { color: colors.red }]}>{participant.defeated ? "Defeated" : `${participant.health.current} / ${participant.health.max} HP`}</Text></View>)}</View>; }
function maxSequence(events) { return events.reduce((max, event) => Math.max(max, Number(event.sequence) || 0), 0); }
function insertedText(previous, next) { return next.length > previous.length && (next.startsWith(previous) || previous.length === 0); }
