const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function backfillPhotos() {
  try {
    const usersWithoutPhotos = await prisma.user.findMany({
      where: {
        image: null,
      },
    });

    console.log(`Found ${usersWithoutPhotos.length} users without photos. Updating...`);

    for (const user of usersWithoutPhotos) {
      const imageUrl = `https://i.pravatar.cc/150?u=${user.email}`;
      await prisma.user.update({
        where: { id: user.id },
        data: { image: imageUrl },
      });
      console.log(`- Updated photo for ${user.email}`);
    }

    console.log('Finished backfilling photos.');

  } catch (error) {
    console.error('Error backfilling photos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backfillPhotos();