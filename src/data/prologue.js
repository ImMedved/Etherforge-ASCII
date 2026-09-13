export const PROLOGUE_VILLAGES = Object.freeze({
  portVillage: Object.freeze({
    id: 'port-village',
    name: 'Тихая Пристань',
    description: 'Небольшая портовая деревня: причал, сгоревшая площадь и три покинутых дома.',
    center: Object.freeze({ x: 34, y: 34 }),
    zones: Object.freeze({
      beach: Object.freeze({ x: 16, y: 14, name: 'Берег экспедиции' }),
      square: Object.freeze({ x: 34, y: 34, name: 'Сгоревшая площадь' }),
      houseWest: Object.freeze({ x: 24, y: 34, name: 'Дом рыбака' }),
      houseNorth: Object.freeze({ x: 34, y: 24, name: 'Дом лекаря' }),
      houseEast: Object.freeze({ x: 44, y: 34, name: 'Дом старосты' })
    })
  }),
  undeadVillage: Object.freeze({
    id: 'undead-village',
    name: 'Мёртвая Лощина',
    description: 'Соседняя деревня, полностью захваченная нежитью.',
    center: Object.freeze({ x: 78, y: 66 }),
    zones: Object.freeze({
      outskirts: Object.freeze({ x: 66, y: 58, name: 'Заражённые окраины' }),
      square: Object.freeze({ x: 76, y: 64, name: 'Площадь мёртвых' }),
      cemetery: Object.freeze({ x: 84, y: 70, name: 'Старое кладбище' }),
      tower: Object.freeze({ x: 90, y: 60, name: 'Башня лича' })
    })
  })
});

export const PROLOGUE_CHECKPOINTS = Object.freeze({
  expeditionBeach: Object.freeze({ id: 'expedition-beach', x: 16, y: 14 }),
  portVillage: Object.freeze({ id: 'port-village', x: 34, y: 34 })
});

export const PROLOGUE_HOUSES = Object.freeze([
  Object.freeze({ id: 'house-west', ...PROLOGUE_VILLAGES.portVillage.zones.houseWest }),
  Object.freeze({ id: 'house-north', ...PROLOGUE_VILLAGES.portVillage.zones.houseNorth }),
  Object.freeze({ id: 'house-east', ...PROLOGUE_VILLAGES.portVillage.zones.houseEast })
]);

export const PROLOGUE_ENCOUNTERS = Object.freeze({
  wolves: Object.freeze({
    tag: 'port-wolves',
    enemies: Object.freeze([
      Object.freeze({ type: 'wolf', x: 25, y: 22 }),
      Object.freeze({ type: 'wolf', x: 27, y: 21 }),
      Object.freeze({ type: 'wolf', x: 29, y: 24 })
    ])
  }),
  undead: Object.freeze({
    tag: 'undead-outskirts',
    enemies: Object.freeze([
      Object.freeze({ type: 'ghost', x: 69, y: 58 }),
      Object.freeze({ type: 'goblin', x: 72, y: 61 }),
      Object.freeze({ type: 'ghost', x: 76, y: 64 }),
      Object.freeze({ type: 'orc', x: 82, y: 68 })
    ])
  }),
  lich: Object.freeze({
    tag: 'tower-lich',
    enemies: Object.freeze([
      Object.freeze({ type: 'ghost', name: 'Лич Мёртвой Лощины', x: 90, y: 60, boss: true })
    ])
  })
});

export const PROLOGUE_DIALOGUE = Object.freeze({
  arrival: 'Капитан: «Это поселение выглядит вымершим. Проверь, есть ли кто живой.»',
  air: 'Вы чувствуете невероятную силу ветра. Его порывы подвластны вам, и сами вы — ветер.',
  port: 'Деревня разрушена, дома ещё догорают. Внутри могут остаться припасы и следы нападения.',
  undead: 'След магии ведёт в соседнюю деревню. Окраины, кладбище и башня кишат нежитью.',
  fire: 'Из поверженного лича высвобождается сфера Огня и впитывается в тело мага.'
});
