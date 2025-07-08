import { NextRequest, NextResponse } from "next/server";
import { mem0Service } from "@/lib/mem0Service";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "Memory ID is required" },
        { status: 400 }
      );
    }

    await mem0Service.deleteMemory(id);

    return NextResponse.json({
      success: true,
      message: "Memory deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting memory:", error);
    return NextResponse.json(
      { error: "Failed to delete memory" },
      { status: 500 }
    );
  }
} 