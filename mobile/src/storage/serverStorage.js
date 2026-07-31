import AsyncStorage from "@react-native-async-storage/async-storage";

const serverKey = "rpg-text.mobile.server-url";

export async function loadServerUrl() { return AsyncStorage.getItem(serverKey); }
export async function saveServerUrl(value) { await AsyncStorage.setItem(serverKey, value); return value; }
export async function clearServerUrl() { await AsyncStorage.removeItem(serverKey); }
