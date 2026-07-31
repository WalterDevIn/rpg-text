import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { usePreventRemove } from "@react-navigation/native";
import { useMobileContext } from "../app/MobileContext.js";
import { participantLabel } from "../state/encounterDraft.js";
import { colors } from "../theme/colors.js";
import { styles } from "../theme/styles.js";
import { PrimaryButton } from "../components/PrimaryButton.js";
import { StatusMessage } from "../components/StatusMessage.js";
import { clearEncounterDraft, saveActiveSession } from "../storage/serverStorage.js";

const PARTY = "party";
const HOSTILES = "hostiles";

function useCatalog(service) {
  const [catalog, setCatalog] = useState({ characters: [], creatures: [], scenarios: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    Promise.all([service.listEncounterCharacters(), service.listEncounterCreatures(), service.listEncounterScenarios()])
      .then(([characters, creatures, scenarios]) => active && setCatalog({ characters: characters.characters, creatures: creatures.creatures, scenarios: scenarios.scenarios }))
      .catch((nextError) => active && setError(nextError.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [service]);
  return { catalog, loading, error };
}

function Shell({ step, title, subtitle, children }) {
  return <SafeAreaView style={styles.safe}><ScrollView style={styles.screen} contentContainerStyle={styles.content}><Progress step={step} /><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{subtitle}</Text>{children}</ScrollView></SafeAreaView>;
}

function Progress({ step }) {
  const labels = ["Participants", "Scenario", "Rules", "Review"];
  return <View style={styles.progress}><Text style={styles.eyebrow}>RPG TEXT / NEW COMBAT</Text><Text style={styles.progressLabel}>Step {step} of 4 · {labels[step - 1]}</Text><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${step * 25}%` }]} /></View></View>;
}

function Choice({ entry, selected, onPress, hostile = false }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.card, selected && styles.cardSelected, hostile && selected && styles.cardHostile]}><Text style={styles.cardTitle}>{selected ? "[x] " : "[ ] "}{entry.name}</Text><Text style={styles.cardBody}>{entry.description ?? `${entry.kind ?? "participant"} · HP ${entry.hitPoints?.current ?? entry.hitPoints ?? "?"}`}</Text><Text style={styles.cardMeta}>{String(entry.kind ?? "").toUpperCase()} · AC {entry.armorClass ?? "-"}</Text></Pressable>;
}

function StepButtons({ navigation, next, nextLabel = "Next", disabled = false }) {
  return <View><PrimaryButton title="Back" onPress={() => navigation.goBack()} /><PrimaryButton title={nextLabel} onPress={() => navigation.navigate(next)} disabled={disabled} /></View>;
}

export function ParticipantsScreen({ navigation }) {
  const { service, draft, setDraft } = useMobileContext();
  const { catalog, loading, error } = useCatalog(service);
  function add(entry, side) {
    const count = draft.participants.filter((participant) => participant.sourceId === entry.id).length;
    const instanceKey = `${entry.id}-${count + 1}`;
    setDraft({ ...draft, participants: [...draft.participants, { instanceKey, sourceId: entry.id, displayName: entry.name, participantKind: entry.kind, side, controller: entry.controller ?? (side === PARTY ? "manual" : "ai") }], currentStep: 1 });
  }
  function remove(instanceKey) { setDraft({ ...draft, participants: draft.participants.filter((participant) => participant.instanceKey !== instanceKey) }); }
  function update(instanceKey, patch) { setDraft({ ...draft, participants: draft.participants.map((participant) => participant.instanceKey === instanceKey ? { ...participant, ...patch } : participant) }); }
  const group = draft.participants.filter((participant) => participant.side === PARTY);
  const opponents = draft.participants.filter((participant) => participant.side === HOSTILES);
  const valid = group.length > 0 && opponents.length > 0 && draft.participants.every((participant) => participant.controller && participant.side);
  usePreventRemove(draft.participants.length > 0, ({ data }) => Alert.alert("Leave setup?", "Your current participant selections will remain saved locally.", [{ text: "Stay", style: "cancel" }, { text: "Leave", style: "destructive", onPress: () => navigation.dispatch(data.action) }]));
  if (loading) return <SafeAreaView style={styles.safe}><ActivityIndicator color={colors.cyan} style={{ marginTop: 50 }} /></SafeAreaView>;
  return <Shell step={1} title="Compose the encounter" subtitle="Choose real server content, then assign each participant independently to a side and controller.">
    <ParticipantSection title="Your Group" participants={group} all={draft.participants} onRemove={remove} onUpdate={update} />
    <ParticipantSection title="Opponents" participants={opponents} all={draft.participants} onRemove={remove} onUpdate={update} hostile />
    <Text style={styles.sectionTitle}>Add participant</Text>
    {catalog.characters.map((entry) => <Choice key={`party-${entry.id}`} entry={entry} onPress={() => add(entry, PARTY)} />)}
    {catalog.creatures.map((entry) => <Choice key={`hostile-${entry.id}`} entry={entry} hostile onPress={() => add(entry, HOSTILES)} />)}
    <PrimaryButton title="Add from catalog" onPress={() => navigation.navigate("AddParticipants")} />
    <PrimaryButton title="Create new · coming later" disabled onPress={() => {}} />
    <StatusMessage error message={error} />
    <StepButtons navigation={navigation} next="NewCombatScenario" nextLabel="Continue to scenario" disabled={!valid} />
  </Shell>;
}

function ParticipantSection({ title, participants, all, onRemove, onUpdate, hostile }) {
  return <View><Text style={[styles.sectionTitle, hostile && { color: colors.red }]}>{title}</Text>{participants.length ? participants.map((participant) => <View key={participant.instanceKey} style={[styles.card, hostile && styles.cardHostile]}><Text style={styles.cardTitle}>{participantLabel(participant, all)}</Text><Text style={styles.cardMeta}>{participant.participantKind.toUpperCase()} · {participant.side === PARTY ? "YOUR GROUP" : "OPPONENT"}</Text><View style={styles.choiceRow}><Text style={styles.cardBody}>Controller</Text><Pressable accessibilityRole="button" onPress={() => onUpdate(participant.instanceKey, { controller: "manual" })} style={[styles.smallChoice, participant.controller === "manual" && styles.smallChoiceSelected]}><Text style={styles.smallChoiceText}>You</Text></Pressable><Pressable accessibilityRole="button" onPress={() => onUpdate(participant.instanceKey, { controller: "ai" })} style={[styles.smallChoice, participant.controller === "ai" && styles.smallChoiceSelected]}><Text style={styles.smallChoiceText}>AI</Text></Pressable></View><View style={styles.choiceRow}><Text style={styles.cardBody}>Side</Text><Pressable accessibilityRole="button" onPress={() => onUpdate(participant.instanceKey, { side: PARTY })} style={[styles.smallChoice, participant.side === PARTY && styles.smallChoiceSelected]}><Text style={styles.smallChoiceText}>Group</Text></Pressable><Pressable accessibilityRole="button" onPress={() => onUpdate(participant.instanceKey, { side: HOSTILES })} style={[styles.smallChoice, participant.side === HOSTILES && styles.smallChoiceSelected]}><Text style={styles.smallChoiceText}>Opponents</Text></Pressable></View><Pressable accessibilityRole="button" onPress={() => onRemove(participant.instanceKey)}><Text style={styles.removeText}>Remove participant</Text></Pressable></View>) : <Text style={styles.status}>No participants selected.</Text>}</View>;
}

export function AddParticipantsScreen({ navigation }) {
  const { service, draft, setDraft } = useMobileContext();
  const { catalog, loading, error } = useCatalog(service);
  function add(entry, side) { const count = draft.participants.filter((participant) => participant.sourceId === entry.id).length; setDraft({ ...draft, participants: [...draft.participants, { instanceKey: `${entry.id}-${count + 1}`, sourceId: entry.id, displayName: entry.name, participantKind: entry.kind, side, controller: entry.controller ?? (side === PARTY ? "manual" : "ai") }] }); navigation.goBack(); }
  function Addable({ entry }) { return <View><Choice entry={entry} onPress={() => add(entry, PARTY)} /><PrimaryButton title="Add to opponents" onPress={() => add(entry, HOSTILES)} /></View>; }
  if (loading) return <SafeAreaView style={styles.safe}><ActivityIndicator color={colors.cyan} style={{ marginTop: 50 }} /></SafeAreaView>;
  return <Shell step={1} title="Add participant" subtitle="Choose a real character or creature, then return to composition. Duplicate templates receive separate encounter instance keys."><Text style={styles.sectionTitle}>Characters</Text>{catalog.characters.map((entry) => <Addable key={`character-${entry.id}`} entry={entry} />)}<Text style={styles.sectionTitle}>Creatures</Text>{catalog.creatures.map((entry) => <Addable key={`creature-${entry.id}`} entry={entry} />)}<PrimaryButton title="Open Creation Hub" onPress={() => navigation.navigate("CreationHub", { returnTo: "AddParticipants" })} /><StatusMessage error message={error} /><PrimaryButton title="Back to participants" onPress={() => navigation.goBack()} /></Shell>;
}

export function ScenarioScreen({ navigation }) {
  const { service, draft, setDraft } = useMobileContext();
  const { catalog, loading, error } = useCatalog(service);
  if (loading) return <SafeAreaView style={styles.safe}><ActivityIndicator color={colors.cyan} style={{ marginTop: 50 }} /></SafeAreaView>;
  return <Shell step={2} title="Choose a scenario" subtitle="Scenarios are server-defined metadata. Open Field currently does not modify combat mechanics.">{catalog.scenarios.map((entry) => <Choice key={entry.id} entry={entry} selected={draft.scenarioId === entry.id} onPress={() => setDraft({ ...draft, scenarioId: entry.id, currentStep: 2 })} />)}<StatusMessage error message={error} /><StepButtons navigation={navigation} next="NewCombatRules" nextLabel="Continue to rules" disabled={!draft.scenarioId} /></Shell>;
}

export function RulesScreen({ navigation }) {
  const { draft, setDraft } = useMobileContext();
  return <Shell step={3} title="Review the rules" subtitle="Only server-supported settings are configurable. Foundational combat rules remain authoritative and fixed."><Text style={styles.sectionTitle}>Basic rules</Text><View style={styles.card}><Text style={styles.cardBody}>• Turn-based combat</Text><Text style={styles.cardBody}>• Server-authoritative actions</Text><Text style={styles.cardBody}>• Attack, Dodge, and Pass</Text><Text style={styles.cardBody}>• HP, defeat, and victory</Text><Text style={styles.status}>No optional mechanical rules are available yet.</Text></View><Text style={styles.sectionTitle}>Deterministic seed</Text><Pressable style={styles.card} onPress={() => setDraft({ ...draft, ruleConfiguration: { ...draft.ruleConfiguration, seed: draft.ruleConfiguration.seed === 2026 ? 7 : 2026 }, currentStep: 3 })}><Text style={styles.cardTitle}>Seed {draft.ruleConfiguration.seed}</Text><Text style={styles.cardBody}>Tap to switch the reproducible encounter seed.</Text></Pressable><StepButtons navigation={navigation} next="NewCombatReview" nextLabel="Continue to review" /></Shell>;
}

export function ReviewScreen({ navigation }) {
  const { service, draft } = useMobileContext();
  const [working, setWorking] = useState(false); const [validation, setValidation] = useState(null); const [error, setError] = useState(null);
  const input = { participants: draft.participants, scenarioId: draft.scenarioId, ruleConfiguration: draft.ruleConfiguration, seed: draft.ruleConfiguration.seed };
  async function start() { setWorking(true); setError(null); try { const checked = await service.validateEncounterSetup(input); setValidation(checked); if (!checked.ok) return; const created = await service.createCombatSession(input); await saveActiveSession({ sessionId: created.sessionId, scenario: created.scenario, snapshot: created.snapshot, nextEventCursor: created.nextEventCursor }); await clearEncounterDraft(); navigation.replace("Combat", { sessionId: created.sessionId, snapshot: created.snapshot, events: created.events ?? [], scenario: created.scenario }); } catch (nextError) { setError(nextError.message); } finally { setWorking(false); } }
  return <Shell step={4} title="Review encounter" subtitle="The server validates this exact setup before a real combat session is created."><ReviewSection title="Your Group" participants={draft.participants.filter((participant) => participant.side === PARTY)} all={draft.participants} onEdit={() => navigation.navigate("NewCombatParticipants")} /><ReviewSection title="Opponents" participants={draft.participants.filter((participant) => participant.side === HOSTILES)} all={draft.participants} onEdit={() => navigation.navigate("NewCombatParticipants")} hostile /><View style={styles.choiceRow}><Text style={styles.sectionTitle}>Scenario</Text><EditButton onPress={() => navigation.navigate("NewCombatScenario")} /></View><Text style={styles.status}>{draft.scenarioId ?? "Not selected"}</Text><View style={styles.choiceRow}><Text style={styles.sectionTitle}>Rules</Text><EditButton onPress={() => navigation.navigate("NewCombatRules")} /></View><Text style={styles.status}>Basic · seed {draft.ruleConfiguration.seed}</Text><PrimaryButton title={working ? "Validating..." : "Validate and start combat"} onPress={start} disabled={working} /><StatusMessage error message={validation && !validation.ok ? validation.errors.map((item) => item.message).join(" ") : null} /><StatusMessage error message={error} /><PrimaryButton title="Back" onPress={() => navigation.goBack()} /></Shell>;
}

function ReviewSection({ title, participants, all, onEdit, hostile }) { return <View><View style={styles.choiceRow}><Text style={[styles.sectionTitle, hostile && { color: colors.red }]}>{title}</Text><EditButton onPress={onEdit} /></View>{participants.length ? participants.map((participant) => <Text key={participant.instanceKey} style={styles.status}>{participantLabel(participant, all)} · Controlled by {participant.controller === "manual" ? "You" : "AI"}</Text>) : <Text style={styles.status}>None selected.</Text>}</View>; }
function EditButton({ onPress }) { return <Pressable accessibilityRole="button" onPress={onPress}><Text style={styles.editText}>Edit</Text></Pressable>; }
