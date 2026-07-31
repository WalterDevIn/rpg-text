import { Text } from "react-native";
import { visibleSemanticSegments } from "../../../shared/src/clientPresentation.js";
import { semanticStyleKey } from "../utilities/combatPresentation.js";
import { colors } from "../theme/colors.js";
import { styles } from "../theme/styles.js";

export function SemanticText({ segments = [], references = {}, visibleCharacters = Infinity, onReference, accessibilityLabel, style }) {
  const visible = visibleSemanticSegments(segments, visibleCharacters);
  return <Text style={style} accessibilityLabel={accessibilityLabel}>
    {visible.map((segment, index) => {
      const semantic = segment.semantic;
      if (!semantic) return <Text key={`text-${index}`}>{segment.text}</Text>;
      const reference = references[semantic.referenceId] ?? segment.reference ?? null;
      const interactive = segment.complete !== false && Boolean(reference) && typeof onReference === "function";
      return <Text
        key={`semantic-${semantic.referenceId ?? index}`}
        style={semanticStyle(semantic.kind)}
        onPress={interactive ? () => onReference({ kind: semantic.kind, referenceId: semantic.referenceId, reference, text: segment.text }) : undefined}
        accessibilityRole={interactive ? "button" : undefined}
        accessibilityLabel={interactive ? `${reference.name ?? segment.text}: ${referenceSummary(reference)}` : undefined}
      >{segment.text}</Text>;
    })}
  </Text>;
}

export function semanticStyle(kind) {
  const style = {
    CHARACTER: styles.semanticCharacter,
    CREATURE: styles.semanticCreature,
    ITEM: styles.semanticItem,
    SPELL: styles.semanticSpell,
    ACTION: styles.semanticAction,
    DAMAGE: styles.semanticDamage,
    DICE_ROLL: styles.semanticDice,
  }[semanticStyleKey(kind)] ?? styles.semanticDefault;
  return [style, { textDecorationLine: "underline" }];
}

function referenceSummary(reference = {}) {
  return [reference.description, reference.currentHitPoints !== undefined ? `HP ${reference.currentHitPoints}/${reference.maximumHitPoints}` : null, reference.total !== undefined ? `total ${reference.total}` : null].filter(Boolean).join(" · ") || reference.kind || "Semantic reference";
}
