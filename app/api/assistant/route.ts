import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { runAssistant, type ChatMessage } from "@/lib/assistant";

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      })
    )
    .min(1)
    .max(20),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "That message didn't look right." }, { status: 400 });
  }

  // Order lookups are scoped to whoever is actually signed in server-side —
  // the chat widget never sends a user id itself, so there's nothing for a
  // tampered request to spoof here.
  const session = await auth.api.getSession({ headers: await headers() });

  try {
    const reply = await runAssistant(parsed.data.messages as ChatMessage[], {
      userId: session?.user?.id ?? null,
    });
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Assistant error:", error);
    return NextResponse.json(
      { error: "Sprout is taking a quick break. Try again in a moment." },
      { status: 500 }
    );
  }
}
