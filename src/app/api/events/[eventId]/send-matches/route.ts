import { NextResponse } from 'next/server';
import { prisma } from "../../../../../lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: 'Admin email is required for authorization' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const eventId = params.eventId;

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