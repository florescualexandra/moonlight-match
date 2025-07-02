import { NextResponse } from 'next/server';
import { checkMatchingAlgorithmHealth } from '../../../../lib/matching-production';

// GET /api/health/matching - Health check endpoint for matching algorithm
export async function GET() {
  try {
    const health = await checkMatchingAlgorithmHealth();
    
    return NextResponse.json({
      service: 'matching-algorithm',
      status: health.status,
      aiModelLoaded: health.aiModelLoaded,
      cacheSize: health.cacheSize,
      timestamp: new Date().toISOString(),
      version: 'enhanced-ai-v1.0',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
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