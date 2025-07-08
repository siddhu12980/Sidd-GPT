import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

/**
 * Test API Route: experimental_attachments
 *
 * This tests the new experimental_attachments approach for multiple files
 * without modifying existing chat API.
 */

export async function POST(req: Request) {
  try {
    console.log("🧪 Testing experimental_attachments API route...");

    const body = await req.json();
    const { messages, experimental_attachments } = body;

    console.log("📥 Received request:");
    console.log("  - Messages:", messages?.length || 0);
    console.log(
      "  - Experimental attachments:",
      experimental_attachments?.length || 0
    );

    if (experimental_attachments && experimental_attachments.length > 0) {
      console.log("📎 Attachments details:");
      experimental_attachments.forEach((attachment: any, index: number) => {
        console.log(
          `   ${index + 1}. ${attachment.name} (${attachment.contentType})`
        );
        console.log(`      URL: ${attachment.url.substring(0, 50)}...`);
      });
    }

    // Test Method 1: Pass experimental_attachments directly to AI SDK
    try {
      console.log("\n🔬 Method 1: Testing direct experimental_attachments...");

      const result = await streamText({
        model: openai("gpt-4o"),
        messages: messages,
        // @ts-ignore - experimental_attachments is not in types yet
        experimental_attachments: experimental_attachments,
        temperature: 0.1,
      });

      console.log("✅ Method 1: Direct experimental_attachments - SUCCESS!");
      return result.toDataStreamResponse();
    } catch (method1Error: any) {
      console.log("❌ Method 1 failed:", method1Error.message);

      // Fallback to Method 2: Convert to multimodal content
      return await testMethod2Fallback(messages, experimental_attachments);
    }
  } catch (error: any) {
    console.error("💥 Test API error:", error);
    return new Response(
      JSON.stringify({
        error: "Test API error",
        details: error.message,
        type: error.constructor.name,
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

async function testMethod2Fallback(
  messages: any[],
  experimental_attachments: any[]
) {
  console.log("\n🔬 Method 2: Converting to multimodal content...");

  try {
    // Get the user message content
    const userMessage = messages[messages.length - 1];
    const baseContent =
      userMessage.content || "Please analyze these attached files.";

    // Build multimodal content array with proper typing
    const multimodalContent: any[] = [{ type: "text", text: baseContent }];

    // Process each attachment
    for (const attachment of experimental_attachments) {
      console.log(`🔄 Processing ${attachment.name}...`);

      if (attachment.contentType.startsWith("image/")) {
        multimodalContent.push({
          type: "image",
          image: attachment.url,
        });
        console.log(`   ✅ Added image: ${attachment.name}`);
      } else if (attachment.contentType === "application/pdf") {
        // Fetch and process PDF
        const response = await fetch(attachment.url);
        const pdfBuffer = await response.arrayBuffer();

        multimodalContent.push({
          type: "file",
          data: new Uint8Array(pdfBuffer),
          mimeType: "application/pdf",
          filename: attachment.name,
        });
        console.log(
          `   ✅ Added PDF: ${attachment.name} (${pdfBuffer.byteLength} bytes)`
        );
      } else {
        console.log(`   ⚠️ Unsupported type: ${attachment.contentType}`);
      }
    }

    console.log(
      `📤 Sending multimodal content with ${multimodalContent.length} items...`
    );

    // Update the last message with multimodal content
    const updatedMessages = [...messages];
    updatedMessages[updatedMessages.length - 1] = {
      ...userMessage,
      content: multimodalContent,
    };

    const result = await streamText({
      model: openai("gpt-4o"),
      messages: updatedMessages,
      temperature: 0.1,
    });

    console.log("✅ Method 2: Multimodal conversion - SUCCESS!");
    return result.toDataStreamResponse();
  } catch (method2Error: any) {
    console.error("❌ Method 2 also failed:", method2Error.message);
    throw method2Error;
  }
}

export async function GET(req: Request) {
  return new Response("Experimental attachments test API is running!");
}
