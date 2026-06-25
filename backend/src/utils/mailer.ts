import nodemailer from 'nodemailer';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.EMAIL_FROM || 'SmartStock AI <noreply@smartstock.ai>';

async function send(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    logger.info(`Email envoyé à ${to} — ${subject}`);
  } catch (err) {
    logger.error(`Échec envoi email à ${to}`, err);
  }
}

function base(title: string, content: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr><td style="background:#059669;padding:28px 40px;">
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">🧠 SmartStock AI</h1>
          <p style="margin:4px 0 0;color:#a7f3d0;font-size:13px;">Gestion de stock intelligente</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <h2 style="margin:0 0 16px;color:#111827;font-size:18px;">${title}</h2>
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">SmartStock AI · Gestion de stock pour PME africaines</p>
          <p style="margin:4px 0 0;color:#9ca3af;font-size:12px;">Cet email a été envoyé automatiquement, ne pas répondre.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Emails ───────────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, firstName: string, companyName: string, password: string) {
  const html = base('Bienvenue sur SmartStock AI !', `
    <p style="color:#374151;font-size:15px;line-height:1.6;">Bonjour <strong>${firstName}</strong>,</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;">
      Votre compte a été créé sur <strong>SmartStock AI</strong> pour l'entreprise <strong>${companyName}</strong>.
    </p>
    <table style="background:#f9fafb;border-radius:8px;padding:20px;width:100%;margin:20px 0;" cellpadding="0" cellspacing="0">
      <tr><td style="color:#6b7280;font-size:13px;padding-bottom:8px;">Adresse email</td><td style="color:#111827;font-size:14px;font-weight:600;">${to}</td></tr>
      <tr><td style="color:#6b7280;font-size:13px;padding-top:8px;">Mot de passe</td><td style="color:#111827;font-size:14px;font-weight:600;">${password}</td></tr>
    </table>
    <p style="color:#374151;font-size:14px;">Connectez-vous et changez votre mot de passe dès que possible.</p>
    <a href="${process.env.CLIENT_URL}/login" style="display:inline-block;margin-top:8px;padding:12px 24px;background:#059669;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
      Se connecter →
    </a>
  `);
  await send(to, 'Bienvenue sur SmartStock AI — Vos identifiants de connexion', html);
}

export async function sendPasswordResetEmail(to: string, firstName: string, resetUrl: string) {
  const html = base('Réinitialisation de mot de passe', `
    <p style="color:#374151;font-size:15px;line-height:1.6;">Bonjour <strong>${firstName}</strong>,</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;">
      Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous.
      Ce lien est valable <strong>1 heure</strong>.
    </p>
    <a href="${resetUrl}" style="display:inline-block;margin:20px 0;padding:12px 24px;background:#059669;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
      Réinitialiser mon mot de passe →
    </a>
    <p style="color:#9ca3af;font-size:13px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
  `);
  await send(to, 'SmartStock AI — Réinitialisation de votre mot de passe', html);
}

export async function sendLowStockAlert(to: string, products: { name: string; quantity: number; threshold: number }[]) {
  const rows = products.map(p => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;">${p.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:center;">
        <span style="background:#fef2f2;color:#dc2626;padding:3px 10px;border-radius:20px;font-size:13px;font-weight:600;">${p.quantity}</span>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:center;color:#6b7280;font-size:13px;">${p.threshold}</td>
    </tr>
  `).join('');

  const html = base(`⚠️ Alerte stock bas — ${products.length} produit${products.length > 1 ? 's' : ''}`, `
    <p style="color:#374151;font-size:15px;line-height:1.6;">
      Les produits suivants sont en dessous du seuil d'alerte. Pensez à réapprovisionner.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Produit</th>
          <th style="padding:10px 12px;text-align:center;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Stock actuel</th>
          <th style="padding:10px 12px;text-align:center;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Seuil</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <a href="${process.env.CLIENT_URL}/dashboard/products" style="display:inline-block;margin-top:8px;padding:12px 24px;background:#059669;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
      Voir les produits →
    </a>
  `);
  await send(to, `⚠️ SmartStock AI — Alerte stock bas (${products.length} produit${products.length > 1 ? 's' : ''})`, html);
}

export async function sendNewCompanyEmail(to: string, firstName: string, companyName: string, password: string) {
  const html = base(`Votre espace ${companyName} est prêt`, `
    <p style="color:#374151;font-size:15px;line-height:1.6;">Bonjour <strong>${firstName}</strong>,</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;">
      Votre entreprise <strong>${companyName}</strong> a été créée sur SmartStock AI.
      Voici vos identifiants administrateur :
    </p>
    <table style="background:#f9fafb;border-radius:8px;padding:20px;width:100%;margin:20px 0;" cellpadding="0" cellspacing="0">
      <tr><td style="color:#6b7280;font-size:13px;padding-bottom:8px;">Email</td><td style="color:#111827;font-size:14px;font-weight:600;">${to}</td></tr>
      <tr><td style="color:#6b7280;font-size:13px;padding-top:8px;">Mot de passe</td><td style="color:#111827;font-size:14px;font-weight:600;">${password}</td></tr>
    </table>
    <p style="color:#374151;font-size:14px;">En tant qu'administrateur, vous pouvez créer et gérer les membres de votre équipe.</p>
    <a href="${process.env.CLIENT_URL}/login" style="display:inline-block;margin-top:8px;padding:12px 24px;background:#059669;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
      Accéder à mon espace →
    </a>
  `);
  await send(to, `SmartStock AI — Votre espace ${companyName} est prêt`, html);
}
