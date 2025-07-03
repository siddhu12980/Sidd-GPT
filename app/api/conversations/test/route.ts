import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET() {
  try {
    // Ensure mongoose is connected
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!, {
        dbName: process.env.MONGODB_DB,
      });
    }

    if (!mongoose.connection.db) {
      throw new Error("Database connection is not established.");
    }
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();

    const collectionNames = collections.map((col) => col.name);

    return NextResponse.json({
      status: "success",
      db: process.env.MONGODB_DB,
      collections: collectionNames,
      message: "MongoDB connection and models are working!",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : error,
      },
      { status: 500 }
    );
  }
}
