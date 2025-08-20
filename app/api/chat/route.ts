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
    console.log("=== CHAT API START ===");
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[${requestId}] Request started at:`, new Date().toISOString());

    // Get authenticated user
    const { userId } = await auth();
    const currentUserId = userId || "anonymous";
    console.log(`[${requestId}] User ID:`, currentUserId);

    const body = await req.json();
    console.log(
      `[${requestId}] Raw request body:`,
      JSON.stringify(body, null, 2)
    );

    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      console.error(
        `[${requestId}] Invalid messages format:`,
        typeof messages,
        messages
      );
      return new Response("Invalid messages format", { status: 400 });
    }

    console.log(`[${requestId}] Messages array length:`, messages.length);
    console.log(`[${requestId}] Messages structure check:`);

    // Log detailed structure of each message
    messages.forEach((msg, index) => {
      console.log(`[${requestId}] Message ${index}:`, {
        role: msg.role,
        hasId: !!msg.id,
        hasParts: !!msg.parts,
        partsLength: msg.parts?.length || 0,
        partsTypes: msg.parts?.map((p: any) => p.type) || [],
        hasContent: !!msg.content,
        messageKeys: Object.keys(msg),
      });

      // Log file parts in detail
      if (msg.parts) {
        msg.parts.forEach((part: any, partIndex: number) => {
          if (part.type === "file") {
            console.log(
              `[${requestId}] Message ${index}, File part ${partIndex}:`,
              {
                type: part.type,
                mediaType: part.mediaType,
                mediaTypeType: typeof part.mediaType,
                hasUrl: !!part.url,
                hasFilename: !!part.filename,
                partKeys: Object.keys(part),
              }
            );
          }
        });
      }
    });

    const model: ModelName = "gpt-4o";
    const tokenManager = new TokenManager(model);

    console.log(
      `[${requestId}] Full messages in backend:`,
      JSON.stringify(messages, null, 2)
    );

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
      `[${requestId}] finalMessages sample:`,
      JSON.stringify(finalMessages.slice(-2), null, 2)
    );

    // Comprehensive logging before convertToModelMessages call
    console.log(`[${requestId}] === BEFORE convertToModelMessages ===`);
    console.log(
      `[${requestId}] About to call convertToModelMessages with ${messages.length} messages`
    );

    // Log the exact format we're sending to convertToModelMessages
    console.log(
      `[${requestId}] Messages for convertToModelMessages:`,
      JSON.stringify(messages, null, 2)
    );

    // Validate each message before conversion
    const preConversionValidation = messages.map((msg, index) => {
      const validation = {
        index,
        role: msg.role,
        hasId: !!msg.id,
        hasParts: !!msg.parts,
        partsCount: msg.parts?.length || 0,
        partsDetails:
          msg.parts?.map((part: any, partIndex: number) => ({
            partIndex,
            type: part.type,
            mediaType: part.mediaType,
            mediaTypeValid:
              typeof part.mediaType === "string" && part.mediaType.length > 0,
            hasUrl: !!part.url,
            hasFilename: !!part.filename,
            allPartKeys: Object.keys(part),
          })) || [],
      };
      return validation;
    });

    console.log(
      `[${requestId}] Pre-conversion validation:`,
      JSON.stringify(preConversionValidation, null, 2)
    );

    // Try the conversion and catch any errors
    let convertedMessages;
    try {
      console.log(`[${requestId}] Calling convertToModelMessages...`);
      convertedMessages = convertToModelMessages(messages);
      console.log(
        `[${requestId}] convertToModelMessages SUCCESS - converted ${convertedMessages.length} messages`
      );
      console.log(
        `[${requestId}] Converted messages sample:`,
        JSON.stringify(convertedMessages.slice(-2), null, 2)
      );
    } catch (conversionError) {
      console.error(`[${requestId}] ❌ convertToModelMessages ERROR:`, {
        error: conversionError,
        errorMessage:
          conversionError instanceof Error
            ? conversionError.message
            : "Unknown error",
        errorName:
          conversionError instanceof Error
            ? conversionError.constructor.name
            : "Unknown",
        stack:
          conversionError instanceof Error
            ? conversionError.stack
            : "No stack trace",
      });

      // Log the problematic message that caused the error
      console.error(
        `[${requestId}] Messages that caused conversion error:`,
        JSON.stringify(messages, null, 2)
      );
      throw conversionError; // Re-throw to maintain error handling
    }

    // Stream the response using AI SDK v5 - exactly like the docs
    console.log(`[${requestId}] Starting streamText...`);
    const result = streamText({
      model: openai(model),
      system: enhancedSystemPrompt,
      messages: convertedMessages,
      onFinish: async (result) => {
        console.log(`[${requestId}] === onFinish callback started ===`);
        console.log(`[${requestId}] Result usage:`, result.usage);

        // Track usage after completion
        const outputTokens = result.usage?.outputTokens || 500; // fallback estimate
        const totalTokens = inputTokens + outputTokens;
        const cost = tokenManager.calculateCost(inputTokens, outputTokens);

        console.log(`[${requestId}] Usage tracking:`, {
          inputTokens,
          outputTokens,
          totalTokens,
          cost,
          model,
        });

        try {
          await trackUsage(currentUserId, totalTokens, model, cost);
          console.log(`[${requestId}] Usage tracked successfully`);
        } catch (usageError) {
          console.error(`[${requestId}] Usage tracking failed:`, usageError);
        }

        // Store important information in memory for future reference
        console.log(`[${requestId}] === Memory storage starting ===`);
        if (latestUserMessage && latestUserMessage.parts) {
          console.log(`[${requestId}] Processing memory for user message`);

          // Extract text content for memory storage
          const userContent = latestUserMessage.parts
            .filter((part: any) => part.type === "text")
            .map((part: any) => part.text || "")
            .join(" ");

          console.log(
            `[${requestId}] Extracted user content for memory:`,
            userContent
          );

          if (userContent) {
            try {
              // Convert to the format expected by mem0Service
              const memoryMessage = {
                role: latestUserMessage.role,
                content: userContent,
              };
              console.log(`[${requestId}] Storing memory:`, memoryMessage);
              await mem0Service.addMemory(currentUserId, [memoryMessage]);
              console.log(`[${requestId}] Memory stored successfully`);
            } catch (memoryError) {
              console.error(
                `[${requestId}] Memory storage failed:`,
                memoryError
              );
            }
          } else {
            console.log(
              `[${requestId}] No text content found for memory storage`
            );
          }
        } else {
          console.log(
            `[${requestId}] No latest user message or parts for memory`
          );
        }

        console.log(`[${requestId}] === onFinish callback completed ===`);
      },
    });

    console.log(
      `[${requestId}] streamText created successfully, returning response...`
    );
    const response = result.toUIMessageStreamResponse();
    console.log(`[${requestId}] === CHAT API END - Response created ===`);

    return response;
  } catch (error) {
    // Note: requestId might not be available if error occurs early
    const requestId = "unknown";
    console.error(`[${requestId}] ❌ CHAT API FATAL ERROR:`, {
      error,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorName: error instanceof Error ? error.constructor.name : "Unknown",
      stack: error instanceof Error ? error.stack : "No stack trace",
      timestamp: new Date().toISOString(),
    });

    const errorObj = error as Error;

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: errorObj.message,
        type: errorObj.constructor.name,
        requestId: requestId,
        timestamp: new Date().toISOString(),
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
