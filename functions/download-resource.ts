/**
 * Gated resource download: membership check + download log + short signed URL.
 * file_key never returned to the browser.
 */
import { createClient, createAdminClient } from 'npm:@insforge/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const SIGNED_URL_TTL_SECONDS = 120;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function firstRow<T>(data: T | T[] | null | undefined): T | null {
  if (!data) return null;
  return Array.isArray(data) ? data[0] || null : data;
}

function mapRpcError(message: string): { status: number; error: string } {
  const msg = String(message || '');
  const lower = msg.toLowerCase();
  if (lower.includes('not authenticated')) {
    return { status: 401, error: 'Debes iniciar sesión para descargar.' };
  }
  if (lower.includes('membership required')) {
    return { status: 403, error: 'Tu membresía no permite descargar este recurso.' };
  }
  if (lower.includes('not available') || lower.includes('not found')) {
    return { status: 404, error: 'Recurso no disponible.' };
  }
  return { status: 400, error: msg || 'No se pudo preparar la descarga.' };
}

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  const userToken = authHeader?.replace(/^Bearer\s+/i, '').trim() || null;
  if (!userToken) {
    return json({ error: 'Debes iniciar sesión para descargar.' }, 401);
  }

  const baseUrl = Deno.env.get('INSFORGE_BASE_URL');
  const apiKey = Deno.env.get('API_KEY');
  if (!baseUrl || !apiKey) {
    return json({ error: 'Server misconfigured' }, 500);
  }

  let body: { resourceId?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const resourceId = String(body.resourceId || '').trim();
  if (!resourceId) {
    return json({ error: 'resourceId is required' }, 400);
  }

  const client = createClient({
    baseUrl,
    accessToken: userToken,
  });

  const { data: userData, error: userError } = await client.auth.getCurrentUser();
  if (userError || !userData?.user?.id) {
    return json({ error: 'Debes iniciar sesión para descargar.' }, 401);
  }

  const { data: claimRaw, error: claimError } = await client.database.rpc(
    'claim_resource_download',
    { p_resource_id: resourceId }
  );

  if (claimError) {
    const mapped = mapRpcError(claimError.message || String(claimError));
    return json({ error: mapped.error, details: claimError }, mapped.status);
  }

  const claim = firstRow(claimRaw) as {
    file_key?: string;
    file_name?: string;
    mime_type?: string | null;
    download_count?: number;
  } | null;

  if (!claim?.file_key) {
    return json({ error: 'No se pudo preparar la descarga.' }, 500);
  }

  const admin = createAdminClient({
    baseUrl,
    apiKey,
  });

  const { data: signed, error: signError } = await admin.storage
    .from('resource-files')
    .createSignedUrl(claim.file_key, SIGNED_URL_TTL_SECONDS);

  if (signError || !signed?.signedUrl) {
    return json(
      {
        error: 'No se pudo generar el enlace de descarga.',
        details: signError?.message || signError,
      },
      500
    );
  }

  return json({
    ok: true,
    signedUrl: signed.signedUrl,
    fileName: claim.file_name || 'recurso',
    mimeType: claim.mime_type || null,
    downloadCount: claim.download_count ?? null,
    expiresIn: SIGNED_URL_TTL_SECONDS,
  });
}
