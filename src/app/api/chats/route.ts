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

    return NextResponse.json({ chats });
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
        const { matchId, userId } = await request.json();

        if (!matchId || !userId) {
            return NextResponse.json({ error: 'Match ID and userId are required' }, { status: 400 });
        }
        
        // Check if a chat for this match already exists
        const existingChat = await prisma.chat.findUnique({
            where: { matchId },
        });
        if (existingChat) {
            return NextResponse.json({ chat: existingChat });
        }
        
        // Verify the match exists and is revealed for the requesting user
        const match = await prisma.match.findUnique({ where: { id: matchId }});
        if (!match) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }
        // Only allow chat creation if the requesting user is userId or matchedUserId and the match is revealed for them
        let isRevealed = false;
        if (match.userId === userId && (match.isInitiallyRevealed || match.isPaidReveal)) {
            isRevealed = true;
        }
        if (match.matchedUserId === userId && (match.isInitiallyRevealed || match.isPaidReveal)) {
            isRevealed = true;
        }
        if (!isRevealed) {
            return NextResponse.json({ error: 'You cannot start a chat with a hidden match.' }, { status: 403 });
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