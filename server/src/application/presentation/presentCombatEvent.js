import { entityReference } from "./referenceDictionary.js";
import { semanticSegment, textSegment } from "./semanticSegments.js";

export function presentCombatEvent(event, participants) {
  const byId = new Map(participants.map((participant) => [participant.entityId, participant]));
  const name = (id) => byId.get(id)?.identity?.name ?? id ?? "desconocido";
  const participantSegment = (id) => {
    const participant = byId.get(id);
    return participant ? semanticSegment(participant.identity.name, participant.identity.kind === "character" ? "CHARACTER" : "CREATURE", `entity:${id}`) : textSegment(name(id));
  };
  const message = (origin, segments, tone = "neutral") => ({ id: event.sequence, sequence: event.sequence, type: event.type, origin, tone, segments, references: referencesFor(segments) });
  const damageReference = `damage:event-${event.sequence}`;
  switch (event.type) {
    case "COMBAT_STARTED": return message("dm", [textSegment("El encuentro comienza. Se resuelve la iniciativa.")]);
    case "DICE_ROLLED": {
      const kind = event.purpose === "DAMAGE" ? "DAMAGE" : "DICE_ROLL";
      return message("dice", [participantSegment(event.actorId), textSegment(` · ${event.purpose}: `), semanticSegment(`${event.notation} = ${event.rolls?.join(", ") ?? event.naturalRoll}${formatModifier(event.modifier)} = ${event.total}`, kind, `${kind === "DAMAGE" ? damageReference : `dice:event-${event.sequence}`}`)], "neutral");
    }
    case "ROUND_STARTED": return message("system", [textSegment(`Comienza la ronda ${event.round}.`)]);
    case "TURN_STARTED": return message("dm", [textSegment("Turno de "), participantSegment(event.entityId), textSegment(` (ronda ${event.round}).`)]);
    case "INTENT_DECLARED": return message("dm", [participantSegment(event.actorId), semanticSegment(" ataca", "ACTION", "action:ATTACK"), textSegment(" a "), participantSegment(event.targetId), ...(event.instrumentId ? [textSegment(" con "), semanticSegment(event.instrumentName ?? event.instrumentId, "ITEM", `item:${event.instrumentId}`), textSegment(".")] : [textSegment(".")])]);
    case "TURN_PASSED": return message(byId.get(event.entityId)?.controller === "manual" ? "player" : "creature", [participantSegment(event.entityId), semanticSegment(" pasa", "ACTION", "action:PASS"), textSegment(" el turno.")]);
    case "CONDITION_APPLIED": return message(byId.get(event.entityId)?.controller === "manual" ? "player" : "creature", [participantSegment(event.entityId), semanticSegment(" esquiva", "ACTION", "action:DODGE"), textSegment(" y adopta una postura defensiva.")]);
    case "CONDITION_EXPIRED": return message("dm", [participantSegment(event.entityId), textSegment(" ya no está en postura defensiva.")]);
    case "ATTACK_MISSED": return message("dm", [participantSegment(event.actorId), textSegment(" falla contra "), participantSegment(event.targetId), textSegment(` (${event.total} contra CA ${event.armorClass}).`)]);
    case "ATTACK_HIT": return message("dm", [participantSegment(event.actorId), semanticSegment(" impacta", "ACTION", "action:ATTACK"), textSegment(" a "), participantSegment(event.targetId), textSegment(" y causa "), semanticSegment(`${event.damage} de daño`, "DAMAGE", damageReference), textSegment(".")]);
    case "DAMAGE_APPLIED": return message("dm", [participantSegment(event.targetId), textSegment(" recibe "), semanticSegment(`${event.amount} de daño ${String(event.damageType).toLowerCase()}`, "DAMAGE", damageReference), textSegment(` (${event.remainingHitPoints} PV restantes).`)]);
    case "COMBATANT_DEFEATED": return message("dm", [participantSegment(event.entityId), textSegment(" queda derrotado.")]);
    case "COMBAT_FINISHED": return message("system", [textSegment(`El combate termina. Ganadores: ${event.winnerFaction ?? "ninguno"}.`)]);
    case "INTENT_REJECTED": return message("system", [textSegment(`Acción rechazada: ${event.reason}.`)]);
    default: return message("system", [textSegment(`${event.type}.`)]);
  }

  function referencesFor(segments) {
    const references = {};
    for (const segment of segments) {
      const referenceId = segment.semantic?.referenceId;
      if (!referenceId) continue;
      if (referenceId.startsWith("entity:")) {
        const participant = byId.get(referenceId.slice("entity:".length));
        if (participant) references[referenceId] = entityReference(participant);
      } else if (referenceId.startsWith("damage:")) {
        references[referenceId] = { kind: "DAMAGE", notation: event.notation ?? null, rolls: event.rolls ?? (event.naturalRoll === undefined ? [] : [event.naturalRoll]), modifier: event.modifier ?? 0, total: event.amount ?? event.damage ?? event.total ?? 0, damageType: event.damageType ?? null, sourceActorId: event.sourceId ?? event.actorId ?? null, targetId: event.targetId ?? null, remainingHitPoints: event.remainingHitPoints ?? null };
      } else if (referenceId.startsWith("dice:")) {
        references[referenceId] = { kind: "DICE_ROLL", purpose: event.purpose, notation: event.notation, rolls: event.rolls ?? [event.naturalRoll], modifier: event.modifier ?? 0, total: event.total };
      } else if (referenceId.startsWith("item:")) {
        references[referenceId] = { kind: "ITEM", name: event.instrumentName ?? referenceId.slice(5), description: "Instrumento usado por el actor en este ataque.", equipped: true };
      } else if (referenceId.startsWith("action:")) {
        references[referenceId] = { kind: "ACTION", name: { ATTACK: "Atacar", DODGE: "Esquivar", PASS: "Pasar" }[referenceId.slice(7)] ?? "Acción", description: "Acción autoritativa del combate.", available: true };
      }
    }
    return references;
  }
}

function formatModifier(modifier) { if (!modifier) return ""; return modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`; }
