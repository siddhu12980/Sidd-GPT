import { notFound } from "next/navigation";
import mongoose from "mongoose";
import Session from "@/models/session";
import User from "@/models/users";
import { auth } from "@clerk/nextjs/server";
import ChatClient from "../../../components/ChatClient";
import { MessageUtils } from "@/models/message";

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;

    // Validate the ID format
    if (!id || id.length !== 24) {
      return notFound();
    }

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

    const user = await User.findOne({ clerkId: userId });
    if (!user) return notFound();

    // Find the session and populate messages
    const session = await Session.findOne({
      _id: id,
      user: user._id,
    }).populate({
      path: "messages",
      select:
        "role content createdAt type fileUrl fileName fileType attachments attachmentUrls attachmentTypes attachmentNames attachmentCount hasMultipleAttachments",
      options: { sort: { createdAt: 1 } },
    });

    if (!session) return notFound();

    // ✅ NEW: Use MessageUtils to convert to AI SDK v5 format
    const uiMessages = MessageUtils.toUIMessages(session.messages);

    // Pass sessionId, title, and messages to the client component
    return (
      <ChatClient
        sessionId={session._id.toString()}
        sessionTitle={session.title}
        initialMessages={uiMessages}
      />
    );
  } catch (error) {
    console.error("Chat page error:", error);
    return notFound();
  }
}
