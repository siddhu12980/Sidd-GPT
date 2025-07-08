import { notFound } from "next/navigation";
import mongoose from "mongoose";
import Session from "@/models/session";
import User from "@/models/users";
import { auth } from "@clerk/nextjs/server";
import ChatClient from "../../../components/ChatClient";

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
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

  // ✅ FIXED: Properly serialize and clean the message data
  const cleanMessages = session.messages.map((m: any) => {
    // Convert mongoose document to plain object
    const messageObj = m.toObject ? m.toObject() : m;

    // Extract attachments data for display arrays
    const attachments = Array.isArray(messageObj.attachments)
      ? messageObj.attachments
      : [];
    const attachmentUrls = attachments.map((att: any) => att.url || "");
    const attachmentTypes = attachments.map((att: any) => att.type || "file");
    const attachmentNames = attachments.map((att: any) => att.fileName || "");

    return {
      _id: messageObj._id?.toString?.() || messageObj._id,
      role: messageObj.role,
      content: messageObj.content,
      createdAt: messageObj.createdAt?.toISOString?.() || messageObj.createdAt,
      // ✅ FIXED: Set type based on attachments count
      type: attachments.length > 1 ? "mixed" : (messageObj.type || "text"),
      fileUrl: messageObj.fileUrl || "",
      fileName: messageObj.fileName || "",
      fileType: messageObj.fileType || "",
      // NEW: Clean attachment data - ensure arrays are properly serialized
      attachments: attachments.map((att: any) => ({
        type: att.type || "file",
        url: att.url || "",
        fileName: att.fileName || "",
        fileType: att.fileType || "",
      })),
      // ✅ FIXED: Populate display arrays from attachments for UI rendering
      attachmentUrls: attachmentUrls,
      attachmentTypes: attachmentTypes,
      attachmentNames: attachmentNames,
      attachmentCount: messageObj.attachmentCount || attachments.length,
      hasMultipleAttachments: Boolean(
        messageObj.hasMultipleAttachments || attachments.length > 1
      ),
    };
  });

  // Pass sessionId, title, and messages to the client component
  return (
    <ChatClient
      sessionId={session._id.toString()}
      sessionTitle={session.title}
      initialMessages={cleanMessages}
    />
  );
}
