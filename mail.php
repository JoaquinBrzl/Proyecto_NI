<?php
/**
 * Optional local PHP fallback. Production (Netlify) uses
 * functions/send-contact-message.ts via InsForge.
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json; charset=utf-8');

$msg = [];

function ni_env(string $key, string $default = ''): string
{
    static $loaded = null;
    if ($loaded === null) {
        $loaded = [];
        $path = __DIR__ . DIRECTORY_SEPARATOR . '.env.local';
        if (is_readable($path)) {
            foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
                $line = trim($line);
                if ($line === '' || str_starts_with($line, '#')) {
                    continue;
                }
                if (!str_contains($line, '=')) {
                    continue;
                }
                [$k, $v] = explode('=', $line, 2);
                $loaded[trim($k)] = trim($v, " \t\"'");
            }
        }
    }
    $value = $loaded[$key] ?? getenv($key);
    if ($value === false || $value === null || $value === '') {
        return $default;
    }
    return (string) $value;
}

function ni_fail(string $field, string $error): array
{
    return [
        'code' => false,
        'field' => $field,
        'err' => $error,
    ];
}

function ni_ok(string $success): array
{
    return [
        'code' => true,
        'success' => $success,
    ];
}

function ni_h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function ni_contact_template(array $data): string
{
    $name = ni_h($data['name']);
    $email = ni_h($data['email']);
    $career = ni_h($data['career'] !== '' ? $data['career'] : '—');
    $university = ni_h($data['university'] !== '' ? $data['university'] : '—');
    $phone = ni_h($data['phone'] !== '' ? $data['phone'] : '—');
    $subject = ni_h($data['subject'] !== '' ? $data['subject'] : 'Consulta general');
    $message = nl2br(ni_h($data['message']));
    $when = ni_h($data['when']);

    return <<<HTML
<!DOCTYPE html>
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
              <div style="font-size:13px;margin-top:8px;opacity:0.9;">Recibido el {$when}</div>
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
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;font-size:15px;font-weight:600;color:#1b1b1c;">{$name}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Correo</td>
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;font-size:15px;">
                    <a href="mailto:{$email}" style="color:#5237f9;text-decoration:none;font-weight:600;">{$email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Teléfono</td>
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;font-size:15px;color:#1b1b1c;">{$phone}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Carrera</td>
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;font-size:15px;color:#1b1b1c;">{$career}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Universidad</td>
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;font-size:15px;color:#1b1b1c;">{$university}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Asunto</td>
                  <td style="padding:10px 0;border-bottom:1px solid #eef1f6;font-size:15px;color:#1b1b1c;">{$subject}</td>
                </tr>
              </table>
              <div style="margin:22px 0 8px;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Mensaje</div>
              <div style="background:#f7f5ff;border:1px solid #ece7ff;border-radius:12px;padding:16px 18px;font-size:15px;line-height:1.7;color:#1b1b1c;">
                {$message}
              </div>
              <p style="margin:20px 0 0;font-size:13px;color:#64748b;line-height:1.5;">
                Puedes responder este correo y le llegará directamente a {$name}.
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
</html>
HTML;
}

$name = trim((string) ($_POST['contact-name'] ?? ''));
$phone = trim((string) ($_POST['contact-phone'] ?? ''));
$email = trim((string) ($_POST['contact-email'] ?? ''));
$career = trim((string) ($_POST['contact-career'] ?? ''));
$university = trim((string) ($_POST['contact-university'] ?? ''));
$subject = trim((string) ($_POST['subject'] ?? $_POST['contact-subject'] ?? ''));
$message = trim((string) ($_POST['contact-message'] ?? ''));
$honeypot = trim((string) ($_POST['contact-company'] ?? ''));

if ($honeypot !== '') {
    echo json_encode(ni_ok('¡Mensaje enviado correctamente!'));
    exit;
}

if ($name === '') {
    $msg = ni_fail('contact-name', 'El nombre no puede estar vacío.');
} elseif (mb_strlen($name) > 120) {
    $msg = ni_fail('contact-name', 'El nombre es demasiado largo.');
} elseif ($phone !== '' && !preg_match('/^[0-9\s\-\+\(\)]{4,20}$/', $phone)) {
    $msg = ni_fail('contact-phone', 'Ingresa un número de teléfono válido.');
} elseif ($email === '') {
    $msg = ni_fail('contact-email', 'El correo no puede estar vacío.');
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $msg = ni_fail('contact-email', 'Ingresa un correo válido.');
} elseif ($message === '') {
    $msg = ni_fail('contact-message', 'El mensaje no puede estar vacío.');
} elseif (mb_strlen($message) > 5000) {
    $msg = ni_fail('contact-message', 'El mensaje es demasiado largo.');
} else {
    $autoload = __DIR__ . '/vendor/autoload.php';
    if (!is_readable($autoload)) {
        echo json_encode(ni_fail('contact-message', 'Falta PHPMailer. Ejecuta composer install en el servidor.'));
        exit;
    }

    require $autoload;

    $smtpUser = ni_env('MAIL_SMTP_USER', 'gruponi2026@gmail.com');
    $smtpPass = ni_env('MAIL_SMTP_PASS');
    $mailTo = ni_env('MAIL_TO', 'gruponi2026@gmail.com');
    $mailFrom = ni_env('MAIL_FROM', $smtpUser !== '' ? $smtpUser : 'gruponi2026@gmail.com');
    $mailFromName = ni_env('MAIL_FROM_NAME', 'Grupo NI');
    $smtpHost = ni_env('MAIL_SMTP_HOST', 'smtp.gmail.com');
    $smtpPort = (int) ni_env('MAIL_SMTP_PORT', '587');

    if ($smtpPass === '' || $smtpPass === 'generar en la web') {
        error_log('[ni/mail] MAIL_SMTP_PASS missing in .env.local');
        $msg = ni_fail(
            'contact-message',
            'No se pudo enviar el mensaje. Inténtalo nuevamente.'
        );
    } else {
        $mail = new PHPMailer(true);
        $when = (new DateTimeImmutable('now', new DateTimeZone('America/Lima')))->format('d/m/Y H:i');
        $mailSubject = $subject !== ''
            ? ('[Grupo NI] ' . $subject)
            : ('[Grupo NI] Mensaje de ' . $name);

        $payload = [
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'career' => $career,
            'university' => $university,
            'subject' => $subject,
            'message' => $message,
            'when' => $when,
        ];

        try {
            $mail->isSMTP();
            $mail->Host = $smtpHost;
            $mail->SMTPAuth = true;
            $mail->Username = $smtpUser;
            $mail->Password = $smtpPass;
            $mail->SMTPSecure = $smtpPort === 465
                ? PHPMailer::ENCRYPTION_SMTPS
                : PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = $smtpPort;
            $mail->CharSet = 'UTF-8';

            $mail->setFrom($mailFrom, $mailFromName);
            $mail->addAddress($mailTo, 'Grupo NI');
            $mail->addReplyTo($email, $name);

            $mail->isHTML(true);
            $mail->Subject = $mailSubject;
            $mail->Body = ni_contact_template($payload);
            $mail->AltBody =
                "Nuevo mensaje de contacto — Grupo NI\n\n" .
                "Fecha: {$when}\n" .
                "Nombre: {$name}\n" .
                "Correo: {$email}\n" .
                "Teléfono: " . ($phone !== '' ? $phone : '—') . "\n" .
                "Carrera: " . ($career !== '' ? $career : '—') . "\n" .
                "Universidad: " . ($university !== '' ? $university : '—') . "\n" .
                "Asunto: " . ($subject !== '' ? $subject : 'Consulta general') . "\n\n" .
                "Mensaje:\n{$message}\n";

            $mail->send();
            $msg = ni_ok('¡Mensaje enviado correctamente! Te responderemos pronto.');
        } catch (Exception $e) {
            $msg = ni_fail('contact-message', 'No se pudo enviar el mensaje. Inténtalo nuevamente.');
        }
    }
}

echo json_encode($msg, JSON_UNESCAPED_UNICODE);
