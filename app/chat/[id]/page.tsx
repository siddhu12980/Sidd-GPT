import { notFound } from "next/navigation";
import mongoose from "mongoose";
import Session from "@/models/session";
import User from "@/models/users";
import { auth } from "@clerk/nextjs/server";
import ChatClient from "../../../components/ChatClient";

export default async function ChatSessionPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  // Ensure mongoose is connected
  if (!mongoose.connection.readyState) {
    await mongoose.connect(process.env.MONGODB_URI!, {
      dbName: process.env.MONGODB_DB,
    });
  }

  // Force model registration
  if (!mongoose.models.Message) {
    require("@/models/message");
  }

  // Get the current user
  const { userId } = await auth();
  if (!userId) return notFound();

  // Find the user in  DB
  const user = await User.findOne({ clerkId: userId });
  
  if (!user) return notFound();

  // Find the session and populate messages
  const session = await Session.findOne({
    _id: id,
    user: user._id,
  }).populate({
    path: "messages",
    select: "role content createdAt type fileUrl fileName fileType",
    options: { sort: { createdAt: 1 } },
  });

  if (!session) return notFound();

  console.log("session", session);

  console.log("session.messages", session.messages);

  // Pass sessionId, title, and messages to the client component
  return (
    <ChatClient
      sessionId={session._id.toString()}
      sessionTitle={session.title}
      initialMessages={session.messages.map((m: any) => ({
        _id: m._id?.toString?.(),
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
        type: m.type,
        fileUrl: m.fileUrl,
        fileName: m.fileName,
        fileType: m.fileType,
      }))}
    />
  );
}
