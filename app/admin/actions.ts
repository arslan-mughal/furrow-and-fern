"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminAction } from "@/lib/admin";
import {
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendPaymentRejectedEmail,
} from "@/lib/email";

// ── Category CRUD ─────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function createCategory(formData: FormData) {
  await requireAdminAction();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Category name is required.");
  await prisma.category.create({ data: { name, slug: slugify(name) } });
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function deleteCategory(categoryId: string) {
  await requireAdminAction();
  const productCount = await prisma.product.count({ where: { categoryId } });
  if (productCount > 0) {
    throw new Error("Move or delete this category's products before deleting it.");
  }
  await prisma.category.delete({ where: { id: categoryId } });
  revalidatePath("/admin/categories");
}

// ── Order management ──────────────────────────────────────────────────────
// Confirm/reject/fulfil are separate actions rather than a generic
// updateOrderStatus because each has different side effects (stock
// decrement, emails, verifiedBy tracking). The admin can't skip steps:
// only PENDING_VERIFICATION orders can be confirmed or rejected; only
// CONFIRMED orders can be fulfilled.

async function getOrderOrThrow(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: { select: { email: true } } },
  });
  if (!order) throw new Error("Order not found.");
  return order;
}

export async function confirmPayment(orderId: string) {
  const admin = await requireAdminAction();
  const order = await getOrderOrThrow(orderId);

  if (order.status !== "PENDING_VERIFICATION") {
    throw new Error("Only orders pending verification can be confirmed.");
  }

  // Stock decrements atomically with the status update in one transaction.
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "CONFIRMED",
        verifiedAt: new Date(),
        verifiedBy: admin.email,
      },
    });

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
  });

  const recipient = order.user?.email ?? order.guestEmail;
  if (recipient) {
    await sendOrderConfirmationEmail({
      to: recipient,
      orderId: order.id,
      items: order.items,
      totalCents: order.totalCents,
      currency: order.currency,
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function rejectPayment(orderId: string, formData: FormData) {
  await requireAdminAction();
  const order = await getOrderOrThrow(orderId);
  const reason = String(formData.get("reason") ?? "").trim();

  if (order.status !== "PENDING_VERIFICATION") {
    throw new Error("Only orders pending verification can be rejected.");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "REJECTED",
      rejectionReason: reason || null,
    },
  });

  const recipient = order.user?.email ?? order.guestEmail;
  if (recipient) {
    await sendPaymentRejectedEmail({
      to: recipient,
      orderId: order.id,
      reason: reason || undefined,
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function markFulfilled(orderId: string) {
  await requireAdminAction();
  const order = await getOrderOrThrow(orderId);

  if (order.status !== "CONFIRMED") {
    throw new Error("Only confirmed orders can be marked as fulfilled.");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "FULFILLED" },
  });

  const recipient = order.user?.email ?? order.guestEmail;
  if (recipient) {
    await sendOrderShippedEmail({ to: recipient, orderId: order.id });
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function cancelOrder(orderId: string) {
  await requireAdminAction();
  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}
