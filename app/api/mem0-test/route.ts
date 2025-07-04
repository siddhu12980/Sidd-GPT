import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createMem0, retrieveMemories, addMemories } from "@mem0/vercel-ai-provider";

// Initialize Mem0
const mem0 = createMem0({
  provider: "openai",
  mem0ApiKey: process.env.MEM0_API_KEY,
  apiKey: process.env.OPENAI_API_KEY,
  config: {
    compatibility: "strict",
  },
});

export async function GET() {
  try {
    const testUserId = "test-user-123";
    
    // Test 1: Basic text generation with memory
    console.log("Testing basic Mem0 text generation...");
    const { text } = await generateText({
      model: mem0("gpt-4o-mini", { user_id: testUserId }),
      prompt: "Hello! This is a test message.",
    });

    // Test 2: Add some memories
    console.log("Testing memory addition...");
    await addMemories(
      [{ role: "user", content: [{ type: "text", text: "I love red cars and prefer electric vehicles." }] }],
      { user_id: testUserId, mem0ApiKey: process.env.MEM0_API_KEY }
    );

    // Test 3: Retrieve memories
    console.log("Testing memory retrieval...");
    const memories = await retrieveMemories(
      "What kind of car should I buy?",
      { user_id: testUserId, mem0ApiKey: process.env.MEM0_API_KEY }
    );

    // Test 4: Test contextual response using memory
    console.log("Testing contextual response with memory...");
    const { text: contextualResponse } = await generateText({
      model: mem0("gpt-4o-mini", { user_id: testUserId }),
      prompt: "What kind of car should I buy?",
    });

    console.log("Contextual response:", contextualResponse);

    // Check if the response mentions red cars or electric vehicles
    const mentionsRedCar = contextualResponse.toLowerCase().includes('red') || 
                          contextualResponse.toLowerCase().includes('electric') ||
                          contextualResponse.toLowerCase().includes('ev');

    return NextResponse.json({
      status: "success",
      message: "Mem0 integration is working!",
      testResults: {
        basicGeneration: text,
        memoriesRetrieved: memories ? "Yes" : "No",
        memoryContent: memories ? memories.substring(0, 100) + "..." : "None",
        contextualResponse: contextualResponse,
        usesMemory: mentionsRedCar ? "Yes - Mentions red/electric cars" : "No - Generic response",
        memoryWorking: mentionsRedCar ? "✅ SUCCESS" : "❌ FAILED"
      },
      config: {
        mem0ApiKeyExists: !!process.env.MEM0_API_KEY,
        openaiApiKeyExists: !!process.env.OPENAI_API_KEY,
      }
    });
  } catch (error) {
    console.error("Mem0 test error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        config: {
          mem0ApiKeyExists: !!process.env.MEM0_API_KEY,
          openaiApiKeyExists: !!process.env.OPENAI_API_KEY,
        }
      },
      { status: 500 }
    );
  }
} 