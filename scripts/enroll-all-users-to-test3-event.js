import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    // Find the event named 'test3'
    const event = await prisma.event.findFirst({ where: { name: 'test3' } });
    if (!event) {
      console.error("Event named 'test3' not found.");
      process.exit(1);
    }
    // Find all users except admins
    const users = await prisma.user.findMany({ where: { isAdmin: false } });
    let enrolled = 0;
    for (const user of users) {
      // Check if ticket already exists
      const existing = await prisma.ticket.findFirst({ where: { userId: user.id, eventId: event.id } });
      if (!existing) {
        await prisma.ticket.create({ data: { userId: user.id, eventId: event.id } });
        enrolled++;
        console.log(`Enrolled user: ${user.email}`);
      }
    }
    console.log(`\nEnrolled ${enrolled} users to event 'test3'.`);
  } catch (error) {
    console.error('Error enrolling users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 