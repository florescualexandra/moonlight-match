import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId"); // Replace with real auth in production

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const tickets = await prisma.ticket.findMany({
      where: { userId },
      include: { event: true },
    });
    const events = tickets.map(ticket => ticket.event);
    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user events" }, { status: 500 });
  }
} 