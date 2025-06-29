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

    const { matchId, userId } = paymentIntent.metadata;

    if (!matchId || !userId) {
      return NextResponse.json(
        { error: 'Invalid payment metadata' },
        { status: 400 }
      );
    }

    // Find the match and verify it belongs to the user
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

    if (match.isPaidReveal) {
      return NextResponse.json(
        { error: 'Match is already revealed' },
        { status: 409 }
      );
    }

    // Update the match to mark it as paid reveal
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        isPaidReveal: true,
      },
    });

    return NextResponse.json({
      success: true,
      match: updatedMatch,
    });
  } catch (error) {
    console.error('Error processing match reveal payment success:', error);
    return NextResponse.json(
      { error: 'Failed to process payment success' },
      { status: 500 }
    );
  }
} 