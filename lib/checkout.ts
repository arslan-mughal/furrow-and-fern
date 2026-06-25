import { z } from "zod";
import { prisma } from "./prisma";
import { toCents } from "./money";
import { addressSchema } from "./address";

// No longer constrained by Stripe metadata size (that limit applied when
// the cart round-tripped through a Checkout Session's metadata field —
// removed along with Stripe). Kept as a sanity bound, not a technical one.
export const cartItemRequestSchema = z
  .array(
    z.object({
      productId: z.string().min(1).max(50),
      quantity: z.number().int().min(1).max(20),
    })
  )
  .min(1)
  .max(50);

export type CartItemRequest = z.infer<typeof cartItemRequestSchema>;

export const paymentMethodSchema = z.enum(["BANK_TRANSFER", "JAZZCASH", "EASYPAISA"]);

export const checkoutRequestSchema = z.object({
  items: cartItemRequestSchema,
  email: z.string().trim().email("Enter a valid email address"),
  billingAddress: addressSchema,
  shippingAddress: addressSchema,
  paymentMethod: paymentMethodSchema,
});

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

export interface PricedItem {
  productId: string;
  name: string;
  image: string;
  unitPriceCents: number;
  quantity: number;
}

interface PriceCartResult {
  items: PricedItem[];
  errors: string[];
}

/**
 * Re-derives name/image/price/stock from the database for every requested
 * line — the request only ever supplies productId + quantity. Never trust
 * price, name, or image sent by the client for anything that affects what
 * gets charged. One batched query rather than N sequential lookups.
 */
export async function priceCartItems(requested: CartItemRequest): Promise<PriceCartResult> {
  const ids = requested.map((item) => item.productId);
  const dbProducts = await prisma.product.findMany({
    where: { id: { in: ids }, deletedAt: null },
    include: {
      images: {
        where: { isFeatured: true },
        take: 1,
      },
    },
  });
  const productById = new Map(dbProducts.map((product) => [product.id, product]));

  const items: PricedItem[] = [];
  const errors: string[] = [];

  for (const { productId, quantity } of requested) {
    const product = productById.get(productId);

    if (!product) {
      errors.push(`A product in your cart is no longer available.`);
      continue;
    }
    if (product.stock < quantity) {
      errors.push(`Only ${product.stock} left of "${product.name}".`);
      continue;
    }

    const primaryImage =
      product.images[0]?.url ??
      `https://placehold.co/600x600/1F3A2E/F2EDE1?text=${encodeURIComponent(product.name)}&font=raleway`;

    items.push({
      productId: product.id,
      name: product.name,
      image: primaryImage,
      unitPriceCents: toCents(product.price),
      quantity,
    });
  }

  return { items, errors };
}
