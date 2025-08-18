import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { context } = await req.json();

  if (!context) {
    return NextResponse.json({ error: "Context is required" }, { status: 400 });
  }

  try {
    const result = await generateText({
      model: openai("gpt-4o"),
      prompt: `Analyze this chat conversation and determine if there's enough context to generate a meaningful title.
Chat context:
${context}

Rules:
1. If the conversation is just greetings (hi, hello, good morning, etc.) or casual small talk, return "null"
2. If there's a clear topic, problem, or subject being discussed, generate a title
3. Title must be under 10 characters
4. Title should be descriptive and relevant to the main topic
5. Return only the title or "null" - no other text

Examples:
- "How to fix React hooks" → "React Hooks"
- "hi, how are you?" → "null"
- "Can you help me with Python?" → "Python Help"
- "What's the weather like?" → "null"

Title:`,
    });

    const title = result.text.trim();

    // Check if AI returned "null" or empty
    if (title.toLowerCase() === "null" || !title) {
      return NextResponse.json({ title: null });
    }

    return NextResponse.json({ title });
  } catch (error) {
    console.error("Title generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate title" },
      { status: 500 }
    );
  }
}
