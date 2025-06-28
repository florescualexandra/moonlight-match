import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- Matching Algorithm (simplified for demo, see previous messages for full version) ---
function preprocessSet(val: string) {
  if (!val) return new Set();
  return new Set(val.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean));
}
function jaccard(a: string, b: string) {
  const setA = preprocessSet(a);
  const setB = preprocessSet(b);
  if (!setA.size && !setB.size) return 1.0;
  if (!setA.size || !setB.size) return 0.0;
  return [...setA].filter(x => setB.has(x)).length / new Set([...setA, ...setB]).size;
}
function numericSimilarity(a: any, b: any, maxDiff = 4) {
  try {
    return 1 - Math.abs(Number(a) - Number(b)) / maxDiff;
  } catch {
    return 0.5;
  }
}
// TODO: Add deal breaker, gender, age, and text similarity logic as in the advanced version

export async function POST(req: NextRequest) {
  // Get eventId from the request body
  const { eventId } = await req.json();
  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  // Get all users for this event (with tickets)
  const users = await prisma.user.findMany({
    where: {
      tickets: {
        some: { eventId }
      }
    }
  });

  const matchesToCreate = [];
  for (const userA of users) {
    if (!userA.formResponse) continue;
    let dataA: any = userA.formResponse;
    if (typeof dataA === 'string') {
      try { dataA = JSON.parse(dataA); } catch { dataA = {}; }
    }
    const scores: { userId: string; matchedUserId: string; score: number }[] = [];
    for (const userB of users) {
      if (userA.id === userB.id || !userB.formResponse) continue;
      let dataB: any = userB.formResponse;
      if (typeof dataB === 'string') {
        try { dataB = JSON.parse(dataB); } catch { dataB = {}; }
      }
      // Use actual form keys
      const hobbiesScore = jaccard(
        dataA["What are your main hobbies or interests? (Select all that apply)"],
        dataB["What are your main hobbies or interests? (Select all that apply)"]
      );
      const musicScore = jaccard(
        dataA["What is your favorite music genre? (Select all that apply)"],
        dataB["What is your favorite music genre? (Select all that apply)"]
      );
      const score = 0.5 * hobbiesScore + 0.5 * musicScore;
      scores.push({ userId: userA.id, matchedUserId: userB.id, score });
    }
    scores.sort((a, b) => b.score - a.score);
    const top3 = scores.slice(0, 3);
    for (const match of top3) {
      matchesToCreate.push({
        userId: match.userId,
        matchedUserId: match.matchedUserId,
        eventId,
        score: match.score,
        isInitiallyRevealed: false,
        isPaidReveal: false,
      });
    }
  }
  await prisma.match.deleteMany({ where: { eventId } });
  await prisma.match.createMany({ data: matchesToCreate });
  return NextResponse.json({ status: 'done', count: matchesToCreate.length });
}

// Note: For real use, replace the matching logic with the full advanced version from previous messages, including deal breakers, gender, age, and text similarity. For text similarity, use a service or WASM/TF.js model, as Node.js cannot run Python models directly. 