import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Session from "@/models/session";
import User from "@/models/users";
import { auth } from "@clerk/nextjs/server";

// Ensure mongoose is connected
if (!mongoose.connection.readyState) {
  mongoose.connect(process.env.MONGODB_URI!, {
    dbName: process.env.MONGODB_DB,
  });
}

export async function GET(req: NextRequest) {
  console.log("🔍 GET /api/conversations - Request received");
  const { userId } = await auth();
  console.log("🔑 Clerk userId:", userId);

  if (!userId) {
    console.log("❌ No userId - returning 401");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find the user
    console.log("👤 Looking for user with clerkId:", userId);
    let user = await User.findOne({ clerkId: userId });
    console.log(
      "👤 Found user:",
      user ? { _id: user._id, clerkId: user.clerkId } : null
    );

    // Auto-create user if they don't exist (like in POST endpoint)
    if (!user) {
      console.log("👤 User not found, creating new user...");
      user = await User.create({ clerkId: userId });
      console.log("👤 Created new user:", { _id: user._id, clerkId: user.clerkId });
    }

    // Get all sessions for this user
    console.log("💬 Looking for sessions for user._id:", user._id);
    const sessions = await Session.find({ user: user._id }).select(
      "title createdAt updatedAt"
    );
    console.log("💬 Found sessions:", sessions.length);
    console.log("💬 Sessions data:", sessions);

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("💥 Error in GET /api/conversations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title } = await req.json();

  // Find or create the user
  let user = await User.findOne({ clerkId: userId });
  if (!user) {
    user = await User.create({ clerkId: userId });
  }

  // Create new session
  const session = await Session.create({ user: user._id, title });

  console.log("session", session);

  return NextResponse.json(session);
}
