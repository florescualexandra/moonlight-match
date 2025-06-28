import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const eventId = url.pathname.split("/").slice(-3, -2)[0];
  try {
    const { matches } = await request.json();

    if (!Array.isArray(matches)) {
      return NextResponse.json(
        { error: "Invalid matches data" },
        { status: 400 }
      );
    }

    // Create matches in a transaction
    const createdMatches = await prisma.$transaction(
      matches.map(match =>
        prisma.match.create({
          data: {
            user: { connect: { id: match.userId } },
            matchedUser: { connect: { id: match.matchedUserId } },
            event: { connect: { id: eventId } },
            score: typeof match.score === 'number' ? match.score : 0
          }
        })
      )
    );

    return NextResponse.json({ matches: createdMatches });
  } catch (error) {
    console.error("Error creating matches:", error);
    return NextResponse.json(
      { error: "Failed to create matches" },
      { status: 500 }
    );
  }
}

// GET: fetch matches for an event
export async function GET(request: Request) {
  const url = new URL(request.url);
  const eventId = url.pathname.split("/").slice(-3, -2)[0];
  try {
    const matches = await prisma.match.findMany({
      where: { eventId },
      include: {
        user: true,
        matchedUser: true,
      },
    });
    return NextResponse.json({ matches });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
} 