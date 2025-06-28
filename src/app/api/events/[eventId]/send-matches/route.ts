import { NextResponse } from 'next/server';
import { prisma } from "../../../../../lib/prisma";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const eventId = url.pathname.split("/").slice(-2, -1)[0];
  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: 'Admin email is required for authorization' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!eventId) {
    return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
  }

  try {
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { matchesSent: true },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Error sending matches:', error);
    return NextResponse.json(
      { error: 'Failed to update event to send matches' },
      { status: 500 }
    );
  }
} 