import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { profileJson, messages } = await req.json();

    if (!profileJson) {
      return NextResponse.json(
        { error: "Missing profileJson" },
        { status: 400 }
      );
    }

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages must be an array" },
        { status: 400 }
      );
    }

    const identityString = JSON.stringify(profileJson, null, 2);

    const openAiMessages: {
      role: "system" | "user" | "assistant";
      content: string;
    }[] = [
      {
        role: "system",
        content:
          "You are a personalized assistant that knows the user extremely well. Use the provided identity graph JSON as long-term memory. Stay helpful, honest, and grounded.",
      },
      {
        role: "system",
        content:
          "When you answer, speak directly to the user as 'you'. Use their preferences, goals, constraints, skills, and tone from the identity graph. Do NOT repeat the full JSON back.",
      },
      {
        role: "user",
        content:
          "Here is the user's identity graph JSON. Use it as context for the rest of this conversation:\n\n" +
          identityString,
      },
    ];

    for (const m of messages as { role: "user" | "assistant"; content: string }[]) {
      openAiMessages.push({
        role: m.role,
        content: m.content,
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: openAiMessages,
      temperature: 0.5,
    });

    const reply =
      completion.choices[0]?.message?.content ??
      "Sorry, I couldn't generate a reply.";

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("CHAT SANDBOX ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
