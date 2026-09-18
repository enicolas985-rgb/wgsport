const nodemailer = require('nodemailer');
const { getDb } = require('../db/database');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  if (!host) {
    console.warn('[mailer] SMTP_HOST no configurado. Los correos no se enviarán.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      : undefined
  });

  return transporter;
}

function fromAddress() {
  return process.env.MAIL_FROM || `WG <${process.env.SMTP_USER || 'no-reply@wg.com'}>`;
}

async function sendMail(to, subject, html, text) {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[mailer] (sin SMTP) Para: ${to} | Asunto: ${subject}`);
    return { skipped: true };
  }
  try {
    const encoded = encodeURIComponent(to);
    const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3001';
    const info = await transport.sendMail({
      from: fromAddress(),
      to,
      subject,
      html,
      text,
      headers: {
        'List-Unsubscribe': `<${baseUrl}/api/subscribe/unsub?email=${encoded}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
      }
    });
    console.log(`[mailer] Enviado a ${to}: ${info.messageId}`);
    return { ok: true, messageId: info.messageId };
  } catch (error) {
    console.error('[mailer] Error al enviar correo:', error.message);
    return { ok: false, error: error.message };
  }
}

function getSubscribers() {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT email FROM subscribers').all();
    return rows.map(r => r.email);
  } catch (error) {
    console.error('[mailer] Error al leer suscriptores:', error.message);
    return [];
  }
}

function notifyPromotion(promotion) {
  const emails = getSubscribers();
  if (emails.length === 0) {
    console.log('[mailer] No hay suscriptores para notificar.');
    return Promise.resolve();
  }

  const promoValue = promotion.type === 'percentage'
    ? `${promotion.value}% de descuento`
    : `$${Number(promotion.value).toFixed(2)} de descuento`;

  const subject = `Nueva Promoción: ${promotion.name}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E5E5E5;">
      <div style="background: #000; color: #fff; padding: 40px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; letter-spacing: -0.02em;">WG</h1>
        <p style="margin: 8px 0 0; opacity: 0.8;">Ropa Deportiva de Alto Rendimiento</p>
      </div>
      <div style="padding: 40px;">
        <h2 style="font-size: 20px; margin-top: 0;">¡Tenemos una nueva promoción!</h2>
        <p style="font-size: 16px; line-height: 1.6;">Estamos emocionados de anunciarte nuestra nueva oferta:</p>
        <div style="background: #F2F2F2; padding: 24px; border-left: 4px solid #000; margin: 24px 0;">
          <p style="margin: 0; font-size: 18px; font-weight: bold;">${promotion.name}</p>
          <p style="margin: 8px 0 0; font-size: 24px; font-weight: bold;">${promoValue}</p>
        </div>
        <p style="font-size: 14px; color: #666666;">Visita nuestro catálogo y aprovecha esta oferta antes de que termine.</p>
      </div>
      <div style="padding: 16px; text-align: center; color: #8E8E8E; font-size: 12px;">
        © ${new Date().getFullYear()} WG. Todos los derechos reservados.<br><br>
        <a href="${baseUrl}/api/subscribe/unsub?email=${encodeURIComponent(email)}" style="color: #8E8E8E;">Darme de baja de esta lista de correos</a>
      </div>
    </div>
  `;
  const text = `Nueva Promoción en WG: ${promotion.name}

${promoValue}

¡Aprovecha esta oferta antes de que termine! Visita nuestro catálogo.

-
WG - Ropa Deportiva de Alto Rendimiento
Para dejar de recibir estos correos: ${baseUrl}/api/subscribe/unsub?email=${encodeURIComponent(email)}`;

  return Promise.all(emails.map(email => sendMail(email, subject, html, text)));
}

module.exports = { sendMail, getSubscribers, notifyPromotion };