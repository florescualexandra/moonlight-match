import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculateCompatibility } from '../../../../../lib/matching';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    const url = new URL(req.url);
    const eventId = url.pathname.split("/").slice(-2, -1)[0];

    if (!eventId) {
        return NextResponse.json({ error: 'Event ID is required.' }, { status: 400 });
    }

    try {
        // 1. Set event state to "matching in progress"
        await prisma.event.update({
            where: { id: eventId },
            data: { isMatching: true, isMatchingComplete: false },
        });

        // 2. Fetch all users for the event (users with tickets for this event)
        const users = await prisma.user.findMany({
            where: {
                tickets: {
                    some: {
                        eventId: eventId
                    }
                }
            },
        });

        if (users.length < 2) {
            await prisma.event.update({
                where: { id: eventId },
                data: { isMatching: false, isMatchingComplete: true },
            });
            return NextResponse.json({ message: 'Not enough users to create matches.' });
        }

        // Clear old matches for this event to ensure a fresh run
        await prisma.match.deleteMany({ where: { eventId } });

        // 3. Iterate through each unique pair of users
        for (let i = 0; i < users.length; i++) {
            for (let j = i + 1; j < users.length; j++) {
                const userA = users[i];
                const userB = users[j];

                // 4. Calculate compatibility
                const score = await calculateCompatibility(userA, userB);
                console.log(`Match score for ${userA.name} and ${userB.name}: ${score.toFixed(3)}`);

                // 5. Store the match in the database
                await prisma.match.create({
                    data: {
                        userId: userA.id,
                        matchedUserId: userB.id,
                        eventId: eventId,
                        score: score,
                    }
                });
            }
        }
        
        // 6. Set event state to "matching complete"
        await prisma.event.update({
            where: { id: eventId },
            data: { isMatching: false, isMatchingComplete: true },
        });

        // 7. For testing: retrieve and print the top 3 matches for each user
        console.log("\n--- Top 3 Matches Per User ---");
        for (const user of users) {
            const topMatches = await prisma.match.findMany({
                where: { userId: user.id },
                orderBy: { score: 'desc' },
                take: 3,
                include: { matchedUser: { select: { name: true } }, },
            });

            console.log(`\nTop matches for ${user.name}:`);
            if (topMatches.length === 0) {
                console.log("  No matches found.");
            } else {
                topMatches.forEach((match, index) => {
                    console.log(`  ${index + 1}. ${match.matchedUser.name} (Score: ${match.score.toFixed(3)})`);
                });
            }
        }

        return NextResponse.json({ message: 'Matching process completed successfully.' });

    } catch (error) {
        console.error('Matching process failed:', error);
        // Safely attempt to revert the event state on failure
        try {
            await prisma.event.update({
                where: { id: eventId },
                data: { isMatching: false },
            });
        } catch (revertError) {
            console.error("Failed to revert event state:", revertError);
        }
        return NextResponse.json({ error: 'Internal server error during matching.' }, { status: 500 });
    }
} 