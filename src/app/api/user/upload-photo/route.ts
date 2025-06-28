import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { prisma } from "../../../../lib/prisma";
import { mkdirSync } from 'fs';

// Ensure the upload directory exists
const uploadDir = join(process.cwd(), 'public', 'uploads');
mkdirSync(uploadDir, { recursive: true });

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const email: string | null = data.get('email') as string;

    if (!file || !email) {
      return NextResponse.json({ success: false, error: 'File and email are required.' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename
    const filename = `${user.id}-${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const path = join(uploadDir, filename);
    await writeFile(path, buffer);
    console.log(`open ${path} to see the uploaded file`);

    // Create a public URL path
    const publicPath = `/uploads/${filename}`;

    // Update user's image in the database
    const updatedUser = await prisma.user.update({
      where: { email: email },
      data: { image: publicPath },
    });

    return NextResponse.json({ success: true, image: updatedUser.image });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: 'File upload failed.' }, { status: 500 });
  }
} 