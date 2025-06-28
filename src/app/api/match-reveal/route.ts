import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    // Get user's matches that haven't been revealed yet
    const unrevealedMatches = await prisma.match.findMany({
      where: {
        userId: userId,
        isPaidReveal: false,
        isInitiallyRevealed: true
      },
      orderBy: {
        score: 'desc'
      },
      take: 2,
      include: {
        matchedUser: {
          select: {
            name: true,
            image: true,
            description: true
          }
        }
      }
    });

    if (unrevealedMatches.length === 0) {
      return NextResponse.json({
        error: 'No more matches to reveal'
      }, { status: 400 });
    }

    // Mark matches as revealed
    await prisma.match.updateMany({
      where: {
        id: {
          in: unrevealedMatches.map(m => m.id)
        }
      },
      data: {
        isPaidReveal: true
      }
    });

    // Format matches for response
    const formattedMatches = unrevealedMatches.map(match => ({
      id: match.id,
      name: match.matchedUser.name,
      photo: match.matchedUser.image,
      description: match.matchedUser.description,
      score: match.score
    }));

    return NextResponse.json({
      matches: formattedMatches
    });
  } catch (error) {
    console.error('Match reveal error:', error);
    return NextResponse.json({
      error: 'Failed to reveal matches'
    }, { status: 500 });
  }
} 