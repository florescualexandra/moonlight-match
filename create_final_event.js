const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if Final event already exists
    const existingEvent = await prisma.event.findFirst({
      where: {
        name: 'Final'
      }
    });

    if (existingEvent) {
      console.log('Event named "Final" already exists:', existingEvent);
      return;
    }

    // Create the Final event
    const finalEvent = await prisma.event.create({
      data: {
        name: 'Final',
        date: new Date('2024-12-31T23:59:59Z'), // Set to end of year
        formUrl: 'https://forms.google.com/final-event-form'
      }
    });

    console.log('Created Final event:', finalEvent);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 