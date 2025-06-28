const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const INPUT_CSV = 'moonlight_match_responses_500.csv';

async function main() {
  try {
    // Get the most recent event
    const events = await prisma.event.findMany({
      orderBy: {
        date: 'desc'
      },
      take: 1
    });

    if (events.length === 0) {
      console.error('No events found. Please create an event first.');
      process.exit(1);
    }

    const currentEvent = events[0];
    console.log(`Enrolling users to event: ${currentEvent.name}`);

    // Read and process users from CSV
    const users = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(INPUT_CSV)
        .pipe(csv())
        .on('data', (row) => {
          if (users.length < 100) {
            users.push(row);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Update each user with the current event and form response
    for (const user of users) {
      const email = user.Email || generateEmail(user.Name, users.indexOf(user) + 1);
      
      try {
        await prisma.user.update({
          where: { email },
          data: {
            eventId: currentEvent.id,
            formResponse: {
              interests: user.Interests ? user.Interests.split(',').map(i => i.trim()) : [],
              personality: user.Personality || '3',
              activities: user.Activities ? user.Activities.split(',').map(a => a.trim()) : [],
              age: user.Age || '25',
              gender: user.Gender || 'Other',
              bio: user.Bio || '',
              lookingFor: user.LookingFor || 'Friendship'
            }
          }
        });
        console.log(`Updated user: ${email}`);
      } catch (e) {
        console.error(`Failed to update user ${email}:`, e.message);
      }
    }

    console.log('Enrollment complete!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function generateEmail(name, idx) {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${base || 'user'}${idx}@moonlightmatch.fake`;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 