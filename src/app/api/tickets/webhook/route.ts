import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "../../../../lib/prisma";

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
      process.env.STRIPE_TICKET_WEBHOOK_SECRET!
    );

    console.log('Received Stripe event:', event.type, JSON.stringify(event.data.object));

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent metadata:', paymentIntent.metadata);
      // Check if this is a ticket purchase
      if (paymentIntent.metadata?.type === 'event_ticket') {
        const { userId, eventId } = paymentIntent.metadata;
        if (!userId || !eventId) {
          console.error('Missing userId or eventId in paymentIntent metadata');
        } else {
          // Prevent duplicate tickets
          const existingTicket = await prisma.ticket.findFirst({
            where: { userId, eventId }
          });
          if (!existingTicket) {
            await prisma.ticket.create({
              data: { userId, eventId }
            });
            console.log(`Ticket created for user ${userId} and event ${eventId}`);
          } else {
            console.log(`Ticket already exists for user ${userId} and event ${eventId}`);
          }
        }
      } else {
        console.log('payment_intent.succeeded does not have type=event_ticket');
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