import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil"
});

export async function POST(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      include: {
        user: true,
        matchedUser: true
      }
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 500, // $5.00 in cents
      currency: "usd",
      metadata: {
        matchId: match.id
      }
    });

    // Update match to revealed
    await prisma.match.update({
      where: { id: match.id },
      data: { isPaidReveal: true }
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      match: {
        id: match.id,
        matchedUser: {
          name: match.matchedUser.name,
          description: match.matchedUser.description
        }
      }
    });
  } catch (error) {
    console.error("Error revealing match:", error);
    return NextResponse.json(
      { error: "Failed to reveal match" },
      { status: 500 }
    );
  }
} 