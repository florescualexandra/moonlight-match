const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function revealTop3Matches() {
  const users = await prisma.user.findMany({ select: { id: true } });

  for (const user of users) {
    // Get top 3 matches by score for this user
    const topMatches = await prisma.match.findMany({
      where: { userId: user.id },
      orderBy: { score: 'desc' },
      take: 3,
    });

    // Update those matches to isInitiallyRevealed: true
    for (const match of topMatches) {
      await prisma.match.update({
        where: { id: match.id },
        data: { isInitiallyRevealed: true },
      });
    }
  }

  console.log('Top 3 matches for each user have been revealed!');
}

revealTop3Matches()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 