// @ts-nocheck
import { NextResponse } from 'next/server';
import { prisma } from "../../../../lib/prisma";

// GET all messages for a chat
export async function GET(request: Request, { params }: { params: { chatId: string } }) {
  const { chatId } = params;

  try {
    const messages = await prisma.message.findMany({
      where: { chatId },
      include: {
        sender: {
          select: { id: true, name: true }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error(`Error fetching messages for chat ${chatId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST a new message to a chat
export async function POST(request: Request, { params }: { params: { chatId: string } }) {
  const { chatId } = params;
  const { content, senderId } = await request.json();

  if (!content || !senderId) {
    return NextResponse.json({ error: 'Content and senderId are required' }, { status: 400 });
  }

  try {
    const newMessage = await prisma.message.create({
      data: {
        chatId,
        senderId,
        content,
      },
      include: {
        sender: {
            select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error) {
    console.error(`Error sending message to chat ${chatId}:`, error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
} 