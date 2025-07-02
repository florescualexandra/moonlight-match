// @ts-nocheck
import { NextResponse } from 'next/server';
import { prisma } from "../../../lib/prisma";

// GET all chats for a user
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get('email');

  if (!userEmail) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          { match: { userId: user.id } },
          { match: { matchedUserId: user.id } },
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
          include: {
            sender: {
              select: { name: true }
            }
          }
        },
      },
      orderBy: {
        updatedAt: 'desc',
      }
    });

    // Transform chats to the structure expected by the frontend
    const chatItems = chats
      .filter(chat => chat.match) // Only include chats with a valid match
      .map(chat => {
        // Determine the other user
        let otherUser = null;
        if (chat.match.user.id === user.id) {
          otherUser = chat.match.matchedUser;
        } else {
          otherUser = chat.match.user;
        }
        return {
          chatId: chat.id,
          otherUserName: otherUser?.name || 'Anonymous',
          otherUserImage: otherUser?.image || null,
          lastMessage: chat.messages[0]?.content || '',
          lastMessageTimestamp: chat.messages[0]?.createdAt || chat.updatedAt,
        };
      });

    return NextResponse.json({ chats: chatItems });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}

// POST to create a new chat
export async function POST(request: Request) {
    try {
        const { matchId } = await request.json();

        if (!matchId) {
            return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
        }
        
        // Check if a chat for this match already exists
        const existingChat = await prisma.chat.findUnique({
            where: { matchId },
        });

        if (existingChat) {
            return NextResponse.json({ chat: existingChat });
        }
        
        // Verify the match exists before creating a chat for it
        const match = await prisma.match.findUnique({ where: { id: matchId }});
        if (!match) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }

        // Create new chat
        const newChat = await prisma.chat.create({
            data: {
                matchId: matchId,
            },
        });

        return NextResponse.json({ chat: newChat }, { status: 201 });
    } catch (error) {
        console.error('Error creating chat:', error);
        return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
    }
} 