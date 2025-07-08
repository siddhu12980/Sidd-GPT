import { NextRequest, NextResponse } from "next/server";
import { TokenManager, ModelName } from "@/lib/tokenManager";

export async function POST(req: NextRequest) {
  try {
    const { messages, model = "gpt-4o" } = await req.json();

    const tokenManager = new TokenManager(model as ModelName);
    const normalizedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
    }));

    const tokenCheck = tokenManager.checkTokenLimits(normalizedMessages);
    const usageSummary = tokenManager.getUsageSummary(normalizedMessages);
    
    let trimmedMessages = null;
    if (!tokenCheck.withinLimits) {
      trimmedMessages = tokenManager.trimMessagesToFit(normalizedMessages);
    }

    return NextResponse.json({
      tokenCheck,
      usageSummary,
      trimmedMessages,
      originalCount: messages.length,
      trimmedCount: trimmedMessages?.length || messages.length
    });
  } catch (error) {
    console.error("Token count error:", error);
    return NextResponse.json(
      { error: "Failed to count tokens" },
      { status: 500 }
    );
  }
} 