import { getAnthropic, ASSISTANT_MODEL } from "./anthropic";
import { queryProducts } from "./products";
import { prisma } from "./prisma";
import { formatCents } from "./money";

const SYSTEM_PROMPT = `You are Sprout, the friendly garden assistant for Furrow & Fern, an online store selling plants, seeds, tools, pots, soil, and outdoor decor.

Your job is to help shoppers find the right products and check on their orders. Guidelines:
- Always use the search_products tool to answer any question about what's available, in stock, or how much something costs — never guess or invent a product, price, or stock level.
- Use the get_my_orders tool when someone asks about an order, shipping, or order status. If it reports they're not signed in, tell them to sign in at /login to check orders — don't guess at order details.
- Keep replies short and conversational — a sentence or two, plus product names when relevant. This is a chat widget, not an essay.
- If asked something unrelated to gardening or this store, gently steer the conversation back.
- Never invent a discount, coupon, or shipping-time promise you don't have data for.`;

const tools = [
  {
    name: "search_products",
    description:
      "Search the Furrow & Fern product catalog. Use this for any question about what's for sale, prices, categories, or stock.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Free-text search, e.g. a product name or keyword. Omit to browse by category/filters alone.",
        },
        category: {
          type: "string",
          description:
            "Exact category name: 'Plants', 'Seeds', 'Tools', 'Pots & Planters', 'Soil & Fertilizer', 'Outdoor Decor', or 'Watering & Irrigation'.",
        },
        maxPrice: { type: "number", description: "Maximum price in US dollars." },
        inStockOnly: { type: "boolean", description: "Only return items currently in stock." },
      },
    },
  },
  {
    name: "get_my_orders",
    description:
      "Look up the current shopper's own recent orders and their status. Takes no input. Only works if they're signed in — returns an error explaining that otherwise.",
    input_schema: { type: "object", properties: {} },
  },
];

interface ToolContext {
  userId: string | null;
}

async function runTool(name: string, input: Record<string, unknown>, ctx: ToolContext): Promise<unknown> {
  if (name === "search_products") {
    const products = await queryProducts({
      search: typeof input.query === "string" ? input.query : undefined,
      category: typeof input.category === "string" ? input.category : undefined,
      maxPrice: typeof input.maxPrice === "number" ? input.maxPrice : undefined,
      inStockOnly: input.inStockOnly === true,
    });

    return products.slice(0, 8).map((product) => ({
      name: product.name,
      slug: product.slug,
      price: `$${product.price.toFixed(2)}`,
      category: product.category,
      inStock: product.stock > 0,
      stock: product.stock,
      description: product.description,
    }));
  }

  if (name === "get_my_orders") {
    if (!ctx.userId) {
      return { error: "Not signed in. Tell the shopper to sign in at /login to check their orders." };
    }

    const orders = await prisma.order.findMany({
      where: { userId: ctx.userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (orders.length === 0) {
      return { orders: [], note: "This shopper has no orders yet." };
    }

    return {
      orders: orders.map((order) => ({
        id: order.id.slice(-8),
        status: order.status,
        total: formatCents(order.totalCents, order.currency),
        placedOn: order.createdAt.toISOString().slice(0, 10),
        items: order.items.map((item) => `${item.name} ×${item.quantity}`),
      })),
    };
  }

  return { error: `Unknown tool: ${name}` };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_TOOL_ITERATIONS = 4;

export async function runAssistant(history: ChatMessage[], ctx: ToolContext): Promise<string> {
  const client = getAnthropic();

  let messages: any[] = history.map((message) => ({ role: message.role, content: message.content }));

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const response = await client.messages.create({
      model: ASSISTANT_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
      tools: tools as any,
    });

    if (response.stop_reason !== "tool_use") {
      const textBlock = response.content.find((block: any) => block.type === "text") as any;
      return textBlock?.text ?? "";
    }

    const toolUseBlocks = response.content.filter((block: any) => block.type === "tool_use");

    const toolResults = await Promise.all(
      toolUseBlocks.map(async (block: any) => ({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(await runTool(block.name, block.input ?? {}, ctx)),
      }))
    );

    messages = [
      ...messages,
      { role: "assistant", content: response.content },
      { role: "user", content: toolResults },
    ];
  }

  return "I'm having trouble finishing that thought — could you try asking again, maybe a bit more specifically?";
}