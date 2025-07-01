import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import Stripe from "stripe";

// Initialize Stripe only if the secret key is available
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-05-28.basil"
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    const { userId, eventId } = await request.json();

    if (!userId || !eventId) {
      return NextResponse.json(
        { error: "Missing userId or eventId" },
        { status: 400 }
      );
    }

    if (!stripe) {
      // Fallback: Directly create a ticket for dev/testing
      const ticket = await prisma.ticket.create({
        data: { userId, eventId }
      });
      return NextResponse.json({ ticket, fallback: true });
    }

    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if event is in the past
    const eventDate = new Date(event.date);
    const now = new Date();
    if (eventDate < now) {
      return NextResponse.json(
        { error: "Cannot purchase tickets for past events" },
        { status: 400 }
      );
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2500, // $25.00 in cents
      currency: "usd",
      metadata: {
        userId: userId,
        eventId: eventId,
        type: "event_ticket"
      },
      description: `Ticket for ${event.name}`,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        formUrl: event.formUrl
      }
    });

  } catch (error) {
    console.error("Ticket purchase error:", error);
    return NextResponse.json(
      { error: "Failed to process ticket purchase" },
      { status: 500 }
    );
  }
} 