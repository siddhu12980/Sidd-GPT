import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Message from '@/models/message';
import { auth } from '@clerk/nextjs/server';

if (!mongoose.connection.readyState) {
  mongoose.connect(process.env.MONGODB_URI!, { dbName: process.env.MONGODB_DB });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string, messageId: string } }) {
  
  const { id, messageId } = await params;

  if (!mongoose.connection.readyState) {
    mongoose.connect(process.env.MONGODB_URI!, { dbName: process.env.MONGODB_DB });
  }
  
  console.log("req", id, messageId);
  
  const { userId } = await auth();

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { content } = await req.json();
  if (!content) return NextResponse.json({ error: 'Missing content' }, { status: 400 });

  const message = await Message.findOneAndUpdate(
    { _id: messageId },
    { content },
    { new: true }
  );
  if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

  return NextResponse.json(message);
} 