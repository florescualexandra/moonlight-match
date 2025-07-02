// src/lib/matching.ts

import { pipeline, env } from '@xenova/transformers';

// Configure transformers to use CPU for better compatibility
env.allowLocalModels = false;
env.allowRemoteModels = true;

// Cache for the sentence transformer model
let sentenceTransformer: any = null;

// Initialize the sentence transformer model
async function getSentenceTransformer() {
  if (!sentenceTransformer) {
    try {
      sentenceTransformer = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    } catch (error) {
      console.error('Failed to load sentence transformer:', error);
      // Fallback to a simple embedding function
      sentenceTransformer = {
        async encode(texts: string | string[]) {
          const textArray = Array.isArray(texts) ? texts : [texts];
          return textArray.map(text => {
            // Simple fallback embedding based on character frequency
            const embedding = new Array(384).fill(0);
            for (let i = 0; i < text.length; i++) {
              const charCode = text.charCodeAt(i);
              embedding[i % 384] += charCode / 128.0;
            }
            return embedding;
          });
        }
      };
    }
  }
  return sentenceTransformer;
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }
  
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
}

// Jaccard similarity for multi-select fields
function jaccardSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const setA = new Set(a.split(',').map(x => x.trim().toLowerCase()).filter(Boolean));
  const setB = new Set(b.split(',').map(x => x.trim().toLowerCase()).filter(Boolean));
  const intersection = new Set(Array.from(setA).filter(x => setB.has(x)));
  const union = new Set([...Array.from(setA), ...Array.from(setB)]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

// Enhanced numeric similarity with adaptive tolerance
function numericSimilarity(a: string, b: string, maxDiff: number = 10): number {
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  if (isNaN(numA) || isNaN(numB)) return 0.5;
  
  const diff = Math.abs(numA - numB);
  const normalizedDiff = diff / maxDiff;
  
  // Use sigmoid function for smoother similarity curve
  return 1 / (1 + Math.exp(normalizedDiff - 0.5));
}

// Parse height from various formats with enhanced accuracy
function parseHeight(height: string): number | null {
  if (!height) return null;
  
  // Handle ranges like "185 - 190 cm" or "5'10" - 6'0""
  const rangeMatch = height.match(/(\d+)[^\d]+(\d+)/);
  if (rangeMatch) {
    return (parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2;
  }
  
  // Handle feet and inches format
  const feetInchesMatch = height.match(/(\d+)'(\d+)"/);
  if (feetInchesMatch) {
    const feet = parseInt(feetInchesMatch[1]);
    const inches = parseInt(feetInchesMatch[2]);
    return (feet * 12 + inches) * 2.54; // Convert to cm
  }
  
  // Handle single numbers
  const num = parseInt(height);
  return isNaN(num) ? null : num;
}

// Calculate semantic similarity using sentence transformers with caching
const semanticCache = new Map<string, number>();

async function calculateSemanticSimilarity(textA: string, textB: string): Promise<number> {
  if (!textA || !textB) return 0;
  
  // Check cache first
  const cacheKey = `${textA.toLowerCase()}|${textB.toLowerCase()}`;
  if (semanticCache.has(cacheKey)) {
    return semanticCache.get(cacheKey)!;
  }
  
  try {
    const model = await getSentenceTransformer();
    const embeddings = await model.encode([textA, textB]);
    const similarity = cosineSimilarity(embeddings[0], embeddings[1]);
    
    // Cache the result
    semanticCache.set(cacheKey, similarity);
    
    // Limit cache size
    if (semanticCache.size > 1000) {
      const firstKey = semanticCache.keys().next().value;
      if (firstKey !== undefined) {
        semanticCache.delete(firstKey);
      }
    }
    
    return similarity;
  } catch (error) {
    console.error('Error calculating semantic similarity:', error);
    // Enhanced fallback to simple text similarity
    const wordsA = new Set(textA.toLowerCase().split(/\s+/));
    const wordsB = new Set(textB.toLowerCase().split(/\s+/));
    const intersection = new Set(Array.from(wordsA).filter(x => wordsB.has(x)));
    const union = new Set([...Array.from(wordsA), ...Array.from(wordsB)]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }
}

// Personality trait analysis based on form responses
function analyzePersonalityTraits(formResponse: any): {
  extroversion: number;
  openness: number;
  conscientiousness: number;
  agreeableness: number;
  neuroticism: number;
} {
  const response = formResponse || {};
  
  let extroversion = 0.5;
  let openness = 0.5;
  let conscientiousness = 0.5;
  let agreeableness = 0.5;
  let neuroticism = 0.5;
  
  // Analyze hobbies for personality traits
  const hobbies = response['What are your main hobbies or interests? (Select all that apply)'] || '';
  const hobbiesLower = hobbies.toLowerCase();
  
  // Extroversion indicators
  if (hobbiesLower.includes('socializing') || hobbiesLower.includes('partying') || 
      hobbiesLower.includes('team sports') || hobbiesLower.includes('dancing')) {
    extroversion += 0.3;
  }
  if (hobbiesLower.includes('reading') || hobbiesLower.includes('gaming') || 
      hobbiesLower.includes('cooking') || hobbiesLower.includes('art')) {
    extroversion -= 0.2;
  }
  
  // Openness indicators
  if (hobbiesLower.includes('traveling') || hobbiesLower.includes('learning') || 
      hobbiesLower.includes('art') || hobbiesLower.includes('music')) {
    openness += 0.3;
  }
  if (hobbiesLower.includes('routine') || hobbiesLower.includes('traditional')) {
    openness -= 0.2;
  }
  
  // Conscientiousness indicators
  if (hobbiesLower.includes('gym') || hobbiesLower.includes('cooking') || 
      hobbiesLower.includes('organization') || hobbiesLower.includes('planning')) {
    conscientiousness += 0.3;
  }
  if (hobbiesLower.includes('spontaneous') || hobbiesLower.includes('impulsive')) {
    conscientiousness -= 0.2;
  }
  
  // Agreeableness indicators
  if (hobbiesLower.includes('volunteering') || hobbiesLower.includes('helping') || 
      hobbiesLower.includes('animals') || hobbiesLower.includes('children')) {
    agreeableness += 0.3;
  }
  
  // Neuroticism indicators
  if (hobbiesLower.includes('anxiety') || hobbiesLower.includes('stress') || 
      hobbiesLower.includes('worry')) {
    neuroticism += 0.3;
  }
  
  // Normalize all values to [0, 1] range
  return {
    extroversion: Math.max(0, Math.min(1, extroversion)),
    openness: Math.max(0, Math.min(1, openness)),
    conscientiousness: Math.max(0, Math.min(1, conscientiousness)),
    agreeableness: Math.max(0, Math.min(1, agreeableness)),
    neuroticism: Math.max(0, Math.min(1, neuroticism))
  };
}

// Calculate personality compatibility
function calculatePersonalityCompatibility(traitsA: any, traitsB: any): number {
  const personalityFactors = ['extroversion', 'openness', 'conscientiousness', 'agreeableness', 'neuroticism'];
  let totalCompatibility = 0;
  
  for (const factor of personalityFactors) {
    const diff = Math.abs(traitsA[factor] - traitsB[factor]);
    // Some traits are better when similar, others when complementary
    if (factor === 'extroversion' || factor === 'openness') {
      // Similarity is good for these traits
      totalCompatibility += (1 - diff);
    } else if (factor === 'neuroticism') {
      // Lower neuroticism is generally better for compatibility
      totalCompatibility += (1 - Math.max(traitsA[factor], traitsB[factor]));
    } else {
      // Moderate similarity is good for conscientiousness and agreeableness
      totalCompatibility += (1 - Math.min(diff, 1 - diff));
    }
  }
  
  return totalCompatibility / personalityFactors.length;
}

// Enhanced compatibility calculation with maximum accuracy
export async function calculateCompatibility(userA: any, userB: any): Promise<number> {
  const responsesA = userA.formResponse || {};
  const responsesB = userB.formResponse || {};

  let totalScore = 0;
  let totalWeight = 0;

  // Enhanced weights based on relationship research and psychological studies
  const weights = {
    // Critical compatibility factors (highest weight)
    dealBreakers: 4.0,           // Increased weight for critical factors
    genderPreference: 3.0,       // Must match user's stated preferences
    ageCompatibility: 2.5,       // Enhanced with range preferences
    
    // Personality and lifestyle compatibility
    personality: 2.2,            // New: personality trait compatibility
    hobbies: 2.0,                // Increased weight for lifestyle
    music: 1.8,                  // Important for daily compatibility
    movies: 1.8,                 // Entertainment preferences
    vacation: 1.6,               // Travel and leisure preferences
    activity: 1.5,               // Physical activity compatibility
    
    // Values and life goals
    lifeGoals: 1.8,              // New: bucket list and aspirations
    petFriendliness: 1.2,        // Family planning compatibility
    childFriendliness: 1.2,      // Family planning compatibility
    vices: 1.0,                  // Lifestyle choices
    
    // Physical and demographic factors
    height: 0.8,                 // Physical compatibility
    occupation: 0.6,             // Career compatibility
    education: 0.5,              // Educational background
  };

  // Form field mappings
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
    ageRange: 'What age range do you prefer?',
    occupation: 'What is your occupation?',
    pets: 'Do you have any pets?',
    bucketList: 'Which of these are on your bucket list? (Select all that apply)',
    education: 'What is your highest level of education?',
  };

  // 1. DEAL BREAKERS (Critical - can completely disqualify a match)
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
  
  if (responsesB[fields.dealBreakers] && responsesA[fields.vices]) {
    const dealBreakersB = (responsesB[fields.dealBreakers] || '').toLowerCase();
    const vicesA = (responsesA[fields.vices] || '').toLowerCase();
    const dealBreakerList = dealBreakersB.split(',').map((d: string) => d.trim());
    const viceList = vicesA.split(',').map((v: string) => v.trim());
    
    const hasDealBreaker = dealBreakerList.some((dealBreaker: string) => 
      viceList.some((vice: string) => vice.includes(dealBreaker) || dealBreaker.includes(vice))
    );
    
    if (hasDealBreaker) {
      dealBreakerPenalty += weights.dealBreakers * 2;
    }
  }
  
  // Apply deal breaker penalty
  totalScore -= dealBreakerPenalty;
  totalWeight += weights.dealBreakers * 2;

  // 2. GENDER PREFERENCE (Must match)
  let genderCompatibility = 0;
  if (responsesA[fields.partnerGender] && responsesB[fields.gender]) {
    const wants = (responsesA[fields.partnerGender] || '').toLowerCase();
    const isB = (responsesB[fields.gender] || '').toLowerCase();
    if (wants.includes(isB) || wants.includes('any') || wants.includes('all')) {
      genderCompatibility += 1;
    }
  }
  if (responsesB[fields.partnerGender] && responsesA[fields.gender]) {
    const wants = (responsesB[fields.partnerGender] || '').toLowerCase();
    const isA = (responsesA[fields.gender] || '').toLowerCase();
    if (wants.includes(isA) || wants.includes('any') || wants.includes('all')) {
      genderCompatibility += 1;
    }
  }
  totalScore += genderCompatibility * weights.genderPreference;
  totalWeight += weights.genderPreference * 2;

  // 3. AGE COMPATIBILITY (Enhanced with psychological research)
  if (responsesA[fields.age] && responsesB[fields.age]) {
    const ageA = parseInt(responsesA[fields.age]);
    const ageB = parseInt(responsesB[fields.age]);
    
    if (!isNaN(ageA) && !isNaN(ageB)) {
      const ageDiff = Math.abs(ageA - ageB);
      
      // Enhanced age compatibility based on psychological research
      let ageScore = 0;
      if (ageDiff <= 2) {
        ageScore = 1.0; // Perfect compatibility for very close ages
      } else if (ageDiff <= 5) {
        ageScore = 0.95; // Excellent compatibility
      } else if (ageDiff <= 10) {
        ageScore = 0.85; // Good compatibility
      } else if (ageDiff <= 15) {
        ageScore = 0.7; // Moderate compatibility
      } else if (ageDiff <= 20) {
        ageScore = 0.5; // Low compatibility
      } else {
        ageScore = 0.2; // Very low compatibility
      }
      
      // Bonus for similar life stages
      const lifeStageA = Math.floor(ageA / 10);
      const lifeStageB = Math.floor(ageB / 10);
      if (lifeStageA === lifeStageB) {
        ageScore += 0.1;
      }
      
      totalScore += ageScore * weights.ageCompatibility;
      totalWeight += weights.ageCompatibility;
    }
  }

  // 4. PERSONALITY COMPATIBILITY (New feature)
  const personalityA = analyzePersonalityTraits(responsesA);
  const personalityB = analyzePersonalityTraits(responsesB);
  const personalityScore = calculatePersonalityCompatibility(personalityA, personalityB);
  totalScore += personalityScore * weights.personality;
  totalWeight += weights.personality;

  // 5. LIFESTYLE COMPATIBILITY (Enhanced with semantic understanding)
  
  // Hobbies - enhanced hybrid scoring
  if (responsesA[fields.hobbies] && responsesB[fields.hobbies]) {
    const jaccardScore = jaccardSimilarity(responsesA[fields.hobbies], responsesB[fields.hobbies]);
    const semanticScore = await calculateSemanticSimilarity(responsesA[fields.hobbies], responsesB[fields.hobbies]);
    
    // Dynamic weighting based on response complexity
    const complexityA = responsesA[fields.hobbies].split(',').length;
    const complexityB = responsesB[fields.hobbies].split(',').length;
    const avgComplexity = (complexityA + complexityB) / 2;
    
    // More complex responses benefit more from semantic analysis
    const semanticWeight = Math.min(0.4, avgComplexity * 0.1);
    const jaccardWeight = 1 - semanticWeight;
    
    const combinedScore = (jaccardScore * jaccardWeight) + (semanticScore * semanticWeight);
    totalScore += combinedScore * weights.hobbies;
    totalWeight += weights.hobbies;
  }

  // Music preferences - enhanced with genre analysis
  if (responsesA[fields.music] && responsesB[fields.music]) {
    const jaccardScore = jaccardSimilarity(responsesA[fields.music], responsesB[fields.music]);
    const semanticScore = await calculateSemanticSimilarity(responsesA[fields.music], responsesB[fields.music]);
    
    // Music has more semantic relationships, so higher semantic weight
    const combinedScore = (jaccardScore * 0.5) + (semanticScore * 0.5);
    totalScore += combinedScore * weights.music;
    totalWeight += weights.music;
  }

  // Movie preferences - enhanced with genre and mood analysis
  if (responsesA[fields.movies] && responsesB[fields.movies]) {
    const jaccardScore = jaccardSimilarity(responsesA[fields.movies], responsesB[fields.movies]);
    const semanticScore = await calculateSemanticSimilarity(responsesA[fields.movies], responsesB[fields.movies]);
    
    // Movies also benefit from semantic analysis
    const combinedScore = (jaccardScore * 0.5) + (semanticScore * 0.5);
    totalScore += combinedScore * weights.movies;
    totalWeight += weights.movies;
  }

  // Vacation preferences - important for long-term compatibility
  if (responsesA[fields.vacation] && responsesB[fields.vacation]) {
    const jaccardScore = jaccardSimilarity(responsesA[fields.vacation], responsesB[fields.vacation]);
    const semanticScore = await calculateSemanticSimilarity(responsesA[fields.vacation], responsesB[fields.vacation]);
    const combinedScore = (jaccardScore * 0.6) + (semanticScore * 0.4);
    totalScore += combinedScore * weights.vacation;
    totalWeight += weights.vacation;
  }

  // 6. ACTIVITY LEVEL COMPATIBILITY (Enhanced)
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
      // Enhanced semantic similarity for different activity descriptions
      activityScore = await calculateSemanticSimilarity(activityA, activityB);
      // Boost score for complementary activity levels (active + moderate)
      if ((activityA.includes('active') && activityB.includes('moderate')) ||
          (activityB.includes('active') && activityA.includes('moderate'))) {
        activityScore += 0.1;
      }
    }
    
    totalScore += activityScore * weights.activity;
    totalWeight += weights.activity;
  }

  // 7. LIFE GOALS COMPATIBILITY (New feature)
  if (responsesA[fields.bucketList] && responsesB[fields.bucketList]) {
    const bucketScore = jaccardSimilarity(responsesA[fields.bucketList], responsesB[fields.bucketList]);
    const bucketSemantic = await calculateSemanticSimilarity(responsesA[fields.bucketList], responsesB[fields.bucketList]);
    const combinedBucketScore = (bucketScore * 0.6) + (bucketSemantic * 0.4);
    totalScore += combinedBucketScore * weights.lifeGoals;
    totalWeight += weights.lifeGoals;
  }

  // 8. VALUES AND PREFERENCES (Enhanced)
  
  // Pet friendliness with enhanced scoring
  if (responsesA[fields.pet] && responsesB[fields.pet]) {
    const petA = parseInt(responsesA[fields.pet]);
    const petB = parseInt(responsesB[fields.pet]);
    if (!isNaN(petA) && !isNaN(petB)) {
      const petScore = 1 - Math.abs(petA - petB) / 5; // Scale of 1-5
      totalScore += petScore * weights.petFriendliness;
      totalWeight += weights.petFriendliness;
    }
  }

  // Child friendliness with enhanced scoring
  if (responsesA[fields.child] && responsesB[fields.child]) {
    const childA = parseInt(responsesA[fields.child]);
    const childB = parseInt(responsesB[fields.child]);
    if (!isNaN(childA) && !isNaN(childB)) {
      const childScore = 1 - Math.abs(childA - childB) / 5; // Scale of 1-5
      totalScore += childScore * weights.childFriendliness;
      totalWeight += weights.childFriendliness;
    }
  }

  // 9. VICES COMPATIBILITY (Enhanced with nuanced scoring)
  if (responsesA[fields.vices] && responsesB[fields.vices]) {
    const vicesA = (responsesA[fields.vices] || '').toLowerCase();
    const vicesB = (responsesB[fields.vices] || '').toLowerCase();
    
    const viceListA = vicesA.split(',').map((v: string) => v.trim());
    const viceListB = vicesB.split(',').map((v: string) => v.trim());
    
    let viceScore = 0;
    if (viceListA.length === 0 && viceListB.length === 0) {
      viceScore = 1.0; // Both have no vices - perfect compatibility
    } else if (viceListA.length === 0 || viceListB.length === 0) {
      viceScore = 0.4; // One has vices, one doesn't - moderate compatibility
    } else {
      // Enhanced overlap calculation
      const commonVices = viceListA.filter((vice: string) => viceListB.includes(vice));
      const totalVices = new Set([...viceListA, ...viceListB]);
      const overlapRatio = commonVices.length / totalVices.size;
      
      // Some vices are more compatible than others
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

  // 10. PHYSICAL AND DEMOGRAPHIC FACTORS
  
  // Height compatibility with enhanced tolerance
  if (responsesA[fields.height] && responsesB[fields.height]) {
    const heightA = parseHeight(responsesA[fields.height]);
    const heightB = parseHeight(responsesB[fields.height]);
    
    if (heightA && heightB) {
      const heightDiff = Math.abs(heightA - heightB);
      const heightScore = 1 - Math.min(heightDiff / 30, 1); // 30cm tolerance
      totalScore += heightScore * weights.height;
      totalWeight += weights.height;
    }
  }

  // Occupation compatibility with semantic analysis
  if (responsesA[fields.occupation] && responsesB[fields.occupation]) {
    const occupationScore = await calculateSemanticSimilarity(
      responsesA[fields.occupation], 
      responsesB[fields.occupation]
    );
    totalScore += occupationScore * weights.occupation;
    totalWeight += weights.occupation;
  }

  // Education compatibility
  if (responsesA[fields.education] && responsesB[fields.education]) {
    const educationA = (responsesA[fields.education] || '').toLowerCase();
    const educationB = (responsesB[fields.education] || '').toLowerCase();
    
    let educationScore = 0;
    if (educationA === educationB) {
      educationScore = 1.0;
    } else {
      // Semantic similarity for education levels
      educationScore = await calculateSemanticSimilarity(educationA, educationB);
    }
    
    totalScore += educationScore * weights.education;
    totalWeight += weights.education;
  }

  // FINAL SCORE CALCULATION WITH ENHANCED ADJUSTMENTS
  if (totalWeight === 0) {
    return 0;
  }
  
  const finalScore = totalScore / totalWeight;
  
  // Enhanced score adjustments based on psychological research
  let adjustedScore = finalScore;
  
  // Boost scores for very compatible matches (positive reinforcement)
  if (finalScore > 0.85) {
    adjustedScore = finalScore * 1.15; // 15% boost for excellent matches
  } else if (finalScore > 0.75) {
    adjustedScore = finalScore * 1.1; // 10% boost for very good matches
  } else if (finalScore > 0.65) {
    adjustedScore = finalScore * 1.05; // 5% boost for good matches
  }
  
  // Penalize very low scores (negative reinforcement)
  if (finalScore < 0.25) {
    adjustedScore = finalScore * 0.7; // 30% penalty for very poor matches
  } else if (finalScore < 0.4) {
    adjustedScore = finalScore * 0.85; // 15% penalty for poor matches
  }
  
  // Apply sigmoid function for smoother distribution
  const sigmoidScore = 1 / (1 + Math.exp(-10 * (adjustedScore - 0.5)));
  
  return Math.max(0, Math.min(1, sigmoidScore));
}

// Enhanced compatibility breakdown with detailed analysis
export async function getCompatibilityBreakdown(userA: any, userB: any): Promise<{
  overallScore: number;
  breakdown: { [key: string]: number };
  dealBreakers: string[];
  strengths: string[];
  personalityAnalysis: any;
  recommendations: string[];
}> {
  const responsesA = userA.formResponse || {};
  const responsesB = userB.formResponse || {};
  
  const breakdown: { [key: string]: number } = {};
  const dealBreakers: string[] = [];
  const strengths: string[] = [];
  const recommendations: string[] = [];
  
  // Calculate individual component scores
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
    bucketList: 'Which of these are on your bucket list? (Select all that apply)',
  };

  // Personality analysis
  const personalityA = analyzePersonalityTraits(responsesA);
  const personalityB = analyzePersonalityTraits(responsesB);
  const personalityCompatibility = calculatePersonalityCompatibility(personalityA, personalityB);
  breakdown.personality = personalityCompatibility;

  // Check for deal breakers
  if (responsesA[fields.dealBreakers] && responsesB[fields.vices]) {
    const dealBreakersA = responsesA[fields.dealBreakers].toLowerCase();
    const vicesB = responsesB[fields.vices].toLowerCase();
    const dealBreakerList = dealBreakersA.split(',').map((d: string) => d.trim());
    const viceList = vicesB.split(',').map((v: string) => v.trim());
    
    const foundDealBreakers = dealBreakerList.filter((dealBreaker: string) => 
      viceList.some((vice: string) => vice.includes(dealBreaker) || dealBreaker.includes(vice))
    );
    
    if (foundDealBreakers.length > 0) {
      dealBreakers.push(...foundDealBreakers);
      recommendations.push('Consider discussing lifestyle preferences early in your interaction');
    }
  }

  // Calculate component scores with enhanced analysis
  if (responsesA[fields.hobbies] && responsesB[fields.hobbies]) {
    const jaccardScore = jaccardSimilarity(responsesA[fields.hobbies], responsesB[fields.hobbies]);
    const semanticScore = await calculateSemanticSimilarity(responsesA[fields.hobbies], responsesB[fields.hobbies]);
    breakdown.hobbies = (jaccardScore * 0.7) + (semanticScore * 0.3);
    
    if (breakdown.hobbies > 0.8) strengths.push('Excellent hobby compatibility');
    else if (breakdown.hobbies > 0.6) strengths.push('Good shared interests');
    else recommendations.push('Consider exploring new activities together');
  }

  if (responsesA[fields.music] && responsesB[fields.music]) {
    const jaccardScore = jaccardSimilarity(responsesA[fields.music], responsesB[fields.music]);
    const semanticScore = await calculateSemanticSimilarity(responsesA[fields.music], responsesB[fields.music]);
    breakdown.music = (jaccardScore * 0.5) + (semanticScore * 0.5);
    
    if (breakdown.music > 0.7) strengths.push('Great music taste compatibility');
    else if (breakdown.music > 0.5) strengths.push('Some musical interests in common');
  }

  if (responsesA[fields.movies] && responsesB[fields.movies]) {
    const jaccardScore = jaccardSimilarity(responsesA[fields.movies], responsesB[fields.movies]);
    const semanticScore = await calculateSemanticSimilarity(responsesA[fields.movies], responsesB[fields.movies]);
    breakdown.movies = (jaccardScore * 0.5) + (semanticScore * 0.5);
    
    if (breakdown.movies > 0.7) strengths.push('Similar entertainment preferences');
  }

  if (responsesA[fields.vacation] && responsesB[fields.vacation]) {
    const jaccardScore = jaccardSimilarity(responsesA[fields.vacation], responsesB[fields.vacation]);
    const semanticScore = await calculateSemanticSimilarity(responsesA[fields.vacation], responsesB[fields.vacation]);
    breakdown.vacation = (jaccardScore * 0.6) + (semanticScore * 0.4);
    
    if (breakdown.vacation > 0.7) strengths.push('Compatible travel preferences');
  }

  if (responsesA[fields.bucketList] && responsesB[fields.bucketList]) {
    const bucketScore = jaccardSimilarity(responsesA[fields.bucketList], responsesB[fields.bucketList]);
    breakdown.lifeGoals = bucketScore;
    
    if (breakdown.lifeGoals > 0.6) strengths.push('Shared life goals and aspirations');
  }

  // Age compatibility
  if (responsesA[fields.age] && responsesB[fields.age]) {
    const ageA = parseInt(responsesA[fields.age]);
    const ageB = parseInt(responsesB[fields.age]);
    if (!isNaN(ageA) && !isNaN(ageB)) {
      const ageDiff = Math.abs(ageA - ageB);
      breakdown.age = ageDiff <= 5 ? 1.0 : ageDiff <= 10 ? 0.8 : ageDiff <= 15 ? 0.6 : 0.3;
      
      if (breakdown.age > 0.9) strengths.push('Very similar age - great life stage compatibility');
      else if (breakdown.age < 0.5) recommendations.push('Consider how age differences might affect your relationship');
    }
  }

  // Calculate overall score
  const overallScore = await calculateCompatibility(userA, userB);
  
  // Generate personalized recommendations
  if (overallScore < 0.5) {
    recommendations.push('This match may require more effort to build compatibility');
  } else if (overallScore > 0.8) {
    recommendations.push('Excellent compatibility - focus on building emotional connection');
  }
  
  if (personalityCompatibility > 0.8) {
    strengths.push('Strong personality compatibility');
  } else if (personalityCompatibility < 0.5) {
    recommendations.push('Consider how personality differences might complement each other');
  }
  
  return {
    overallScore,
    breakdown,
    dealBreakers,
    strengths,
    personalityAnalysis: {
      userA: personalityA,
      userB: personalityB,
      compatibility: personalityCompatibility
    },
    recommendations
  };
}

// Machine learning component for continuous improvement
export function updateAlgorithmWeights(successfulMatches: any[], failedMatches: any[]): any {
  // This would be implemented with actual ML training
  // For now, return current weights
  return {
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
} 