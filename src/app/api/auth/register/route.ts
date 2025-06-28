import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { email, password, name, description, eventId } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }
  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Email already registered.' }, { status: 409 });
  }
  // Hash password
  const hashed = await bcrypt.hash(password, 10);

  // Try to find a FormResponse for this email and event
  let formResponseData = null;
  if (eventId) {
    const responses = await prisma.formResponse.findMany({
      where: { },
    });
    const matchingResponse = responses.find(r => {
      if (typeof r.data === 'object' && r.data !== null) {
        const dataObj = r.data as Record<string, any>;
        return dataObj['Email'] === email;
      }
      return false;
    });
    if (matchingResponse) {
      formResponseData = matchingResponse.data;
    }
  }
  // Set retainDataConsent if present in form
  let retainDataConsent = false;
  if (formResponseData && typeof formResponseData === 'object' && formResponseData !== null) {
    const dataObj = formResponseData as Record<string, any>;
    const consent = dataObj["Retain Data Consent"];
    retainDataConsent = consent === true || consent === 'true' || consent === 1 || consent === '1';
  }
  // Create user with formResponse as Json field
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name,
      description,
      formResponse: formResponseData || undefined,
      dataRetention: retainDataConsent,
    },
  });
  // If eventId is present, create a ticket to link user to event
  if (eventId) {
    await prisma.ticket.create({
      data: {
        userId: user.id,
        eventId,
      },
    });
  }
  return NextResponse.json({ user, token: "dummy-token" });
}

// Insert admin user if not exists
const adminEmail = 'admin@user.com';
const adminPassword = 'admin';
const adminHashed = await bcrypt.hash(adminPassword, 10);
const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });
if (!adminExists) {
  await prisma.user.create({
    data: {
      email: adminEmail,
      password: adminHashed,
      name: 'Admin',
    },
  });
} 