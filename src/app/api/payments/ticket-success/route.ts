import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    const { eventId, userId } = paymentIntent.metadata;

    if (!eventId || !userId) {
      return NextResponse.json(
        { error: 'Invalid payment metadata' },
        { status: 400 }
      );
    }

    // Check if ticket already exists
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        userId,
        eventId,
      },
    });

    if (existingTicket) {
      return NextResponse.json(
        { error: 'Ticket already exists' },
        { status: 409 }
      );
    }

    // Create the ticket
    const ticket = await prisma.ticket.create({
      data: {
        userId,
        eventId,
      },
    });

    return NextResponse.json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error('Error processing ticket payment success:', error);
    return NextResponse.json(
      { error: 'Failed to process payment success' },
      { status: 500 }
    );
  }
} 