export const ACTIONS = Object.freeze({
  moveUp: { label: 'Движение вверх', group: 'movement' },
  moveDown: { label: 'Движение вниз', group: 'movement' },
  moveLeft: { label: 'Движение влево', group: 'movement' },
  moveRight: { label: 'Движение вправо', group: 'movement' },
  dash: { label: 'Рывок', group: 'combat' },
  interact: { label: 'Взаимодействие', group: 'combat' },
  quickSpell1: { label: 'Быстрое заклинание 1', group: 'combat' },
  quickSpell2: { label: 'Быстрое заклинание 2', group: 'combat' },
  quickSpell3: { label: 'Быстрое заклинание 3', group: 'combat' },
  quickSpell4: { label: 'Быстрое заклинание 4', group: 'combat' },
  belt1: { label: 'Пояс 1', group: 'combat' },
  belt2: { label: 'Пояс 2', group: 'combat' },
  belt3: { label: 'Пояс 3', group: 'combat' },
  belt4: { label: 'Пояс 4', group: 'combat' },
  journal: { label: 'Журнал', group: 'interface' },
  inventory: { label: 'Инвентарь', group: 'interface' },
  character: { label: 'Персонаж', group: 'interface' },
  controls: { label: 'Управление', group: 'interface' },
  devConsole: { label: 'Консоль разработчика', group: 'interface' },
  resetFormula: { label: 'Сброс формулы', group: 'interface' }
});

export const CONTROL_LAYOUTS = Object.freeze({
  modern: {
    label: 'Современная',
    bindings: {
      moveUp: ['KeyW'], moveDown: ['KeyS'], moveLeft: ['KeyA'], moveRight: ['KeyD'],
      dash: ['Space'], interact: ['KeyF'],
      quickSpell1: ['KeyQ'], quickSpell2: ['KeyE'], quickSpell3: ['KeyR'], quickSpell4: ['KeyT'],
      belt1: ['Digit6'], belt2: ['Digit7'], belt3: ['Digit8'], belt4: ['Digit9'],
      journal: ['KeyJ'], inventory: ['KeyI'], character: ['KeyC'], controls: ['KeyK'],
      devConsole: ['Backquote'], resetFormula: ['KeyG']
    }
  },
  legacy: {
    label: 'Классическая',
    bindings: {
      moveUp: ['KeyW'], moveDown: ['KeyS'], moveLeft: ['KeyA'], moveRight: ['KeyD'],
      dash: ['Space'], interact: ['KeyF'],
      quickSpell1: ['F1'], quickSpell2: ['F2'], quickSpell3: ['F3'], quickSpell4: ['F4'],
      belt1: ['Digit6'], belt2: ['Digit7'], belt3: ['Digit8'], belt4: ['Digit9'],
      journal: ['KeyE'], inventory: ['KeyR'], character: ['KeyC'], controls: ['KeyK'],
      devConsole: ['Backquote'], resetFormula: ['KeyQ']
    }
  },
  leftHanded: {
    label: 'Для левой руки',
    bindings: {
      moveUp: ['ArrowUp'], moveDown: ['ArrowDown'], moveLeft: ['ArrowLeft'], moveRight: ['ArrowRight'],
      dash: ['Numpad0'], interact: ['NumpadDecimal'],
      quickSpell1: ['KeyU'], quickSpell2: ['KeyI'], quickSpell3: ['KeyO'], quickSpell4: ['KeyP'],
      belt1: ['KeyJ'], belt2: ['KeyK'], belt3: ['KeyL'], belt4: ['Semicolon'],
      journal: ['KeyN'], inventory: ['KeyM'], character: ['Comma'], controls: ['Slash'],
      devConsole: ['Backquote'], resetFormula: ['Backspace']
    }
  }
});

const RUNE_CODES = Object.freeze({
  Digit1: 1, Numpad1: 1,
  Digit2: 2, Numpad2: 2,
  Digit3: 3, Numpad3: 3,
  Digit4: 4, Numpad4: 4,
  Digit5: 5, Numpad5: 5
});

export function createControlProfile(layoutId = 'modern') {
  const actualId = CONTROL_LAYOUTS[layoutId] ? layoutId : 'modern';
  const layout = CONTROL_LAYOUTS[actualId];
  return {
    layoutId: actualId,
    bindings: Object.fromEntries(
      Object.entries(layout.bindings).map(([action, codes]) => [action, [...codes]])
    )
  };
}

export function setControlLayout(profile, layoutId) {
  const next = createControlProfile(layoutId);
  profile.layoutId = next.layoutId;
  profile.bindings = next.bindings;
  return profile;
}

export function rebindAction(profile, action, code) {
  if (!ACTIONS[action] || !code) return false;
  for (const otherAction of Object.keys(profile.bindings)) {
    profile.bindings[otherAction] = profile.bindings[otherAction].filter((entry) => entry !== code);
  }
  profile.bindings[action] = [code];
  profile.layoutId = 'custom';
  return true;
}

export function actionForCode(profile, code) {
  return Object.keys(profile.bindings).find((action) => profile.bindings[action].includes(code)) || null;
}

export function runeIndexForCode(code) {
  return RUNE_CODES[code] || 0;
}

export function movementVectorFromActions(actions) {
  let x = 0;
  let y = 0;
  if (actions.has('moveLeft')) x -= 1;
  if (actions.has('moveRight')) x += 1;
  if (actions.has('moveUp')) y -= 1;
  if (actions.has('moveDown')) y += 1;
  if (x && y) {
    x *= Math.SQRT1_2;
    y *= Math.SQRT1_2;
  }
  return { x, y };
}

export function displayCode(code) {
  return code
    .replace(/^Key/, '')
    .replace(/^Digit/, '')
    .replace(/^Numpad/, 'Num ')
    .replace('Space', 'Пробел')
    .replace('Backquote', '`')
    .replace('Semicolon', ';')
    .replace('Comma', ',')
    .replace('Slash', '/');
}
