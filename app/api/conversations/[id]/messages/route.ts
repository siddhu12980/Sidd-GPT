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
  { params }: { params: { id: string } }
) {
  const { id } = await params;

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

  const { role, content } = await req.json();

  if (!role || !content)
    return NextResponse.json(
      { error: "Missing role or content" },
      { status: 400 }
    );

  const message = await Message.create({ session: session._id, role, content });
  session.messages.push(message._id);
  await session.save();

  return NextResponse.json(message);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;

  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const afterId = searchParams.get("after");

  if (!afterId)
    return NextResponse.json({ error: "Missing after param" }, { status: 400 });

  // Find the message to start truncating after
  const afterMsg = await Message.findById(afterId);

  if (!afterMsg)
    return NextResponse.json({ error: "Message not found" }, { status: 404 });

  // Find all messages in this session after the given message (by createdAt)
  const toDelete = await Message.find({
    session: id,
    createdAt: { $gt: afterMsg.createdAt },
  });
  const toDeleteIds = toDelete.map((m) => m._id);

  // Also delete the afterMsg itself (if you want to include it)
  // toDeleteIds.push(afterMsg._id);

  // Delete from Message collection
  await Message.deleteMany({ _id: { $in: toDeleteIds } });

  // Remove from session.messages array
  await Session.findByIdAndUpdate(id, {
    $pull: { messages: { $in: toDeleteIds } },
  });

  return NextResponse.json({ success: true });
}
