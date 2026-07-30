import { caveRat } from "../creatures/caveRat.js";
import { goblin } from "../creatures/goblin.js";
import { slime } from "../creatures/slime.js";
import { createCatalog } from "./createCatalog.js";

export const creatureCatalog = createCatalog([goblin, caveRat, slime]);
