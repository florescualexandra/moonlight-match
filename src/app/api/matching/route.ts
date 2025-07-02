import { NextRequest, NextResponse } from 'next/server';
import { calculateCompatibility, getCompatibilityBreakdown, checkMatchingAlgorithmHealth } from '../../../lib/matching-production';

// POST /api/matching - Calculate compatibility between two users
export async function POST(request: NextRequest) {
  try {
    // Add health check
    const health = await checkMatchingAlgorithmHealth();
    if (health.status === 'unhealthy') {
      return NextResponse.json({ 
        error: 'Matching service temporarily unavailable',
        fallback: true,
        status: 'degraded'
      }, { status: 503 });
    }

    const { userA, userB } = await request.json();
    
    if (!userA || !userB) {
      return NextResponse.json({ error: 'Both users are required' }, { status: 400 });
    }

    // Add timeout protection (30 seconds)
    const compatibilityScore = await Promise.race([
      calculateCompatibility(userA, userB),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Calculation timeout')), 30000)
      )
    ]);

    const breakdown = await getCompatibilityBreakdown(userA, userB);

    return NextResponse.json({
      compatibility: compatibilityScore,
      breakdown,
      algorithmVersion: 'enhanced-ai',
      health: health.status,
      aiModelLoaded: health.aiModelLoaded,
      cacheSize: health.cacheSize,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Matching calculation failed:', error);
    
    // Fallback to basic algorithm if AI fails
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('timeout') || errorMessage.includes('AI') || errorMessage.includes('transformers')) {
      return NextResponse.json({ 
        error: 'Enhanced matching temporarily unavailable',
        fallback: true,
        status: 'degraded'
      }, { status: 503 });
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage 
    }, { status: 500 });
  }
}

// GET /api/matching - Health check endpoint
export async function GET() {
  try {
    const health = await checkMatchingAlgorithmHealth();
    
    return NextResponse.json({
      service: 'matching-algorithm',
      status: health.status,
      aiModelLoaded: health.aiModelLoaded,
      cacheSize: health.cacheSize,
      timestamp: new Date().toISOString(),
      version: 'enhanced-ai-v1.0'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      service: 'matching-algorithm',
      status: 'unhealthy',
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 