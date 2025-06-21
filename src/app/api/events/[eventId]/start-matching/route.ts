import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pipeline } from "@xenova/transformers";

// Define the relevant columns for matching (should match your form fields)
const MATCHING_COLUMNS = [
  "interests",
  "activities",
  "occupation",
  "music",
  "movies",
  "bucketList",
  "vices",
  "pets",
  "age",
  "gender",
  "bio",
  "lookingFor"
];

// Load the model once (cache in memory)
let embedderPromise: Promise<any>;
function getEmbedder(): Promise<any> {
  if (!embedderPromise) {
    embedderPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedderPromise;
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum: number, ai: number, i: number) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum: number, ai: number) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum: number, bi: number) => sum + bi * bi, 0));
  return dot / (normA * normB);
}

interface User {
  id: string;
  formResponse: Record<string, any>;
}

export async function POST(request: Request, contextOrPromise: { params: { eventId: string } } | Promise<{ params: { eventId: string } }>) {
  const context = await contextOrPromise;
  const { params } = context;
  try {
    // Update event status to start matching (no include)
    await prisma.event.update({
      where: { id: params.eventId },
      data: {}
    });

    // Fetch users for this event
    const usersRaw = await prisma.user.findMany({
      where: { eventId: params.eventId, isAdmin: false },
      select: { id: true, formResponse: true }
    });
    const users: User[] = usersRaw
      .map(u => ({ id: u.id, formResponse: (typeof u.formResponse === 'object' && u.formResponse !== null ? u.formResponse : {}) as Record<string, any> }));

    const matches = [];
    const embedder = await getEmbedder();

    // Precompute embeddings for all users and all columns
    const userEmbeddings: Record<string, Record<string, number[]>> = {};
    for (const user of users) {
      userEmbeddings[user.id] = {};
      for (const col of MATCHING_COLUMNS) {
        let value = user.formResponse?.[col];
        if (Array.isArray(value)) value = value.join(', ');
        if (typeof value !== 'string') value = String(value ?? '');
        if (value.trim()) {
          console.log(`Embedding for user ${user.id}, column ${col}:`, value);
          const emb = await embedder(value);
          const vector = Array.isArray(emb) ? emb.flat(Infinity) : [];
          if (vector.length === 0 || typeof vector[0] !== 'number') continue;
          userEmbeddings[user.id][col] = vector;
        }
      }
    }

    for (const user1 of users) {
      const userMatches = [];
      for (const user2 of users) {
        if (user1.id === user2.id) continue;
        let scores: number[] = [];
        for (const col of MATCHING_COLUMNS) {
          const embA = userEmbeddings[user1.id][col];
          const embB = userEmbeddings[user2.id][col];
          if (Array.isArray(embA) && Array.isArray(embB) && embA.length && embB.length) {
            scores.push(cosineSimilarity(embA, embB));
          }
        }
        const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        userMatches.push({
          userId: user1.id,
          matchedUserId: user2.id,
          score: avgScore
        });
      }
      // Sort matches by score and take top 5
      const topMatches = userMatches
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      // Create match records in database
      for (const match of topMatches) {
        // Prevent duplicate matches
        const exists = await prisma.match.findUnique({
          where: {
            userId_matchedUserId: {
              userId: match.userId,
              matchedUserId: match.matchedUserId
            }
          }
        });
        if (!exists) {
          await prisma.match.create({
            data: {
              userId: match.userId,
              matchedUserId: match.matchedUserId,
              isRevealed: match.score <= 3
            }
          });
        }
      }
      matches.push(...topMatches);
    }
    // Mark matching as complete
    await prisma.event.update({
      where: { id: params.eventId },
      data: {}
    });
    return NextResponse.json({ success: true, matches });
  } catch (error) {
    console.error("Error starting matching:", error);
    return NextResponse.json(
      { error: "Failed to start matching process" },
      { status: 500 }
    );
  }
} 