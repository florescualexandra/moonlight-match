import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, password: true, name: true, isAdmin: true } });
  if (!user) {
      console.error('Login failed: user not found for email', email);
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }
    if (!user.password) {
      console.error('Login failed: user has no password field', user);
      return NextResponse.json({ error: 'User has no password set. Please contact support.' }, { status: 500 });
    }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }
    return NextResponse.json({ id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
} 