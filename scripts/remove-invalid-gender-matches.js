import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const anyValues = ['any', 'prefer not to say', 'all', 'no preference', "doesn't matter", 'does not matter'];
function isAny(val) {
  if (!val) return false;
  return anyValues.some(v => val.includes(v));
}

async function removeInvalidGenderMatches() {
  const matches = await prisma.match.findMany();
  let removed = 0;
  for (const match of matches) {
    const userA = await prisma.user.findUnique({ where: { id: match.userId } });
    const userB = await prisma.user.findUnique({ where: { id: match.matchedUserId } });
    if (!userA || !userB) continue;
    const responsesA = userA.formResponse || {};
    const responsesB = userB.formResponse || {};
    const genderA = (responsesA['What is your gender?'] || '').toLowerCase();
    const genderB = (responsesB['What is your gender?'] || '').toLowerCase();
    const partnerGenderA = (responsesA['Which gender do you prefer for your ideal partner? (Select all that apply)'] || '').toLowerCase();
    const partnerGenderB = (responsesB['Which gender do you prefer for your ideal partner? (Select all that apply)'] || '').toLowerCase();
    if (
      partnerGenderA && genderB && !isAny(partnerGenderA) && !partnerGenderA.includes(genderB) ||
      partnerGenderB && genderA && !isAny(partnerGenderB) && !partnerGenderB.includes(genderA)
    ) {
      await prisma.match.delete({ where: { id: match.id } });
      removed++;
      console.log(`Removed invalid match ${match.id} between ${userA.email} and ${userB.email}`);
    }
  }
  console.log(`Done. Removed ${removed} invalid matches.`);
}

removeInvalidGenderMatches()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 