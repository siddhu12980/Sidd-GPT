import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Session from "@/models/session";
import User from "@/models/users";
import Message from "@/models/message";
import { auth } from "@clerk/nextjs/server";

if (!mongoose.connection.readyState) {
  mongoose.connect(process.env.MONGODB_URI!, {
    dbName: process.env.MONGODB_DB,
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await User.findOne({ clerkId: userId });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const session = await Session.findOne({
    _id: id,
    user: user._id,
  }).populate({
    path: "messages",
    select: "role content createdAt type fileName fileType fileUrl",
    options: { sort: { createdAt: 1 } },
  });
  if (!session)
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );

  console.log("=== Conversation Loading Debug ===");
  console.log("Session messages count:", session.messages.length);
  console.log("First message:", session.messages[0]);
  console.log("All messages:", session.messages);

  return NextResponse.json(session);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await User.findOne({ clerkId: userId });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const session = await Session.findOneAndDelete({
    _id: id,
    user: user._id,
  });
  if (!session)
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );

  // Optionally delete all messages in this session
  await Message.deleteMany({ session: session._id });

  return NextResponse.json({ success: true });
}

export async function PATCH(
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

  const { title } = await req.json();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const session = await Session.findOneAndUpdate(
    { _id: parmID, user: user._id },
    { title },
    { new: true }
  );

  if (!session)
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );

  return NextResponse.json(session);
}
