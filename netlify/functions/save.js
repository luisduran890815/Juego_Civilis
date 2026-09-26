import { createHash, randomBytes, randomUUID } from 'node:crypto';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type'
};

const json = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });
const hash = value => createHash('sha256').update(String(value)).digest('hex');
const validId = value => /^[0-9a-f-]{36}$/i.test(value || '');

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url) throw new Error('Falta SUPABASE_URL');
  if (!key) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY');

  return { url: url.replace(/\/$/, ''), key: key.trim() };
}

async function supabase(path, options = {}) {
  const { url, key } = config();

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {})
    }
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('SUPABASE_ERROR', response.status, body);
    throw new Error(body?.message || body?.error || `Supabase HTTP ${response.status}`);
  }

  return body;
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Método no permitido.' });
  }

  try {
    const input = JSON.parse(event.body || '{}');

    if (input.action === 'create') {
      const id = randomUUID();
      const token = `civ_${randomBytes(24).toString('base64url')}`;

      const rows = await supabase('civilis_saves', {
        method: 'POST',
        body: JSON.stringify({
          id,
          save_token_hash: hash(token),
          data: input.data || {},
          updated_at: new Date().toISOString()
        })
      });

      return json(200, {
        id,
        token,
        updatedAt: rows?.[0]?.updated_at || new Date().toISOString()
      });
    }

    if (input.action === 'load') {
      const rows = await supabase(
        `civilis_saves?id=eq.${input.id}&save_token_hash=eq.${hash(input.token)}&select=*`,
        { method: 'GET' }
      );

      if (!rows?.length) {
        return json(404, { error: 'Partida no encontrada.' });
      }

      return json(200, {
        data: rows[0].data,
        updatedAt: rows[0].updated_at
      });
    }

    if (input.action === 'save') {
      const rows = await supabase(
        `civilis_saves?id=eq.${input.id}&save_token_hash=eq.${hash(input.token)}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            data: input.data || {},
            updated_at: new Date().toISOString()
          })
        }
      );

      if (!rows?.length) {
        return json(404, { error: 'Partida no encontrada.' });
      }

      return json(200, { updatedAt: rows[0].updated_at });
    }

    return json(400, { error: 'Acción no reconocida.' });
  } catch (error) {
    console.error('SAVE_FUNCTION_ERROR', error);
    return json(500, { error: error.message || 'Error interno.' });
  }
}
