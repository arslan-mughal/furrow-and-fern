"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// Public on purpose (no admin/session check) — possession of the
// unguessable token is what authorizes this, the same way it works for
// every real newsletter. Not exported for use anywhere else.
export async function confirmUnsubscribe(token: string) {
  await prisma.subscriber.updateMany({
    where: { unsubscribeToken: token },
    data: { unsubscribedAt: new Date() },
  });
  revalidatePath("/unsubscribe");
}
