import { ELEMENTS } from '../config.js';

export function maxSpellLevel(elementLevels, firstKey, secondKey) {
  const first = ELEMENTS[firstKey];
  const second = ELEMENTS[secondKey];
  if (!first || !second) return 0;
  return Math.min(elementLevels[first.id] ?? 0, elementLevels[second.id] ?? 0);
}

export function canCastFormula(elementLevels, firstKey, secondKey, level) {
  return Number.isInteger(level) && level >= 1
    && level <= maxSpellLevel(elementLevels, firstKey, secondKey);
}
