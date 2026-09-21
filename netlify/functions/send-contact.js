const nodemailer = require('nodemailer');

const ADMIN_INBOX = 'gruponi2026@gmail.com';

function json(status, body) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(body),
  };
}

function fail(field, err, status = 400) {
  return json(status, { code: false, field, err });
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function contactTemplate(data) {
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
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;font-size:15px;font-weight:600;">${name}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Correo</td>
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;font-size:15px;">
                    <a href="mailto:${email}" style="color:#5237f9;text-decoration:none;font-weight:600;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Carrera</td>
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;font-size:15px;">${career}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Universidad</td>
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;font-size:15px;">${university}</td>
                </tr>
              </table>
              <div style="margin:22px 0 8px;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Mensaje</div>
              <div style="background:#f7f5ff;border:1px solid #ece7ff;border-radius:12px;padding:16px 18px;font-size:15px;line-height:1.7;">
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

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(204, {});
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { code: false, err: 'Method not allowed' });
  }

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return fail('contact-message', 'No se pudo enviar el mensaje. Inténtalo nuevamente.');
  }

  const honeypot = String(body.company || body['contact-company'] || '').trim();
  if (honeypot) {
    return json(200, { code: true, success: '¡Mensaje enviado correctamente! Te responderemos pronto.' });
  }

  const name = String(body.name || body['contact-name'] || '').trim();
  const email = String(body.email || body['contact-email'] || '').trim();
  const career = String(body.career || body['contact-career'] || '').trim();
  const university = String(body.university || body['contact-university'] || '').trim();
  const message = String(body.message || body['contact-message'] || '').trim();

  if (!name) return fail('contact-name', 'El nombre no puede estar vacío.');
  if (name.length > 120) return fail('contact-name', 'El nombre es demasiado largo.');
  if (!email) return fail('contact-email', 'El correo no puede estar vacío.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail('contact-email', 'Ingresa un correo válido.');
  }
  if (!message) return fail('contact-message', 'El mensaje no puede estar vacío.');
  if (message.length > 5000) return fail('contact-message', 'El mensaje es demasiado largo.');

  const smtpUser = process.env.MAIL_SMTP_USER || 'gruponi2026@gmail.com';
  const smtpPass = process.env.MAIL_SMTP_PASS || '';
  const mailTo = process.env.MAIL_TO || ADMIN_INBOX;
  const mailFrom = process.env.MAIL_FROM || smtpUser;
  const mailFromName = process.env.MAIL_FROM_NAME || 'Grupo NI';

  if (!smtpPass || smtpPass === 'generar en la web' || smtpPass === 'your_gmail_app_password_here') {
    console.error('[send-contact] MAIL_SMTP_PASS is missing');
    return fail('contact-message', 'No se pudo enviar el mensaje. Inténtalo nuevamente.', 500);
  }

  const when = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.MAIL_SMTP_PORT || 587),
    secure: Number(process.env.MAIL_SMTP_PORT || 587) === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  try {
    await transporter.sendMail({
      from: `"${mailFromName}" <${mailFrom}>`,
      to: mailTo,
      replyTo: `"${name}" <${email}>`,
      subject: `[Grupo NI] Mensaje de ${name}`,
      html: contactTemplate({ name, email, career, university, message, when }),
      text:
        `Nuevo mensaje de contacto — Grupo NI\n\n` +
        `Fecha: ${when}\nNombre: ${name}\nCorreo: ${email}\n` +
        `Carrera: ${career || '—'}\nUniversidad: ${university || '—'}\n\n` +
        `Mensaje:\n${message}\n`,
    });
  } catch (err) {
    console.error('[send-contact]', err?.message || err);
    return fail('contact-message', 'No se pudo enviar el mensaje. Inténtalo nuevamente.', 502);
  }

  return json(200, {
    code: true,
    success: '¡Mensaje enviado correctamente! Te responderemos pronto.',
  });
};
