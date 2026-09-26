import { GAME_VERSION, MAP_SIZE, VILLAGER_NAMES } from './config.js';

const deepClone = (value) => JSON.parse(JSON.stringify(value));

export function makeId(prefix = 'id') {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

export function createVillager(index, x = 17, y = 17) {
  return {
    id: makeId('v'),
    name: VILLAGER_NAMES[index % VILLAGER_NAMES.length],
    x: x + (Math.random() - 0.5) * 1.5,
    y: y + (Math.random() - 0.5) * 1.5,
    targetX: x,
    targetY: y,
    hue: (index * 53 + 18) % 360,
    thought: '',
    thoughtUntil: 0
  };
}

function initialBuilding(type, x, y, workers = 0, extras = {}) {
  return {
    id: makeId('b'), type, x, y, workers, progress: 100, cycle: Math.random() * 4,
    createdDay: 1, animals: type === 'barn' ? 2 : 0, breedingClock: 0, ...extras
  };
}

export function createInitialState() {
  const seed = Math.floor(Math.random() * 2_000_000_000);
  const villagers = Array.from({ length: 6 }, (_, i) => createVillager(i));
  return {
    version: GAME_VERSION,
    savedAt: new Date().toISOString(),
    townName: 'Villa Alba',
    seed,
    mapSize: MAP_SIZE,
    clock: { day: 1, hour: 7, minute: 0, speed: 1, paused: false, seasonIndex: 0 },
    resources: {
      wood: 145, stone: 90, grain: 42, vegetables: 30, milk: 0, eggs: 0,
      wool: 0, flour: 0, bread: 12, tools: 5, coins: 85
    },
    happiness: 72,
    villagers,
    buildings: [
      initialBuilding('townhall', 16, 16),
      initialBuilding('house', 14, 17),
      initialBuilding('farm', 16, 13, 2),
      initialBuilding('lumber', 20, 17, 1),
      initialBuilding('quarry', 12, 14, 1)
    ],
    completedWonders: [],
    tradeHistory: [],
    totalProduced: 0,
    totalTraded: 0,
    lastMigrationDay: 0,
    log: [
      { id: makeId('log'), day: 1, hour: 7, text: 'La comunidad ha elegido este valle para crecer en paz.' },
      { id: makeId('log'), day: 1, hour: 7, text: 'Todos los edificios y todo el territorio están disponibles desde el inicio.' }
    ],
    settings: { sound: false, autosave: true },
    ui: { selectedBuildingId: null }
  };
}

export function normalizeState(candidate) {
  const base = createInitialState();
  if (!candidate || typeof candidate !== 'object') return base;

  const state = {
    ...base,
    ...deepClone(candidate),
    version: GAME_VERSION,
    clock: { ...base.clock, ...(candidate.clock || {}) },
    resources: { ...base.resources, ...(candidate.resources || {}) },
    settings: { ...base.settings, ...(candidate.settings || {}) },
    ui: { ...base.ui, ...(candidate.ui || {}) }
  };

  state.townName = String(state.townName || 'Villa Alba').slice(0, 28);
  state.seed = Number.isFinite(Number(state.seed)) ? Number(state.seed) : base.seed;
  state.mapSize = MAP_SIZE;
  state.happiness = Math.max(0, Math.min(100, Number(state.happiness) || 0));
  state.villagers = Array.isArray(state.villagers) ? state.villagers.map((v, i) => ({ ...createVillager(i), ...v })) : base.villagers;
  state.buildings = Array.isArray(state.buildings) ? state.buildings.map(b => ({ workers: 0, progress: 100, cycle: 0, animals: 0, breedingClock: 0, ...b })) : base.buildings;
  state.completedWonders = Array.isArray(state.completedWonders) ? [...new Set(state.completedWonders)] : [];
  state.tradeHistory = Array.isArray(state.tradeHistory) ? state.tradeHistory.slice(-100) : [];
  state.log = Array.isArray(state.log) ? state.log.slice(0, 40) : base.log;

  for (const key of Object.keys(base.resources)) {
    state.resources[key] = Math.max(0, Number(state.resources[key]) || 0);
  }
  return state;
}

export function snapshotState(state) {
  const copy = deepClone(state);
  copy.savedAt = new Date().toISOString();
  copy.ui = { selectedBuildingId: null };
  return copy;
}
