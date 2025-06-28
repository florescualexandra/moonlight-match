import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find users who didn't opt for data retention and registered more than 24 hours ago
    const usersToDelete = await prisma.user.findMany({
      where: {
        dataRetention: false,
        createdAt: {
          lt: twentyFourHoursAgo
        }
      }
    });

    // Delete users and their associated data
    for (const user of usersToDelete) {
      await prisma.user.delete({
        where: { id: user.id }
      });
    }

    return NextResponse.json({
      success: true,
      deletedCount: usersToDelete.length
    });
  } catch (error) {
    console.error("Error cleaning up user data:", error);
    return NextResponse.json(
      { error: "Failed to clean up user data" },
      { status: 500 }
    );
  }
} 