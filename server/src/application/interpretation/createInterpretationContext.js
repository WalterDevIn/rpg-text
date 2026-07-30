import { getActionContext } from "../../game/combat/getActionContext.js";

export function createInterpretationContext(session) {
  return getActionContext(session);
}
