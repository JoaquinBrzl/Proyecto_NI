/**
 * Public contact form: send a formatted message to the Grupo NI admin inbox.
 * Invoked from the browser (Netlify or XAMPP) — no PHP/SMTP.
 */
import { createAdminClient } from 'npm:@insforge/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const ADMIN_INBOX = 'gruponi2026@gmail.com';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function fail(field: string, err: string, status = 400) {
  return json({ code: false, field, err }, status);
}

function escapeHtml(str: string) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function contactTemplate(data: {
  name: string;
  email: string;
  career: string;
  university: string;
  message: string;
  when: string;
}) {
  const name = escapeHtml(data.name);
  const email = escapeHtml(data.email);
  const career = escapeHtml(data.career || '—');
  const university = escapeHtml(data.university || '—');
  const message = escapeHtml(data.message).replace(/\n/g, '<br>');
  const when = escapeHtml(data.when);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo mensaje de contacto</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Plus Jakarta Sans',Segoe UI,Helvetica,Arial,sans-serif;color:#1b1b1c;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eceef5;">
          <tr>
            <td style="background:#5237f9;padding:28px 32px;color:#ffffff;">
              <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.85;font-weight:700;">Grupo NI</div>
              <div style="font-size:24px;line-height:1.25;font-weight:800;margin-top:6px;">Nuevo mensaje de contacto</div>
              <div style="font-size:13px;margin-top:8px;opacity:0.9;">Recibido el ${when}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;">
              <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#363636;">
                Alguien envió una consulta desde el formulario de <strong>Contacto</strong> en la web.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;width:38%;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Nombre</td>
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;font-size:15px;font-weight:600;color:#1b1b1c;">${name}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Correo</td>
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;font-size:15px;">
                    <a href="mailto:${email}" style="color:#5237f9;text-decoration:none;font-weight:600;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Carrera</td>
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;font-size:15px;color:#1b1b1c;">${career}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Universidad</td>
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;font-size:15px;color:#1b1b1c;">${university}</td>
                </tr>
              </table>
              <div style="margin:22px 0 8px;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Mensaje</div>
              <div style="background:#f7f5ff;border:1px solid #ece7ff;border-radius:12px;padding:16px 18px;font-size:15px;line-height:1.7;color:#1b1b1c;">
                ${message}
              </div>
              <p style="margin:20px 0 0;font-size:13px;color:#64748b;line-height:1.5;">
                Puedes responder este correo y le llegará directamente a ${name}.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px 24px;font-size:12px;color:#94a3b8;">
              Este mensaje se envió desde el formulario de contacto de Grupo NI.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ code: false, err: 'Method not allowed' }, 405);
  }

  const baseUrl = Deno.env.get('INSFORGE_BASE_URL');
  const apiKey = Deno.env.get('API_KEY');
  if (!baseUrl || !apiKey) {
    return fail('contact-message', 'No se pudo enviar el mensaje. Inténtalo nuevamente.', 500);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail('contact-message', 'No se pudo enviar el mensaje. Inténtalo nuevamente.');
  }

  const honeypot = String(body.company ?? body['contact-company'] ?? '').trim();
  if (honeypot) {
    return json({ code: true, success: '¡Mensaje enviado correctamente! Te responderemos pronto.' });
  }

  const name = String(body.name ?? body['contact-name'] ?? '').trim();
  const email = String(body.email ?? body['contact-email'] ?? '').trim();
  const career = String(body.career ?? body['contact-career'] ?? '').trim();
  const university = String(body.university ?? body['contact-university'] ?? '').trim();
  const message = String(body.message ?? body['contact-message'] ?? '').trim();

  if (!name) return fail('contact-name', 'El nombre no puede estar vacío.');
  if (name.length > 120) return fail('contact-name', 'El nombre es demasiado largo.');
  if (!email) return fail('contact-email', 'El correo no puede estar vacío.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail('contact-email', 'Ingresa un correo válido.');
  }
  if (!message) return fail('contact-message', 'El mensaje no puede estar vacío.');
  if (message.length > 5000) return fail('contact-message', 'El mensaje es demasiado largo.');

  const inbox = Deno.env.get('CONTACT_MAIL_TO') || ADMIN_INBOX;
  const when = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });

  const admin = createAdminClient({
    baseUrl,
    apiKey,
  });

  const { error } = await admin.emails.send({
    to: inbox,
    subject: `[Grupo NI] Mensaje de ${name}`,
    html: contactTemplate({ name, email, career, university, message, when }),
    from: 'Grupo NI',
    replyTo: email,
  });

  if (error) {
    console.error('[send-contact-message]', error.message || error);
    return fail('contact-message', 'No se pudo enviar el mensaje. Inténtalo nuevamente.', 502);
  }

  return json({
    code: true,
    success: '¡Mensaje enviado correctamente! Te responderemos pronto.',
  });
}
