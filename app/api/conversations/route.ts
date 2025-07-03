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
  console.log("req", req);
  const { userId } = await auth();
  console.log("userId", userId);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find the user
  const user = await User.findOne({ clerkId: userId });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Get all sessions for this user
  const sessions = await Session.find({ user: user._id }).select(
    "title createdAt updatedAt"
  );
  return NextResponse.json(sessions);
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
