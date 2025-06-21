const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Ensure default-event exists
  const defaultEventId = 'default-event';
  const defaultEvent = await prisma.event.findUnique({ where: { id: defaultEventId } });
  if (!defaultEvent) {
    await prisma.event.create({
      data: {
        id: defaultEventId,
        name: 'Default Event',
        date: new Date(),
        formUrl: 'https://forms.google.com/default',
      },
    });
    console.log('Default event created.');
  }

  const adminEmail = 'admin@user.com';
  const adminPassword = 'admin';
  const adminHashed = await bcrypt.hash(adminPassword, 10);

  const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminExists) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "User" ("id", "email", "password", "name", "eventId", "createdAt", "updatedAt", "dataRetention") VALUES (gen_random_uuid(), $1, $2, 'Admin', 'default-event', NOW(), NOW(), false)`,
      adminEmail,
      adminHashed
    );
    console.log('Admin user created.');
  } else {
    console.log('Admin user already exists.');
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