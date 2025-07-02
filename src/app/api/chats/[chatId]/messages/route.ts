// @ts-nocheck
import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

// GET all messages for a chat
export async function GET(request: Request) {
  const url = new URL(request.url);
  const chatId = url.pathname.split('/').slice(-3, -2)[0];

  if (!chatId || chatId === 'chats') {
    return NextResponse.json({ error: 'Invalid chatId' }, { status: 400 });
  }

  try {
    const messages = await prisma.message.findMany({
      where: { chatId },
      include: {
        sender: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ messages });
  } catch (error) {
    console.error(`Error fetching messages for chat ${chatId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST a new message to a chat
export async function POST(request: Request) {
  const url = new URL(request.url);
  const chatId = url.pathname.split('/').slice(-3, -2)[0];
  const body = await request.json();
  const { content, senderId, matchId } = body;

  if (!content || !senderId) {
    return NextResponse.json({ error: 'Content and senderId are required' }, { status: 400 });
  }
  if (!chatId || chatId === 'chats') {
    return NextResponse.json({ error: 'Invalid chatId' }, { status: 400 });
  }

  try {
    // Check if chat exists
    let chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) {
      if (matchId) {
        chat = await prisma.chat.create({ data: { id: chatId, matchId } });
      } else {
        return NextResponse.json({ error: 'Chat does not exist and matchId not provided' }, { status: 400 });
      }
    }
    const newMessage = await prisma.message.create({
      data: {
        chatId: chat.id,
        senderId,
        content,
      },
      include: {
        sender: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error) {
    console.error(`Error sending message to chat ${chatId}:`, error, body);
    return NextResponse.json({ error: 'Failed to send message', details: error instanceof Error ? error.message : error }, { status: 500 });
  }
} 