import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useMobileContext } from "../app/MobileContext.js";
import { PrimaryButton } from "../components/PrimaryButton.js";
import { StatusMessage } from "../components/StatusMessage.js";
import { colors } from "../theme/colors.js";
import { styles } from "../theme/styles.js";

export function EncounterSetupScreen({ navigation }) {
  const { service } = useMobileContext();
  const [catalog, setCatalog] = useState({ characters: [], creatures: [], scenarios: [] });
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedCreatures, setSelectedCreatures] = useState([]);
  const [scenarioId, setScenarioId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState(null);
  const [validation, setValidation] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([service.listEncounterCharacters(), service.listEncounterCreatures(), service.listEncounterScenarios()]).then(([characters, creatures, scenarios]) => {
      if (active) setCatalog({ characters: characters.characters, creatures: creatures.creatures, scenarios: scenarios.scenarios });
    }).catch((nextError) => { if (active) setError(nextError.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [service]);

  function toggleCreature(id) { setSelectedCreatures((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]); setValidation(null); }
  function input() { return { characterIds: selectedCharacter ? [selectedCharacter] : [], creatureIds: selectedCreatures, assignments: selectedCharacter ? { [selectedCharacter]: "party", ...Object.fromEntries(selectedCreatures.map((id) => [id, "hostiles"])) } : {}, scenarioId }; }

  async function start() {
    setWorking(true); setError(null); setValidation(null);
    try {
      const setup = input();
      const checked = await service.validateEncounterSetup(setup);
      setValidation(checked);
      if (!checked.ok) return;
      const created = await service.createCombatSession({ ...setup, seed: 2026 });
      navigation.replace("Combat", { sessionId: created.sessionId, snapshot: created.snapshot, events: created.events ?? [], scenario: created.scenario });
    } catch (nextError) { setError(nextError.message); }
    finally { setWorking(false); }
  }

  if (loading) return <SafeAreaView style={styles.safe}><ActivityIndicator color={colors.cyan} style={{ marginTop: 50 }} /></SafeAreaView>;
  return <SafeAreaView style={styles.safe}><ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={styles.eyebrow}>RPG TEXT / ENCOUNTER</Text><Text style={styles.title}>Encounter setup</Text><Text style={styles.subtitle}>Build a real server-validated combat session.</Text>
    <Text style={styles.sectionTitle}>1. Character</Text>
    {catalog.characters.map((entry) => <ChoiceCard key={entry.id} entry={entry} selected={selectedCharacter === entry.id} onPress={() => { setSelectedCharacter(entry.id); setValidation(null); }} />)}
    <Text style={styles.sectionTitle}>2. Creatures</Text>
    {catalog.creatures.map((entry) => <ChoiceCard key={entry.id} entry={entry} selected={selectedCreatures.includes(entry.id)} hostile onPress={() => toggleCreature(entry.id)} />)}
    <Text style={styles.sectionTitle}>3. Scenario</Text>
    {catalog.scenarios.map((entry) => <ChoiceCard key={entry.id} entry={entry} selected={scenarioId === entry.id} onPress={() => { setScenarioId(entry.id); setValidation(null); }} />)}
    <PrimaryButton title={working ? "Starting..." : "Validate and start combat"} onPress={start} disabled={working || !selectedCharacter || !selectedCreatures.length || !scenarioId} />
    {working ? <ActivityIndicator color={colors.cyan} style={{ marginTop: 16 }} /> : null}
    {validation && !validation.ok ? <StatusMessage error message={validation.errors.map((item) => item.message).join(" ")} /> : null}
    <StatusMessage error message={error} />
  </ScrollView></SafeAreaView>;
}

function ChoiceCard({ entry, selected, hostile = false, onPress }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.card, selected && styles.cardSelected, hostile && selected && styles.cardHostile]}><Text style={styles.cardTitle}>{selected ? "[x] " : "[ ] "}{entry.name}</Text><Text style={styles.cardBody}>{entry.description ?? `${entry.kind} · HP ${entry.hitPoints?.current ?? entry.hitPoints ?? "?"}`}</Text><Text style={styles.cardMeta}>{entry.kind?.toUpperCase()} · {entry.hitPoints?.current ?? entry.hitPoints ?? ""} HP · AC {entry.armorClass ?? "-"}</Text></Pressable>;
}
