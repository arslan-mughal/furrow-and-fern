import { Resend } from "resend";
import { formatCents } from "./money";

const FROM = process.env.EMAIL_FROM || "Furrow & Fern <onboarding@resend.dev>";
const SITE_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

/**
 * Every email send goes through here. Returns false (and logs) instead of
 * throwing on any failure — missing API key, Resend API error, or a network
 * error. None of this app's three email triggers (newsletter signup, order
 * confirmation, order shipped) should fail the operation that caused them
 * just because email delivery had a problem.
 */
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipped "${subject}" to ${to}`);
    return false;
  }

  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error(`[email] Resend rejected "${subject}" to ${to}:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[email] Failed sending "${subject}" to ${to}:`, err);
    return false;
  }
}

// Plain inline-styled HTML rather than React Email: one fewer build-time
// dependency to get right without being able to test-render it. React
// Email would be the natural upgrade if these templates grow more complex.
function emailLayout(bodyHtml: string, footerHtml?: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#F2EDE1;font-family:Georgia,'Times New Roman',serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2EDE1;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #e5e0d5;border-radius:4px;max-width:480px;width:100%;">
            <tr>
              <td style="background-color:#1F3A2E;padding:20px 32px;">
                <span style="font-size:18px;color:#F2EDE1;font-weight:bold;">Furrow &amp; Fern</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#3B2A1F;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            ${
              footerHtml
                ? `<tr><td style="padding:0 32px 28px;color:#8a7e6e;font-size:12px;line-height:1.5;">${footerHtml}</td></tr>`
                : ""
            }
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendWelcomeEmail(email: string, unsubscribeToken: string): Promise<boolean> {
  const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${unsubscribeToken}`;
  const html = emailLayout(
    `<h1 style="font-size:21px;color:#1F3A2E;margin:0 0 16px;">You're on the list 🌱</h1>
     <p style="margin:0;">Thanks for subscribing to Furrow &amp; Fern. Expect seasonal planting
     tips and first dibs on new arrivals — about once a month, never spammy.</p>`,
    `You're receiving this because you subscribed at Furrow &amp; Fern.
     <a href="${unsubscribeUrl}" style="color:#3B2A1F;">Unsubscribe</a>`
  );
  return sendEmail(email, "Welcome to Furrow & Fern 🌱", html);
}

interface OrderEmailItem {
  name: string;
  quantity: number;
  unitPriceCents: number;
}

export async function sendOrderConfirmationEmail(params: {
  to: string;
  orderId: string;
  items: OrderEmailItem[];
  totalCents: number;
  currency: string;
}): Promise<boolean> {
  const itemRows = params.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #ece6d8;">${item.name} × ${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #ece6d8;text-align:right;">${formatCents(
          item.unitPriceCents * item.quantity,
          params.currency
        )}</td>
      </tr>`
    )
    .join("");

  const html = emailLayout(`
    <h1 style="font-size:21px;color:#1F3A2E;margin:0 0 16px;">Thanks for your order!</h1>
    <p style="margin:0 0 16px;">Order #${params.orderId.slice(-8)} is confirmed. Here's what's growing:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${itemRows}
      <tr>
        <td style="padding:12px 0 0;font-weight:bold;">Total</td>
        <td style="padding:12px 0 0;text-align:right;font-weight:bold;">${formatCents(
          params.totalCents,
          params.currency
        )}</td>
      </tr>
    </table>
    <p style="margin:20px 0 0;">We'll send another note once it ships.</p>
  `);

  return sendEmail(params.to, `Order confirmed — #${params.orderId.slice(-8)}`, html);
}

export async function sendOrderShippedEmail(params: { to: string; orderId: string }): Promise<boolean> {
  const html = emailLayout(`
    <h1 style="font-size:21px;color:#1F3A2E;margin:0 0 16px;">Your order is on its way 🚚</h1>
    <p style="margin:0;">Order #${params.orderId.slice(-8)} has shipped. Thanks for growing with us.</p>
  `);
  return sendEmail(params.to, `Your order has shipped — #${params.orderId.slice(-8)}`, html);
}

export async function sendPaymentRejectedEmail(params: {
  to: string;
  orderId: string;
  reason?: string;
}): Promise<boolean> {
  const html = emailLayout(`
    <h1 style="font-size:21px;color:#1F3A2E;margin:0 0 16px;">We couldn't verify your payment</h1>
    <p style="margin:0 0 16px;">
      We weren't able to match a payment to order #${params.orderId.slice(-8)}.
      ${params.reason ? `Note from our team: ${params.reason}` : ""}
    </p>
    <p style="margin:0;">
      If you did send payment, please reply to this email with a screenshot of your
      transaction receipt and we'll sort it out. If you haven't paid yet, you're welcome
      to try checking out again.
    </p>
  `);
  return sendEmail(
    params.to,
    `We couldn't verify payment for order #${params.orderId.slice(-8)}`,
    html
  );
}
