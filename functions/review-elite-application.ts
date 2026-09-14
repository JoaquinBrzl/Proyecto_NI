/**
 * Admin review of Elite applications.
 * Applies approve/reject via RPC first; on reject, sends email (warning if mail fails).
 */
import { createClient } from 'npm:@insforge/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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

function escapeHtml(str: string) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
    return json({ error: 'Unauthorized' }, 401);
  }

  const baseUrl = Deno.env.get('INSFORGE_BASE_URL');
  if (!baseUrl) {
    return json({ error: 'Server misconfigured: INSFORGE_BASE_URL' }, 500);
  }

  let body: { applicationId?: string; decision?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const applicationId = String(body.applicationId || '').trim();
  const decision = String(body.decision || '').trim();
  if (!applicationId) {
    return json({ error: 'applicationId is required' }, 400);
  }
  if (decision !== 'approved' && decision !== 'rejected') {
    return json({ error: 'decision must be approved or rejected' }, 400);
  }

  const client = createClient({
    baseUrl,
    accessToken: userToken,
  });

  const { data: userData, error: userError } = await client.auth.getCurrentUser();
  if (userError || !userData?.user?.id) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const { data: adminRaw, error: adminError } = await client.database.rpc('is_admin');
  const isAdmin = firstRow(adminRaw) === true || adminRaw === true;
  if (adminError || !isAdmin) {
    return json({ error: 'Forbidden: admin only' }, 403);
  }

  // Resolve applicant email before review (needed for reject notification)
  let applicantEmail: string | null = null;
  let applicantName = 'postulante';
  const { data: listData } = await client.database.rpc('list_elite_applications_admin');
  const list = Array.isArray(listData) ? listData : listData ? [listData] : [];
  const existing = list.find((row: { id?: string }) => row.id === applicationId);
  if (existing) {
    applicantEmail = existing.email || null;
    const full = `${existing.nombres || ''} ${existing.apellidos || ''}`.trim();
    if (full) applicantName = full;
  }

  const { data: reviewedRaw, error: reviewError } = await client.database.rpc(
    'review_elite_application',
    {
      p_application_id: applicationId,
      p_decision: decision,
    }
  );

  if (reviewError) {
    return json(
      { error: reviewError.message || 'Review failed', details: reviewError },
      400
    );
  }

  const application = firstRow(reviewedRaw) || reviewedRaw;

  if (decision === 'approved') {
    return json({
      ok: true,
      application,
      emailSent: false,
      warning: null,
    });
  }

  // Rejected: notify applicant by email (decision already applied)
  if (!applicantEmail) {
    return json({
      ok: true,
      application,
      emailSent: false,
      warning: 'Decisión aplicada, pero no se encontró el email del postulante.',
    });
  }

  const safeName = escapeHtml(applicantName);
  const html = `
    <div style="font-family: system-ui, sans-serif; line-height: 1.5; color: #0f172a;">
      <h1 style="font-size: 1.25rem;">Postulación NI Elite</h1>
      <p>Hola ${safeName},</p>
      <p>Lamentamos informarte que tu postulación a <strong>NI Elite</strong> no fue aprobada en esta ocasión.</p>
      <p>Puedes volver a postular desde la página de membresías cuando lo desees.</p>
      <p style="opacity: 0.75; font-size: 0.9rem;">— Equipo Grupo NI</p>
    </div>
  `;

  const { data: emailData, error: emailError } = await client.emails.send({
    to: applicantEmail,
    subject: 'Tu postulación a NI Elite no fue aprobada',
    html,
    from: 'Grupo NI',
  });

  if (emailError) {
    return json({
      ok: true,
      application,
      emailSent: false,
      warning: `Decisión aplicada, pero el correo no se envió: ${emailError.message || 'error de envío'}`,
      emailError: emailError.message || String(emailError),
    });
  }

  return json({
    ok: true,
    application,
    emailSent: true,
    emailId: emailData?.id || null,
    warning: null,
  });
}
