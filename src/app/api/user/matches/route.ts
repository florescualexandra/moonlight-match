import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        event: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const matches = await prisma.match.findMany({
      where: { userId: user.id },
      orderBy: {
        score: 'desc',
      },
      include: {
        matchedUser: {
          select: {
            id: true,
            name: true,
            formResponse: true, // Be mindful of what you expose here
          },
        },
      },
    });

    return NextResponse.json({ matches, event: user.event });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
} 