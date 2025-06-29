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

// Jaccard similarity for multi-select fields
function jaccard(a: string, b: string): number {
  if (!a || !b) return 0;
  const setA = new Set(a.split(',').map(x => x.trim().toLowerCase()).filter(Boolean));
  const setB = new Set(b.split(',').map(x => x.trim().toLowerCase()).filter(Boolean));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

// Numeric similarity (e.g., age, height)
function numericSimilarity(a: string, b: string, maxDiff = 10): number {
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  if (isNaN(numA) || isNaN(numB)) return 0.5;
  return 1 - Math.min(Math.abs(numA - numB) / maxDiff, 1);
}

// Main function to calculate compatibility between two users
export async function calculateCompatibility(userA: any, userB: any): Promise<number> {
  const responsesA = userA.formResponse || {};
  const responsesB = userB.formResponse || {};

  let totalScore = 0;
  let totalWeight = 0;

  // --- Define Weights for each question ---
  const weights: { [key: string]: number } = {
    hobbies: 1.5,
    music: 1.2,
    movies: 1.2,
    vacation: 1.0,
    vices: 1.0,
    dealBreakers: 2.0,
    age: 1.2,
    gender: 1.2,
    activity: 1.0,
    pet: 0.8,
    child: 0.8,
    height: 0.8,
  };

  // --- Map your real form keys ---
  const keys = {
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
  };

  // 1. Hobbies (Jaccard)
  if (responsesA[keys.hobbies] && responsesB[keys.hobbies]) {
    const score = jaccard(responsesA[keys.hobbies], responsesB[keys.hobbies]);
    totalScore += score * weights.hobbies;
    totalWeight += weights.hobbies;
  }
  // 2. Music (Jaccard)
  if (responsesA[keys.music] && responsesB[keys.music]) {
    const score = jaccard(responsesA[keys.music], responsesB[keys.music]);
    totalScore += score * weights.music;
    totalWeight += weights.music;
  }
  // 3. Movies (Jaccard)
  if (responsesA[keys.movies] && responsesB[keys.movies]) {
    const score = jaccard(responsesA[keys.movies], responsesB[keys.movies]);
    totalScore += score * weights.movies;
    totalWeight += weights.movies;
  }
  // 4. Vacation (Jaccard)
  if (responsesA[keys.vacation] && responsesB[keys.vacation]) {
    const score = jaccard(responsesA[keys.vacation], responsesB[keys.vacation]);
    totalScore += score * weights.vacation;
    totalWeight += weights.vacation;
  }
  // 5. Vices (Jaccard, but penalize for deal breakers below)
  if (responsesA[keys.vices] && responsesB[keys.vices]) {
    const score = jaccard(responsesA[keys.vices], responsesB[keys.vices]);
    totalScore += score * weights.vices;
    totalWeight += weights.vices;
  }
  // 6. Deal Breakers (penalty if partner's vices match my deal breakers)
  if (responsesA[keys.dealBreakers] && responsesB[keys.vices]) {
    const dealBreakersA = responsesA[keys.dealBreakers].toLowerCase();
    const vicesB = responsesB[keys.vices].toLowerCase();
    if (dealBreakersA && vicesB && dealBreakersA.split(',').some((d: string) => vicesB.includes(d.trim()))) {
      totalScore -= weights.dealBreakers;
    }
  }
  if (responsesB[keys.dealBreakers] && responsesA[keys.vices]) {
    const dealBreakersB = responsesB[keys.dealBreakers].toLowerCase();
    const vicesA = responsesA[keys.vices].toLowerCase();
    if (dealBreakersB && vicesA && dealBreakersB.split(',').some((d: string) => vicesA.includes(d.trim()))) {
      totalScore -= weights.dealBreakers;
    }
  }
  totalWeight += weights.dealBreakers * 2;

  // 7. Age (numeric similarity, prefer close ages)
  if (responsesA[keys.age] && responsesB[keys.age]) {
    const score = numericSimilarity(responsesA[keys.age], responsesB[keys.age], 10);
    totalScore += score * weights.age;
    totalWeight += weights.age;
  }
  // 8. Height (numeric similarity, prefer close heights)
  if (responsesA[keys.height] && responsesB[keys.height]) {
    // Try to extract a number from height (e.g., "185 - 190 cm" -> 187.5)
    function parseHeight(h: string) {
      const match = h.match(/(\d+)[^\d]+(\d+)/);
      if (match) return (parseInt(match[1]) + parseInt(match[2])) / 2;
      const num = parseInt(h);
      return isNaN(num) ? undefined : num;
    }
    const hA = parseHeight(responsesA[keys.height]);
    const hB = parseHeight(responsesB[keys.height]);
    if (hA && hB) {
      const score = 1 - Math.min(Math.abs(hA - hB) / 20, 1); // 20cm tolerance
      totalScore += score * weights.height;
      totalWeight += weights.height;
    }
  }
  // 9. Gender preference (must match)
  if (responsesA[keys.partnerGender] && responsesB[keys.gender]) {
    const wants = responsesA[keys.partnerGender].toLowerCase();
    const isB = responsesB[keys.gender].toLowerCase();
    if (wants.includes(isB)) {
      totalScore += weights.gender;
    }
    totalWeight += weights.gender;
  }
  if (responsesB[keys.partnerGender] && responsesA[keys.gender]) {
    const wants = responsesB[keys.partnerGender].toLowerCase();
    const isA = responsesA[keys.gender].toLowerCase();
    if (wants.includes(isA)) {
      totalScore += weights.gender;
    }
    totalWeight += weights.gender;
  }
  // 10. Activity level (exact match or close)
  if (responsesA[keys.activity] && responsesB[keys.activity]) {
    const a = responsesA[keys.activity].toLowerCase();
    const b = responsesB[keys.activity].toLowerCase();
    if (a === b) {
      totalScore += weights.activity;
    } else if (a.includes('moderate') && b.includes('moderate')) {
      totalScore += weights.activity * 0.7;
    }
    totalWeight += weights.activity;
  }
  // 11. Pet/child friendliness (exact match)
  if (responsesA[keys.pet] && responsesB[keys.pet]) {
    if (responsesA[keys.pet] === responsesB[keys.pet]) {
      totalScore += weights.pet;
    }
    totalWeight += weights.pet;
  }
  if (responsesA[keys.child] && responsesB[keys.child]) {
    if (responsesA[keys.child] === responsesB[keys.child]) {
      totalScore += weights.child;
    }
    totalWeight += weights.child;
  }

  // --- Final Score Calculation ---
  if (totalWeight === 0) {
    return 0;
  }
  const finalScore = totalScore / totalWeight;
  return Math.max(0, Math.min(1, finalScore));
} 