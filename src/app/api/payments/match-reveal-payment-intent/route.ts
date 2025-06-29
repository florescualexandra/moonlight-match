import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: NextRequest) {
  try {
    const { matchId, userId } = await request.json();

    if (!matchId || !userId) {
      return NextResponse.json(
        { error: 'Match ID and User ID are required' },
        { status: 400 }
      );
    }

    // Verify match exists and belongs to user
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { userId: userId },
          { matchedUserId: userId },
        ],
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Check if match is already revealed
    if (match.isPaidReveal) {
      return NextResponse.json(
        { error: 'Match is already revealed' },
        { status: 409 }
      );
    }

    // Create payment intent for match reveal ($5)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 500, // $5.00 in cents
      currency: 'usd',
      metadata: {
        matchId,
        userId,
        type: 'match_reveal',
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating match reveal payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
} 