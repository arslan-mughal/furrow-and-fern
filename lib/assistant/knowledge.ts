/**
 * All content here is sourced from env vars where it differs per deployment,
 * falling back to sensible placeholder text so the widget still works before
 * the store owner fills in their details.
 *
 * Pattern: admin fills STORE_EMAIL / STORE_PHONE / STORE_WHATSAPP in .env;
 * if not set, we show generic instructions. No AI call is ever made for these.
 */

function storeEmail() {
  return process.env.STORE_EMAIL || "hello@furrow-and-fern.com";
}
function storePhone() {
  return process.env.STORE_PHONE || "(not configured — set STORE_PHONE in .env)";
}
function storeWhatsapp() {
  return process.env.STORE_WHATSAPP || "";
}

export function getReturnPolicy(): string {
  return `**Return Policy — Furrow & Fern**

We accept returns within **30 days of delivery** for most items. Here's how:

1. Email us at ${storeEmail()} with your order number and reason.
2. We'll reply within 1–2 business days with return instructions.
3. Once we receive the item in original condition, we'll process your refund.

**What can't be returned:**
- Live plants that have been repotted or show signs of mishandling after delivery.
- Opened seed packets.
- Items marked "Final sale".

Questions? Email ${storeEmail()} and we'll sort it out.`;
}

export function getContactInfo(): string {
  const whatsapp = storeWhatsapp()
    ? `\n- WhatsApp: ${storeWhatsapp()}`
    : "";

  return `**Contact Furrow & Fern**

- Email: ${storeEmail()}${whatsapp}
- Phone: ${storePhone()}

We're available Saturday–Thursday, 9 am–6 pm PKT. We typically reply to emails within a few hours during business hours.

For order issues, include your **order number** (shown on your receipt) so we can help quickly.`;
}

export function getShippingInfo(): string {
  return `**Shipping Information**

We currently ship within **Pakistan only**.

- **Standard delivery:** 3–5 business days (most cities).
- **Express delivery:** available in Karachi, Lahore, and Islamabad — select at checkout.
- **Minimum order:** none — we ship any order size.
- **Free shipping:** on orders over PKR 3,000.

Once your payment is verified and your order is confirmed, our team packs and dispatches it within 1 business day. You'll get a confirmation email at that point.

For live tracking after dispatch, contact us with your order number at ${storeEmail()}.`;
}

export function getAboutInfo(): string {
  return `**About Furrow & Fern**

We're an online gardening store based in Pakistan, stocking plants, seeds, tools, pots, soil, and outdoor decor — all chosen by people who actually garden.

We focus on quality over volume: every product we carry is something we'd use in our own plots. Questions about anything? Email ${storeEmail()}.`;
}
