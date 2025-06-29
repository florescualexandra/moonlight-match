const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Find the event named "Final"
    const finalEvent = await prisma.event.findFirst({
      where: {
        name: 'Final'
      }
    });

    if (!finalEvent) {
      console.error('Event named "Final" not found. Please create it first.');
      process.exit(1);
    }

    console.log(`Found final event: ${finalEvent.name} (ID: ${finalEvent.id})`);

    // Find all fake users (emails ending with @moonlightmatch.fake) and ale@test.com
    const fakeUsers = await prisma.user.findMany({
      where: {
        OR: [
          {
            email: {
              endsWith: '@moonlightmatch.fake'
            }
          },
          {
            email: 'ale@test.com'
          }
        ]
      }
    });

    console.log(`Found ${fakeUsers.length} fake/test users to enroll`);

    let enrolledCount = 0;
    let alreadyEnrolledCount = 0;

    // Enroll each user to the final event
    for (const user of fakeUsers) {
      try {
        // Check if user already has a ticket for this event
        const existingTicket = await prisma.ticket.findFirst({
          where: {
            userId: user.id,
            eventId: finalEvent.id
          }
        });

        if (existingTicket) {
          console.log(`User ${user.email} already enrolled in final event`);
          alreadyEnrolledCount++;
        } else {
          // Create ticket for the user
          await prisma.ticket.create({
            data: {
              userId: user.id,
              eventId: finalEvent.id
            }
          });
          console.log(`Enrolled user: ${user.email}`);
          enrolledCount++;
        }
      } catch (error) {
        console.error(`Failed to enroll user ${user.email}:`, error.message);
      }
    }

    console.log('\n=== Enrollment Summary ===');
    console.log(`Total fake/test users found: ${fakeUsers.length}`);
    console.log(`Newly enrolled: ${enrolledCount}`);
    console.log(`Already enrolled: ${alreadyEnrolledCount}`);
    console.log(`Total enrolled: ${enrolledCount + alreadyEnrolledCount}`);

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