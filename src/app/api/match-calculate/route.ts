import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculateCompatibility, getCompatibilityBreakdown } from '../../../lib/matching';

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
  try {
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

    console.log(`Calculating matches for ${users.length} users in event ${eventId}`);

    const matchesToCreate = [];
    const compatibilityDetails: { [key: string]: any } = {};

    // Calculate compatibility for all user pairs
    for (const userA of users) {
      if (!userA.formResponse) continue;
      
      const scores: { userId: string; matchedUserId: string; score: number; breakdown?: any }[] = [];
      
      for (const userB of users) {
        if (userA.id === userB.id || !userB.formResponse) continue;
        
        try {
          // Use the enhanced AI matching algorithm
          const compatibilityScore = await calculateCompatibility(userA, userB);
          
          // Get detailed breakdown for top matches
          let breakdown = null;
          if (compatibilityScore > 0.6) {
            breakdown = await getCompatibilityBreakdown(userA, userB);
          }
          
          scores.push({ 
            userId: userA.id, 
            matchedUserId: userB.id, 
            score: compatibilityScore,
            breakdown
          });
          
          // Store compatibility details for debugging/analytics
          const pairKey = `${userA.id}-${userB.id}`;
          compatibilityDetails[pairKey] = {
            score: compatibilityScore,
            breakdown,
            userAName: userA.name || userA.email,
            userBName: userB.name || userB.email
          };
          
        } catch (error) {
          console.error(`Error calculating compatibility between ${userA.id} and ${userB.id}:`, error);
          // Continue with other matches
          continue;
        }
      }
      
      // Sort by compatibility score (highest first)
      scores.sort((a, b) => b.score - a.score);
      
      // Select top 3 matches (or fewer if not enough users)
      const topMatches = scores.slice(0, 3);
      
      for (const match of topMatches) {
        matchesToCreate.push({
          userId: match.userId,
          matchedUserId: match.matchedUserId,
          eventId,
          score: match.score,
          isInitiallyRevealed: false,
          isPaidReveal: false,
        });
      }
      
      console.log(`User ${userA.name || userA.email}: Top match score = ${topMatches[0]?.score?.toFixed(3) || 'N/A'}`);
    }

    // Clear existing matches for this event
    await prisma.match.deleteMany({
      where: { eventId }
    });

    // Create new matches
    if (matchesToCreate.length > 0) {
      await prisma.match.createMany({
        data: matchesToCreate
      });
    }

    // Log some statistics
    const avgScore = matchesToCreate.length > 0 
      ? matchesToCreate.reduce((sum, m) => sum + m.score, 0) / matchesToCreate.length 
      : 0;
    
    const highCompatibilityMatches = matchesToCreate.filter(m => m.score > 0.8).length;
    
    console.log(`Matching complete for event ${eventId}:`);
    console.log(`- Total matches created: ${matchesToCreate.length}`);
    console.log(`- Average compatibility score: ${avgScore.toFixed(3)}`);
    console.log(`- High compatibility matches (>0.8): ${highCompatibilityMatches}`);

    return NextResponse.json({
      success: true,
      message: `Successfully calculated ${matchesToCreate.length} matches`,
      stats: {
        totalMatches: matchesToCreate.length,
        averageScore: avgScore,
        highCompatibilityMatches,
        totalUsers: users.length
      },
      compatibilityDetails: Object.keys(compatibilityDetails).length > 0 ? compatibilityDetails : undefined
    });

  } catch (error) {
    console.error('Error in match calculation:', error);
    return NextResponse.json({ 
      error: 'Internal server error during match calculation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Note: For real use, replace the matching logic with the full advanced version from previous messages, including deal breakers, gender, age, and text similarity. For text similarity, use a service or WASM/TF.js model, as Node.js cannot run Python models directly. 