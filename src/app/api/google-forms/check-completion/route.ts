import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists and has completed the form
    const user = await prisma.user.findUnique({
      where: { email },
      select: { 
        id: true, 
        hasCompletedForm: true,
        name: true,
        email: true
      }
    });

    if (!user) {
      return NextResponse.json({ 
        hasCompletedForm: false,
        message: 'User not found'
      });
    }

    return NextResponse.json({
      hasCompletedForm: user.hasCompletedForm,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      message: user.hasCompletedForm 
        ? 'User has already completed the form' 
        : 'User has not completed the form yet'
    });

  } catch (error) {
    console.error('Error checking form completion:', error);
    return NextResponse.json({ 
      error: 'Failed to check form completion',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 