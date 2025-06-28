import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  // Mark all matches as released
  const result = await prisma.match.updateMany({
    data: { released: true },
    where: { released: false },
  });
  return NextResponse.json({ status: 'released', count: result.count });
} 