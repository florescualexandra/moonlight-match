// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Stripe only if the secret key is available
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-05-28.basil'
    })
  : null;

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  if (!stripe) {
    return NextResponse.json(
      { error: 'Payment service not configured' },
      { status: 500 }
    );
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_MATCH_REVEAL_WEBHOOK_SECRET!
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Webhook received checkout.session.completed');
      console.log('Session:', JSON.stringify(session, null, 2));
      const userId = session.metadata?.userId;
      const amount = session.amount_total;
      const currency = session.currency;
      const type = session.metadata?.type;
      console.log('Metadata:', session.metadata);
      console.log('userId:', userId, 'amount:', amount, 'currency:', currency, 'type:', type);

      if (userId && amount === 500 && currency === 'ron' && type === 'match_reveal') {
        const freeMatches = 3;
        const paidRevealedCount = await prisma.match.count({
          where: {
            userId: userId,
            isPaidReveal: true,
          }
        });
        console.log('paidRevealedCount:', paidRevealedCount);
        const matches = await prisma.match.findMany({
          where: { userId: userId },
          orderBy: { score: 'desc' },
        });
        console.log('matches:', matches.map(m => ({ id: m.id, isPaidReveal: m.isPaidReveal, score: m.score })));
        const toReveal = matches[freeMatches + paidRevealedCount];
        console.log('toReveal:', toReveal);
        if (toReveal && !toReveal.isPaidReveal) {
          await prisma.match.update({
            where: { id: toReveal.id },
            data: { isPaidReveal: true },
          });
          console.log(`Revealed next paid match ${toReveal.id} for user ${userId}`);
        } else {
          console.log('No more matches to reveal for user', userId);
        }
      } else {
        console.log('Webhook: Payment does not match criteria for match reveal.');
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