import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/user/profile - Get user profile data (no auth, debug version)
export async function GET(request: NextRequest) {
  try {
    // For debugging: just return the first user
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        name: true,
        formResponse: true,
        image: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        ...(user.formResponse as any || {}),
        photoUrl: user.image,
        email: user.email,
        name: user.name,
      }
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/user/profile - Update user profile data (no auth, debug version)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile } = body;

    if (!profile) {
      return NextResponse.json({ error: 'Profile data is required' }, { status: 400 });
    }

    // For debugging: update the first user
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        formResponse: profile,
        name: profile.name || undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        formResponse: true,
        image: true,
      }
    });

    return NextResponse.json({
      profile: {
        ...(updatedUser.formResponse as any || {}),
        photoUrl: updatedUser.image,
        email: updatedUser.email,
        name: updatedUser.name,
      }
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 