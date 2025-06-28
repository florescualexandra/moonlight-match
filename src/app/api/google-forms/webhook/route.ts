import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const formData = await request.json();
    
    // Extract email from form response
    const email = formData.email;
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find or create user
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        formResponse: formData
      },
      create: {
        email,
        formResponse: formData,
        eventId: formData.eventId
      }
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error processing form submission:', error);
    return NextResponse.json({ 
      error: 'Failed to process form submission' 
    }, { status: 500 });
  }
} 