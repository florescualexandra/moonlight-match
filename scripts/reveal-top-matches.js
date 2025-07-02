import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function revealTop3MatchesForAllUsers() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    // Get top 3 matches for this user by score (descending)
    const topMatches = await prisma.match.findMany({
      where: { userId: user.id },
      orderBy: { score: 'desc' },
      take: 3,
    });
    // Reveal these matches
    for (const match of topMatches) {
      await prisma.match.update({
        where: { id: match.id },
        data: { isInitiallyRevealed: true },
      });
    }
    console.log(`Revealed top 3 matches for user ${user.email}`);
  }
}

revealTop3MatchesForAllUsers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 