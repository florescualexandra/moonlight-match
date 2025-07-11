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
    console.log('Creating Stripe Checkout Session with:', { eventId, userId });
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'ron',
          product_data: { name: event.name },
          unit_amount: 5000, // 50 RON in bani
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://moonlight-match-website.vercel.app/user/events',
      cancel_url: 'https://moonlight-match-website.vercel.app/events',
      metadata: { eventId, userId, type: 'event_ticket' },
      payment_intent_data: {
        metadata: { eventId, userId, type: 'event_ticket' }
      },
    });
    console.log('Created Stripe Checkout Session:', session.id, 'with metadata:', session.metadata);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating ticket checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 