export const GAME_VERSION = '1.0.0';
export const MAP_SIZE = 34;
export const TILE_W = 64;
export const TILE_H = 32;
export const HOURS_PER_REAL_SECOND = 0.72;

export const RESOURCE_META = {
  wood: { label: 'Madera', icon: '🪵', color: '#9c6a3c' },
  stone: { label: 'Piedra', icon: '🪨', color: '#8c9395' },
  grain: { label: 'Grano', icon: '🌾', color: '#d8ae4a' },
  vegetables: { label: 'Verduras', icon: '🥕', color: '#6ea84f' },
  milk: { label: 'Leche', icon: '🥛', color: '#f2eee1' },
  eggs: { label: 'Huevos', icon: '🥚', color: '#ead9ad' },
  wool: { label: 'Lana', icon: '🧶', color: '#d6c4c8' },
  flour: { label: 'Harina', icon: '⚪', color: '#e7dec7' },
  bread: { label: 'Pan', icon: '🥖', color: '#c9803f' },
  tools: { label: 'Herramientas', icon: '🔨', color: '#70838a' },
  coins: { label: 'Monedas', icon: '🪙', color: '#e6b84a' }
};

export const CATEGORIES = [
  { id: 'vivienda', label: 'Vivienda' },
  { id: 'campo', label: 'Campo' },
  { id: 'industria', label: 'Producción' },
  { id: 'comunidad', label: 'Comunidad' },
  { id: 'maravillas', label: 'Maravillas' }
];

export const BUILDINGS = {
  townhall: {
    name: 'Casa comunal', category: 'comunidad', icon: '🏛️', size: [2, 2], cost: {},
    description: 'Corazón administrativo de la comunidad. No requiere trabajadores.',
    color: '#bc7750', roof: '#5d6f52', maxWorkers: 0, initial: true
  },
  house: {
    name: 'Casa campesina', category: 'vivienda', icon: '🏡', size: [1, 1], cost: { wood: 30, stone: 10 },
    description: 'Aumenta la capacidad de población en 4 habitantes.',
    color: '#d9b77d', roof: '#a9513f', maxWorkers: 0, housing: 4
  },
  farm: {
    name: 'Huerta', category: 'campo', icon: '🌾', size: [2, 1], cost: { wood: 18, stone: 4 },
    description: 'Cultiva grano y verduras. Cada agricultor mejora la cosecha.',
    color: '#9d743b', roof: '#c69b45', maxWorkers: 3,
    production: { hours: 10, inputs: {}, outputs: { grain: 7, vegetables: 5 }, label: 'Cosecha' }
  },
  barn: {
    name: 'Establo', category: 'campo', icon: '🐄', size: [2, 1], cost: { wood: 42, stone: 18, grain: 8 },
    description: 'Cría animales y produce leche, huevos y lana.',
    color: '#b85a42', roof: '#7b3e34', maxWorkers: 2, animalHousing: 12,
    production: { hours: 12, inputs: { grain: 2 }, outputs: { milk: 3, eggs: 3, wool: 1 }, label: 'Productos animales' }
  },
  lumber: {
    name: 'Casa forestal', category: 'industria', icon: '🪵', size: [1, 1], cost: { wood: 24, stone: 8 },
    description: 'Gestiona el bosque de forma sostenible y obtiene madera.',
    color: '#8a613f', roof: '#42634b', maxWorkers: 2,
    production: { hours: 9, inputs: {}, outputs: { wood: 8 }, label: 'Tala selectiva' }
  },
  quarry: {
    name: 'Cantera', category: 'industria', icon: '🪨', size: [2, 1], cost: { wood: 28, stone: 8 },
    description: 'Extrae piedra de manera gradual para nuevas construcciones.',
    color: '#7e8588', roof: '#5c6568', maxWorkers: 2,
    production: { hours: 11, inputs: {}, outputs: { stone: 7 }, label: 'Extracción' }
  },
  workshop: {
    name: 'Taller', category: 'industria', icon: '🔨', size: [1, 1], cost: { wood: 45, stone: 30 },
    description: 'Convierte madera y piedra en herramientas.',
    color: '#b98657', roof: '#596870', maxWorkers: 2,
    production: { hours: 12, inputs: { wood: 5, stone: 2 }, outputs: { tools: 2 }, label: 'Herramientas' }
  },
  mill: {
    name: 'Molino', category: 'industria', icon: '⚙️', size: [1, 1], cost: { wood: 38, stone: 24 },
    description: 'Muele el grano para obtener harina.',
    color: '#d2c29f', roof: '#7c7162', maxWorkers: 2,
    production: { hours: 7, inputs: { grain: 4 }, outputs: { flour: 4 }, label: 'Molienda' }
  },
  bakery: {
    name: 'Panadería', category: 'industria', icon: '🥖', size: [1, 1], cost: { wood: 42, stone: 20 },
    description: 'Hornea pan, un alimento eficiente y valioso para comerciar.',
    color: '#d9a66d', roof: '#9c5542', maxWorkers: 2,
    production: { hours: 8, inputs: { flour: 3 }, outputs: { bread: 5 }, label: 'Horneado' }
  },
  market: {
    name: 'Mercado', category: 'comunidad', icon: '🏪', size: [2, 1], cost: { wood: 48, stone: 28, coins: 25 },
    description: 'Permite comerciar con pueblos vecinos controlados por bots.',
    color: '#dfb15b', roof: '#b8534b', maxWorkers: 1, happiness: 3
  },
  warehouse: {
    name: 'Almacén', category: 'comunidad', icon: '📦', size: [2, 1], cost: { wood: 55, stone: 24 },
    description: 'Organiza las reservas y concede un pequeño bono de producción.',
    color: '#a4774f', roof: '#596550', maxWorkers: 1, productionBonus: 0.08
  },
  plaza: {
    name: 'Plaza florida', category: 'comunidad', icon: '🌻', size: [2, 2], cost: { wood: 24, stone: 36, coins: 20 },
    description: 'Lugar de encuentro que aumenta el bienestar de la población.',
    color: '#769b68', roof: '#d8b95f', maxWorkers: 0, happiness: 8
  },
  grandGarden: {
    name: 'Gran Jardín de la Concordia', category: 'maravillas', icon: '🌳', size: [3, 3],
    cost: { wood: 220, stone: 140, tools: 24, coins: 180 },
    description: 'Maravilla opcional: un jardín monumental dedicado a la cooperación.',
    color: '#5f9d64', roof: '#ddc25b', maxWorkers: 0, happiness: 20, wonder: true
  },
  observatory: {
    name: 'Observatorio de las Estrellas', category: 'maravillas', icon: '🔭', size: [2, 2],
    cost: { wood: 170, stone: 230, tools: 32, coins: 220 },
    description: 'Maravilla opcional: celebra el conocimiento sin terminar la partida.',
    color: '#7786a9', roof: '#48546f', maxWorkers: 0, happiness: 16, wonder: true
  }
};

export const BOT_TOWNS = [
  {
    id: 'marisma-clara', name: 'Marisma Clara', color: '#5f9f91', specialty: 'Lácteos y tejidos',
    offers: [
      { mode: 'buy', resource: 'milk', price: 5 },
      { mode: 'buy', resource: 'wool', price: 8 },
      { mode: 'sell', resource: 'grain', price: 3 }
    ]
  },
  {
    id: 'puerto-lucero', name: 'Puerto Lucero', color: '#4e7ca1', specialty: 'Herramientas y piedra',
    offers: [
      { mode: 'buy', resource: 'tools', price: 15 },
      { mode: 'sell', resource: 'stone', price: 4 },
      { mode: 'buy', resource: 'bread', price: 7 }
    ]
  },
  {
    id: 'valle-dorado', name: 'Valle Dorado', color: '#c38b45', specialty: 'Madera y alimentos',
    offers: [
      { mode: 'sell', resource: 'wood', price: 4 },
      { mode: 'buy', resource: 'vegetables', price: 4 },
      { mode: 'sell', resource: 'eggs', price: 5 }
    ]
  }
];

export const VILLAGER_NAMES = [
  'Alba', 'Bruno', 'Celia', 'Damián', 'Elena', 'Fabio', 'Gaia', 'Hugo',
  'Inés', 'Jaime', 'Lina', 'Mateo', 'Nora', 'Óscar', 'Paz', 'Rita',
  'Sol', 'Teo', 'Vera', 'Yago', 'Amaya', 'Biel', 'Clara', 'Darío'
];

export const SEASONS = [
  { name: 'Primavera', icon: '🌱', ground: '#7fae5b', accent: '#8fc46a', farm: 1.1 },
  { name: 'Verano', icon: '☀️', ground: '#8caf58', accent: '#a7c66a', farm: 1.12 },
  { name: 'Otoño', icon: '🍂', ground: '#a79554', accent: '#c0a55e', farm: 1.2 },
  { name: 'Invierno', icon: '❄️', ground: '#a8b8b5', accent: '#c3cfca', farm: 0.85 }
];

export const HELP_SECTIONS = [
  ['Objetivo abierto', 'Haz crecer tu civilización a tu ritmo. No hay guerras, niveles ni derrota definitiva. Las maravillas son hitos opcionales y puedes continuar después de construirlas.'],
  ['Construcción', 'Elige un edificio y haz clic en una casilla libre. Las obras avanzan con aldeanos disponibles; puedes construir en cualquier parte accesible del mapa.'],
  ['Población', 'Las casas aumentan la capacidad. Con alimento, bienestar y espacio libre llegarán nuevos habitantes. Nadie desaparece por falta de comida: el bienestar baja hasta que te recuperes.'],
  ['Producción', 'Selecciona un edificio terminado para asignar trabajadores. Algunas cadenas consumen insumos: grano → harina → pan, y madera + piedra → herramientas.'],
  ['Comercio', 'Construye un mercado para comprar y vender a tres pueblos bot. Sus precios cambian un poco cada día.'],
  ['Controles', 'Arrastra para desplazar, usa la rueda para acercar, WASD o flechas para mover la cámara. Espacio pausa; 1, 2 y 3 cambian la velocidad.']
];
