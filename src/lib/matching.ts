// src/lib/matching.ts

// A placeholder for sentence transformer embeddings
async function getEmbedding(text: string): Promise<number[]> {
  // In a real implementation, this would use a model like Xenova/all-MiniLM-L6-v2
  // For now, we simulate it by returning an array based on text length
  console.log(`Generating embedding for: "${text}"`);
  // This is a simplistic placeholder. A real model would produce a fixed-size vector.
  return Array.from({ length: 384 }, (_, i) => text.charCodeAt(i % text.length) / 128.0);
}

// Calculates cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }
  
  const dotProduct = vecA.map((val, i) => val * vecB[i]).reduce((sum, current) => sum + current, 0);
  const magnitudeA = Math.sqrt(vecA.map(val => val * val).reduce((sum, current) => sum + current, 0));
  const magnitudeB = Math.sqrt(vecB.map(val => val * val).reduce((sum, current) => sum + current, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
}

// Main function to calculate compatibility between two users
export async function calculateCompatibility(userA: any, userB: any): Promise<number> {
  const responsesA = userA.formResponse || {};
  const responsesB = userB.formResponse || {};

  let totalScore = 0;
  let totalWeight = 0;

  // --- Define Weights for each question ---
  const weights: { [key: string]: number } = {
    'Hobbies': 1.5,
    'Favorite Music Genre': 1.2,
    'Preferred Movie/TV Genre': 1.2,
    'Vacation Type': 1.0,
    'Deal Breakers': 2.0, // High importance
    'Vices': 1.5,
  };

  // --- Calculate similarity for different fields ---

  // 1. Hobbies (Text-based, comma-separated)
  if (responsesA['Hobbies'] && responsesB['Hobbies']) {
    const hobbiesA = await getEmbedding(String(responsesA['Hobbies']));
    const hobbiesB = await getEmbedding(String(responsesB['Hobbies']));
    const score = cosineSimilarity(hobbiesA, hobbiesB);
    totalScore += score * weights['Hobbies'];
    totalWeight += weights['Hobbies'];
  }
  
  // 2. Favorite Music Genre (Text-based, comma-separated)
  if (responsesA['Favorite Music Genre'] && responsesB['Favorite Music Genre']) {
    const musicA = await getEmbedding(String(responsesA['Favorite Music Genre']));
    const musicB = await getEmbedding(String(responsesB['Favorite Music Genre']));
    const score = cosineSimilarity(musicA, musicB);
    totalScore += score * weights['Favorite Music Genre'];
    totalWeight += weights['Favorite Music Genre'];
  }
  
  // 3. Movie/TV Genre (Text-based, comma-separated)
  if (responsesA['Preferred Movie/TV Genre'] && responsesB['Preferred Movie/TV Genre']) {
    const movieA = await getEmbedding(String(responsesA['Preferred Movie/TV Genre']));
    const movieB = await getEmbedding(String(responsesB['Preferred Movie/TV Genre']));
    const score = cosineSimilarity(movieA, movieB);
    totalScore += score * weights['Preferred Movie/TV Genre'];
    totalWeight += weights['Preferred Movie/TV Genre'];
  }

  // 4. Vacation Type (Text-based, comma-separated)
  if (responsesA['Vacation Type'] && responsesB['Vacation Type']) {
      const vacationA = await getEmbedding(String(responsesA['Vacation Type']));
      const vacationB = await getEmbedding(String(responsesB['Vacation Type']));
      const score = cosineSimilarity(vacationA, vacationB);
      totalScore += score * weights['Vacation Type'];
      totalWeight += weights['Vacation Type'];
  }
  
  // 5. Vices (Categorical, check for overlap)
  if (responsesA['Vices'] && responsesB['Vices']) {
    const vicesA = String(responsesA['Vices']).split(',').map(v => v.trim());
    const vicesB = String(responsesB['Vices']).split(',').map(v => v.trim());
    const commonVices = vicesA.filter(v => vicesB.includes(v));
    // This is a simple score: 1 if perfect match, 0.5 if some overlap, 0 if none
    let score = 0;
    if (vicesA.sort().join(',') === vicesB.sort().join(',')) {
        score = 1;
    } else if (commonVices.length > 0) {
        score = 0.5;
    }
    totalScore += score * weights['Vices'];
    totalWeight += weights['Vices'];
  }
  
  // 6. Deal Breakers (Crucial Check - negative score)
  if (responsesA['Deal Breakers'] && responsesB['Vices']) {
    const dealBreakersA = String(responsesA['Deal Breakers']).split(',').map(d => d.trim().toLowerCase());
    const vicesB = String(responsesB['Vices']).split(',').map(v => v.trim().toLowerCase());
    if (vicesB.some(vice => dealBreakersA.includes(vice))) {
      totalScore -= weights['Deal Breakers']; // Apply a penalty
    }
  }
  if (responsesB['Deal Breakers'] && responsesA['Vices']) {
    const dealBreakersB = String(responsesB['Deal Breakers']).split(',').map(d => d.trim().toLowerCase());
    const vicesA = String(responsesA['Vices']).split(',').map(v => v.trim().toLowerCase());
    if (vicesA.some(vice => dealBreakersB.includes(vice))) {
      totalScore -= weights['Deal Breakers']; // Apply a penalty
    }
  }
  totalWeight += weights['Deal Breakers'] * 2; // Account for two-way check

  // --- Final Score Calculation ---
  if (totalWeight === 0) {
    return 0; // Cannot calculate score if no common fields are weighted
  }
  
  const finalScore = (totalScore / totalWeight);
  // Normalize score to be between 0 and 1, clipping any negative results from deal-breakers
  return Math.max(0, Math.min(1, finalScore));
} 