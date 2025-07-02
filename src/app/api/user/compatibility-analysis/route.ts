import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculateCompatibility, getCompatibilityBreakdown } from '../../../../lib/matching';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET /api/user/compatibility-analysis - Get detailed compatibility analysis
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Get the user and their tickets
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        tickets: {
          include: {
            event: true
          }
        }
      }
    });

    if (!user || user.tickets.length === 0) {
      return NextResponse.json({ error: 'User not found or no tickets found' }, { status: 404 });
    }

    // Get the event from the user's first ticket
    const event = user.tickets[0].event;

    // Get all other users in the same event
    const otherUsers = await prisma.user.findMany({
      where: {
        tickets: {
          some: {
            eventId: event.id
          }
        },
        id: { not: user.id },
        formResponse: { not: {} }
      }
    });

    if (otherUsers.length === 0) {
      return NextResponse.json({ 
        error: 'No other users found in this event',
        message: 'Compatibility analysis requires other users to be present'
      }, { status: 404 });
    }

    // Calculate compatibility with all other users
    const compatibilityResults = [];
    
    for (const otherUser of otherUsers) {
      try {
        const compatibilityScore = await calculateCompatibility(user, otherUser);
        const breakdown = await getCompatibilityBreakdown(user, otherUser);
        
        compatibilityResults.push({
          userId: otherUser.id,
          name: otherUser.name || 'Anonymous',
          email: otherUser.email,
          compatibilityScore,
          breakdown,
          strengths: breakdown.strengths,
          dealBreakers: breakdown.dealBreakers,
          componentScores: breakdown.breakdown
        });
      } catch (error) {
        console.error(`Error calculating compatibility with user ${otherUser.id}:`, error);
        continue;
      }
    }

    // Sort by compatibility score (highest first)
    compatibilityResults.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    // Calculate statistics
    const totalUsers = compatibilityResults.length;
    const avgCompatibility = totalUsers > 0 
      ? compatibilityResults.reduce((sum, r) => sum + r.compatibilityScore, 0) / totalUsers 
      : 0;
    
    const highCompatibilityCount = compatibilityResults.filter(r => r.compatibilityScore > 0.8).length;
    const mediumCompatibilityCount = compatibilityResults.filter(r => r.compatibilityScore > 0.6 && r.compatibilityScore <= 0.8).length;
    const lowCompatibilityCount = compatibilityResults.filter(r => r.compatibilityScore <= 0.6).length;

    // Get top matches
    const topMatches = compatibilityResults.slice(0, 5);

    // Analyze user's requirements and preferences
    const userRequirements = analyzeUserRequirements(user);
    const requirementCorrelation = analyzeRequirementCorrelation(user, compatibilityResults);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        requirements: userRequirements
      },
      event: {
        id: event.id,
        name: event.name,
        date: event.date
      },
      statistics: {
        totalPotentialMatches: totalUsers,
        averageCompatibility: avgCompatibility,
        highCompatibilityCount,
        mediumCompatibilityCount,
        lowCompatibilityCount,
        compatibilityDistribution: {
          high: (highCompatibilityCount / totalUsers) * 100,
          medium: (mediumCompatibilityCount / totalUsers) * 100,
          low: (lowCompatibilityCount / totalUsers) * 100
        }
      },
      topMatches,
      requirementCorrelation,
      allCompatibilityResults: compatibilityResults
    });

  } catch (error) {
    console.error('Error in compatibility analysis:', error);
    return NextResponse.json({ 
      error: 'Internal server error during compatibility analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to analyze user's requirements
function analyzeUserRequirements(user: any) {
  const formResponse = user.formResponse || {};
  
  return {
    hobbies: formResponse['What are your main hobbies or interests? (Select all that apply)'] || 'Not specified',
    music: formResponse['What is your favorite music genre? (Select all that apply)'] || 'Not specified',
    movies: formResponse['What type of movie or TV show do you prefer? (Select all that apply)'] || 'Not specified',
    vacation: formResponse['Which type of vacation do you prefer? (Select all that apply)'] || 'Not specified',
    activity: formResponse['How often do you engage in physical activity?'] || 'Not specified',
    petPreference: formResponse['How important is it that your partner is pet-friendly?'] || 'Not specified',
    childPreference: formResponse['How important is it that your partner is child-friendly?'] || 'Not specified',
    dealBreakers: formResponse['Which of these traits would be deal breakers for you? (Select all that apply)'] || 'None specified',
    vices: formResponse['Which of the following vices would you say you have? (Select all that apply):'] || 'None',
    age: formResponse['How old are you?'] || 'Not specified',
    gender: formResponse['What is your gender?'] || 'Not specified',
    partnerGender: formResponse['Which gender do you prefer for your ideal partner? (Select all that apply)'] || 'Not specified',
    occupation: formResponse['What is your occupation?'] || 'Not specified',
    pets: formResponse['Do you have any pets?'] || 'Not specified',
    bucketList: formResponse['Which of these are on your bucket list? (Select all that apply)'] || 'Not specified'
  };
}

// Helper function to analyze how user requirements correlate with compatibility
function analyzeRequirementCorrelation(user: any, compatibilityResults: any[]) {
  const formResponse = user.formResponse || {};
  const analysis = {
    mostCompatibleTraits: [] as string[],
    leastCompatibleTraits: [] as string[],
    requirementInsights: [] as string[],
    recommendations: [] as string[]
  };

  // Analyze hobbies correlation
  const userHobbies = formResponse['What are your main hobbies or interests? (Select all that apply)'] || '';
  if (userHobbies) {
    const hobbyCorrelation = compatibilityResults
      .filter(r => r.componentScores?.hobbies > 0.7)
      .length;
    
    if (hobbyCorrelation > compatibilityResults.length * 0.3) {
      analysis.mostCompatibleTraits.push('Hobbies and interests');
    }
  }

  // Analyze music correlation
  const userMusic = formResponse['What is your favorite music genre? (Select all that apply)'] || '';
  if (userMusic) {
    const musicCorrelation = compatibilityResults
      .filter(r => r.componentScores?.music > 0.6)
      .length;
    
    if (musicCorrelation > compatibilityResults.length * 0.4) {
      analysis.mostCompatibleTraits.push('Music preferences');
    }
  }

  // Analyze deal breakers impact
  const userDealBreakers = formResponse['Which of these traits would be deal breakers for you? (Select all that apply)'] || '';
  if (userDealBreakers) {
    const dealBreakerImpact = compatibilityResults
      .filter(r => r.dealBreakers && r.dealBreakers.length > 0)
      .length;
    
    if (dealBreakerImpact > 0) {
      analysis.leastCompatibleTraits.push('Deal breakers');
      analysis.requirementInsights.push(`You have ${dealBreakerImpact} potential matches with deal breaker conflicts`);
    }
  }

  // Generate recommendations
  const lowCompatibilityCount = compatibilityResults.filter(r => r.compatibilityScore < 0.5).length;
  if (lowCompatibilityCount > compatibilityResults.length * 0.5) {
    analysis.recommendations.push('Consider being more flexible with your preferences to increase compatibility');
  }

  const highCompatibilityCount = compatibilityResults.filter(r => r.compatibilityScore > 0.8).length;
  if (highCompatibilityCount > 0) {
    analysis.recommendations.push(`You have ${highCompatibilityCount} highly compatible potential matches`);
  }

  return analysis;
} 