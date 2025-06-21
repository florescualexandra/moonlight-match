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
        extraRevealed: false,
        released: true
      },
      orderBy: {
        score: 'desc'
      },
      take: 2,
      include: {
        match: {
          select: {
            name: true,
            photo: true,
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
        extraRevealed: true
      }
    });

    // Format matches for response
    const formattedMatches = unrevealedMatches.map(match => ({
      id: match.id,
      name: match.match.name,
      photo: match.match.photo,
      description: match.match.description,
      score: match.score,
      similarities: match.similarities
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