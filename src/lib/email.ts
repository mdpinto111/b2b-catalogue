import nodemailer from "nodemailer";
import { euro } from "./money";

type OrderLine = { titre: string; quantite: number; prixUnitaire: number; totalLigne: number };
type OrderPayload = {
  orderId: number;
  clientNom: string;
  clientEmail: string;
  note?: string | null;
  lines: OrderLine[];
  total: number;
};

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };

// Contact fields are free text typed by the client, so they are escaped before
// being interpolated into the HTML body.
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => HTML_ESCAPES[c]);
}

function transporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null; // no SMTP configured: console mode
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

export function renderHtml(o: OrderPayload, forOwner: boolean): string {
  const rows = o.lines
    .map(
      (l) =>
        `<tr>
          <td style="padding:6px 10px;border-bottom:1px solid #eee">${escapeHtml(l.titre)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center">${l.quantite}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${euro(l.prixUnitaire)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${euro(l.totalLigne)}</td>
        </tr>`
    )
    .join("");

  const intro = forOwner
    ? `<p>Nouvelle commande <b>#${o.orderId}</b> de <b>${escapeHtml(o.clientNom)}</b> (${escapeHtml(o.clientEmail)}).</p>`
    : `<p>Bonjour ${escapeHtml(o.clientNom)}, merci pour votre commande <b>#${o.orderId}</b>. Voici le récapitulatif :</p>`;

  return `
  <div style="font-family:system-ui,Arial,sans-serif;color:#18181b;max-width:640px">
    ${intro}
    ${o.note ? `<p style="color:#555"><i>Note : ${escapeHtml(o.note)}</i></p>` : ""}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px">
      <thead>
        <tr style="background:#fafafa;text-align:left">
          <th style="padding:8px 10px">Produit</th>
          <th style="padding:8px 10px;text-align:center">Qté</th>
          <th style="padding:8px 10px;text-align:right">P.U.</th>
          <th style="padding:8px 10px;text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding:10px;text-align:right;font-weight:600">Total</td>
          <td style="padding:10px;text-align:right;font-weight:700">${euro(o.total)}</td>
        </tr>
      </tfoot>
    </table>
  </div>`;
}

function parseFrom(raw: string): { email: string; name?: string } {
  const m = raw.match(/^(.*)<(.+)>$/);
  if (m) return { name: m[1].trim().replace(/^"|"$/g, "") || undefined, email: m[2].trim() };
  return { email: raw.trim() };
}

// Mailtrap Send API (HTTPS/443), preferred because some networks block SMTP ports.
async function sendViaMailtrapApi(token: string, from: string, messages: Mail[]) {
  const fromParsed = parseFrom(from);
  for (const m of messages) {
    const res = await fetch("https://send.api.mailtrap.io/api/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromParsed,
        to: [{ email: m.to }],
        reply_to: m.replyTo ? { email: m.replyTo } : undefined,
        subject: m.subject,
        html: m.html,
        category: m.category,
      }),
    });
    if (!res.ok) {
      throw new Error(`Mailtrap API ${res.status}: ${await res.text()}`);
    }
  }
}

type Mail = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  category?: string;
};

// Single delivery path for every outgoing email: Mailtrap HTTPS API when a token
// is set, otherwise SMTP, otherwise a console fallback for local development.
async function deliver(messages: Mail[]) {
  const from = process.env.MAIL_FROM || "Catalogue <no-reply@exemple.com>";

  const apiToken = process.env.MAILTRAP_API_TOKEN;
  if (apiToken) {
    await sendViaMailtrapApi(apiToken, from, messages);
    return;
  }

  const t = transporter();
  if (!t) {
    // Development without SMTP: log instead
    for (const m of messages) {
      console.log(`\n--- EMAIL (dev) → ${m.to} ---\n${m.subject}\n`);
    }
    return;
  }

  await Promise.all(
    messages.map((m) =>
      t.sendMail({ from, to: m.to, subject: m.subject, html: m.html, replyTo: m.replyTo })
    )
  );
}

function ownerEmail(): string {
  return process.env.OWNER_EMAIL || "patron@exemple.com";
}

export async function sendOrderEmails(o: OrderPayload) {
  await deliver([
    {
      to: ownerEmail(),
      subject: `Nouvelle commande #${o.orderId} — ${o.clientNom}`,
      html: renderHtml(o, true),
      category: "Commande",
    },
    {
      to: o.clientEmail,
      subject: `Votre commande #${o.orderId}`,
      html: renderHtml(o, false),
      category: "Commande",
    },
  ]);
}

type ContactPayload = {
  clientNom: string;
  clientEmail: string;
  sujet: string;
  message: string;
};

function renderContactHtml(c: ContactPayload): string {
  return `
  <div style="font-family:system-ui,Arial,sans-serif;color:#18181b;max-width:640px">
    <p>Message de <b>${escapeHtml(c.clientNom)}</b> (${escapeHtml(c.clientEmail)}).</p>
    <p style="color:#555">Sujet : <b>${escapeHtml(c.sujet)}</b></p>
    <div style="white-space:pre-wrap;border-left:3px solid #e4e4e7;padding:4px 0 4px 12px;margin-top:12px;font-size:14px">${escapeHtml(
      c.message
    )}</div>
  </div>`;
}

// Goes to the shop owner only. replyTo carries the client address so a reply
// from the owner's mailbox reaches them directly.
export async function sendContactEmail(c: ContactPayload) {
  await deliver([
    {
      to: ownerEmail(),
      subject: `Message de ${c.clientNom} — ${c.sujet}`,
      html: renderContactHtml(c),
      replyTo: c.clientEmail,
      category: "Contact",
    },
  ]);
}
