import { streamText, UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";

import { createMem0 } from "@mem0/vercel-ai-provider";

const mem0 = createMem0({
  provider: "openai",
  mem0ApiKey: process.env.MEM0_API_KEY,
  apiKey: process.env.OPENAI_API_KEY,
  config: {
    compatibility: "strict",
  },
});


export async function POST(req: Request) {
  try {

    

    console.log("=== API Route Debug Start ===");

    // Check if OpenAI API key is set
    const apiKey = process.env.OPENAI_API_KEY;
    console.log("OpenAI API Key exists:", !!apiKey);
    console.log("API Key length:", apiKey ? apiKey.length : 0);

    const { messages }: { messages: UIMessage[] } = await req.json();
    console.log("Received messages:", messages);
    console.log("Messages count:", messages.length);

    // Validate messages
    if (!messages || !Array.isArray(messages)) {
      console.log("Invalid messages format");
      return new Response("Invalid messages format", { status: 400 });
    }

    console.log("Creating streamText with model: gpt-4o-mini");

    const result = streamText({
      model: mem0("gpt-4o-mini", { user_id: "borat" }),
      system: "You are a helpful assistant.",
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
  return new Response("Chat API is running!");
}
