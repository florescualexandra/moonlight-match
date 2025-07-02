# Enhanced AI Matching Algorithm Documentation

## Overview

The Moonlight Match platform uses an advanced AI-powered matching algorithm that intelligently correlates user requirements and preferences with potential partner information to create highly compatible matches. This algorithm goes beyond simple keyword matching to understand semantic relationships and nuanced compatibility factors.

## Core Algorithm Components

### 1. Sentence Transformer Integration

The algorithm uses the `Xenova/all-MiniLM-L6-v2` model for semantic text understanding:

```typescript
// Initialize sentence transformer for semantic similarity
const sentenceTransformer = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
```

**Benefits:**
- Understands context and meaning, not just exact word matches
- Handles synonyms and related concepts
- Provides more accurate compatibility scoring

### 2. Multi-Dimensional Compatibility Scoring

The algorithm evaluates compatibility across multiple dimensions with weighted importance:

#### Core Compatibility Factors (Highest Weight)
- **Deal Breakers (3.0)**: Critical factors that can completely disqualify matches
- **Gender Preference (2.5)**: Must match user's stated preferences
- **Age Compatibility (2.0)**: Enhanced with range preferences and bonuses for similar age groups

#### Lifestyle Compatibility
- **Hobbies (1.8)**: Combined Jaccard + semantic similarity
- **Music (1.5)**: Genre and artist preferences
- **Movies (1.5)**: Entertainment preferences
- **Vacation (1.3)**: Travel and leisure preferences
- **Activity Level (1.2)**: Physical activity compatibility

#### Values and Preferences
- **Pet Friendliness (1.0)**: Importance scale matching
- **Child Friendliness (1.0)**: Family planning compatibility
- **Vices (0.8)**: Nuanced scoring for lifestyle choices

#### Physical Attributes (Lower Weight)
- **Height (0.6)**: Physical compatibility with tolerance ranges

## Algorithm Implementation

### Compatibility Calculation Process

```typescript
export async function calculateCompatibility(userA: any, userB: any): Promise<number> {
  // 1. Deal Breaker Analysis
  // 2. Gender Preference Matching
  // 3. Age Compatibility with Range Preferences
  // 4. Lifestyle Compatibility (Hobbies, Music, Movies, etc.)
  // 5. Activity Level Matching
  // 6. Values and Preferences Analysis
  // 7. Vices Compatibility
  // 8. Physical Attributes
  // 9. Additional Factors (Occupation, Pets, Bucket List)
  // 10. Final Score Calculation with Adjustments
}
```

### Semantic Similarity Calculation

```typescript
async function calculateSemanticSimilarity(textA: string, textB: string): Promise<number> {
  const model = await getSentenceTransformer();
  const embeddings = await model.encode([textA, textB]);
  return cosineSimilarity(embeddings[0], embeddings[1]);
}
```

### Hybrid Scoring Approach

For multi-select fields like hobbies and music, the algorithm combines:

1. **Jaccard Similarity (70%)**: Exact overlap of selected options
2. **Semantic Similarity (30%)**: Meaning-based similarity using AI

```typescript
const jaccardScore = jaccardSimilarity(responsesA[fields.hobbies], responsesB[fields.hobbies]);
const semanticScore = await calculateSemanticSimilarity(responsesA[fields.hobbies], responsesB[fields.hobbies]);
const combinedScore = (jaccardScore * 0.7) + (semanticScore * 0.3);
```

## Requirement Correlation Analysis

### User Requirements Analysis

The algorithm analyzes how user requirements correlate with compatibility:

```typescript
function analyzeRequirementCorrelation(user: any, compatibilityResults: any[]) {
  return {
    mostCompatibleTraits: string[],
    leastCompatibleTraits: string[],
    requirementInsights: string[],
    recommendations: string[]
  };
}
```

### Key Correlation Factors

1. **Hobbies Correlation**: Identifies if user's hobbies lead to high compatibility
2. **Music Preferences**: Analyzes music taste correlation with match success
3. **Deal Breaker Impact**: Quantifies how deal breakers affect potential matches
4. **Preference Flexibility**: Recommends adjustments for better compatibility

## Advanced Features

### 1. Deal Breaker Detection

The algorithm intelligently detects when a user's deal breakers conflict with a potential partner's traits:

```typescript
const hasDealBreaker = dealBreakerList.some((dealBreaker: string) => 
  viceList.some((vice: string) => vice.includes(dealBreaker) || dealBreaker.includes(vice))
);
```

### 2. Age Compatibility Enhancement

Enhanced age matching with bonuses for similar age groups:

```typescript
let ageScore = 1 - Math.min(Math.abs(ageA - ageB) / 15, 1);
if (Math.abs(ageA - ageB) <= 5) ageScore += 0.2;  // Bonus for very close ages
if (Math.abs(ageA - ageB) <= 10) ageScore += 0.1; // Bonus for close ages
```

### 3. Activity Level Matching

Smart activity level compatibility with semantic understanding:

```typescript
if (activityA === activityB) {
  activityScore = 1.0;
} else if (activityA.includes('active') && activityB.includes('active')) {
  activityScore = 0.8;
} else {
  activityScore = await calculateSemanticSimilarity(activityA, activityB);
}
```

### 4. Vices Compatibility

Nuanced scoring for lifestyle choices:

```typescript
if (viceListA.length === 0 && viceListB.length === 0) {
  viceScore = 1.0; // Both have no vices
} else if (viceListA.length === 0 || viceListB.length === 0) {
  viceScore = 0.3; // One has vices, one doesn't
} else {
  // Calculate overlap for compatible vices
  const commonVices = viceListA.filter(vice => viceListB.includes(vice));
  viceScore = commonVices.length / totalVices.size;
}
```

## API Endpoints

### 1. Match Calculation API

**Endpoint**: `POST /api/match-calculate`

Calculates matches for all users in an event using the enhanced algorithm.

**Features:**
- Detailed compatibility scoring
- Breakdown analysis for high-scoring matches
- Comprehensive statistics and analytics
- Error handling and logging

### 2. Compatibility Analysis API

**Endpoint**: `GET /api/user/compatibility-analysis`

Provides detailed analysis of how user requirements correlate with potential matches.

**Returns:**
- User requirements breakdown
- Compatibility statistics
- Top matches with detailed analysis
- Requirement correlation insights
- Personalized recommendations

## Performance Optimizations

### 1. Model Caching

The sentence transformer model is cached to avoid repeated loading:

```typescript
let sentenceTransformer: any = null;

async function getSentenceTransformer() {
  if (!sentenceTransformer) {
    sentenceTransformer = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return sentenceTransformer;
}
```

### 2. Fallback Mechanisms

Robust fallback for when AI models are unavailable:

```typescript
catch (error) {
  // Fallback to simple text similarity
  const wordsA = new Set(textA.toLowerCase().split(/\s+/));
  const wordsB = new Set(textB.toLowerCase().split(/\s+/));
  return intersection.size / union.size;
}
```

### 3. Batch Processing

Efficient processing of multiple user pairs with error handling:

```typescript
for (const userA of users) {
  for (const userB of users) {
    try {
      const compatibilityScore = await calculateCompatibility(userA, userB);
      // Process result
    } catch (error) {
      console.error(`Error calculating compatibility:`, error);
      continue; // Continue with other matches
    }
  }
}
```

## Quality Assurance

### 1. Score Validation

All compatibility scores are normalized to the range [0, 1]:

```typescript
return Math.max(0, Math.min(1, adjustedScore));
```

### 2. Statistical Analysis

Comprehensive statistics for algorithm validation:

- Average compatibility scores
- High compatibility match counts
- Distribution analysis
- Performance metrics

### 3. Detailed Logging

Extensive logging for debugging and optimization:

```typescript
console.log(`User ${userA.name}: Top match score = ${topMatches[0]?.score?.toFixed(3)}`);
console.log(`Matching complete: ${matchesToCreate.length} matches created`);
```

## Future Enhancements

### 1. Machine Learning Integration

- Train custom models on successful matches
- Implement preference learning from user feedback
- Add personality trait analysis

### 2. Advanced Features

- Real-time compatibility updates
- Dynamic weight adjustment based on user feedback
- Multi-language support for international users

### 3. Performance Improvements

- Parallel processing for large user bases
- Caching of compatibility scores
- Optimized embedding generation

## Usage Examples

### Basic Compatibility Calculation

```typescript
const compatibilityScore = await calculateCompatibility(userA, userB);
console.log(`Compatibility: ${(compatibilityScore * 100).toFixed(1)}%`);
```

### Detailed Analysis

```typescript
const breakdown = await getCompatibilityBreakdown(userA, userB);
console.log('Strengths:', breakdown.strengths);
console.log('Deal Breakers:', breakdown.dealBreakers);
console.log('Component Scores:', breakdown.breakdown);
```

### API Integration

```typescript
// Calculate matches for an event
const response = await fetch('/api/match-calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ eventId: 'event-123' })
});

// Get compatibility analysis
const analysis = await fetch('/api/user/compatibility-analysis', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

This enhanced AI matching algorithm provides a sophisticated, multi-dimensional approach to compatibility matching that goes far beyond simple keyword matching, ensuring users receive highly compatible matches based on their specific requirements and preferences. 