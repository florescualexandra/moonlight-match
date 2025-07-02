"use strict";
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@user.com';
    const password = 'admin';
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await prisma.user.upsert({
        where: { email },
        update: { password: hashedPassword, name: 'Admin', isAdmin: true },
        create: {
            email,
            password: hashedPassword,
            name: 'Admin',
            isAdmin: true,
        },
    });
    console.log('Admin user created/updated:', admin);
}

main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
