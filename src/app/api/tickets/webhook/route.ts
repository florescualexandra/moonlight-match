import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe only if the secret key is available
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-05-28.basil"
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
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      // Check if this is a ticket purchase
      if (paymentIntent.metadata?.type === 'event_ticket') {
        const { userId, eventId } = paymentIntent.metadata;
        
        // The ticket was already created in the purchase endpoint
        // Here we could add additional logic like sending confirmation emails
        console.log(`Ticket purchase successful for user ${userId} and event ${eventId}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: `Webhook handler failed: ${errorMessage}` 
    }, { status: 400 });
  }
} 