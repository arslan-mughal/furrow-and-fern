"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function submitTransactionId(orderId: string, formData: FormData) {
  const transactionId = String(formData.get("transactionId") ?? "").trim();
  if (!transactionId) {
    throw new Error("Enter your transaction ID.");
  }
  const note = String(formData.get("note") ?? "").trim();

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error("Order not found.");
  }

  // Already submitted (or further along, e.g. an admin already
  // confirmed/rejected it) — don't let a resubmission overwrite that.
  if (order.status === "PENDING") {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        transactionId,
        transactionNote: note || null,
        submittedAt: new Date(),
        status: "PENDING_VERIFICATION",
      },
    });
  }

  redirect(`/checkout/success?orderId=${orderId}`);
}
