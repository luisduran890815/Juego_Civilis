import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BUILDINGS, BOT_TOWNS, MAP_SIZE } from '../js/config.js';
import { createInitialState, normalizeState, snapshotState } from '../js/state.js';
import { handler } from '../netlify/functions/save.mjs';

const state = createInitialState();
assert.equal(state.mapSize, MAP_SIZE);
assert.equal(state.villagers.length, 6);
assert.ok(state.buildings.some(item => item.type === 'townhall'));
assert.ok(Object.values(BUILDINGS).some(item => item.wonder));
assert.equal(BOT_TOWNS.length, 3);
assert.deepEqual(normalizeState(snapshotState(state)).resources, state.resources);

for (const building of state.buildings) assert.ok(BUILDINGS[building.type], `Tipo desconocido: ${building.type}`);
for (const [type, meta] of Object.entries(BUILDINGS)) {
  assert.ok(meta.name && meta.size?.length === 2, `Metadatos incompletos: ${type}`);
  for (const amount of Object.values(meta.cost)) assert.ok(amount >= 0);
}

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
for (const id of ['gameCanvas', 'resourceBar', 'buildList', 'inspector', 'tradeDialog', 'cloudDialog']) {
  assert.ok(html.includes(`id="${id}"`), `Falta #${id} en index.html`);
  assert.ok(app.includes(`#${id}`), `#${id} no se usa en app.js`);
}

const methodResponse = await handler({ httpMethod: 'GET', body: '' });
assert.equal(methodResponse.statusCode, 405);

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
const requests = [];
globalThis.fetch = async (url, options) => {
  requests.push({ url, options });
  if (options.method === 'POST') return new Response(JSON.stringify([{ updated_at: '2026-09-26T20:00:00Z' }]), { status: 201 });
  if (options.method === 'PATCH') return new Response(JSON.stringify([{ updated_at: '2026-09-26T20:01:00Z' }]), { status: 200 });
  return new Response(JSON.stringify([{ data: state, updated_at: '2026-09-26T20:01:00Z' }]), { status: 200 });
};
const createResponse = await handler({ httpMethod: 'POST', body: JSON.stringify({ action: 'create', data: state }) });
assert.equal(createResponse.statusCode, 200);
const cloudRef = JSON.parse(createResponse.body);
assert.match(cloudRef.id, /^[0-9a-f-]{36}$/i);
assert.match(cloudRef.token, /^civ_/);
const loadResponse = await handler({ httpMethod: 'POST', body: JSON.stringify({ action: 'load', id: cloudRef.id, token: cloudRef.token }) });
assert.equal(loadResponse.statusCode, 200);
assert.equal(requests.length, 2);
assert.ok(!JSON.stringify(requests).includes(cloudRef.token), 'La clave privada no debe enviarse a Supabase');

console.log('✓ Estado inicial válido');
console.log(`✓ ${Object.keys(BUILDINGS).length} tipos de edificio y ${BOT_TOWNS.length} pueblos bot`);
console.log('✓ Contrato y flujo simulado de la función serverless válidos');
console.log('✓ Selectores principales conectados');
