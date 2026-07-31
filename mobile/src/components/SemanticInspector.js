import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { colors } from "../theme/colors.js";
import { styles } from "../theme/styles.js";

export function SemanticInspector({ reference, onClose, insets }) {
  if (!reference) return null;
  const value = reference.reference ?? {};
  return <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
    <Pressable style={styles.overviewBackdrop} onPress={onClose} accessibilityLabel="Close semantic inspector">
      <Pressable style={[styles.inspectorPanel, { marginTop: insets.top + 8, marginBottom: Math.max(insets.bottom, 8) }]} onPress={(event) => event.stopPropagation()} accessibilityViewIsModal>
        <View style={styles.overviewHeader}><Text style={styles.overviewTitle}>{value.name ?? reference.text}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close semantic inspector" onPress={onClose} style={styles.closeButton}><Text style={styles.closeText}>×</Text></Pressable></View>
        <ScrollView contentContainerStyle={styles.overviewContent}>
          <Text style={styles.semanticInspectorKind}>{reference.kind}</Text>
          <ReferenceDetails kind={reference.kind} value={value} />
        </ScrollView>
      </Pressable>
    </Pressable>
  </Modal>;
}

function ReferenceDetails({ kind, value }) {
  const rows = [];
  if (value.description) rows.push(["Description", value.description]);
  if (["CHARACTER", "CREATURE"].includes(kind)) {
    if (value.currentHitPoints !== undefined && value.maximumHitPoints !== undefined) rows.push(["HP", `${value.currentHitPoints} / ${value.maximumHitPoints}`]);
    if (value.faction) rows.push(["Faction", value.faction]);
    if (value.controller) rows.push(["Controller", value.controller]);
    if (value.defeated !== undefined) rows.push(["State", value.defeated ? "Defeated" : "Active"]);
    if (value.armorClass !== undefined) rows.push(["Armor class", value.armorClass]);
    if (value.conditions?.length) rows.push(["Conditions", value.conditions.join(", ")]);
  }
  if (kind === "ITEM") {
    if (value.itemType) rows.push(["Type", value.itemType]);
    if (value.equipped !== undefined) rows.push(["Equipped", value.equipped ? "Yes" : "No"]);
    if (value.damageNotation) rows.push(["Damage", value.damageNotation]);
  }
  if (kind === "SPELL" && value.level !== undefined) rows.push(["Level", value.level]);
  if (kind === "ACTION") {
    if (value.available !== undefined) rows.push(["Available", value.available ? "Yes" : "No"]);
    if (value.actorName) rows.push(["Actor", value.actorName]);
    if (value.targetName) rows.push(["Target", value.targetName]);
  }
  if (["DAMAGE", "DICE_ROLL"].includes(kind)) {
    if (value.purpose) rows.push(["Purpose", value.purpose]);
    if (value.notation) rows.push(["Notation", value.notation]);
    if (value.rolls?.length) rows.push(["Rolls", value.rolls.join(", ")]);
    if (value.modifier !== undefined) rows.push(["Modifier", value.modifier]);
    if (value.total !== undefined) rows.push(["Total", value.total]);
    if (value.damageType) rows.push(["Damage type", value.damageType]);
    if (value.remainingHitPoints !== undefined && value.remainingHitPoints !== null) rows.push(["Remaining HP", value.remainingHitPoints]);
  }
  if (!rows.length) return <Text style={styles.overviewBody}>No additional public details are available.</Text>;
  return rows.map(([label, text]) => <View key={label} style={styles.inspectorRow}><Text style={styles.inspectorLabel}>{label}</Text><Text style={styles.overviewBody}>{String(text)}</Text></View>);
}
