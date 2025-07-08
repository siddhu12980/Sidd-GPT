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
  } catch (error) {}
}

// Helper function to process PDF files
async function processPdfFile(fileUrl: string) {
  try {
    const response = await fetch(fileUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status}`);
    }

    const pdfBuffer = await response.arrayBuffer();

    return {
      type: "file",
      data: new Uint8Array(pdfBuffer),
      mimeType: "application/pdf",
      filename: fileUrl.split("/").pop() || "document.pdf",
    };
  } catch (error) {
    throw error;
  }
}

// NEW: Helper function to process multiple attachments using multimodal format
async function processMultipleAttachments(
  attachmentUrls: string[],
  attachmentTypes: string[]
) {
  const multimodalContent = [];
  let processedCount = 0;

  for (let i = 0; i < attachmentUrls.length; i++) {
    try {
      const url = attachmentUrls[i];
      const type = attachmentTypes[i] || "file";

      if (
        type === "image" ||
        url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i)
      ) {
        multimodalContent.push({
          type: "image",
          image: url,
        });
        processedCount++;
      } else if (type === "pdf" || url.match(/\.pdf$/i)) {
        const pdfContent = await processPdfFile(url);
        multimodalContent.push(pdfContent);
        processedCount++;
      } else {
        // Try to handle as file
        multimodalContent.push({
          type: "file",
          file: new URL(url),
        });
        processedCount++;
      }
    } catch (error) {
      console.error(
        `❌ Failed to process ${attachmentUrls[i]}:`,
        (error as Error).message
      );
    }
  }

  return multimodalContent;
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

    const {
      messages,
      userId,
      data,
      sessionId,
      attachmentUrls,
      attachmentTypes,
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 });
    }

    const model = "gpt-4o" as ModelName;
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

    const inputTokens = tokenManager.countMessageTokens(normalizedMessages);

    // NEW: Log multiple attachments
    if (attachmentUrls?.length > 0) {
      attachmentUrls.forEach((url: string, i: number) => {
        const type = attachmentTypes?.[i] || "auto-detect";
      });
    }

    const currentUserId = userId || "default-user";

    const latestUserMessage = messages
      .filter((msg) => msg.role === "user")
      .pop();

    let enhancedSystemPrompt = `
      You are a highly capable and trustworthy AI assistant. Use the memory context, including prior user conversations, to maintain continuity, understand intent, and provide relevant, personalized assistance.
      
      Your role is to deliver accurate, thoughtful, and context-aware responses across a range of tasks—technical, creative, or general. Ask clarifying questions when needed. If unsure, admit uncertainty rather than guessing.
      
      You remain helpful, respectful, and professional. Avoid unsafe or misleading outputs. Always prioritize solving the user's problem effectively based on their goals and the evolving context of the conversation.
      `;

    if (latestUserMessage && typeof latestUserMessage.content === "string") {
      try {
        const memories = await mem0Service.getRelevantMemories(
          currentUserId,
          latestUserMessage.content,
          5
        );

        if (memories && memories.length > 0) {
          const memoryContext = memories.join("\n\n");
          enhancedSystemPrompt = `${memoryContext}\n\n  ${enhancedSystemPrompt}`;
        }
      } catch (memoryError) {
        // Continue without storing memory if it fails
      }
    }

    // NEW: Handle multiple attachments using multimodal format
    if (attachmentUrls && attachmentUrls.length > 0) {
      try {
        const lastMessage = messages[messages.length - 1];
        const baseContent =
          lastMessage?.content || "Please analyze these attached files.";

        // Build multimodal content array
        const multimodalContent: any[] = [{ type: "text", text: baseContent }];

        // Process all attachments
        const attachmentContent = await processMultipleAttachments(
          attachmentUrls,
          attachmentTypes || []
        );
        multimodalContent.push(...attachmentContent);

        const initialMessages = messages.slice(0, -1);

        const result = await streamText({
          model: openai("gpt-4o"),
          system: enhancedSystemPrompt,
          messages: [
            ...initialMessages,
            {
              role: "user",
              content: multimodalContent,
            },
          ],
        });

        // Track usage for multiple attachments
        const finalInputTokens = tokenManager.countMessageTokens([
          ...initialMessages,
          { role: "user", content: JSON.stringify(multimodalContent) },
        ]);

        const hasPdf = attachmentUrls.some(
          (url: string, i: number) =>
            attachmentTypes?.[i] === "pdf" || url.match(/\.pdf$/i)
        );
        const estimatedOutputTokens = hasPdf ? 1500 : 800;

        const totalTokens = finalInputTokens + estimatedOutputTokens;
        const cost = tokenManager.calculateCost(
          finalInputTokens,
          estimatedOutputTokens
        );

        trackUsage(currentUserId, totalTokens, "gpt-4o", cost);

        return result.toDataStreamResponse();
      } catch (attachmentError) {
        console.error(
          "❌ Multiple attachments processing failed:",
          attachmentError
        );
        // Fall through to legacy handling
      }
    }

    // LEGACY: Handle single file attachments (backward compatibility)
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
            text: "What is in this image?",
          });
        } else if (isPdf(fileUrl)) {
          multimodalContent.push({
            type: "text",
            text: "Please analyze this PDF and tell me what it contains. Summarize the key points.",
          });
        } else {
          multimodalContent.push({
            type: "text",
            text: "Analyze this file.",
          });
        }
      }

      if (isImage(fileUrl)) {
        multimodalContent.push({ type: "image", image: new URL(fileUrl) });
      } else if (isPdf(fileUrl)) {
        try {
          const pdfContent = await processPdfFile(fileUrl);
          multimodalContent.push(pdfContent);
        } catch (pdfError) {
          multimodalContent.push({ type: "file", file: new URL(fileUrl) });
        }
      } else if (isDocument(fileUrl)) {
        multimodalContent.push({ type: "file", file: new URL(fileUrl) });
      }

      const initialMessages = messages.slice(0, -1);

      const result = await streamText({
        model: openai("gpt-4o"),
        system: enhancedSystemPrompt,
        messages: [
          ...initialMessages,
          {
            role: "user",
            content: multimodalContent,
          },
        ],
      });

      // Track usage for legacy single file
      const finalInputTokens = tokenManager.countMessageTokens([
        ...initialMessages,
        { role: "user", content: JSON.stringify(multimodalContent) },
      ]);

      const estimatedOutputTokens = isPdf(fileUrl) ? 1000 : 500;
      const totalTokens = finalInputTokens + estimatedOutputTokens;
      const cost = tokenManager.calculateCost(
        finalInputTokens,
        estimatedOutputTokens
      );

      trackUsage(currentUserId, totalTokens, "gpt-4o", cost);

      return result.toDataStreamResponse();
    }

    // STANDARD: Text-only messages
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

    // Track usage for standard text responses
    const finalInputTokens = tokenManager.countMessageTokens(aiMessages);
    const estimatedOutputTokens = 500;
    const totalTokens = finalInputTokens + estimatedOutputTokens;
    const cost = tokenManager.calculateCost(
      finalInputTokens,
      estimatedOutputTokens
    );

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
  return new Response("Chat API with multiple attachments support is running!");
}
