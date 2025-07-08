import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Session from "@/models/session";
import User from "@/models/users";
import Message from "@/models/message";
import { auth } from "@clerk/nextjs/server";
// ...

if (!mongoose.connection.readyState) {
  mongoose.connect(process.env.MONGODB_URI!, {
    dbName: process.env.MONGODB_DB,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  const parmID = (await params).id;

  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await User.findOne({ clerkId: userId });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const session = await Session.findOne({ _id: parmID, user: user._id });
  if (!session)
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );

  const { role, content, type, fileUrl, fileName, fileType, attachments } =
    await req.json();

  console.log("=== Message Creation Debug ===");
  console.log("role", role);
  console.log("content", content);
  console.log("type", type);
  console.log("attachments", attachments);
  console.log("Full request body:", { role, content, type, attachments });

  if (!role || !content)
    return NextResponse.json(
      { error: "Missing role or content" },
      { status: 400 }
    );

  // Ensure type is explicitly set
  const messageType = type || "text";
  const messageData = {
    session: session._id,
    role,
    content,
    type: messageType,
    fileUrl: fileUrl,
    fileName: fileName,
    fileType: fileType,
    // NEW: Include attachments array for multiple files
    ...(attachments && attachments.length > 0 && { attachments }),
  };
  console.log("Message data to save:", messageData);

  const message = await Message.create(messageData);
  console.log("Saved message:", message);

  // Explicitly select all fields including type to ensure it's returned
  const savedMessage = await Message.findById(message._id);
  console.log("Retrieved saved message:", savedMessage);

  session.messages.push(message._id);
  await session.save();

  return NextResponse.json(savedMessage);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const afterId = searchParams.get("after");
  const includeTarget = searchParams.get("includeTarget") === "true";

  if (!afterId)
    return NextResponse.json({ error: "Missing after param" }, { status: 400 });

  console.log("=== DELETE Debug ===");
  console.log("Session ID:", id);
  console.log("After ID:", afterId);
  console.log("Include Target:", includeTarget);

  // Find the session with populated messages
  const session = await Session.findById(id).populate("messages");
  console.log("Session found:", session);

  if (!session)
    return NextResponse.json({ error: "Session not found" }, { status: 404 });

  // Find the index of the target message
  const messageIndex = session.messages.findIndex(
    (msg: any) => msg._id.toString() === afterId
  );
  console.log("Message index:", messageIndex);

  if (messageIndex === -1)
    return NextResponse.json(
      { error: "Message not found in session" },
      { status: 404 }
    );

  // Determine starting index based on operation type
  const startIndex = includeTarget ? messageIndex : messageIndex + 1;
  console.log("Start index for deletion:", startIndex);

  // Get messages to delete
  const messagesToDelete = session.messages.slice(startIndex);

  console.log("Messages to delete:", messagesToDelete);
  console.log("Number of messages to delete:", messagesToDelete.length);

  const toDeleteIds = messagesToDelete.map((msg: any) => msg._id);
  console.log("Message IDs to delete:", toDeleteIds);

  if (toDeleteIds.length > 0) {
    // Delete from Message collection
    const deleteResult = await Message.deleteMany({
      _id: { $in: toDeleteIds },
    });

    console.log("Delete result:", deleteResult);

    // Remove from session.messages array
    const updateResult = await Session.findByIdAndUpdate(id, {
      $pull: { messages: { $in: toDeleteIds } },
    });
    console.log("Session update result:", updateResult);
  }

  return NextResponse.json({
    success: true,
    deletedCount: toDeleteIds.length,
    operation: includeTarget ? "delete" : "edit",
  });
}
