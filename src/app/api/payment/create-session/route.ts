import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Additional Matches',
              description: 'Get access to 2 more matches with photos and chat functionality'
            },
            unit_amount: 999 // $9.99
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/matches?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/matches`,
      metadata: {
        userId: userId.toString()
      }
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Payment session error:', error);
    return NextResponse.json({ 
      error: 'Failed to create payment session' 
    }, { status: 500 });
  }
} 