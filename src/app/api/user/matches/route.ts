import { NextResponse } from 'next/server';
import { prisma } from "../../../../lib/prisma";

function getDescriptiveCommonality(question: string, answer: string): string {
    const qLower = question.toLowerCase();

    if (qLower.includes('how would you rate your sense of adventure')) {
        return `Share a sense of adventure (rated ${answer}/5)`;
    }
    if (qLower.includes('active')) {
        if (answer.toLowerCase() === 'not very active') {
            return `Prefer to take it easy over being active`;
        }
        return `Enjoy being active`;
    }
    if (qLower.includes('alcohol')) {
        return `Have similar views on alcohol`;
    }
    if (!isNaN(parseInt(answer, 10))) {
        return `${question}: ${answer}`;
    }
    return answer;
}

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
            image: true, // This line is crucial
            formResponse: true,
          },
        },
      },
    });

    // This logic reveals the top 3 matches for free and finds commonalities
    const processedMatches = matches.map((match, index) => {
      const commonalities: string[] = [];
      if (user.formResponse && match.matchedUser.formResponse) {
        const userResponses = user.formResponse as Record<string, any>;
        const matchedUserResponses = match.matchedUser.formResponse as Record<string, any>;

        for (const key in userResponses) {
          if (Object.prototype.hasOwnProperty.call(userResponses, key) && userResponses[key] === matchedUserResponses[key]) {
             const answer = String(userResponses[key]);
             commonalities.push(getDescriptiveCommonality(key, answer));
          }
        }
      }

      return {
        ...match,
        isInitiallyRevealed: match.isInitiallyRevealed || index < 3,
        commonalities: commonalities.slice(0, 3),
      };
    });

    return NextResponse.json({ matches: processedMatches, event: user.event });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}