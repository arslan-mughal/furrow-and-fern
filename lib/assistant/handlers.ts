import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { queryProducts } from "@/lib/products";
import type { AssistantResponse } from "./types";
import { getReturnPolicy, getContactInfo, getShippingInfo } from "./knowledge";

// ── Status copy ───────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  PENDING: "waiting for payment",
  PENDING_VERIFICATION: "payment submitted — we're verifying it against our bank account",
  CONFIRMED: "payment confirmed ✓ — we're preparing your order",
  REJECTED: "payment could not be verified — please contact us",
  FULFILLED: "shipped — on its way to you",
  CANCELLED: "cancelled",
};

function labelStatus(status: string): string {
  return STATUS_LABELS[status] ?? status.toLowerCase().replace(/_/g, " ");
}

// ── Order status ──────────────────────────────────────────────────────────────

export async function handleOrderStatus(
  userId: string | null
): Promise<AssistantResponse> {
  if (!userId) {
    return {
      reply:
        "To check your order, you'll need to be signed in. Head to [/login](/login) and sign in — then come back and ask again.",
      source: "db",
      intent: "order_status",
    };
  }

  const order = await prisma.order.findFirst({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  if (!order) {
    return {
      reply:
        "I don't see any orders on your account yet. If you just placed one, it might take a moment to appear. You can also view your orders at [/account](/account).",
      source: "db",
      intent: "order_status",
    };
  }

  const lines = [
    `**Your most recent order — #${order.id.slice(-8)}**`,
    `Status: ${labelStatus(order.status)}`,
    `Total: ${formatCents(order.totalCents, order.currency)}`,
    `Placed: ${order.createdAt.toLocaleDateString("en-PK", { dateStyle: "medium" })}`,
    "",
    "**Items:**",
    ...order.items.map((item) => `- ${item.name} ×${item.quantity}`),
  ];

  if (order.status === "PENDING") {
    lines.push("", "To complete your order, go to [/checkout/payment/" + order.id + "](your payment page) and submit your transaction ID.");
  } else if (order.status === "PENDING_VERIFICATION") {
    lines.push("", "We usually verify payments within a few hours. We'll email you once it's confirmed.");
  } else if (order.status === "CONFIRMED") {
    lines.push("", "We'll email you again when it ships.");
  } else if (order.status === "REJECTED") {
    lines.push("", "If you did send payment, please contact us with a screenshot of your transaction receipt.");
  }

  return { reply: lines.join("\n"), source: "db", intent: "order_status" };
}

// ── Tracking / shipping ───────────────────────────────────────────────────────

export async function handleTracking(
  userId: string | null
): Promise<AssistantResponse> {
  if (!userId) {
    return {
      reply:
        "Please [sign in](/login) to look up your order's shipping status.",
      source: "db",
      intent: "tracking",
    };
  }

  const order = await prisma.order.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!order) {
    return {
      reply: "No orders found on your account yet.",
      source: "db",
      intent: "tracking",
    };
  }

  const lines = [`**Order #${order.id.slice(-8)} — Shipping status**`, ""];

  if (order.status === "FULFILLED") {
    lines.push(
      "Your order has been dispatched. For a specific courier tracking number, contact us with your order number and we'll look it up for you.",
      `Email: ${process.env.STORE_EMAIL || "hello@furrow-and-fern.com"}`
    );
  } else if (order.status === "CONFIRMED") {
    lines.push("Your payment is confirmed and we're packing your order. It will ship within 1 business day — you'll get an email when it dispatches.");
  } else if (order.status === "PENDING_VERIFICATION") {
    lines.push("We're still verifying your payment. Once confirmed, we'll pack and ship within 1 business day.");
  } else {
    lines.push(`Current status: ${labelStatus(order.status)}`);
    lines.push("Your order will ship once payment is verified and confirmed.");
  }

  return { reply: lines.join("\n"), source: "db", intent: "tracking" };
}

// ── Order history ─────────────────────────────────────────────────────────────

export async function handleOrderHistory(
  userId: string | null
): Promise<AssistantResponse> {
  if (!userId) {
    return {
      reply: "Please [sign in](/login) to view your order history.",
      source: "db",
      intent: "order_history",
    };
  }

  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (orders.length === 0) {
    return {
      reply: "You don't have any orders yet. Browse our [products](/products) to get started.",
      source: "db",
      intent: "order_history",
    };
  }

  const lines = [`**Your last ${orders.length} order${orders.length > 1 ? "s" : ""}:**`, ""];

  for (const order of orders) {
    const itemSummary = order.items
      .slice(0, 2)
      .map((i) => i.name)
      .join(", ");
    const extra = order.items.length > 2 ? ` +${order.items.length - 2} more` : "";

    lines.push(
      `**#${order.id.slice(-8)}** · ${labelStatus(order.status)} · ${formatCents(order.totalCents, order.currency)}`,
      `${order.createdAt.toLocaleDateString("en-PK", { dateStyle: "medium" })} — ${itemSummary}${extra}`,
      ""
    );
  }

  lines.push("View full details at [/account](/account).");

  return { reply: lines.join("\n"), source: "db", intent: "order_history" };
}

// ── Product availability ──────────────────────────────────────────────────────

export async function handleProductAvailability(
  query: string
): Promise<AssistantResponse> {
  if (!query.trim()) {
    return {
      reply:
        "What are you looking for? Tell me a product name or category (e.g. 'snake plant', 'pruning shears', 'seeds') and I'll check what's available.",
      source: "db",
      intent: "product_availability",
    };
  }

  const result = await queryProducts({
    search: query,
    sort: "newest",
    page: 1,
  });

  if (result.products.length === 0) {
    return {
      reply: `I couldn't find any products matching "${query}" right now. Try browsing [all products](/products) or contact us — we may be able to source it.`,
      source: "db",
      intent: "product_availability",
    };
  }

  const shown = result.products.slice(0, 4);
  const lines = [`**${result.total > 4 ? `Top ${shown.length} of ${result.total} results` : `${shown.length} result${shown.length > 1 ? "s" : ""}`} for "${query}":**`, ""];

  for (const p of shown) {
    const stockNote = p.stock === 0
      ? "✗ Out of stock"
      : p.stock <= 3
        ? `⚠ Only ${p.stock} left`
        : `✓ In stock (${p.stock})`;
    lines.push(
      `**${p.name}** — ${p.price.toFixed(2)} ${stockNote}`,
      `[View product](/products/${p.slug})`,
      ""
    );
  }

  if (result.total > 4) {
    lines.push(`[See all ${result.total} results](/products?q=${encodeURIComponent(query)})`);
  }

  return { reply: lines.join("\n"), source: "db", intent: "product_availability" };
}

// ── FAQ handlers ──────────────────────────────────────────────────────────────

export async function handleReturnPolicy(): Promise<AssistantResponse> {
  return { reply: getReturnPolicy(), source: "faq", intent: "return_policy" };
}

export async function handleContact(): Promise<AssistantResponse> {
  return { reply: getContactInfo(), source: "faq", intent: "contact" };
}

export async function handleShippingFAQ(): Promise<AssistantResponse> {
  return { reply: getShippingInfo(), source: "faq", intent: "shipping_status" };
}

// ── Greeting ──────────────────────────────────────────────────────────────────

export async function handleGreeting(): Promise<AssistantResponse> {
  return {
    reply:
      "Hi! I'm Sprout 🌱 I can help you with:\n- **Order status** — check your latest order\n- **Product availability** — find what's in stock\n- **Shipping info** — delivery times and coverage\n- **Returns** — our policy and process\n- **Gardening advice** — plant care, growing tips\n\nWhat can I help you with?",
    source: "faq",
    intent: "greeting",
  };
}

// ── Unknown / fallback ────────────────────────────────────────────────────────

export async function handleUnknown(hasAi: boolean): Promise<AssistantResponse> {
  const aiLine = hasAi
    ? "\nI can also answer gardening questions — plant care, growing tips, fertilizer advice, and more."
    : "";

  return {
    reply:
      `I'm not sure I understood that. Here's what I can help with:\n\n- **Your orders** — status, history, shipping\n- **Products** — availability and stock levels\n- **Returns** — our policy\n- **Contact** — how to reach the team${aiLine}\n\nJust ask and I'll do my best!`,
    source: "fallback",
    intent: "unknown",
  };
}
