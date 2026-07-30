import { humanFighter } from "../characters/humanFighter.js";
import { humanWizard } from "../characters/humanWizard.js";
import { createCatalog } from "./createCatalog.js";

export const characterCatalog = createCatalog([humanFighter, humanWizard]);
