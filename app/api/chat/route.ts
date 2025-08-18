import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText } from "ai";
import mongoose from "mongoose";
import { TokenManager, ModelName } from "@/lib/tokenManager";
import { mem0Service } from "@/lib/mem0Service";
// Ensure mongoose connection
if (!mongoose.connection.readyState) {
  mongoose.connect(process.env.MONGODB_URI!, {
    dbName: process.env.MONGODB_DB,
  });
}

// Usage schema (same as in usage/route.ts)
const usageSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  date: { type: String, required: true },
  tokensUsed: { type: Number, default: 0 },
  requestsMade: { type: Number, default: 0 },
  modelUsed: { type: String, required: true },
  cost: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

usageSchema.index({ userId: 1, date: 1 });

const Usage = mongoose.models.Usage || mongoose.model("Usage", usageSchema);

// Helper function to track usage directly in database
async function trackUsage(
  userId: string,
  tokensUsed: number,
  modelUsed: string,
  cost: number
) {
  try {
    const date = new Date().toISOString().split("T")[0];
    const existingUsage = await Usage.findOne({ userId, date, modelUsed });

    if (existingUsage) {
      existingUsage.tokensUsed += tokensUsed;
      existingUsage.requestsMade += 1;
      existingUsage.cost += cost;
      await existingUsage.save();
    } else {
      await Usage.create({
        userId,
        date,
        tokensUsed,
        requestsMade: 1,
        modelUsed,
        cost,
      });
    }
  } catch (error) {
    console.error("Failed to track usage:", error);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    const currentUserId = userId || "anonymous";

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 });
    }

    const model: ModelName = "gpt-4o";
    const tokenManager = new TokenManager(model);

    console.log("messages in backend ", JSON.stringify(messages, null, 2));

    // Extract text content from parts for token counting (for our token manager)
    const normalizedMessages = messages.map((msg: any) => {
      let content = "";
      if (msg.parts && Array.isArray(msg.parts)) {
        // Extract text from parts array
        content = msg.parts
          .filter((part: any) => part.type === "text")
          .map((part: any) => part.text || "")
          .join(" ");
      }
      return {
        role: msg.role,
        content: content,
      };
    });

    console.log("normalizedMessages in backend ", normalizedMessages);

    // Check token limits and trim if necessary
    const tokenCheck = tokenManager.checkTokenLimits(normalizedMessages);

    let finalMessages = messages; // Use original messages for streamText

    if (!tokenCheck.withinLimits) {
      console.log("Token limit exceeded, trimming messages...");
      const trimmed = tokenManager.trimMessagesToFit(normalizedMessages);
      finalMessages = messages.slice(0, trimmed.length);
    }

    // Get the latest user message for memory context
    const latestUserMessage = messages
      .filter((msg: any) => msg.role === "user")
      .pop();

    console.log("latestUserMessage in backend ", latestUserMessage);

    // Enhanced system prompt with memory context
    let enhancedSystemPrompt = `
You are a highly capable and trustworthy AI assistant. Use the memory context, including prior user conversations, to maintain continuity, understand intent, and provide relevant, personalized assistance.

Your role is to deliver accurate, thoughtful, and context-aware responses across a range of tasks—technical, creative, or general. Ask clarifying questions when needed. If unsure, admit uncertainty rather than guessing.

You remain helpful, respectful, and professional. Avoid unsafe or misleading outputs. Always prioritize solving the user's problem effectively based on their goals and the evolving context of the conversation.
    `;

    // Add memory context if available
    if (latestUserMessage && latestUserMessage.parts) {
      // Extract text content from the latest user message parts
      const userContent = latestUserMessage.parts
        .filter((part: any) => part.type === "text")
        .map((part: any) => part.text || "")
        .join(" ");

      if (userContent) {
        try {
          const memories = await mem0Service.getRelevantMemories(
            currentUserId,
            userContent,
            5
          );

          if (memories && memories.length > 0) {
            const memoryContext = memories.join("\n\n");
            enhancedSystemPrompt = `${memoryContext}\n\n${enhancedSystemPrompt}`;
          }
        } catch (memoryError) {
          console.warn("Failed to retrieve memories:", memoryError);
        }
      }
    }

    // Calculate input tokens for usage tracking using normalized messages
    const inputTokens = tokenManager.countMessageTokens(normalizedMessages);

    console.log(
      "finalMessages sample:",
      JSON.stringify(finalMessages.slice(-2), null, 2)
    );

    // Stream the response using AI SDK v5 - exactly like the docs
    const result = streamText({
      model: openai(model),
      system: enhancedSystemPrompt,
      messages: convertToModelMessages(messages),
      onFinish: async (result) => {
        // Track usage after completion
        const outputTokens = result.usage?.outputTokens || 500; // fallback estimate
        const totalTokens = inputTokens + outputTokens;
        const cost = tokenManager.calculateCost(inputTokens, outputTokens);

        await trackUsage(currentUserId, totalTokens, model, cost);

        // Store important information in memory for future reference
        if (latestUserMessage && latestUserMessage.parts) {
          // Extract text content for memory storage
          const userContent = latestUserMessage.parts
            .filter((part: any) => part.type === "text")
            .map((part: any) => part.text || "")
            .join(" ");

          if (userContent) {
            try {
              // Convert to the format expected by mem0Service
              const memoryMessage = {
                role: latestUserMessage.role,
                content: userContent,
              };
              await mem0Service.addMemory(currentUserId, [memoryMessage]);
            } catch (memoryError) {
              console.warn("Failed to store memory:", memoryError);
            }
          }
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    const errorObj = error as Error;

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: errorObj.message,
        type: errorObj.constructor.name,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
