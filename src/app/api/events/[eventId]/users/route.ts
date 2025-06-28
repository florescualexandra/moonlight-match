import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const eventId = url.pathname.split("/").slice(-2, -1)[0];
  try {
    const users = await prisma.user.findMany({
      where: {
        isAdmin: false,
        tickets: {
          some: {
            eventId: eventId
          }
        }
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