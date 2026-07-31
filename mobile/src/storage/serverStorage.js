import AsyncStorage from "@react-native-async-storage/async-storage";

const serverKey = "rpg-text.mobile.server-url";
const sessionKey = "rpg-text.mobile.active-session";
const draftKey = "rpg-text.mobile.encounter-draft";
const preferencesKey = "rpg-text-presentation-preferences";

export async function loadServerUrl() { return AsyncStorage.getItem(serverKey); }
export async function saveServerUrl(value) { await AsyncStorage.setItem(serverKey, value); return value; }
export async function clearServerUrl() { await AsyncStorage.removeItem(serverKey); }
export async function loadActiveSession() { return readJson(sessionKey); }
export async function saveActiveSession(value) { await writeJson(sessionKey, value); return value; }
export async function clearActiveSession() { await AsyncStorage.removeItem(sessionKey); }
export async function loadEncounterDraft() { return readJson(draftKey); }
export async function saveEncounterDraft(value) { await writeJson(draftKey, { version: 1, draft: value }); return value; }
export async function clearEncounterDraft() { await AsyncStorage.removeItem(draftKey); }
export async function clearLocalPreferences() { await AsyncStorage.removeItem(preferencesKey); }

async function readJson(key) { const value = await AsyncStorage.getItem(key); if (!value) return null; const parsed = JSON.parse(value); return key === draftKey && parsed?.version === 1 ? parsed.draft : parsed; }
async function writeJson(key, value) { await AsyncStorage.setItem(key, JSON.stringify(value)); }
