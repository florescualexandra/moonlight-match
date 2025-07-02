// src/lib/matching-production.ts
// Production-optimized version of the enhanced matching algorithm

// Set transformers cache directory for Vercel compatibility
if (typeof process !== 'undefined') {
  process.env.TRANSFORMERS_CACHE = '/tmp/transformers_cache';
}

import { pipeline } from '@xenova/transformers';

// Global cache for AI model and embeddings
let sentenceTransformer: any = null;
let modelLoadingPromise: Promise<any> | null = null;
const embeddingCache = new Map<string, number[]>();
const CACHE_SIZE_LIMIT = 1000; // Limit cache size to prevent memory issues

// Initialize AI model with proper error handling and caching
async function initializeAI() {
  if (sentenceTransformer) {
    return sentenceTransformer;
  }

  if (modelLoadingPromise) {
    return modelLoadingPromise;
  }

  modelLoadingPromise = (async () => {
    try {
      console.log('🤖 Initializing AI transformers for production...');
      sentenceTransformer = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true, // Use quantized model for better performance
        progress_callback: (progress: number) => {
          if (progress % 25 === 0) {
            console.log(`AI model loading: ${progress}%`);
          }
        }
      });
      console.log('✅ AI transformers initialized successfully for production');
      return sentenceTransformer;
    } catch (error) {
      console.error('❌ AI transformers failed to initialize:', error);
      sentenceTransformer = null;
      throw error;
    }
  })();

  return modelLoadingPromise;
}

// Calculate semantic similarity with caching and error handling
async function calculateSemanticSimilarity(textA: string, textB: string): Promise<number> {
  if (!textA || !textB) {
    return calculateBasicSimilarity(textA, textB);
  }

  try {
    // Check cache first
    const cacheKeyA = `embedding:${textA.toLowerCase().trim()}`;
    const cacheKeyB = `embedding:${textB.toLowerCase().trim()}`;
    
    let embeddingA = embeddingCache.get(cacheKeyA);
    let embeddingB = embeddingCache.get(cacheKeyB);

    // Initialize AI if needed
    const transformer = await initializeAI();
    
    if (!transformer) {
      return calculateBasicSimilarity(textA, textB);
    }

    // Generate embeddings if not cached
    if (!embeddingA) {
      const embeddingResultA = await transformer(textA, { pooling: 'mean', normalize: true });
      embeddingA = Array.from(embeddingResultA.data);
      
      // Add to cache with size limit
      if (embeddingCache.size < CACHE_SIZE_LIMIT) {
        embeddingCache.set(cacheKeyA, embeddingA);
      }
    }

    if (!embeddingB) {
      const embeddingResultB = await transformer(textB, { pooling: 'mean', normalize: true });
      embeddingB = Array.from(embeddingResultB.data);
      
      // Add to cache with size limit
      if (embeddingCache.size < CACHE_SIZE_LIMIT) {
        embeddingCache.set(cacheKeyB, embeddingB);
      }
    }

    const similarity = cosineSimilarity(embeddingA, embeddingB);
    return similarity;
  } catch (error) {
    console.warn('⚠️ Semantic similarity failed, using basic similarity:', error);
    return calculateBasicSimilarity(textA, textB);
  }
}

// Basic similarity calculation (fallback)
function calculateBasicSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const setA = new Set(a.split(',').map(x => x.trim().toLowerCase()).filter(Boolean));
  const setB = new Set(b.split(',').map(x => x.trim().toLowerCase()).filter(Boolean));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

// Cosine similarity calculation
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Personality analysis with error handling
function analyzePersonalityTraits(formResponse: Record<string, string>) {
  try {
    const response = formResponse || {};
    
    let extroversion = 0.5;
    let openness = 0.5;
    let conscientiousness = 0.5;
    let agreeableness = 0.5;
    let neuroticism = 0.5;
    
    const hobbies = response['What are your main hobbies or interests? (Select all that apply)'] || '';
    const hobbiesLower = hobbies.toLowerCase();
    
    if (hobbiesLower.includes('socializing') || hobbiesLower.includes('partying') || 
        hobbiesLower.includes('team sports') || hobbiesLower.includes('dancing')) {
      extroversion += 0.3;
    }
    if (hobbiesLower.includes('reading') || hobbiesLower.includes('gaming') || 
        hobbiesLower.includes('cooking') || hobbiesLower.includes('art')) {
      extroversion -= 0.2;
    }
    
    if (hobbiesLower.includes('traveling') || hobbiesLower.includes('learning') || 
        hobbiesLower.includes('art') || hobbiesLower.includes('music')) {
      openness += 0.3;
    }
    
    if (hobbiesLower.includes('gym') || hobbiesLower.includes('cooking') || 
        hobbiesLower.includes('organization') || hobbiesLower.includes('planning')) {
      conscientiousness += 0.3;
    }
    
    if (hobbiesLower.includes('volunteering') || hobbiesLower.includes('helping') || 
        hobbiesLower.includes('animals') || hobbiesLower.includes('children')) {
      agreeableness += 0.3;
    }
    
    return {
      extroversion: Math.max(0, Math.min(1, extroversion)),
      openness: Math.max(0, Math.min(1, openness)),
      conscientiousness: Math.max(0, Math.min(1, conscientiousness)),
      agreeableness: Math.max(0, Math.min(1, agreeableness)),
      neuroticism: Math.max(0, Math.min(1, neuroticism))
    };
  } catch (error) {
    console.warn('⚠️ Personality analysis failed, using default values:', error);
    return {
      extroversion: 0.5,
      openness: 0.5,
      conscientiousness: 0.5,
      agreeableness: 0.5,
      neuroticism: 0.5
    };
  }
}

// Personality compatibility calculation
function calculatePersonalityCompatibility(traitsA: any, traitsB: any): number {
  try {
    const personalityFactors = ['extroversion', 'openness', 'conscientiousness', 'agreeableness', 'neuroticism'];
    let totalCompatibility = 0;
    
    for (const factor of personalityFactors) {
      const diff = Math.abs(traitsA[factor] - traitsB[factor]);
      if (factor === 'extroversion' || factor === 'openness') {
        totalCompatibility += (1 - diff);
      } else if (factor === 'neuroticism') {
        totalCompatibility += (1 - Math.max(traitsA[factor], traitsB[factor]));
      } else {
        totalCompatibility += (1 - Math.min(diff, 1 - diff));
      }
    }
    
    return totalCompatibility / personalityFactors.length;
  } catch (error) {
    console.warn('⚠️ Personality compatibility calculation failed:', error);
    return 0.5; // Default neutral score
  }
}

// Production-optimized compatibility calculation
export async function calculateCompatibility(userA: any, userB: any): Promise<number> {
  const startTime = Date.now();
  
  try {
    const responsesA = userA.formResponse || {};
    const responsesB = userB.formResponse || {};

    let totalScore = 0;
    let totalWeight = 0;

    const weights = {
      dealBreakers: 4.0,
      genderPreference: 3.0,
      ageCompatibility: 2.5,
      personality: 2.2,
      hobbies: 2.0,
      music: 1.8,
      movies: 1.8,
      vacation: 1.6,
      activity: 1.5,
      lifeGoals: 1.8,
      petFriendliness: 1.2,
      childFriendliness: 1.2,
      vices: 1.0,
      height: 0.8,
      occupation: 0.6,
      education: 0.5,
    };

    const fields = {
      hobbies: 'What are your main hobbies or interests? (Select all that apply)',
      music: 'What is your favorite music genre? (Select all that apply)',
      movies: 'What type of movie or TV show do you prefer? (Select all that apply)',
      vacation: 'Which type of vacation do you prefer? (Select all that apply)',
      vices: 'Which of the following vices would you say you have? (Select all that apply):',
      dealBreakers: 'Which of these traits would be deal breakers for you? (Select all that apply)',
      age: 'How old are you?',
      gender: 'What is your gender?',
      partnerGender: 'Which gender do you prefer for your ideal partner? (Select all that apply)',
      activity: 'How often do you engage in physical activity?',
      pet: 'How important is it that your partner is pet-friendly?',
      child: 'How important is it that your partner is child-friendly?',
      height: 'How tall are you?',
      occupation: 'What is your occupation?',
      bucketList: 'Which of these are on your bucket list? (Select all that apply)',
      education: 'What is your highest level of education?',
    };

    // Deal breakers with timeout protection
    let dealBreakerPenalty = 0;
    if (responsesA[fields.dealBreakers] && responsesB[fields.vices]) {
      const dealBreakersA = (responsesA[fields.dealBreakers] || '').toLowerCase();
      const vicesB = (responsesB[fields.vices] || '').toLowerCase();
      const dealBreakerList = dealBreakersA.split(',').map((d: string) => d.trim());
      const viceList = vicesB.split(',').map((v: string) => v.trim());
      
      const hasDealBreaker = dealBreakerList.some((dealBreaker: string) => 
        viceList.some((vice: string) => vice.includes(dealBreaker) || dealBreaker.includes(vice))
      );
      
      if (hasDealBreaker) {
        dealBreakerPenalty += weights.dealBreakers * 2;
      }
    }
    
    totalScore -= dealBreakerPenalty;
    totalWeight += weights.dealBreakers * 2;

    // Gender preference
    let genderCompatibility = 0;
    if (responsesA[fields.partnerGender] && responsesB[fields.gender]) {
      const wants = (responsesA[fields.partnerGender] || '').toLowerCase();
      const isB = (responsesB[fields.gender] || '').toLowerCase();
      if (wants.includes(isB) || wants.includes('any') || wants.includes('all')) {
        genderCompatibility += 1;
      }
    }
    totalScore += genderCompatibility * weights.genderPreference;
    totalWeight += weights.genderPreference * 2;

    // Age compatibility
    if (responsesA[fields.age] && responsesB[fields.age]) {
      const ageA = parseInt(responsesA[fields.age]);
      const ageB = parseInt(responsesB[fields.age]);
      
      if (!isNaN(ageA) && !isNaN(ageB)) {
        const ageDiff = Math.abs(ageA - ageB);
        
        let ageScore = 0;
        if (ageDiff <= 2) {
          ageScore = 1.0;
        } else if (ageDiff <= 5) {
          ageScore = 0.95;
        } else if (ageDiff <= 10) {
          ageScore = 0.85;
        } else if (ageDiff <= 15) {
          ageScore = 0.7;
        } else if (ageDiff <= 20) {
          ageScore = 0.5;
        } else {
          ageScore = 0.2;
        }
        
        totalScore += ageScore * weights.ageCompatibility;
        totalWeight += weights.ageCompatibility;
      }
    }

    // Personality compatibility
    const personalityA = analyzePersonalityTraits(responsesA);
    const personalityB = analyzePersonalityTraits(responsesB);
    const personalityScore = calculatePersonalityCompatibility(personalityA, personalityB);
    totalScore += personalityScore * weights.personality;
    totalWeight += weights.personality;

    // Parallel processing for semantic similarity calculations
    const similarityPromises = [];
    
    // Hobbies with semantic similarity
    if (responsesA[fields.hobbies] && responsesB[fields.hobbies]) {
      similarityPromises.push(
        calculateSemanticSimilarity(responsesA[fields.hobbies], responsesB[fields.hobbies])
          .then(semanticScore => {
            const jaccardScore = calculateBasicSimilarity(responsesA[fields.hobbies], responsesB[fields.hobbies]);
            const hybridScore = (semanticScore * 0.7) + (jaccardScore * 0.3);
            totalScore += hybridScore * weights.hobbies;
            totalWeight += weights.hobbies;
          })
      );
    }

    // Music with semantic similarity
    if (responsesA[fields.music] && responsesB[fields.music]) {
      similarityPromises.push(
        calculateSemanticSimilarity(responsesA[fields.music], responsesB[fields.music])
          .then(semanticScore => {
            const jaccardScore = calculateBasicSimilarity(responsesA[fields.music], responsesB[fields.music]);
            const hybridScore = (semanticScore * 0.7) + (jaccardScore * 0.3);
            totalScore += hybridScore * weights.music;
            totalWeight += weights.music;
          })
      );
    }

    // Movies with semantic similarity
    if (responsesA[fields.movies] && responsesB[fields.movies]) {
      similarityPromises.push(
        calculateSemanticSimilarity(responsesA[fields.movies], responsesB[fields.movies])
          .then(semanticScore => {
            const jaccardScore = calculateBasicSimilarity(responsesA[fields.movies], responsesB[fields.movies]);
            const hybridScore = (semanticScore * 0.7) + (jaccardScore * 0.3);
            totalScore += hybridScore * weights.movies;
            totalWeight += weights.movies;
          })
      );
    }

    // Vacation with semantic similarity
    if (responsesA[fields.vacation] && responsesB[fields.vacation]) {
      similarityPromises.push(
        calculateSemanticSimilarity(responsesA[fields.vacation], responsesB[fields.vacation])
          .then(semanticScore => {
            const jaccardScore = calculateBasicSimilarity(responsesA[fields.vacation], responsesB[fields.vacation]);
            const hybridScore = (semanticScore * 0.7) + (jaccardScore * 0.3);
            totalScore += hybridScore * weights.vacation;
            totalWeight += weights.vacation;
          })
      );
    }

    // Life goals with semantic similarity
    if (responsesA[fields.bucketList] && responsesB[fields.bucketList]) {
      similarityPromises.push(
        calculateSemanticSimilarity(responsesA[fields.bucketList], responsesB[fields.bucketList])
          .then(semanticScore => {
            const jaccardScore = calculateBasicSimilarity(responsesA[fields.bucketList], responsesB[fields.bucketList]);
            const hybridScore = (semanticScore * 0.7) + (jaccardScore * 0.3);
            totalScore += hybridScore * weights.lifeGoals;
            totalWeight += weights.lifeGoals;
          })
      );
    }

    // Wait for all semantic similarity calculations to complete
    await Promise.all(similarityPromises);

    // Activity level
    if (responsesA[fields.activity] && responsesB[fields.activity]) {
      const activityA = (responsesA[fields.activity] || '').toLowerCase();
      const activityB = (responsesB[fields.activity] || '').toLowerCase();
      
      let activityScore = 0;
      if (activityA === activityB) {
        activityScore = 1.0;
      } else if (activityA.includes('active') && activityB.includes('active')) {
        activityScore = 0.9;
      } else if (activityA.includes('moderate') && activityB.includes('moderate')) {
        activityScore = 0.8;
      } else if (activityA.includes('sedentary') && activityB.includes('sedentary')) {
        activityScore = 0.7;
      } else {
        activityScore = 0.5;
      }
      
      totalScore += activityScore * weights.activity;
      totalWeight += weights.activity;
    }

    // Pet friendliness
    if (responsesA[fields.pet] && responsesB[fields.pet]) {
      const petA = parseInt(responsesA[fields.pet]);
      const petB = parseInt(responsesB[fields.pet]);
      if (!isNaN(petA) && !isNaN(petB)) {
        const petScore = 1 - Math.abs(petA - petB) / 5;
        totalScore += petScore * weights.petFriendliness;
        totalWeight += weights.petFriendliness;
      }
    }

    // Child friendliness
    if (responsesA[fields.child] && responsesB[fields.child]) {
      const childA = parseInt(responsesA[fields.child]);
      const childB = parseInt(responsesB[fields.child]);
      if (!isNaN(childA) && !isNaN(childB)) {
        const childScore = 1 - Math.abs(childA - childB) / 5;
        totalScore += childScore * weights.childFriendliness;
        totalWeight += weights.childFriendliness;
      }
    }

    // Vices
    if (responsesA[fields.vices] && responsesB[fields.vices]) {
      const vicesA = (responsesA[fields.vices] || '').toLowerCase();
      const vicesB = (responsesB[fields.vices] || '').toLowerCase();
      
      const viceListA = vicesA.split(',').map((v: string) => v.trim());
      const viceListB = vicesB.split(',').map((v: string) => v.trim());
      
      let viceScore = 0;
      if (viceListA.length === 0 && viceListB.length === 0) {
        viceScore = 1.0;
      } else if (viceListA.length === 0 || viceListB.length === 0) {
        viceScore = 0.4;
      } else {
        const commonVices = viceListA.filter((vice: string) => viceListB.includes(vice));
        const totalVices = new Set([...viceListA, ...viceListB]);
        const overlapRatio = commonVices.length / totalVices.size;
        
        const compatibleVices = ['moderate drinking', 'social drinking', 'occasional smoking'];
        const incompatibleVices = ['excessive drinking', 'heavy smoking', 'gambling'];
        
        let compatibilityBonus = 0;
        for (const vice of commonVices) {
          if (compatibleVices.some(cv => vice.includes(cv))) {
            compatibilityBonus += 0.1;
          } else if (incompatibleVices.some(iv => vice.includes(iv))) {
            compatibilityBonus -= 0.1;
          }
        }
        
        viceScore = Math.max(0, Math.min(1, overlapRatio + compatibilityBonus));
      }
      
      totalScore += viceScore * weights.vices;
      totalWeight += weights.vices;
    }

    // Height
    if (responsesA[fields.height] && responsesB[fields.height]) {
      const heightA = parseFloat(responsesA[fields.height]);
      const heightB = parseFloat(responsesB[fields.height]);
      
      if (!isNaN(heightA) && !isNaN(heightB)) {
        const heightDiff = Math.abs(heightA - heightB);
        const heightScore = 1 - Math.min(heightDiff / 30, 1);
        totalScore += heightScore * weights.height;
        totalWeight += weights.height;
      }
    }

    // Education
    if (responsesA[fields.education] && responsesB[fields.education]) {
      const educationA = (responsesA[fields.education] || '').toLowerCase();
      const educationB = (responsesB[fields.education] || '').toLowerCase();
      
      let educationScore = 0;
      if (educationA === educationB) {
        educationScore = 1.0;
      } else {
        educationScore = 0.5;
      }
      
      totalScore += educationScore * weights.education;
      totalWeight += weights.education;
    }

    if (totalWeight === 0) {
      return 0;
    }
    
    const finalScore = totalScore / totalWeight;
    
    let adjustedScore = finalScore;
    
    if (finalScore > 0.85) {
      adjustedScore = finalScore * 1.15;
    } else if (finalScore > 0.75) {
      adjustedScore = finalScore * 1.1;
    } else if (finalScore > 0.65) {
      adjustedScore = finalScore * 1.05;
    }
    
    if (finalScore < 0.25) {
      adjustedScore = finalScore * 0.7;
    } else if (finalScore < 0.4) {
      adjustedScore = finalScore * 0.85;
    }
    
    const sigmoidScore = 1 / (1 + Math.exp(-10 * (adjustedScore - 0.5)));
    
    const result = Math.max(0, Math.min(1, sigmoidScore));
    
    const endTime = Date.now();
    console.log(`⏱️ Compatibility calculation completed in ${endTime - startTime}ms`);
    
    return result;
  } catch (error) {
    console.error('❌ Compatibility calculation failed:', error);
    return 0.5; // Return neutral score on error
  }
}

// Production-optimized compatibility breakdown
export async function getCompatibilityBreakdown(userA: any, userB: any) {
  try {
    const responsesA = userA.formResponse || {};
    const responsesB = userB.formResponse || {};

    const breakdown = {
      dealBreakers: [] as string[],
      strengths: [] as string[],
      areas: {} as Record<string, string>
    };

    const fields = {
      hobbies: 'What are your main hobbies or interests? (Select all that apply)',
      music: 'What is your favorite music genre? (Select all that apply)',
      movies: 'What type of movie or TV show do you prefer? (Select all that apply)',
      vacation: 'Which type of vacation do you prefer? (Select all that apply)',
      vices: 'Which of the following vices would you say you have? (Select all that apply):',
      dealBreakers: 'Which of these traits would be deal breakers for you? (Select all that apply)',
      age: 'How old are you?',
      gender: 'What is your gender?',
      partnerGender: 'Which gender do you prefer for your ideal partner? (Select all that apply)',
      activity: 'How often do you engage in physical activity?',
      pet: 'How important is it that your partner is pet-friendly?',
      child: 'How important is it that your partner is child-friendly?',
      height: 'How tall are you?',
      occupation: 'What is your occupation?',
      bucketList: 'Which of these are on your bucket list? (Select all that apply)',
      education: 'What is your highest level of education?',
    };

    // Check for deal breakers
    if (responsesA[fields.dealBreakers] && responsesB[fields.vices]) {
      const dealBreakersA = (responsesA[fields.dealBreakers] || '').toLowerCase();
      const vicesB = (responsesB[fields.vices] || '').toLowerCase();
      const dealBreakerList = dealBreakersA.split(',').map((d: string) => d.trim());
      const viceList = vicesB.split(',').map((v: string) => v.trim());
      
      const hasDealBreaker = dealBreakerList.some((dealBreaker: string) => 
        viceList.some((vice: string) => vice.includes(dealBreaker) || dealBreaker.includes(vice))
      );
      
      if (hasDealBreaker) {
        breakdown.dealBreakers.push('Vice compatibility issue');
      }
    }

    // Check gender preference
    if (responsesA[fields.partnerGender] && responsesB[fields.gender]) {
      const wants = (responsesA[fields.partnerGender] || '').toLowerCase();
      const isB = (responsesB[fields.gender] || '').toLowerCase();
      if (wants.includes(isB) || wants.includes('any') || wants.includes('all')) {
        breakdown.strengths.push('Gender preference match');
      } else {
        breakdown.dealBreakers.push('Gender preference mismatch');
      }
    }

    // Check age compatibility
    if (responsesA[fields.age] && responsesB[fields.age]) {
      const ageA = parseInt(responsesA[fields.age]);
      const ageB = parseInt(responsesB[fields.age]);
      
      if (!isNaN(ageA) && !isNaN(ageB)) {
        const ageDiff = Math.abs(ageA - ageB);
        
        if (ageDiff <= 5) {
          breakdown.strengths.push('Age compatibility');
        } else if (ageDiff <= 10) {
          breakdown.areas.age = 'Good age compatibility';
        } else {
          breakdown.areas.age = 'Age difference may be a concern';
        }
      }
    }

    // Check hobbies with timeout protection
    if (responsesA[fields.hobbies] && responsesB[fields.hobbies]) {
      try {
        const similarity = await Promise.race([
          calculateSemanticSimilarity(responsesA[fields.hobbies], responsesB[fields.hobbies]),
          new Promise<number>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        
        if (similarity > 0.7) {
          breakdown.strengths.push('Shared interests');
        } else if (similarity > 0.4) {
          breakdown.areas.hobbies = 'Some shared interests';
        } else {
          breakdown.areas.hobbies = 'Different interests';
        }
      } catch (error) {
        console.warn('⚠️ Hobbies similarity calculation failed:', error);
        breakdown.areas.hobbies = 'Interest compatibility unclear';
      }
    }

    return breakdown;
  } catch (error) {
    console.error('❌ Compatibility breakdown failed:', error);
    return {
      dealBreakers: ['Analysis failed'],
      strengths: [],
      areas: {}
    };
  }
}

// Cleanup function for memory management
export function cleanupMatchingResources() {
  embeddingCache.clear();
  if (sentenceTransformer) {
    // Clean up transformer resources if needed
    sentenceTransformer = null;
  }
  modelLoadingPromise = null;
}

// Health check function for production monitoring
export async function checkMatchingAlgorithmHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  aiModelLoaded: boolean;
  cacheSize: number;
  lastError?: string;
}> {
  try {
    const aiModelLoaded = sentenceTransformer !== null;
    const cacheSize = embeddingCache.size;
    
    return {
      status: aiModelLoaded ? 'healthy' : 'degraded',
      aiModelLoaded,
      cacheSize
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      aiModelLoaded: false,
      cacheSize: 0,
      lastError: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 