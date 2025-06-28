import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const matchId = req.nextUrl.pathname.split("/").pop();
    if (!matchId) {
      return NextResponse.json({ error: 'No matchId provided' }, { status: 400 });
    }
    const chat = await prisma.chat.findUnique({
      where: { matchId },
      include: { messages: true }
    });

    if (!chat) {
      return NextResponse.json({ messages: [] });
    }

    return NextResponse.json({ messages: chat.messages });
  } catch (error) {
    console.error('Chat fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const matchId = req.nextUrl.pathname.split("/").pop();
    if (!matchId) {
      return NextResponse.json({ error: 'No matchId provided' }, { status: 400 });
    }
    const { message, userId } = await req.json(); // userId should be provided by the client or session

    let chat = await prisma.chat.findUnique({
      where: { matchId },
      include: { messages: true }
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          matchId,
        },
        include: { messages: true }
      });
    }

    const newMessage = await prisma.message.create({
      data: {
        chatId: chat.id,
        senderId: userId,
        content: message,
      }
    });

    return NextResponse.json({ message: newMessage });
  } catch (error) {
    console.error('Chat send error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
} 