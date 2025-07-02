// @ts-nocheck
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET all chats for a user
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    // Find all chats where the user is part of the match
    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          { match: { userId } },
          { match: { matchedUserId: userId } },
        ],
      },
      include: {
        match: {
          include: {
            user: { select: { id: true, name: true, image: true } },
            matchedUser: { select: { id: true, name: true, image: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Transform for frontend
    const chatItems = chats.map(chat => {
      let otherUser = chat.match.userId === userId ? chat.match.matchedUser : chat.match.user;
      return {
        chatId: chat.id,
        otherUserName: otherUser?.name || 'Anonymous',
        otherUserImage: otherUser?.image || null,
        lastMessage: chat.messages[0]?.content || '',
        lastMessageTimestamp: chat.messages[0]?.createdAt || chat.updatedAt,
        matchId: chat.matchId,
      };
    });
    return NextResponse.json({ chats: chatItems });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}

// POST to create a new chat for a match
export async function POST(request: Request) {
  try {
    const { matchId } = await request.json();
    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
    }
    // Check if chat exists
    let chat = await prisma.chat.findUnique({ where: { matchId } });
    if (!chat) {
      // Create chat for this match
      chat = await prisma.chat.create({ data: { matchId } });
    }
    return NextResponse.json({ chat }, { status: 201 });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
} 