import {
  PROLOGUE_CHECKPOINTS,
  PROLOGUE_HOUSES,
  PROLOGUE_VILLAGES
} from '../data/prologue.js';

const OBJECTIVES = Object.freeze({
  'find-air': 'Следуйте от корабля к сфере Воздуха',
  wolves: 'Отбейте нападение волков: {kills}/3',
  'reach-port': 'Доберитесь до площади деревни «Тихая Пристань»',
  'inspect-port': 'Осмотрите три дома в Тихой Пристани: {houses}/3',
  'travel-undead': 'Идите к окраинам деревни «Мёртвая Лощина»',
  'clear-undead': 'Очистите деревню нежити: {kills}/4',
  lich: 'Доберитесь до башни и победите лича',
  'find-fire': 'Заберите сферу Огня в башне лича',
  'return-port': 'Вернитесь на площадь Тихой Пристани',
  'equip-reward': 'Экипируйте любой найденный предмет через инвентарь',
  'save-at-hub': 'Сохраните прогресс у сигнального костра',
  complete: 'Пролог завершён: Воздух и Огонь пробуждены'
});

export const PROLOGUE_PHASES = Object.freeze([
  { id: 'find-air', name: 'Высадка: найти Воздух' },
  { id: 'wolves', name: 'Дорога: нападение волков' },
  { id: 'reach-port', name: 'Войти в Тихую Пристань' },
  { id: 'inspect-port', name: 'Осмотреть три дома' },
  { id: 'travel-undead', name: 'Путь в Мёртвую Лощину' },
  { id: 'clear-undead', name: 'Зачистить деревню нежити' },
  { id: 'lich', name: 'Башня: победить лича' },
  { id: 'find-fire', name: 'Забрать сферу Огня' },
  { id: 'return-port', name: 'Вернуться в Тихую Пристань' },
  { id: 'equip-reward', name: 'Экипировать награду' },
  { id: 'save-at-hub', name: 'Сохраниться у костра' },
  { id: 'complete', name: 'Пролог завершён' }
]);

const PHASE_TARGETS = Object.freeze({
  'find-air': Object.freeze({ x: 23, y: 20 }),
  'reach-port': PROLOGUE_VILLAGES.portVillage.zones.square,
  'travel-undead': PROLOGUE_VILLAGES.undeadVillage.zones.outskirts,
  'clear-undead': PROLOGUE_VILLAGES.undeadVillage.zones.square,
  lich: PROLOGUE_VILLAGES.undeadVillage.zones.tower,
  'find-fire': PROLOGUE_VILLAGES.undeadVillage.zones.tower,
  'return-port': PROLOGUE_VILLAGES.portVillage.zones.square,
  'equip-reward': PROLOGUE_VILLAGES.portVillage.zones.square,
  'save-at-hub': PROLOGUE_VILLAGES.portVillage.zones.square
});

export function createPrologueState() {
  return {
    id: 'prologue',
    phase: 'find-air',
    phaseKills: 0,
    totalKills: 0,
    housesInspected: [],
    lootClaims: 0,
    rewardClaimed: false,
    defeats: 0,
    checkpoint: PROLOGUE_CHECKPOINTS.expeditionBeach.id,
    visitedVillages: [],
    lastDialogue: 'arrival',
    savedAtHub: false,
    dialogueChoices: { arrival: 'take-guards' }
  };
}

export function prologueObjective(prologue) {
  return (OBJECTIVES[prologue.phase] || '')
    .replace('{kills}', String(prologue.phaseKills))
    .replace('{houses}', String(prologue.housesInspected.length));
}

export function prologueTarget(prologue) {
  if (prologue.phase === 'inspect-port') {
    return PROLOGUE_HOUSES.find((house) => !prologue.housesInspected.includes(house.id)) || null;
  }
  return PHASE_TARGETS[prologue.phase] || null;
}

export function recordPrologueSphere(prologue, elementId) {
  if (prologue.phase === 'find-air' && elementId === 'air') {
    prologue.phase = 'wolves';
    prologue.phaseKills = 0;
    prologue.lastDialogue = 'air';
    return 'wolves';
  }
  if (prologue.phase === 'find-fire' && elementId === 'fire') {
    prologue.phase = 'return-port';
    prologue.lastDialogue = 'fire';
    return 'return-port';
  }
  return null;
}

export function recordPrologueEnemyDefeat(prologue, encounterTag = null) {
  const expected = prologue.phase === 'wolves'
    ? { tag: 'port-wolves', count: 3, next: 'reach-port' }
    : prologue.phase === 'clear-undead'
      ? { tag: 'undead-outskirts', count: 4, next: 'lich' }
      : prologue.phase === 'lich'
        ? { tag: 'tower-lich', count: 1, next: 'find-fire' }
        : null;
  if (!expected || (encounterTag && encounterTag !== expected.tag)) return null;
  prologue.phaseKills += 1;
  prologue.totalKills += 1;
  if (prologue.phaseKills < expected.count) return false;
  prologue.phase = expected.next;
  prologue.phaseKills = 0;
  return expected.next;
}

export function recordPrologueLocation(prologue, locationId) {
  if (prologue.phase === 'reach-port' && locationId === 'port-village') {
    prologue.phase = 'inspect-port';
    prologue.checkpoint = PROLOGUE_CHECKPOINTS.portVillage.id;
    prologue.lastDialogue = 'port';
    if (!prologue.visitedVillages.includes(locationId)) prologue.visitedVillages.push(locationId);
    return 'inspect-port';
  }
  if (prologue.phase === 'travel-undead' && locationId === 'undead-village') {
    prologue.phase = 'clear-undead';
    prologue.phaseKills = 0;
    prologue.lastDialogue = 'undead';
    if (!prologue.visitedVillages.includes(locationId)) prologue.visitedVillages.push(locationId);
    return 'clear-undead';
  }
  if (prologue.phase === 'return-port' && locationId === 'port-village') {
    prologue.phase = 'equip-reward';
    return 'equip-reward';
  }
  return null;
}

export function recordPrologueHouse(prologue, houseId) {
  if (prologue.phase !== 'inspect-port') return false;
  if (!PROLOGUE_HOUSES.some((house) => house.id === houseId)) return false;
  if (!prologue.housesInspected.includes(houseId)) prologue.housesInspected.push(houseId);
  if (prologue.housesInspected.length >= PROLOGUE_HOUSES.length) {
    prologue.phase = 'travel-undead';
    return 'travel-undead';
  }
  return true;
}

export function recordPrologueChest(prologue) {
  prologue.lootClaims += 1;
  prologue.rewardClaimed = true;
  return true;
}

export function recordPrologueEquipment(prologue) {
  if (prologue.phase !== 'equip-reward') return false;
  prologue.phase = 'save-at-hub';
  return true;
}

export function recordPrologueHubSave(prologue) {
  if (prologue.phase !== 'save-at-hub') return false;
  prologue.savedAtHub = true;
  prologue.phase = 'complete';
  return true;
}

export function recordPrologueHubReturn(prologue) {
  return recordPrologueLocation(prologue, 'port-village');
}

export function recordPrologueDefeat(prologue) {
  prologue.defeats += 1;
  if (['wolves', 'clear-undead', 'lich'].includes(prologue.phase)) prologue.phaseKills = 0;
}

export function normalizePrologueState(value = {}) {
  return {
    ...createPrologueState(),
    ...value,
    housesInspected: Array.isArray(value.housesInspected) ? [...value.housesInspected] : [],
    visitedVillages: Array.isArray(value.visitedVillages) ? [...value.visitedVillages] : [],
    dialogueChoices: { arrival: 'take-guards', ...(value.dialogueChoices || {}) }
  };
}

export function createPrologueStateAtPhase(phase) {
  const targetIndex = PROLOGUE_PHASES.findIndex((entry) => entry.id === phase);
  if (targetIndex < 0) return createPrologueState();
  const state = createPrologueState();
  state.phase = phase;
  if (targetIndex >= 1) state.lastDialogue = 'air';
  if (targetIndex >= 3) {
    state.checkpoint = PROLOGUE_CHECKPOINTS.portVillage.id;
    state.visitedVillages = ['port-village'];
    state.lastDialogue = 'port';
  }
  if (targetIndex >= 4) {
    state.housesInspected = PROLOGUE_HOUSES.map((house) => house.id);
    state.lootClaims = 3;
    state.rewardClaimed = true;
  }
  if (targetIndex >= 5) {
    state.visitedVillages.push('undead-village');
    state.lastDialogue = 'undead';
  }
  if (targetIndex >= 8) state.lastDialogue = 'fire';
  if (targetIndex >= 11) state.savedAtHub = true;
  return state;
}
