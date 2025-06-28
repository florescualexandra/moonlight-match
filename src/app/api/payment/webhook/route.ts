// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from "../../../../lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
});

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;

      if (userId) {
        // Find the top 2 unrevealed matches for the user
        const matchesToReveal = await prisma.match.findMany({
          where: {
            userId: userId,
            isInitiallyRevealed: false,
            isPaidReveal: false,
          },
          orderBy: {
            score: 'desc'
          },
          take: 2
        });

        // Mark these matches as revealed via payment
        await prisma.match.updateMany({
          where: {
            id: {
              in: matchesToReveal.map(m => m.id)
            }
          },
          data: {
            isPaidReveal: true
          }
        });
        
        console.log(`Revealed ${matchesToReveal.length} paid matches for user ${userId}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Don't send a 500 to Stripe, it will just retry.
    return NextResponse.json({ 
      error: `Webhook handler failed: ${errorMessage}` 
    }, { status: 400 });
  }
} 