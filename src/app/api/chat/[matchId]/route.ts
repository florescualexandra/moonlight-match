import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const matchId = req.nextUrl.pathname.split("/").pop();
    if (!matchId) {
      return NextResponse.json({ error: 'No matchId provided' }, { status: 400 });
    }
    const chat = await prisma.chat.findFirst({
      where: {
        OR: [
          { user1Id: parseInt(matchId) },
          { user2Id: parseInt(matchId) }
        ]
      }
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
    const { message } = await req.json();
    const userId = 1; // TODO: Get from session

    let chat = await prisma.chat.findFirst({
      where: {
        OR: [
          { user1Id: parseInt(matchId) },
          { user2Id: parseInt(matchId) }
        ]
      }
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          user1Id: userId,
          user2Id: parseInt(matchId),
          messages: []
        }
      });
    }

    const newMessage = {
      from: userId,
      text: message,
      timestamp: new Date()
    };

    const updatedMessages = [...(chat.messages as any[]), newMessage];

    await prisma.chat.update({
      where: { id: chat.id },
      data: { messages: updatedMessages }
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