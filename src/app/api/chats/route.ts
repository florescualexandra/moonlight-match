import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// Helper: get userId from session or query (for demo, use query param)
function getUserId(req: NextRequest): string | null {
  const url = new URL(req.url);
  return url.searchParams.get('userId');
}

export async function POST(req: NextRequest) {
  try {
    const { matchId } = await req.json();
    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
    }
    // Find or create chat for this match
    let chat = await prisma.chat.findUnique({ where: { matchId } });
    if (!chat) {
      chat = await prisma.chat.create({ data: { matchId } });
    }
    return NextResponse.json({ chat });
  } catch (error) {
    console.error('Error creating/retrieving chat:', error);
    return NextResponse.json({ error: 'Failed to create/retrieve chat' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }
  try {
    // Find all chats where the user is part of the match
    const chats = await prisma.chat.findMany({
      where: {
        match: {
          OR: [
            { userId },
            { matchedUserId: userId },
          ],
        },
      },
      include: {
        match: true,
      },
    });
    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
} 