import { streamText, UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { createMem0, retrieveMemories, addMemories } from "@mem0/vercel-ai-provider";

// Initialize Mem0 with proper configuration
const mem0 = createMem0({
  provider: "openai",
  mem0ApiKey: process.env.MEM0_API_KEY,
  apiKey: process.env.OPENAI_API_KEY,
  config: {
    compatibility: "strict",
  },
  // Optional global config
  mem0Config: {
    // You can set default values here
  },
});

export async function POST(req: Request) {
  try {
    console.log("=== API Route Debug Start ===");

    // Check if required API keys are set
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const mem0ApiKey = process.env.MEM0_API_KEY;
    
    console.log("OpenAI API Key exists:", !!openaiApiKey);
    console.log("Mem0 API Key exists:", !!mem0ApiKey);
    
    if (!openaiApiKey) {
      throw new Error("OpenAI API key is not configured");
    }
    
    if (!mem0ApiKey) {
      throw new Error("Mem0 API key is not configured");
    }

    const { messages, userId }: { messages: UIMessage[]; userId?: string } = await req.json();
    console.log("Received messages:", messages);
    console.log("Messages count:", messages.length);
    console.log("User ID:", userId);

    // Validate messages
    if (!messages || !Array.isArray(messages)) {
      console.log("Invalid messages format");
      return new Response("Invalid messages format", { status: 400 });
    }

    // Use provided userId or fallback to a default
    const currentUserId = userId || "default-user";
    
    // Get the latest user message for memory retrieval
    const latestUserMessage = messages
      .filter(msg => msg.role === "user")
      .pop();
    
    let enhancedSystemPrompt = "You are a helpful assistant.";
    
    // Retrieve relevant memories if we have a user message
    if (latestUserMessage && typeof latestUserMessage.content === "string") {
      try {
        console.log("Retrieving memories for user:", currentUserId);
        const memories = await retrieveMemories(latestUserMessage.content, { 
          user_id: currentUserId,
          mem0ApiKey: process.env.MEM0_API_KEY 
        });
        
        if (memories) {
          enhancedSystemPrompt = `${memories}\n\nYou are a helpful assistant.`;
          console.log("Memories retrieved and added to system prompt");
        }
      } catch (memoryError) {
        console.warn("Failed to retrieve memories:", memoryError);
        // Continue without memories if retrieval fails
      }
    }

    console.log("Creating streamText with model: gpt-4o-mini");
    console.log("Enhanced system prompt:", enhancedSystemPrompt);

    const result = streamText({
      model: mem0("gpt-4o-mini", { user_id: currentUserId }),
      system: enhancedSystemPrompt,
      messages,
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
          [{ 
            role: "user", 
            content: [{ type: "text", text: latestUserMessage.content }] 
          }],
          { 
            user_id: currentUserId, 
            mem0ApiKey: process.env.MEM0_API_KEY 
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
