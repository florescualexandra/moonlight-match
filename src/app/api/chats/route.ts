// @ts-nocheck
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all chats for a user
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get('email');

  if (!userEmail) {
    return NextResponse.json({ error: 'User email is required' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find all matches where the user is involved
    const matches = await prisma.match.findMany({
        where: {
            OR: [
                { userId: user.id },
                { matchedUserId: user.id }
            ]
        },
        select: { id: true }
    });
    
    const matchIds = matches.map(m => m.id);

    // Find all chats associated with those matches
    const chats = await prisma.chat.findMany({
      where: {
        matchId: { in: matchIds }
      },
      include: {
        match: {
            include: {
                user: { select: { id: true, name: true } },
                matchedUser: { select: { id: true, name: true } }
            }
        },
        messages: { // Optionally include the last message
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { content: true, createdAt: true, sender: { select: { name: true } } }
        }
      },
    });

    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
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