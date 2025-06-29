const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Path to your CSV or JSON with the fetched users (update as needed)
const CSV_PATH = path.join(__dirname, '../moonlight_match_responses_500.csv');
const PASSWORD = 'user1234';

function parseCSV(csvPath) {
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n').filter(Boolean);
  const headers = lines[0].split('\t');
  return lines.slice(1).map(line => {
    const values = line.split('\t');
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = values[i] ? values[i].trim() : '';
    });
    return obj;
  });
}

async function main() {
  // Fetch all users except the excluded ones
  const excludedEmails = ['ale@test.com', 'admin@user.com'];
  const users = await prisma.user.findMany({
    where: {
      email: {
        notIn: excludedEmails
      }
    }
  });
  let updated = 0;
  for (const user of users) {
    await prisma.user.update({
      where: { email: user.email },
      data: {
        password: PASSWORD,
      },
    });
    updated++;
  }
  console.log(`Updated password for ${updated} users (except ${excludedEmails.join(', ')}).`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
}); 