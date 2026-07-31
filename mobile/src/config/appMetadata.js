export function getAppVersion(constants) {
  const version = constants?.expoConfig?.version ?? constants?.manifest?.version;
  return typeof version === "string" && version.trim() ? version : "unknown";
}
