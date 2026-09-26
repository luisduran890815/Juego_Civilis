import { createHash, randomBytes, randomUUID } from 'node:crypto';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff'
};

const json = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });
const hash = value => createHash('sha256').update(String(value)).digest('hex');
const validId = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || '');

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase no está configurado en el hosting.');
  return { url: url.replace(/\/$/, ''), key };
}

async function supabase(path, options = {}) {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      prefer: 'return=representation',
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    console.error('Supabase response:', response.status, body);
    throw new Error('No se pudo completar la operación de guardado.');
  }
  return body;
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Método no permitido.' });

  try {
    if ((event.body || '').length > 2_000_000) return json(413, { error: 'La partida supera el tamaño permitido.' });
    const input = JSON.parse(event.body || '{}');
    const action = input.action;

    if (action === 'create') {
      if (!input.data || typeof input.data !== 'object') return json(400, { error: 'Datos de partida inválidos.' });
      const id = randomUUID();
      const token = `civ_${randomBytes(24).toString('base64url')}`;
      const rows = await supabase('civilis_saves', {
        method: 'POST',
        body: JSON.stringify({ id, save_token_hash: hash(token), data: input.data })
      });
      return json(200, { id, token, updatedAt: rows?.[0]?.updated_at || new Date().toISOString() });
    }

    if (action === 'save' || action === 'load') {
      if (!validId(input.id) || typeof input.token !== 'string' || input.token.length < 20) {
        return json(400, { error: 'ID o clave privada inválidos.' });
      }
      const encodedHash = encodeURIComponent(hash(input.token));
      const encodedId = encodeURIComponent(input.id);

      if (action === 'load') {
        const rows = await supabase(`civilis_saves?id=eq.${encodedId}&save_token_hash=eq.${encodedHash}&select=data,updated_at`, { method: 'GET' });
        if (!rows?.length) return json(404, { error: 'No se encontró la partida o la clave no coincide.' });
        return json(200, { data: rows[0].data, updatedAt: rows[0].updated_at });
      }

      if (!input.data || typeof input.data !== 'object') return json(400, { error: 'Datos de partida inválidos.' });
      const rows = await supabase(`civilis_saves?id=eq.${encodedId}&save_token_hash=eq.${encodedHash}`, {
        method: 'PATCH',
        body: JSON.stringify({ data: input.data, updated_at: new Date().toISOString() })
      });
      if (!rows?.length) return json(404, { error: 'No se encontró la partida o la clave no coincide.' });
      return json(200, { updatedAt: rows[0].updated_at });
    }

    return json(400, { error: 'Acción no reconocida.' });
  } catch (error) {
    console.error(error);
    return json(500, { error: error.message || 'Error interno de guardado.' });
  }
}
