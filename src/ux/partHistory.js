const UX_RECENT_PARTS_KEY = "eurorack-panel-designer-recent-parts-v1";
const UX_FAVORITE_PARTS_KEY = "eurorack-panel-designer-favorite-parts-v1";
function partStableKey(def) {
  return `${def.type}|${def.name}|${def.manufacturer || ""}|${def.partNumber || ""}`;
}
function readStringListStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function writeStringListStorage(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items.slice(0, 32)));
  } catch {}
}
function rememberRecentPart(def) {
  const key = partStableKey(def);
  const next = [
    key,
    ...readStringListStorage(UX_RECENT_PARTS_KEY).filter((k) => k !== key),
  ].slice(0, 8);
  writeStringListStorage(UX_RECENT_PARTS_KEY, next);
}
function sendPartPlacementEvent(def, stamp = false) {
  rememberRecentPart(def);
  window.dispatchEvent(
    new CustomEvent("start-part-placement", { detail: { def, stamp } }),
  );
}
