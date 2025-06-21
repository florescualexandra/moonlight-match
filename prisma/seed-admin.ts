import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@user.com';
  const adminPassword = 'admin';
  const adminHashed = await bcrypt.hash(adminPassword, 10);

  const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminExists) {
    await prisma.$executeRaw`INSERT INTO "User" ("id", "email", "password", "name", "eventId", "createdAt", "updatedAt", "dataRetention") VALUES (gen_random_uuid(), ${adminEmail}, ${adminHashed}, 'Admin', 'default-event', NOW(), NOW(), false)`;
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