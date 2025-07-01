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
        // Idempotency: Only insert if not already present
        const stripePaymentIntentId = session.payment_intent || session.id;
        const existingPayment = await prisma.stripePayment.findUnique({
          where: { stripePaymentIntentId },
        });
        if (!existingPayment) {
          await prisma.stripePayment.create({
            data: {
              userId,
              amount,
              currency,
              type,
              status: 'succeeded',
              stripePaymentIntentId,
            },
          });
        }
        // Reveal only the next hidden match (not already revealed) in descending score order
        const nextHiddenMatch = await prisma.match.findFirst({
          where: {
            userId: userId,
            isInitiallyRevealed: false,
            isPaidReveal: false,
          },
          orderBy: { score: 'desc' },
        });
        if (nextHiddenMatch) {
          await prisma.match.update({
            where: { id: nextHiddenMatch.id },
            data: { isPaidReveal: true },
          });
          console.log(`Revealed next hidden match ${nextHiddenMatch.id} for user ${userId}`);
        } else {
          console.log(`No more hidden matches to reveal for user ${userId}`);
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