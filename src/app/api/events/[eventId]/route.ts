import { NextResponse } from "next/server";
import { prisma } from '../../../../lib/prisma';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const eventId = url.pathname.split("/").pop();
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const eventId = url.pathname.split("/").pop();
  if (!eventId) {
    return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
  }
  try {
    await prisma.event.delete({ where: { id: eventId } });
    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
} 