require('dotenv').config({ path: 'D:/WG/server/.env' });
const initSqlJs = require('sql.js');
const fs = require('fs');
const nodemailer = require('nodemailer');

(async () => {
  const SQL = await initSqlJs();
  const dbPath = 'D:/WG/server/db/wg.db';
  const sql = new SQL.Database(fs.readFileSync(dbPath));
  const subs = sql.exec('SELECT email FROM subscribers')?.[0]?.values?.map(r => r[0]) || [];
  console.log('SUSCRIPTORES EN wg.db (REAL):', JSON.stringify(subs));

  const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  const targets = Array.from(new Set([...subs, 'enicolas985@gmail.com']));
  for (const to of targets) {
    try {
      const info = await t.sendMail({
        from: `"WG" <${process.env.SMTP_USER}>`,
        to,
        subject: 'WG - Newsletter definitivo 💪',
        html: `<div style="font-family:Arial;max-width:600px;margin:0 auto;border:1px solid #E5E5E5">
          <div style="background:#000;color:#fff;padding:40px;text-align:center">
            <h1 style="margin:0;font-size:28px">WG</h1>
            <p style="margin:8px 0 0;opacity:.8">Ropa Deportiva de Alto Rendimiento</p>
          </div>
          <div style="padding:40px">
            <h2 style="margin-top:0">¡Tu suscripción al newsletter WG está activa!</h2>
            <p style="font-size:16px;line-height:1.6">Gracias por unirte. A partir de ahora recibirás <b>todas las nuevas promociones</b> directamente en este correo.</p>
          </div>
        </div>`
      });
      console.log('ENVIADO OK ->', to, '| messageId:', info.messageId);
    } catch (e) {
      console.log('FALLO ->', to, '|', e.message);
    }
  }
  process.exit(0);
})();
