import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
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

    // Verify match exists
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'ron',
          product_data: { name: 'Reveal Match' },
          unit_amount: 500, // 5 RON in bani
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://your-app.com/payment-success',
      cancel_url: 'https://your-app.com/payment-cancel',
      metadata: { matchId, userId, type: 'match_reveal' },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating match reveal checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 