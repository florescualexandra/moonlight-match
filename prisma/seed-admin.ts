import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@user.com';
  const adminPassword = 'admin';
  const adminHashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!admin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: adminHashedPassword,
        name: 'Admin',
        isAdmin: true,
        dataRetention: false,
        event: {
            connectOrCreate: {
                where: { id: 'default-event' },
                create: { id: 'default-event', name: 'Default Event', date: new Date(), formUrl: 'http://example.com/form' }
            }
        }
      },
    });
    console.log('Admin user created.');
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