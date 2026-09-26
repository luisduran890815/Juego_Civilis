import { normalizeState, snapshotState } from './state.js';

const LOCAL_SAVE_KEY = 'civilis.save.v1';
const CLOUD_REF_KEY = 'civilis.cloud.v1';
const API_URL = '/.netlify/functions/save';

export function saveLocal(state) {
  const data = snapshotState(state);
  localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(data));
  return data.savedAt;
}

export function loadLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_SAVE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : null;
  } catch (error) {
    console.warn('No se pudo leer el guardado local:', error);
    return null;
  }
}

export function clearLocal() {
  localStorage.removeItem(LOCAL_SAVE_KEY);
  localStorage.removeItem(CLOUD_REF_KEY);
}

export function getCloudRef() {
  try {
    return JSON.parse(localStorage.getItem(CLOUD_REF_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setCloudRef(ref) {
  localStorage.setItem(CLOUD_REF_KEY, JSON.stringify(ref));
}

async function cloudRequest(payload) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Error HTTP ${response.status}`);
  return body;
}

export async function createCloudSave(state) {
  const result = await cloudRequest({ action: 'create', data: snapshotState(state) });
  const ref = { id: result.id, token: result.token, updatedAt: result.updatedAt };
  setCloudRef(ref);
  return ref;
}

export async function syncCloudSave(state, ref = getCloudRef()) {
  if (!ref?.id || !ref?.token) throw new Error('No hay una partida en la nube vinculada.');
  const result = await cloudRequest({ action: 'save', id: ref.id, token: ref.token, data: snapshotState(state) });
  const updated = { ...ref, updatedAt: result.updatedAt };
  setCloudRef(updated);
  return updated;
}

export async function loadCloudSave(id, token) {
  const result = await cloudRequest({ action: 'load', id: id.trim(), token: token.trim() });
  const ref = { id: id.trim(), token: token.trim(), updatedAt: result.updatedAt };
  setCloudRef(ref);
  return { state: normalizeState(result.data), ref };
}

export function exportSaveFile(state) {
  const blob = new Blob([JSON.stringify(snapshotState(state), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `civilis-${state.townName.toLowerCase().replace(/[^a-z0-9áéíóúüñ]+/gi, '-')}.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importSaveFile(file) {
  if (!file || file.size > 4_000_000) throw new Error('El archivo es demasiado grande.');
  const text = await file.text();
  return normalizeState(JSON.parse(text));
}
