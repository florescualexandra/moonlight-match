import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.match.deleteMany();
    console.log('Deleted matches:', result.count);
  } catch (error) {
    console.error('Error deleting matches:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 