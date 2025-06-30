import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Dummy admin check (replace with real auth in production)
async function isAdmin(req: NextRequest) {
  // Example: check for a header or session
  const email = req.headers.get('x-admin-email');
  if (!email) return false;
  const user = await prisma.user.findUnique({ where: { email } });
  return user?.isAdmin;
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { email, eventId } = await req.json();
  if (!email || !eventId) {
    return NextResponse.json({ error: 'Email and eventId are required' }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  const existing = await prisma.ticket.findFirst({ where: { userId: user.id, eventId } });
  if (existing) {
    return NextResponse.json({ message: 'Ticket already exists for this user and event.' });
  }
  await prisma.ticket.create({ data: { userId: user.id, eventId } });
  return NextResponse.json({ success: true });
} 