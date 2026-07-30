import { InterpretationStatus, SemanticKind } from "../../../../shared/src/index.js";
import { actionDescriptions } from "./actionLexicon.js";
import { normalizeSpanishText } from "./normalizeSpanishText.js";
import { recognizeAction } from "./recognizeAction.js";
import { resolveReference } from "./resolveReference.js";
import { tokenizeSpanishText } from "./tokenizeSpanishText.js";

const ignored = new Set(["a", "al", "la", "el", "los", "las", "un", "una", "unos", "unas", "mi", "mis", "con", "de", "por", "favor"]);
const spellPhrases = ["bola de fuego", "curar", "hechizo", "conjuro"];

export function parseCombatCommand(originalText, context) {
  const tokens = tokenizeSpanishText(originalText);
  const annotations = [];
  const references = {};
  const warnings = [];
  const ambiguities = [];
  const missing = [];
  const action = recognizeAction(tokens);
  const spell = findSpell(tokens);
  if (!action) {
    if (spell) {
      const launch = tokens.find((token) => token.normalized === "lanzo" || token.normalized === "lanzar");
      if (launch) {
        const actionReferenceId = "action:UNSUPPORTED";
        annotations.push(annotation(launch, launch, SemanticKind.ACTION, actionReferenceId));
        references[actionReferenceId] = { kind: SemanticKind.ACTION, name: "Lanzar", description: "Acción reconocida, pero no disponible en el combate actual.", available: false };
      }
      const spellReferenceId = "spell:unsupported";
      annotations.push(annotation(tokens[spell.start], tokens[spell.end], SemanticKind.SPELL, spellReferenceId));
      references[spellReferenceId] = { kind: SemanticKind.SPELL, name: originalText.slice(tokens[spell.start].start, tokens[spell.end].end), description: "Este hechizo está reconocido, pero el lanzamiento de conjuros aún no está implementado.", supported: false };
      return result(InterpretationStatus.UNSUPPORTED, originalText, annotations, references, null, missing, ambiguities, warnings, "El lanzamiento de conjuros aún no está disponible.");
    }
    return result(InterpretationStatus.UNSUPPORTED, originalText, annotations, references, null, missing, ambiguities, warnings, "No reconozco esa acción. Usa atacar, esquivar o pasar.");
  }
  const actionId = `action:${action.type}`;
  const actionTokens = tokens.slice(action.startToken, action.endToken + 1);
  annotations.push(annotation(actionTokens[0], actionTokens.at(-1), SemanticKind.ACTION, actionId));
  references[actionId] = { kind: SemanticKind.ACTION, name: actionName(action.type), description: actionDescriptions[action.type], requiredTarget: action.type === "ATTACK", available: isActionAvailable(context, action.type) };
  if (!isActionAvailable(context, action.type)) return result(InterpretationStatus.INVALID_CONTEXT, originalText, annotations, references, null, missing, ambiguities, warnings, "Esta acción no está disponible en el contexto actual.");
  if (action.type !== "ATTACK") return result(InterpretationStatus.RESOLVED, originalText, annotations, references, { type: action.type, actorId: context.activeActor.entityId }, missing, ambiguities, warnings);

  const boundary = tokens.findIndex((token, index) => index > action.endToken && token.normalized === "con");
  const targetTokens = tokens.slice(action.endToken + 1, boundary === -1 ? tokens.length : boundary).filter((token) => !ignored.has(token.normalized));
  if (targetTokens.length === 0) {
    missing.push({ field: "targetId", message: "Elige un objetivo.", suggestions: validTargets(context).map(referenceSummary) });
    return result(InterpretationStatus.INCOMPLETE, originalText, annotations, references, null, missing, ambiguities, warnings);
  }
  const targetResolution = resolveReference(targetTokens, validTargets(context));
  if (targetResolution.status === "AMBIGUOUS") {
    const options = targetResolution.candidates.map(referenceSummary);
    ambiguities.push({ field: "targetId", message: "Hay varios objetivos posibles.", options });
    const targetReferenceId = "target:ambiguous";
    annotations.push(annotation(targetTokens[0], targetTokens.at(-1), SemanticKind.CREATURE, targetReferenceId));
    references[targetReferenceId] = { kind: SemanticKind.CREATURE, name: targetTokens.map(({ text }) => text).join(" "), description: "Selecciona un objetivo concreto.", options };
    return result(InterpretationStatus.AMBIGUOUS, originalText, annotations, references, null, missing, ambiguities, warnings);
  }
  if (targetResolution.status !== "RESOLVED") return result(InterpretationStatus.INVALID_CONTEXT, originalText, annotations, references, null, missing, ambiguities, warnings, "No encuentro un objetivo hostil válido con ese nombre.");
  const target = targetResolution.candidate;
  const targetReferenceId = `entity:${target.entityId}`;
  annotations.push(annotation(targetTokens[0], targetTokens.at(-1), target.kind === "character" ? SemanticKind.CHARACTER : SemanticKind.CREATURE, targetReferenceId));
  references[targetReferenceId] = participantReference(target);

  const itemTokens = boundary === -1 ? [] : tokens.slice(boundary + 1).filter((token) => !ignored.has(token.normalized));
  if (itemTokens.length) {
    const itemResolution = resolveReference(itemTokens, context.availableItems);
    if (itemResolution.status === "RESOLVED") {
      const item = itemResolution.candidate;
      const itemReferenceId = `item:${item.id}`;
      annotations.push(annotation(itemTokens[0], itemTokens.at(-1), SemanticKind.ITEM, itemReferenceId));
      references[itemReferenceId] = itemReference(item);
      warnings.push({ code: "ITEM_CHOICE_NOT_SUPPORTED", message: "El ataque usa el arma equipada; la selección explícita de armas aún no cambia la resolución." });
      if (!item.equipped) warnings.push({ code: "ITEM_NOT_EQUIPPED", message: "El objeto está disponible, pero el ataque actual usa el arma equipada." });
    } else {
      const itemReferenceId = "item:unavailable";
      annotations.push(annotation(itemTokens[0], itemTokens.at(-1), SemanticKind.ITEM, itemReferenceId));
      references[itemReferenceId] = { kind: SemanticKind.ITEM, name: itemTokens.map(({ text }) => text).join(" "), description: "Este objeto no está disponible para el actor actual.", available: false };
      warnings.push({ code: "ITEM_NOT_AVAILABLE", message: "No tienes ese objeto disponible para este ataque." });
      return result(InterpretationStatus.INVALID_CONTEXT, originalText, annotations, references, null, missing, ambiguities, warnings, "El objeto mencionado no está disponible para este actor.");
    }
  }
  return result(InterpretationStatus.RESOLVED, originalText, annotations, references, { type: "ATTACK", actorId: context.activeActor.entityId, targetId: target.entityId }, missing, ambiguities, warnings);
}

function result(status, originalText, annotations, references, intent, missing, ambiguities, warnings, message = null) { return { status, originalText, annotations, references, intent, missing, ambiguities, warnings, ...(message ? { message } : {}) }; }
function annotation(start, end, kind, referenceId) { return { start: start.start, end: end.end, kind, referenceId }; }
function actionName(type) { return { ATTACK: "Atacar", DODGE: "Esquivar", PASS: "Pasar" }[type]; }
function isActionAvailable(context, type) { return context.status === "ACTIVE" && context.activeActor?.controller === "manual" && context.availableActions.some((action) => action.type === type); }
function validTargets(context) { const ids = new Set(context.availableActions.find((action) => action.type === "ATTACK")?.validTargetIds ?? []); return context.participants.filter((participant) => ids.has(participant.entityId)); }
function referenceSummary(candidate) { return { referenceId: `entity:${candidate.entityId}`, name: candidate.name, kind: candidate.kind === "character" ? SemanticKind.CHARACTER : SemanticKind.CREATURE, description: candidate.description ?? "Una criatura del encuentro.", faction: candidate.faction, currentHitPoints: candidate.health.current, maximumHitPoints: candidate.health.max, armorClass: candidate.armorClass, defeated: candidate.defeated }; }
function participantReference(candidate) { return referenceSummary(candidate); }
function itemReference(item) { return { kind: SemanticKind.ITEM, name: item.name, description: item.description, itemType: item.kind, equipped: item.equipped, damageNotation: item.damageNotation, damageType: item.damageType }; }
function findSpell(tokens) { const values = tokens.map(({ normalized }) => normalized); for (const phrase of spellPhrases) { const words = phrase.split(" "); for (let i = 0; i <= values.length - words.length; i += 1) if (words.every((word, offset) => values[i + offset] === word)) return { start: i, end: i + words.length - 1 }; } return null; }
