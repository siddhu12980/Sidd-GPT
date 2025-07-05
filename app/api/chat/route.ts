import { streamText, UIMessage } from "ai";
import {
  createMem0,
  retrieveMemories,
  addMemories,
} from "@mem0/vercel-ai-provider";
import { TokenManager, ModelName } from "@/lib/tokenManager";
import { chatRateLimiter } from "@/middleware/rateLimiter";

// Initialize Mem0 with proper configuration
const mem0 = createMem0({
  provider: "openai",
  mem0ApiKey: process.env.MEM0_API_KEY,
  apiKey: process.env.OPENAI_API_KEY,
  config: {
    compatibility: "strict",
  },
  mem0Config: {},
});

export async function POST(req: Request) {
  try {
    console.log("=== API Route Debug Start ===");
    console.log("=== API Route Debug Start ===");
    console.log("=== API Route Debug Start ===");
    console.log("=== API Route Debug Start ===");
    console.log("=== API Route Debug Start ===");

    const rateLimitResult = await chatRateLimiter(req as any);
    if (rateLimitResult.status !== 200) {
      return rateLimitResult;
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    const mem0ApiKey = process.env.MEM0_API_KEY;

    console.log("=== API Keys Debug ===");
    console.log("OpenAI API Key exists:", !!openaiApiKey);
    console.log("Mem0 API Key exists:", !!mem0ApiKey);
    console.log("Mem0 API Key length:", mem0ApiKey?.length || 0);
    console.log("=== API Keys Debug End ===");

    if (!openaiApiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    if (!mem0ApiKey) {
      throw new Error("Mem0 API key is not configured");
    }

    const body = await req.json();

    console.log("=== API Route Debug Start ===");
    console.log("Received body:", body);
    console.log("=== API Route Debug End ===");

    const { messages, userId, data, sessionId } = body;

    console.log("Received messages:", messages);
    console.log("Messages count:", messages.length);
    console.log("User ID:", userId);
    console.log("Session ID:", sessionId);

    if (!messages || !Array.isArray(messages)) {
      console.log("Invalid messages format");
      return new Response("Invalid messages format", { status: 400 });
    }

    const model = "gpt-4o" as ModelName;
    const tokenManager = new TokenManager(model);

    console.log("=== Token Management Debug ===");
    console.log("Model:", model);
    console.log("Original messages count:", messages.length);

    const normalizedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content:
        typeof msg.content === "string"
          ? msg.content
          : JSON.stringify(msg.content),
    }));

    const tokenCheck = tokenManager.checkTokenLimits(normalizedMessages);
    console.log("Token check result:", {
      withinLimits: tokenCheck.withinLimits,
      inputTokens: tokenCheck.inputTokens,
      maxInputTokens: tokenCheck.maxInputTokens,
      estimatedOutputTokens: tokenCheck.estimatedOutputTokens,
      totalEstimated: tokenCheck.totalEstimated,
      utilizationPercentage:
        ((tokenCheck.totalEstimated / tokenCheck.maxInputTokens) * 100).toFixed(
          2
        ) + "%",
    });

    if (!tokenCheck.withinLimits) {
      console.warn(
        "Input exceeds token limits. Trimming messages from:",
        tokenCheck.inputTokens,
        "tokens"
      );
      const trimmed = tokenManager.trimMessagesToFit(normalizedMessages);
      console.log("Messages after trimming:", trimmed.length);
      console.log(
        "Trimmed messages:",
        trimmed.map((m) => ({ role: m.role, contentLength: m.content.length }))
      );
      messages.splice(0, messages.length, ...trimmed);
    } else {
      console.log("Messages within token limits - no trimming needed");
    }

    console.log("=== End Token Management Debug ===");

    // Use provided userId or fallback to a default
    const currentUserId = userId || "default-user";

    // Use sessionId as org_id for memory isolation, fallback to user ID if no session
    // const orgId = sessionId || currentUserId;

    // Get the latest user message for memory retrieval
    const latestUserMessage = messages
      .filter((msg) => msg.role === "user")
      .pop();

    let enhancedSystemPrompt = "You are a helpful assistant.";

    // Retrieve relevant memories if we have a user message
    if (latestUserMessage && typeof latestUserMessage.content === "string") {
      try {
        const memories = await retrieveMemories(latestUserMessage.content, {
          user_id: currentUserId,
          // org_id: orgId,
        });
        if (memories) {
          enhancedSystemPrompt = `${memories}\n\nYou are a helpful assistant.`;
        }

        console.log("=== Memories Debug ===");
        console.log("Memories:", memories);
        console.log("=== Memories Debug End ===");
      } catch (memoryError) {
        // Continue without memories if retrieval fails
      }
    }

    // --- Enhanced Multimodal Pattern (image/file support) ---
    const lastMessage = messages[messages.length - 1];
    const fileUrl = lastMessage?.data || data;
    const content = lastMessage?.content || "";

    function isImage(url: string) {
      return url && url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i);
    }
    function isDocument(url: string) {
      return url && url.match(/\.(pdf|docx?|txt|csv|xlsx?|ppt|pptx|zip|rar)$/i);
    }

    if (fileUrl) {
      console.log("=== File URL Debug ===");
      console.log("File URL:", fileUrl);
      console.log("=== File URL Debug End ===");
      let multimodalContent = [];
      if (content) {
        console.log("=== Content Debug ===");
        console.log("Content:", content);
        console.log("=== Content Debug End ===");
        multimodalContent.push({ type: "text", text: content });
      } else {
        console.log("=== No Content Debug ===");
        console.log("No Content:", content);
        console.log("=== No Content Debug End ===");
        multimodalContent.push({
          type: "text",
          text: isImage(fileUrl)
            ? "What is in this image?"
            : "Analyze this file.",
        });
      }
      if (isImage(fileUrl)) {
        multimodalContent.push({ type: "image", image: new URL(fileUrl) });
      } else if (isDocument(fileUrl)) {
        multimodalContent.push({ type: "file", file: new URL(fileUrl) });
      }
      const initialMessages = messages.slice(0, -1);
      // Log the query and data being acted upon
      console.log("=== User Query Debug ===");
      console.log("User Query (text):", content);
      console.log("File URL:", fileUrl);
      console.log("Multimodal Content:", multimodalContent);
      console.log("Initial Messages:", initialMessages);
      // End log
      const result = streamText({
        model: mem0("gpt-4o-mini", { user_id: currentUserId }),
        system: enhancedSystemPrompt,
        messages: [
          ...initialMessages,
          {
            role: "user",
            content: multimodalContent,
          },
        ],
      });
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
        } as any, // Cast to any to satisfy the AI SDK type
      ];
    }

    // Log the query and data for non-multimodal
    if (!fileUrl) {
      const lastUserMsg = messages.filter((m) => m.role === "user").pop();
      console.log("=== User Query Debug ===");
      console.log("User Query (text):", lastUserMsg?.content);
      console.log("All Messages:", messages);
    }

    const result = streamText({
      model: mem0("gpt-4o-mini", { user_id: currentUserId }),
      system: enhancedSystemPrompt,
      messages: aiMessages,
    });

    console.log("StreamText result created successfully");
    console.log("Result type:", typeof result);
    console.log("Result methods:", Object.getOwnPropertyNames(result));

    const response = result.toDataStreamResponse();
    console.log("DataStreamResponse created successfully");
    console.log("Response status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    // Store important information in memory for future reference
    if (latestUserMessage && typeof latestUserMessage.content === "string") {
      try {
        // Add the user message to memory for future context
        await addMemories(
          [
            {
              role: "user",
              content: [{ type: "text", text: latestUserMessage.content }],
            },
          ],
          {
            user_id: currentUserId,
            // org_id: orgId,
          }
        );
        console.log("User message stored in memory");
      } catch (memoryError) {
        console.warn("Failed to store message in memory:", memoryError);
      }
    }

    console.log("=== API Route Debug End ===");
    return response;
  } catch (error) {
    console.error("=== API Route Error ===");
    const errorObj = error as Error;
    console.error("Error type:", errorObj.constructor.name);
    console.error("Error message:", errorObj.message);
    console.error("Error stack:", errorObj.stack);
    console.error("Full error object:", error);

    // Check if it's an API key error
    if (
      errorObj.message?.includes("API key") ||
      errorObj.message?.includes("authentication")
    ) {
      console.error("This appears to be an API key/authentication error");
    }

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
  console.log("=== GET Request Debug ===");
  console.log("OpenAI API Key exists:", !!process.env.OPENAI_API_KEY);
  console.log("Mem0 API Key exists:", !!process.env.MEM0_API_KEY);
  return new Response("Chat API with Mem0 integration is running!");
}
