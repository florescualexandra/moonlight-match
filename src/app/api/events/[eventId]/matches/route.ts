import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
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
            matchedUser: { connect: { id: match.matchedUserId } }
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
export async function GET(request: Request, context: { params: any }) {
  const { eventId } = await context.params;
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