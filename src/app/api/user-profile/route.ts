import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET user profile
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { name: true, description: true, formResponse: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// PUT (update) user profile
export async function PUT(req: NextRequest) {
  try {
    const { email, name, description, formResponse } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required for updating.' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        name,
        description,
        formResponse,
      },
    });

    return NextResponse.json({ message: 'Profile updated successfully.', user: updatedUser });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
} 