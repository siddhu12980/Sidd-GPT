import { streamText, UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { TokenManager, ModelName } from "@/lib/tokenManager";
import { chatRateLimiter } from "@/middleware/rateLimiter";
import { mem0Service } from "@/lib/mem0Service";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";

// Connect to MongoDB if not already connected
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
  createdAt: { type: Date, default: Date.now }
});

usageSchema.index({ userId: 1, date: 1 });

const Usage = mongoose.models.Usage || mongoose.model('Usage', usageSchema);

// Helper function to track usage directly in database
async function trackUsage(
  userId: string, 
  tokensUsed: number, 
  modelUsed: string, 
  cost: number
) {
  try {
    const date = new Date().toISOString().split('T')[0];
    
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
        cost
      });
    }
    
    console.log(`✅ Usage tracked: ${tokensUsed} tokens, $${cost.toFixed(6)} for user ${userId}`);
  } catch (error) {
    console.error('Error tracking usage:', error);
  }
}

// Helper function to handle PDF processing
async function processPdfFile(fileUrl: string) {
  try {
    console.log('📥 Fetching PDF from:', fileUrl);
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status}`);
    }
    
    const pdfBuffer = await response.arrayBuffer();
    console.log('✅ PDF fetched successfully, size:', pdfBuffer.byteLength, 'bytes');
    
    return {
      type: 'file',
      data: Buffer.from(pdfBuffer),
      mimeType: 'application/pdf',
      filename: fileUrl.split('/').pop() || 'document.pdf'
    };
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const rateLimitResult = await chatRateLimiter(req as any);
    if (rateLimitResult.status !== 200) {
      return rateLimitResult;
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    const mem0ApiKey = process.env.MEM0_API_KEY;

    if (!openaiApiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    if (!mem0ApiKey) {
      throw new Error("Mem0 API key is not configured");
    }

    const body = await req.json();
    const { messages, userId, data, sessionId } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 });
    }

    const model = "gpt-4o" as ModelName; // Using gpt-4o-mini as shown in the streamText calls
    
    const tokenManager = new TokenManager(model);

    const normalizedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content:
        typeof msg.content === "string"
          ? msg.content
          : JSON.stringify(msg.content),
    }));

    const tokenCheck = tokenManager.checkTokenLimits(normalizedMessages);

    if (!tokenCheck.withinLimits) {
      const trimmed = tokenManager.trimMessagesToFit(normalizedMessages);
      messages.splice(0, messages.length, ...trimmed);
    }

    // Calculate input tokens for usage tracking
    const inputTokens = tokenManager.countMessageTokens(normalizedMessages);
    console.log("=== Token Management Debug ===");
    console.log("Model:", model);
    console.log("Input tokens:", inputTokens);
    console.log("Original messages count:", messages.length);
    console.log("Token check result:", tokenCheck);
    console.log("=== End Token Management Debug ===");

    // Use provided userId or fallback to a default
    const currentUserId = userId || "default-user";

    // Get the latest user message for memory retrieval
    const latestUserMessage = messages
      .filter((msg) => msg.role === "user")
      .pop();

    console.log("latestUserMessage", latestUserMessage);

    let enhancedSystemPrompt = `
      
      You are a highly capable and trustworthy AI assistant. Use the memory context, including prior user conversations, to maintain continuity, understand intent, and provide relevant, personalized assistance.
      
      Your role is to deliver accurate, thoughtful, and context-aware responses across a range of tasks—technical, creative, or general. Ask clarifying questions when needed. If unsure, admit uncertainty rather than guessing.
      
      You remain helpful, respectful, and professional. Avoid unsafe or misleading outputs. Always prioritize solving the user's problem effectively based on their goals and the evolving context of the conversation.
      `;

    // Retrieve relevant memories if we have a user message
    if (latestUserMessage && typeof latestUserMessage.content === "string") {
      try {
        const memories = await mem0Service.getRelevantMemories(
          currentUserId,
          latestUserMessage.content,
          5
        );

        console.log("Revelant Memories", memories);

        if (memories && memories.length > 0) {
          const memoryContext = memories.join("\n\n");
          enhancedSystemPrompt = `${memoryContext}\n\n  ${enhancedSystemPrompt}`;
        }
      } catch (memoryError) {
        console.log("Memory Failed", memoryError);
      }
    }

    // --- Enhanced Multimodal Pattern (image/file/PDF support) ---
    const lastMessage = messages[messages.length - 1];
    const fileUrl = lastMessage?.data || data;
    const content = lastMessage?.content || "";

    function isImage(url: string) {
      return url && url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i);
    }
    function isDocument(url: string) {
      return url && url.match(/\.(docx?|txt|csv|xlsx?|ppt|pptx|zip|rar)$/i);
    }
    function isPdf(url: string) {
      return url && url.match(/\.pdf$/i);
    }

    if (fileUrl) {
      let multimodalContent = [];
      if (content) {
        multimodalContent.push({ type: "text", text: content });
      } else {
        if (isImage(fileUrl)) {
          multimodalContent.push({
            type: "text",
            text: "What is in this image?"
          });
        } else if (isPdf(fileUrl)) {
          multimodalContent.push({
            type: "text",
            text: "Please analyze this PDF and tell me what it contains. Summarize the key points."
          });
        } else {
          multimodalContent.push({
            type: "text",
            text: "Analyze this file."
          });
        }
      }

      if (isImage(fileUrl)) {
        multimodalContent.push({ type: "image", image: new URL(fileUrl) });
      } else if (isPdf(fileUrl)) {
        console.log('🧪 Processing PDF with AI SDK...');
        try {
          const pdfContent = await processPdfFile(fileUrl);
          multimodalContent.push(pdfContent);
        } catch (pdfError) {
          console.error('PDF processing failed:', pdfError);
          // Fallback to treating as regular file
          multimodalContent.push({ type: "file", file: new URL(fileUrl) });
        }
      } else if (isDocument(fileUrl)) {
        multimodalContent.push({ type: "file", file: new URL(fileUrl) });
      }

      const initialMessages = messages.slice(0, -1);

      // Use gpt-4o for file processing (especially PDFs) for better results
      const fileModel = "gpt-4o";
      
      const result = await streamText({
        model: openai(fileModel),
        system: enhancedSystemPrompt,
        messages: [
          ...initialMessages,
          {
            role: "user",
            content: multimodalContent,
          },
        ],
      });

      // Track usage for multimodal request
      const finalInputTokens = tokenManager.countMessageTokens([
        ...initialMessages,
        { role: "user", content: JSON.stringify(multimodalContent) }
      ]);
      
      // For streaming responses, we'll estimate output tokens and track when response finishes
      const estimatedOutputTokens = isPdf(fileUrl) ? 1000 : 500; // PDFs might need more tokens
      const totalTokens = finalInputTokens + estimatedOutputTokens;
      const cost = tokenManager.calculateCost(finalInputTokens, estimatedOutputTokens);
      
      console.log("=== Usage Tracking (Multimodal) ===");
      console.log("File type:", isPdf(fileUrl) ? "PDF" : isImage(fileUrl) ? "Image" : "Document");
      console.log("Model used:", fileModel);
      console.log("Input tokens:", finalInputTokens);
      console.log("Estimated output tokens:", estimatedOutputTokens);
      console.log("Total tokens:", totalTokens);
      console.log("Cost:", cost);
      console.log("=== End Usage Tracking ===");

      // Track usage asynchronously
      trackUsage(currentUserId, totalTokens, fileModel, cost);

      return result.toDataStreamResponse();
    }

    let aiMessages = messages;
    if (
      messages.length > 0 &&
      typeof messages[messages.length - 1] === "object" &&
      Object.prototype.hasOwnProperty.call(
        messages[messages.length - 1],
        "type"
      ) &&
      (messages[messages.length - 1] as any).type === "image"
    ) {
      const initialMessages = messages.slice(0, -1);
      const currentMessage = messages[messages.length - 1];
      aiMessages = [
        ...initialMessages,
        {
          ...currentMessage,
          content: [
            { type: "text", text: currentMessage.content },
            { type: "image", image: currentMessage.content },
          ],
        } as any,
      ];
    }

    const result = await streamText({
      model: openai("gpt-4o"),
      system: enhancedSystemPrompt,
      messages: aiMessages,
    });

    // For standard text responses, track usage
    const finalInputTokens = tokenManager.countMessageTokens(aiMessages);
    const estimatedOutputTokens = 500; // Reasonable estimate for responses
    const totalTokens = finalInputTokens + estimatedOutputTokens;
    const cost = tokenManager.calculateCost(finalInputTokens, estimatedOutputTokens);
    
    console.log("=== Usage Tracking (Standard) ===");
    console.log("Input tokens:", finalInputTokens);
    console.log("Estimated output tokens:", estimatedOutputTokens);
    console.log("Total tokens:", totalTokens);
    console.log("Cost:", cost);
    console.log("=== End Usage Tracking ===");

    // Track usage asynchronously
    trackUsage(currentUserId, totalTokens, model, cost);

    const response = result.toDataStreamResponse();

    // Store important information in memory for future reference
    if (latestUserMessage && typeof latestUserMessage.content === "string") {
      try {
        await mem0Service.addMemory(currentUserId, [latestUserMessage]);
      } catch (memoryError) {
        // Continue without storing memory if it fails
      }
    }

    return response;
  } catch (error) {
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

export async function GET(req: Request) {
  return new Response("Chat API with Mem0 integration and PDF support is running!");
}