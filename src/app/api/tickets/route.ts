import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { userId, eventId } = await request.json();

  if (!userId || !eventId) {
    return NextResponse.json({ error: "Missing userId or eventId" }, { status: 400 });
  }

  try {
    // Prevent duplicate tickets
    const existing = await prisma.ticket.findFirst({ where: { userId, eventId } });
    if (existing) {
      return NextResponse.json({ error: "Ticket already exists" }, { status: 409 });
    }

    const ticket = await prisma.ticket.create({
      data: { userId, eventId }
    });
    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('Ticket creation error:', error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
} 