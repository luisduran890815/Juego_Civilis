export const GAME_VERSION = '1.2.0';
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
  coins: { label: 'Monedas', icon: '🪙', color: '#e6b84a' },
  corn: { label: 'Maíz', icon: '🌽', color: '#e7bd45' },
  fruit: { label: 'Frutas', icon: '🍎', color: '#cf5c50' },
  grapes: { label: 'Uvas', icon: '🍇', color: '#75538f' },
  meat: { label: 'Carne', icon: '🥩', color: '#b85f52' },
  cheese: { label: 'Queso', icon: '🧀', color: '#e2bd4d' },
  fabric: { label: 'Tela', icon: '🧵', color: '#7296a6' },
  clothes: { label: 'Ropa', icon: '👕', color: '#658bb2' }
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
  cornField: { name: 'Maizal', category: 'campo', icon: '🌽', size: [2, 1], cost: { wood: 22, stone: 5 }, description: 'Cultiva maíz para alimento y crianza.', color: '#b88e3d', roof: '#d6b84d', maxWorkers: 3, production: { hours: 10, inputs: {}, outputs: { corn: 9 }, label: 'Cosecha de maíz' } },
  orchard: { name: 'Huerto frutal', category: 'campo', icon: '🍎', size: [2, 2], cost: { wood: 34, stone: 8 }, description: 'Produce frutas frescas.', color: '#6f914f', roof: '#9f4e3f', maxWorkers: 3, production: { hours: 14, inputs: {}, outputs: { fruit: 8 }, label: 'Recolección de fruta' } },
  vineyard: { name: 'Viñedo', category: 'campo', icon: '🍇', size: [2, 2], cost: { wood: 40, stone: 12, coins: 10 }, description: 'Cultiva uvas de alto valor.', color: '#7f8750', roof: '#694c79', maxWorkers: 3, production: { hours: 15, inputs: {}, outputs: { grapes: 7 }, label: 'Vendimia' } },
  chickenCoop: { name: 'Gallinero', category: 'campo', icon: '🐔', size: [1, 1], cost: { wood: 30, stone: 8, grain: 5 }, description: 'Produce huevos eficientemente.', color: '#c78b59', roof: '#8d4e3d', maxWorkers: 2, animalHousing: 10, production: { hours: 8, inputs: { grain: 1 }, outputs: { eggs: 5 }, label: 'Recolección de huevos' } },
  sheepfold: { name: 'Ovejero', category: 'campo', icon: '🐑', size: [2, 1], cost: { wood: 44, stone: 14, grain: 6 }, description: 'Produce lana para tejidos.', color: '#bab6a3', roof: '#6b655d', maxWorkers: 2, animalHousing: 10, production: { hours: 11, inputs: { grain: 2 }, outputs: { wool: 4 }, label: 'Esquila' } },
  pigsty: { name: 'Porqueriza', category: 'campo', icon: '🐖', size: [2, 1], cost: { wood: 46, stone: 16, grain: 8 }, description: 'Produce carne para la comunidad.', color: '#aa7964', roof: '#775043', maxWorkers: 2, animalHousing: 8, production: { hours: 14, inputs: { grain: 3, corn: 2 }, outputs: { meat: 4 }, label: 'Producción de carne' } },
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
  cheeseMaker: { name: 'Quesería', category: 'industria', icon: '🧀', size: [1, 1], cost: { wood: 48, stone: 24, coins: 12 }, description: 'Transforma leche en queso.', color: '#d6ad5a', roof: '#8c6250', maxWorkers: 2, production: { hours: 9, inputs: { milk: 3 }, outputs: { cheese: 2 }, label: 'Elaboración de queso' } },
  weaver: { name: 'Tejeduría', category: 'industria', icon: '🧵', size: [1, 1], cost: { wood: 52, stone: 20, tools: 2 }, description: 'Convierte lana en tela.', color: '#7894a2', roof: '#596575', maxWorkers: 2, production: { hours: 10, inputs: { wool: 3 }, outputs: { fabric: 2 }, label: 'Tejido de tela' } },
  tailor: { name: 'Sastrería', category: 'industria', icon: '👕', size: [1, 1], cost: { wood: 58, stone: 18, tools: 3, coins: 15 }, description: 'Convierte tela en ropa.', color: '#6b8dad', roof: '#4e6078', maxWorkers: 2, production: { hours: 11, inputs: { fabric: 2 }, outputs: { clothes: 2 }, label: 'Confección' } },
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
  school: { name: 'Escuela', category: 'comunidad', icon: '🏫', size: [2, 2], cost: { wood: 75, stone: 55, tools: 6, coins: 35 }, description: 'Mejora el bienestar y la productividad.', color: '#d4b36b', roof: '#805646', maxWorkers: 2, happiness: 7, productionBonus: 0.03 },
  clinic: { name: 'Centro médico', category: 'comunidad', icon: '🏥', size: [2, 2], cost: { wood: 85, stone: 70, tools: 8, coins: 50 }, description: 'Mejora notablemente el bienestar.', color: '#e2dfd2', roof: '#a7544d', maxWorkers: 3, happiness: 11 },
  library: { name: 'Biblioteca', category: 'comunidad', icon: '📚', size: [2, 2], cost: { wood: 90, stone: 80, tools: 10, coins: 60 }, description: 'Conserva conocimiento y mejora la producción.', color: '#b89162', roof: '#586b60', maxWorkers: 2, happiness: 8, productionBonus: 0.05 },
  grandLibrary: { name: 'Gran Biblioteca Universal', category: 'maravillas', icon: '📚', size: [3, 3], cost: { wood: 520, stone: 620, tools: 120, coins: 900 }, description: 'Maravilla del conocimiento: +8% de producción y +12 de bienestar.', color: '#b18a5d', roof: '#4f665d', maxWorkers: 0, happiness: 12, productionBonus: 0.08, wonder: true },
  colossalLighthouse: { name: 'Faro Colosal', category: 'maravillas', icon: '🗼', size: [3, 3], cost: { wood: 360, stone: 900, tools: 160, coins: 1100 }, description: 'Símbolo costero: +6% de producción y +10 de bienestar.', color: '#d7d1b7', roof: '#b55546', maxWorkers: 0, happiness: 10, productionBonus: 0.06, wonder: true },
  hangingGardens: { name: 'Jardines Colgantes', category: 'maravillas', icon: '🌿', size: [3, 3], cost: { wood: 640, stone: 480, vegetables: 700, fruit: 650, tools: 80, coins: 700 }, description: 'Jardines monumentales: +24 de bienestar.', color: '#6b9d67', roof: '#d0b65d', maxWorkers: 0, happiness: 24, wonder: true },
  grandTheater: { name: 'Gran Teatro de las Artes', category: 'maravillas', icon: '🎭', size: [3, 2], cost: { wood: 580, stone: 540, fabric: 180, clothes: 120, tools: 90, coins: 850 }, description: 'Centro cultural: +18 de bienestar y +3% de producción.', color: '#a66d62', roof: '#5f4768', maxWorkers: 0, happiness: 18, productionBonus: 0.03, wonder: true },
  peoplesPalace: { name: 'Palacio del Pueblo', category: 'maravillas', icon: '🏛️', size: [4, 3], cost: { wood: 700, stone: 1100, tools: 190, coins: 1300 }, description: 'Gran obra cívica: +20 de bienestar y +5% de producción.', color: '#c5a56c', roof: '#6b5749', maxWorkers: 0, happiness: 20, productionBonus: 0.05, wonder: true },
  concordCathedral: { name: 'Catedral de la Concordia', category: 'maravillas', icon: '⛪', size: [3, 3], cost: { wood: 450, stone: 1250, tools: 175, coins: 1150 }, description: 'Monumento a la paz: +26 de bienestar.', color: '#d0c7ad', roof: '#57707a', maxWorkers: 0, happiness: 26, wonder: true },
  imperialBridge: { name: 'Puente Imperial', category: 'maravillas', icon: '🌉', size: [4, 2], cost: { wood: 820, stone: 1050, tools: 220, coins: 900 }, description: 'Proeza de ingeniería: +7% de producción y +8 de bienestar.', color: '#9e8e77', roof: '#575c5b', maxWorkers: 0, happiness: 8, productionBonus: 0.07, wonder: true },
  solarTemple: { name: 'Templo del Sol', category: 'maravillas', icon: '☀️', size: [3, 3], cost: { stone: 1350, tools: 150, coins: 1400, corn: 500, grain: 500 }, description: 'Santuario luminoso: +16 de bienestar y +6% de producción.', color: '#d9b55a', roof: '#a75b3f', maxWorkers: 0, happiness: 16, productionBonus: 0.06, wonder: true },
  worldClock: { name: 'Torre del Tiempo', category: 'maravillas', icon: '🕰️', size: [2, 3], cost: { wood: 420, stone: 980, tools: 240, coins: 1250 }, description: 'Torre mecánica: +9% de producción.', color: '#8d8c83', roof: '#4c6470', maxWorkers: 0, happiness: 6, productionBonus: 0.09, wonder: true },
  crystalAqueduct: { name: 'Acueducto de Cristal', category: 'maravillas', icon: '💧', size: [4, 2], cost: { stone: 1450, tools: 210, coins: 1000 }, description: 'Infraestructura monumental: +14 de bienestar y +7% de producción.', color: '#96b7bd', roof: '#54747c', maxWorkers: 0, happiness: 14, productionBonus: 0.07, wonder: true },
  peaceColossus: { name: 'Coloso de la Paz', category: 'maravillas', icon: '🕊️', size: [3, 3], cost: { stone: 1500, tools: 260, coins: 1600 }, description: 'Estatua monumental: +28 de bienestar.', color: '#c9c2ac', roof: '#758077', maxWorkers: 0, happiness: 28, wonder: true },
  harvestSanctuary: { name: 'Santuario de la Cosecha', category: 'maravillas', icon: '🌾', size: [3, 3], cost: { wood: 750, stone: 650, grain: 1000, corn: 800, fruit: 450, tools: 120, coins: 650 }, description: 'Celebra la abundancia: +10% de producción agrícola general.', color: '#b99445', roof: '#6f7047', maxWorkers: 0, happiness: 10, productionBonus: 0.10, wonder: true },
  artisansCitadel: { name: 'Ciudadela de los Artesanos', category: 'maravillas', icon: '⚒️', size: [4, 3], cost: { wood: 900, stone: 950, tools: 320, fabric: 220, clothes: 130, coins: 1200 }, description: 'Cumbre manufacturera: +12% de producción.', color: '#9d7456', roof: '#505d65', maxWorkers: 0, happiness: 8, productionBonus: 0.12, wonder: true },
  hallOfNations: { name: 'Salón de los Pueblos', category: 'maravillas', icon: '🤝', size: [4, 3], cost: { wood: 780, stone: 1000, tools: 180, cheese: 300, clothes: 180, coins: 1800 }, description: 'Casa del intercambio: +15 de bienestar y +8% de producción.', color: '#ba8c59', roof: '#506d68', maxWorkers: 0, happiness: 15, productionBonus: 0.08, wonder: true },
  eternalArchive: { name: 'Archivo de la Memoria', category: 'maravillas', icon: '📜', size: [3, 3], cost: { wood: 560, stone: 1150, tools: 210, fabric: 250, coins: 1450 }, description: 'Preserva el legado: +18 de bienestar y +10% de producción.', color: '#a98862', roof: '#4e5965', maxWorkers: 0, happiness: 18, productionBonus: 0.10, wonder: true },
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


// 1,000 optional aspirations: 8 progressive categories x 125 tiers.
// They are generated deterministically, so saved games remain compact and compatible.
export const ASPIRATION_CATEGORIES = [
  { id: 'population', label: 'Población', icon: '👥' },
  { id: 'production', label: 'Producción', icon: '📦' },
  { id: 'trade', label: 'Comercio', icon: '🤝' },
  { id: 'wealth', label: 'Riqueza', icon: '🪙' },
  { id: 'housing', label: 'Vivienda', icon: '🏘️' },
  { id: 'days', label: 'Permanencia', icon: '📅' },
  { id: 'buildings', label: 'Urbanismo', icon: '🏗️' },
  { id: 'food', label: 'Reservas', icon: '🌾' }
];

const aspirationScale = {
  population: tier => 10 + tier * 5,
  production: tier => tier * 250,
  trade: tier => tier * 100,
  wealth: tier => tier * 250,
  housing: tier => 10 + tier * 6,
  days: tier => tier * 15,
  buildings: tier => 5 + tier * 2,
  food: tier => tier * 300
};

const aspirationDetail = {
  population: target => `${target} habitantes`,
  production: target => `${target.toLocaleString('es-CO')} bienes producidos`,
  trade: target => `${target.toLocaleString('es-CO')} bienes comerciados`,
  wealth: target => `${target.toLocaleString('es-CO')} monedas acumuladas`,
  housing: target => `Capacidad para ${target} habitantes`,
  days: target => `Alcanzar el día ${target}`,
  buildings: target => `${target} edificios construidos`,
  food: target => `${target.toLocaleString('es-CO')} puntos de alimento reservados`
};

export const ASPIRATIONS = ASPIRATION_CATEGORIES.flatMap(category =>
  Array.from({ length: 125 }, (_, index) => {
    const tier = index + 1;
    const target = aspirationScale[category.id](tier);
    return {
      id: `${category.id}-${String(tier).padStart(3, '0')}`,
      category: category.id,
      tier,
      icon: category.icon,
      title: `${category.label} ${tier}`,
      detail: aspirationDetail[category.id](target),
      metric: category.id,
      target
    };
  })
);
