import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkoutRequestSchema, priceCartItems } from "@/lib/checkout";

/**
 * Creates the Order directly — there's no payment gateway redirect to wait
 * for anymore. The order starts PENDING; it moves to PENDING_VERIFICATION
 * once the customer reports a transaction id (app/checkout/payment/[orderId]),
 * and only an admin moves it to CONFIRMED after checking their actual bank
 * or wallet statement (app/admin/actions.ts#confirmPayment).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = checkoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message ?? "That order doesn't look right." },
      { status: 400 }
    );
  }

  const { items: requestedItems, email, billingAddress, shippingAddress, paymentMethod } =
    parsed.data;

  const { items, errors } = await priceCartItems(requestedItems);

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }
  if (items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const session = await auth.api.getSession({ headers: await headers() });

  const subtotalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  // No shipping fee or tax calculation built in — total mirrors subtotal.
  // See README "Payment architecture notes".
  const totalCents = subtotalCents;

  const order = await prisma.order.create({
    data: {
      userId: session?.user?.id ?? null,
      guestEmail: session?.user?.id ? null : email,
      status: "PENDING",
      paymentMethod,
      subtotalCents,
      totalCents,
      currency: "PKR",
      billingAddress,
      shippingAddress,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          image: item.image,
          unitPriceCents: item.unitPriceCents,
          quantity: item.quantity,
        })),
      },
    },
  });

  return NextResponse.json({ orderId: order.id });
}
