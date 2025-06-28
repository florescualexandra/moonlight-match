import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET(request: Request, contextOrPromise: { params: { eventId: string } } | Promise<{ params: { eventId: string } }>) {
  const context = await contextOrPromise;
  const { params } = context;
  try {
    const users = await prisma.user.findMany({
      where: {
        eventId: params.eventId,
        isAdmin: false
      },
      select: {
        id: true,
        name: true,
        email: true,
        formResponse: true
      }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching event users:", error);
    return NextResponse.json(
      { error: "Failed to fetch event users" },
      { status: 500 }
    );
  }
} 