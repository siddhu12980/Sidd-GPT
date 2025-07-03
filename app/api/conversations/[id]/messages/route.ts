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
