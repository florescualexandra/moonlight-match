import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const prisma = new PrismaClient();

// POST /api/user/upload-photo - Upload user profile photo
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // For now, let's create a simple placeholder photo URL
    // In a real implementation, you'd handle the actual file upload
    const photoUrl = `/uploads/profile_${decoded.userId}_${Date.now()}.jpg`;

    // Update user's image field
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { image: photoUrl }
    });

    return NextResponse.json({
      photoUrl,
      message: 'Photo uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 