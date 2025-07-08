import { NextRequest, NextResponse } from "next/server";
import { mem0Service } from "@/lib/mem0Service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const memories = await mem0Service.getAllUserMemories(userId);

    return NextResponse.json({
      success: true,
      memories: memories,
    });
  } catch (error) {
    console.error("Error fetching memories:", error);
    return NextResponse.json(
      { error: "Failed to fetch memories" },
      { status: 500 }
    );
  }
} 