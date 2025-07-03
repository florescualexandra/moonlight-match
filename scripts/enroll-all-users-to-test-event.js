import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    // Find the event named 'demo'
    const event = await prisma.event.findFirst({ where: { name: 'demo' } });
    if (!event) {
      console.error("Event named 'demo' not found.");
      process.exit(1);
    }
    // Find all users except 'a@test.com' and admins
    const users = await prisma.user.findMany({ where: { email: { not: 'a@test.com' }, isAdmin: false } });
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
    console.log(`\nEnrolled ${enrolled} users to event 'demo'.`);
  } catch (error) {
    console.error('Error enrolling users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 