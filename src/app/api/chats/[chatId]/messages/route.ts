import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

// Helper: get userId from session or query (for demo, use query param)
function getUserId(req: NextRequest): string | null {
  const url = new URL(req.url);
  return url.searchParams.get('userId');
}

export async function GET(req: NextRequest, { params }: { params: { chatId: string } }) {
  const userId = getUserId(req);
  const { chatId } = params;
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }
  try {
    // Check if user is a participant in the chat
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { match: true },
    });
    if (!chat || (chat.match.userId !== userId && chat.match.matchedUserId !== userId)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, name: true, image: true } } },
    });
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { chatId: string } }) {
  const userId = getUserId(req);
  const { chatId } = params;
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }
  try {
    const { content } = await req.json();
    if (!content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }
    // Check if user is a participant in the chat
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { match: true },
    });
    if (!chat || (chat.match.userId !== userId && chat.match.matchedUserId !== userId)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: userId,
        content,
      },
      include: { sender: { select: { id: true, name: true, image: true } } },
    });
    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
} 