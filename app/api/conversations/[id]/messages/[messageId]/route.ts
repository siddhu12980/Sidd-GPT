import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Message from "@/models/message";
import { auth } from "@clerk/nextjs/server";

if (!mongoose.connection.readyState) {
  mongoose.connect(process.env.MONGODB_URI!, {
    dbName: process.env.MONGODB_DB,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const { id, messageId } = await params;

  if (!mongoose.connection.readyState) {
    mongoose.connect(process.env.MONGODB_URI!, {
      dbName: process.env.MONGODB_DB,
    });
  }

  console.log("=== PATCH Debug ===");
  console.log("Session ID:", id);
  console.log("Message ID:", messageId);

  const { userId } = await auth();
  console.log("User ID:", userId);

  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();
  console.log("New content:", content);

  if (!content)
    return NextResponse.json({ error: "Missing content" }, { status: 400 });

  // Find the message first to verify it exists
  const existingMessage = await Message.findById(messageId);
  console.log("Existing message:", existingMessage);

  if (!existingMessage)
    return NextResponse.json({ error: "Message not found" }, { status: 404 });

  const message = await Message.findOneAndUpdate(
    { _id: messageId },
    { content },
    { new: true }
  );

  console.log("Updated message:", message);

  if (!message)
    return NextResponse.json({ error: "Message not found" }, { status: 404 });

  return NextResponse.json(message);
}
