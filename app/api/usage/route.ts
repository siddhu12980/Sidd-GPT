import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";

if (!mongoose.connection.readyState) {
  mongoose.connect(process.env.MONGODB_URI!, {
    dbName: process.env.MONGODB_DB,
  });
}

const usageSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  date: { type: String, required: true },
  tokensUsed: { type: Number, default: 0 },
  requestsMade: { type: Number, default: 0 },
  modelUsed: { type: String, required: true },
  cost: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

usageSchema.index({ userId: 1, date: 1 });

const Usage = mongoose.models.Usage || mongoose.model('Usage', usageSchema);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tokensUsed, modelUsed, cost = 0 } = await req.json();
  const date = new Date().toISOString().split('T')[0];

  try {
    const existingUsage = await Usage.findOne({ userId, date, modelUsed });
    
    if (existingUsage) {
      existingUsage.tokensUsed += tokensUsed;
      existingUsage.requestsMade += 1;
      existingUsage.cost += cost;
      await existingUsage.save();
    } else {
      await Usage.create({
        userId,
        date,
        tokensUsed,
        requestsMade: 1,
        modelUsed,
        cost
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Usage tracking error:", error);
    return NextResponse.json({ error: "Failed to track usage" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "day";
  const model = searchParams.get("model");

  try {
    const date = new Date();
    let startDate: string;

    if (period === "day") {
      startDate = date.toISOString().split('T')[0];
    } else if (period === "week") {
      date.setDate(date.getDate() - 7);
      startDate = date.toISOString().split('T')[0];
    } else if (period === "month") {
      date.setMonth(date.getMonth() - 1);
      startDate = date.toISOString().split('T')[0];
    } else {
      startDate = "1970-01-01";
    }

    const query: any = { userId, date: { $gte: startDate } };
    if (model) query.modelUsed = model;

    const usage = await Usage.find(query).sort({ date: -1 });

    const totalTokens = usage.reduce((sum, u) => sum + u.tokensUsed, 0);
    const totalRequests = usage.reduce((sum, u) => sum + u.requestsMade, 0);
    const totalCost = usage.reduce((sum, u) => sum + u.cost, 0);

    return NextResponse.json({
      usage,
      summary: {
        totalTokens,
        totalRequests,
        totalCost,
        period
      }
    });
  } catch (error) {
    console.error("Usage retrieval error:", error);
    return NextResponse.json({ error: "Failed to retrieve usage" }, { status: 500 });
  }
} 