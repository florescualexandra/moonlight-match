const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const INPUT_CSV = 'moonlight_match_responses_500.csv';
const OUTPUT_CSV = 'imported_users_credentials.csv';

function generateEmail(name, idx) {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${base || 'user'}${idx}@moonlightmatch.fake`;
}

function generatePassword() {
  return Math.random().toString(36).slice(-10);
}

async function main() {
  const users = [];
  let idx = 1;
  const credentials = [['Name', 'Email', 'Password']];

  // First, ensure we have a default event
  const defaultEvent = await prisma.event.upsert({
    where: { id: 'default-event' },
    update: {},
    create: {
      id: 'default-event',
      name: 'Default Event',
      date: new Date(),
      formUrl: 'https://forms.google.com/example',
    },
  });

  fs.createReadStream(INPUT_CSV)
    .pipe(csv())
    .on('data', (row) => {
      if (users.length < 100) {
        users.push({ ...row, idx: idx++ });
      }
    })
    .on('end', async () => {
      for (const user of users) {
        const email = generateEmail(user.Name, user.idx);
        const password = generatePassword();
        const hashedPassword = await bcrypt.hash(password, 10);
        
        try {
          const createdUser = await prisma.user.create({
            data: {
              email,
              password: hashedPassword,
              name: user.Name,
              formResponse: user, // Store the entire form response as JSON
              eventId: defaultEvent.id,
              dataRetention: false,
              isAdmin: false
            },
          });
          credentials.push([user.Name, email, password]);
          console.log(`Created user: ${user.Name}`);
        } catch (e) {
          console.error(`Failed to import user ${user.Name}:`, e.message);
        }
      }
      
      // Write credentials to file
      fs.writeFileSync(
        OUTPUT_CSV,
        credentials.map((row) => row.join(',')).join('\n'),
        'utf8'
      );
      console.log('Import complete! Credentials saved to', OUTPUT_CSV);
      await prisma.$disconnect();
    });
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
}); 