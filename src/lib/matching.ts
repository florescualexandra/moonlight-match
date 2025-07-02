// src/lib/matching.ts

import { pipeline, env } from '@xenova/transformers';

// Configure transformers to use CPU for better compatibility
env.allowLocalModels = false;
env.allowRemoteModels = true;
// Set cache directory to /tmp for Vercel compatibility
env.cacheDir = '/tmp';

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
        async embed(texts: string | string[]) {
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

function flattenEmbedding(embedding: any): number[] {
  // Recursively flatten to 1D array
  if (!Array.isArray(embedding)) return [embedding];
  return embedding.reduce(
    (acc: number[], val: any) => acc.concat(flattenEmbedding(val)),
    []
  );
}

async function calculateSemanticSimilarity(textA: string, textB: string): Promise<number> {
  if (!textA || !textB) return 0;
  // Check cache first
  const cacheKey = `${textA.toLowerCase()}|${textB.toLowerCase()}`;
  if (semanticCache.has(cacheKey)) {
    return semanticCache.get(cacheKey)!;
  }
  try {
    const model = await getSentenceTransformer();
    const embeddings = await model([textA, textB]);
    const embA = flattenEmbedding(embeddings[0]);
    const embB = flattenEmbedding(embeddings[1]);
    const similarity = cosineSimilarity(embA, embB);
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
  const fields = {
    hobbies: "What are your main hobbies or interests? (Select all that apply)",
    music: "What is your favorite music genre? (Select all that apply)",
    movies: "What type of movie or TV show do you prefer? (Select all that apply)",
    age: "How old are you?",
    gender: "What is your gender?",
    partnerGender: "Which gender do you prefer for your ideal partner? (Select all that apply)",
    height: "How tall are you?",
    partnerPhysical: "What physical attributes are most attractive to you in a partner? (Select all that apply)",
    agePref: "What age range do you prefer?",
    dealBreakers: "Which of these traits would be deal breakers for you? (Select all that apply)",
    vices: "Which of the following vices would you say you have? (Select all that apply):",
  };

  const responsesA = userA.formResponse || {};
  const responsesB = userB.formResponse || {};

  // --- HARD DEALBREAKERS ---
  // Robust parsing helpers
  function parseGender(val: any): string[] {
    if (!val) return [];
    if (Array.isArray(val)) return val.map((v) => v.toLowerCase().trim());
    return val.split(',').map((v: string) => v.toLowerCase().trim()).filter(Boolean);
  }
  function parseAgeRange(str: string): [number, number] | null {
    if (!str || /no preference/i.test(str)) return null;
    const match = str.match(/(\d+)[^\d]+(\d+)/);
    if (match) return [parseInt(match[1]), parseInt(match[2])];
    return null;
  }

  // Parse gender and gender preference as arrays
  const genderPrefA = parseGender(responsesA[fields.partnerGender]);
  const genderA = parseGender(responsesA[fields.gender]);
  const genderPrefB = parseGender(responsesB[fields.partnerGender]);
  const genderB = parseGender(responsesB[fields.gender]);

  // For debug: get emails if available
  const emailA = responsesA["What is your email address? (the one used for creating the user as well)"] || userA.email || userA.id;
  const emailB = responsesB["What is your email address? (the one used for creating the user as well)"] || userB.email || userB.id;

  // Gender preference check (allow 'any', 'all', or empty = no preference)
  if (
    genderPrefA.length && genderB.length &&
    !genderPrefA.some((pref) => genderB.includes(pref) || pref === 'any' || pref === 'all')
  ) {
    console.log(`[MATCH-DEBUG] Gender dealbreaker: ${emailA} wants ${genderPrefA} but ${emailB} is ${genderB}`);
    return 0;
  }
  if (
    genderPrefB.length && genderA.length &&
    !genderPrefB.some((pref) => genderA.includes(pref) || pref === 'any' || pref === 'all')
  ) {
    console.log(`[MATCH-DEBUG] Gender dealbreaker: ${emailB} wants ${genderPrefB} but ${emailA} is ${genderA}`);
    return 0;
  }

  // 2. Height preference (if 'Tall' is required)
  const heightA = parseHeight(responsesA[fields.height] || "");
  const heightB = parseHeight(responsesB[fields.height] || "");
  const partnerPhysicalA = (responsesA[fields.partnerPhysical] || "").toLowerCase();
  const partnerPhysicalB = (responsesB[fields.partnerPhysical] || "").toLowerCase();
  // Use first gender if multiple (should be only one)
  const gA = genderA[0] || "";
  const gB = genderB[0] || "";
  if (partnerPhysicalA.includes("tall")) {
    if ((gB === "male" && (heightB === null || heightB < 175)) || (gB === "female" && (heightB === null || heightB < 170))) {
      console.log(`[MATCH-DEBUG] Height dealbreaker: ${emailA} wants tall, but ${emailB} is ${heightB}cm (${gB})`);
      return 0;
    }
  }
  if (partnerPhysicalB.includes("tall")) {
    if ((gA === "male" && (heightA === null || heightA < 175)) || (gA === "female" && (heightA === null || heightA < 170))) {
      console.log(`[MATCH-DEBUG] Height dealbreaker: ${emailB} wants tall, but ${emailA} is ${heightA}cm (${gA})`);
      return 0;
    }
  }

  // 3. Age preference (handle 'No preference' and empty gracefully)
  const ageA = parseInt(responsesA[fields.age]);
  const ageB = parseInt(responsesB[fields.age]);
  const agePrefA = parseAgeRange(responsesA[fields.agePref] || "");
  const agePrefB = parseAgeRange(responsesB[fields.agePref] || "");
  if (agePrefA && (isNaN(ageB) || ageB < agePrefA[0] || ageB > agePrefA[1])) {
    console.log(`[MATCH-DEBUG] Age dealbreaker: ${emailA} wants ${agePrefA[0]}–${agePrefA[1]}, but ${emailB} is ${ageB}`);
    return 0;
  }
  if (agePrefB && (isNaN(ageA) || ageA < agePrefB[0] || ageA > agePrefB[1])) {
    console.log(`[MATCH-DEBUG] Age dealbreaker: ${emailB} wants ${agePrefB[0]}–${agePrefB[1]}, but ${emailA} is ${ageA}`);
    return 0;
  }

  // 4. Dealbreakers (toxic traits)
  function toArray(val: any): string[] {
    if (!val) return [];
    if (Array.isArray(val)) return val.map((v) => v.toLowerCase());
    return val.split(',').map((v: string) => v.trim().toLowerCase());
  }
  const dealBreakersA = toArray(responsesA[fields.dealBreakers]);
  const vicesB = toArray(responsesB[fields.vices]);
  const dealBreakersB = toArray(responsesB[fields.dealBreakers]);
  const vicesA = toArray(responsesA[fields.vices]);
  if (dealBreakersA.some((db) => vicesB.some((v) => v.includes(db) || db.includes(v)))) {
    console.log(`[MATCH-DEBUG] Dealbreaker: ${emailA} cannot accept ${dealBreakersA} but ${emailB} has ${vicesB}`);
    return 0;
  }
  if (dealBreakersB.some((db) => vicesA.some((v) => v.includes(db) || db.includes(v)))) {
    console.log(`[MATCH-DEBUG] Dealbreaker: ${emailB} cannot accept ${dealBreakersB} but ${emailA} has ${vicesA}`);
    return 0;
  }

  let totalScore = 0;
  let totalWeight = 0;

  const weights = {
    hobbies: 2,
    music: 1.5,
    movies: 1.5,
    age: 2,
    gender: 2,
  };

  // Hobbies
  if (responsesA[fields.hobbies] && responsesB[fields.hobbies]) {
    const setA = new Set(responsesA[fields.hobbies].split(',').map((x: string) => x.trim().toLowerCase()));
    const setB = new Set(responsesB[fields.hobbies].split(',').map((x: string) => x.trim().toLowerCase()));
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    const score = union.size ? intersection.size / union.size : 0.5;
    totalScore += score * weights.hobbies;
    totalWeight += weights.hobbies;
  }

  // Music
  if (responsesA[fields.music] && responsesB[fields.music]) {
    const score = responsesA[fields.music] === responsesB[fields.music] ? 1 : 0.5;
    totalScore += score * weights.music;
    totalWeight += weights.music;
  }

  // Movies
  if (responsesA[fields.movies] && responsesB[fields.movies]) {
    const score = responsesA[fields.movies] === responsesB[fields.movies] ? 1 : 0.5;
    totalScore += score * weights.movies;
    totalWeight += weights.movies;
  }

  // Age
  if (responsesA[fields.age] && responsesB[fields.age]) {
    const ageA = parseInt(responsesA[fields.age]);
    const ageB = parseInt(responsesB[fields.age]);
    if (!isNaN(ageA) && !isNaN(ageB)) {
      const diff = Math.abs(ageA - ageB);
      const score = 1 - Math.min(diff / 10, 1); // 10 years tolerance
      totalScore += score * weights.age;
      totalWeight += weights.age;
    }
  }

  // Gender
  if (responsesA[fields.gender] && responsesB[fields.gender]) {
    const score = responsesA[fields.gender] === responsesB[fields.gender] ? 1 : 0.5;
    totalScore += score * weights.gender;
    totalWeight += weights.gender;
  }

  if (totalWeight === 0) return 0.5;
  return Math.max(0, Math.min(1, totalScore / totalWeight));
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