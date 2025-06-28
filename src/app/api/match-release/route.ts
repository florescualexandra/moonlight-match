import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  // Mark all matches as initially revealed
  const result = await prisma.match.updateMany({
    data: { isInitiallyRevealed: true },
    where: { isInitiallyRevealed: false },
  });
  return NextResponse.json({ status: 'released', count: result.count });
} 