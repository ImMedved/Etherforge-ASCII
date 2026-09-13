export const SAVE_KEY = 'ascii-arcana.save.v1';
export const SAVE_VERSION = 1;

export function createSaveSnapshot(state, now = Date.now()) {
  return {
    version: SAVE_VERSION,
    savedAt: now,
    progression: state.progression,
    prologue: state.prologue,
    equipment: state.equipment,
    inventory: state.inventory,
    belt: state.belt,
    controls: state.controls,
    quickSpellKeys: state.quickSpells.map((spell) => spell?.key || null)
  };
}

export function saveGame(storage, state, now = Date.now()) {
  if (!storage?.setItem) return false;
  storage.setItem(SAVE_KEY, JSON.stringify(createSaveSnapshot(state, now)));
  return true;
}

export function loadGame(storage) {
  if (!storage?.getItem) return null;
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== SAVE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}
