import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

const subscribeSchema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.subscriber.findUnique({ where: { email } });

  if (existing && !existing.unsubscribedAt) {
    // Already an active subscriber — idempotent success, no duplicate
    // welcome email for someone submitting the form twice.
    return NextResponse.json({ success: true });
  }

  const subscriber = existing
    ? await prisma.subscriber.update({ where: { email }, data: { unsubscribedAt: null } })
    : await prisma.subscriber.create({ data: { email } });

  // Best-effort: a failed welcome email shouldn't fail the subscription.
  await sendWelcomeEmail(subscriber.email, subscriber.unsubscribeToken);

  return NextResponse.json({ success: true });
}
