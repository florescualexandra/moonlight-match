import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: NextRequest) {
  try {
    const { eventId, userId } = await request.json();

    if (!eventId || !userId) {
      return NextResponse.json(
        { error: 'Event ID and User ID are required' },
        { status: 400 }
      );
    }

    // Verify event exists and get price
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if user already has a ticket for this event
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        userId,
        eventId,
      },
    });

    if (existingTicket) {
      return NextResponse.json(
        { error: 'User already has a ticket for this event' },
        { status: 409 }
      );
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'ron',
          product_data: { name: event.name },
          unit_amount: 200, // 2 RON in bani (Stripe minimum)
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://your-app.com/payment-success',
      cancel_url: 'https://your-app.com/payment-cancel',
      metadata: { eventId, userId, type: 'event_ticket' },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating ticket checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 