import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@user.com';
  const adminPassword = 'admin';
  const adminHashedPassword = await bcrypt.hash(adminPassword, 10);

  // Create default event if it doesn't exist
  const defaultEventId = 'default-event';
  const defaultEvent = await prisma.event.upsert({
    where: { id: defaultEventId },
    update: {},
    create: {
      id: defaultEventId,
      name: 'Default Event',
      date: new Date(),
      formUrl: 'http://example.com/form',
    },
  });

  const admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!admin) {
    const newAdmin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: adminHashedPassword,
        name: 'Admin',
        isAdmin: true,
        dataRetention: false,
      },
    });
    // Link admin to event via ticket
    await prisma.ticket.create({
      data: {
        userId: newAdmin.id,
        eventId: defaultEventId,
      },
    });
    console.log('Admin user created and linked to default event.');
  } else if (!admin.isAdmin) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { isAdmin: true },
    });
    console.log('Admin user found and updated to be an admin.');
  } else {
    console.log('Admin user already exists and is configured correctly.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 