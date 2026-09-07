<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/vendor/autoload.php';

header('Content-Type: application/json; charset=utf-8');

$msg = [];

// Recibir datos del formulario
$name = trim($_POST['contact-name'] ?? '');
$phone = trim($_POST['contact-phone'] ?? '');
$email = trim($_POST['contact-email'] ?? '');
$subject = trim($_POST['subject'] ?? '');
$message = trim($_POST['contact-message'] ?? '');

// =========================
// VALIDACIONES
// =========================

if ($name === '') {

    $msg['code'] = false;
    $msg['field'] = 'contact-name';
    $msg['err'] = 'El nombre no puede estar vacío.';

} elseif ($phone === '') {

    $msg['code'] = false;
    $msg['field'] = 'contact-phone';
    $msg['err'] = 'El teléfono no puede estar vacío.';

} elseif (!preg_match('/^[0-9\s\-\+\(\)]{4,20}$/', $phone)) {

    $msg['code'] = false;
    $msg['field'] = 'contact-phone';
    $msg['err'] = 'Ingresa un número de teléfono válido.';

} elseif ($email === '') {

    $msg['code'] = false;
    $msg['field'] = 'contact-email';
    $msg['err'] = 'El correo no puede estar vacío.';

} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {

    $msg['code'] = false;
    $msg['field'] = 'contact-email';
    $msg['err'] = 'Ingresa un correo válido.';

} elseif ($message === '') {

    $msg['code'] = false;
    $msg['field'] = 'contact-message';
    $msg['err'] = 'El mensaje no puede estar vacío.';

} else {

    // =========================
    // CONFIGURACIÓN DEL CORREO
    // =========================

    $mail = new PHPMailer(true);

    try {

        // SMTP
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;

        // TU CORREO DE GMAIL
        $mail->Username = 'joaquinbarzola418@gmail.com';

        // IMPORTANTE:
        // Aquí NO va tu contraseña normal de Gmail.
        // Debes colocar una CONTRASEÑA DE APLICACIÓN.
        $mail->Password = 'generar en la web';

        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        // =========================
        // REMITENTE
        // =========================

        $mail->setFrom(
            'joaquinbarzola418@gmail.com',
            'Formulario Web'
        );

        // =========================
        // DESTINATARIO
        // =========================

        $mail->addAddress(
            'joaquinbarzola418@gmail.com',
            'Joaquin Barzola'
        );

        // =========================
        // RESPONDER AL CLIENTE
        // =========================

        $mail->addReplyTo(
            $email,
            $name
        );

        // =========================
        // CONTENIDO
        // =========================

        $mail->isHTML(true);

        $mail->Subject = $subject !== ''
            ? $subject
            : 'Nuevo mensaje desde la página web';

        $mail->Body = '
            <h2>Nuevo mensaje desde el formulario web</h2>

            <p><strong>Nombre:</strong> ' . htmlspecialchars($name) . '</p>

            <p><strong>Teléfono:</strong> ' . htmlspecialchars($phone) . '</p>

            <p><strong>Correo:</strong> ' . htmlspecialchars($email) . '</p>

            <p><strong>Asunto:</strong> ' . htmlspecialchars($subject) . '</p>

            <p><strong>Mensaje:</strong></p>

            <p>' . nl2br(htmlspecialchars($message)) . '</p>
        ';

        // Versión texto plano
        $mail->AltBody =
            "Nombre: $name\n" .
            "Teléfono: $phone\n" .
            "Correo: $email\n" .
            "Asunto: $subject\n\n" .
            "Mensaje:\n$message";

        // ENVIAR
        $mail->send();

        // Respuesta que espera tu main.js
        $msg['code'] = true;
        $msg['success'] = '¡Mensaje enviado correctamente!';

    } catch (Exception $e) {

        $msg['code'] = false;
        $msg['field'] = 'contact-message';
        $msg['err'] = 'No se pudo enviar el mensaje. Inténtalo nuevamente.';

        // Para desarrollo puedes descomentar esto:
        // $msg['err'] = $mail->ErrorInfo;
    }
}

echo json_encode($msg);