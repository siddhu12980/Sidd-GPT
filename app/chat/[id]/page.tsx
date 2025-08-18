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
  console.log("🔍 Chat page function called!");

  try {
    const { id } = await params;
    console.log("🔍 Chat page - Session ID:", id);

    // Validate the ID format
    if (!id || id.length !== 24) {
      console.log("🔍 Chat page - Invalid ID format:", id);
      return notFound();
    }

    // Ensure mongoose is connected
    console.log(
      "🔍 Chat page - Mongoose connection state:",
      mongoose.connection.readyState
    );
    if (!mongoose.connection.readyState) {
      console.log("🔍 Chat page - Connecting to MongoDB...");
      await mongoose.connect(process.env.MONGODB_URI!, {
        dbName: process.env.MONGODB_DB,
      });
      console.log("🔍 Chat page - MongoDB connected successfully");
    }

    // Force model registration
    if (!mongoose.models.Message) {
      require("@/models/message");
    }

    // Get the current user
    console.log("🔍 Chat page - Getting auth...");
    const { userId } = await auth();
    console.log("🔍 Chat page - User ID:", userId);
    if (!userId) {
      console.log("🔍 Chat page - No user ID, calling notFound()");
      return notFound();
    }

    console.log("🔍 Chat page - Looking up user in database...");
    const user = await User.findOne({ clerkId: userId });
    console.log("🔍 Chat page - User found:", !!user, user?._id);

    if (!user) {
      console.log("🔍 Chat page - No user found in DB, calling notFound()");
      return notFound();
    }

    // Find the session and populate messages
    console.log(
      "🔍 Chat page - Looking for session:",
      id,
      "for user:",
      user._id
    );
    console.log("🔍 Chat page - About to query Session.findOne...");

    const session = await Session.findOne({
      _id: id,
      user: user._id,
    }).populate({
      path: "messages",
      select:
        "role content createdAt type fileUrl fileName fileType attachments attachmentUrls attachmentTypes attachmentNames attachmentCount hasMultipleAttachments",
      options: { sort: { createdAt: 1 } },
    });

    console.log("🔍 Chat page - Session query completed. Found:", !!session);
    if (session) {
      console.log("🔍 Chat page - Session details:", {
        id: session._id,
        title: session.title,
        messageCount: session.messages?.length || 0,
      });
    }

    if (!session) {
      console.log("🔍 Chat page - No session found, calling notFound()");
      return notFound();
    }

    console.log("🔍 Chat page - Raw messages from db:", session.messages?.length || 0, "messages");

    // ✅ NEW: Use MessageUtils to convert to AI SDK v5 format
    console.log("🔍 Chat page - Converting messages to UI format...");
    let uiMessages;
    try {
      uiMessages = MessageUtils.toUIMessages(session.messages);
      console.log("🔍 Chat page - UI messages converted successfully:", uiMessages?.length || 0, "messages");
    } catch (conversionError) {
      console.error("🔍 Chat page - Error converting messages:", conversionError);
      throw conversionError;
    }

    console.log("🔍 Chat page - About to render ChatClient...");
    console.log("🔍 Chat page - Session ID for client:", session._id.toString());
    console.log("🔍 Chat page - Session title:", session.title);
    
    // Pass sessionId, title, and messages to the client component
    const result = (
      <ChatClient
        sessionId={session._id.toString()}
        sessionTitle={session.title}
        initialMessages={uiMessages}
      />
    );
    
    console.log("🔍 Chat page - ChatClient component created, returning...");
    return result;
    
  } catch (error) {
    console.error("🔍 Chat page - ERROR OCCURRED:", error);
    console.error("🔍 Chat page - Error stack:", error instanceof Error ? error.stack : 'No stack');
    console.error("🔍 Chat page - Error name:", error instanceof Error ? error.name : typeof error);
    console.error("🔍 Chat page - Error message:", error instanceof Error ? error.message : String(error));
    
    // Instead of notFound(), let's render an error message to see what's happening
    return (
      <div className="flex h-screen bg-[#212121] text-white items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-500">Chat Page Error</h1>
          <p className="text-gray-400 mb-2">An error occurred while loading the chat:</p>
          <p className="text-red-400 font-mono text-sm">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    );
  }
}
