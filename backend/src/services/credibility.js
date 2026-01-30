/**
 * Source Credibility Service
 * 
 * Assigns credibility scores to content based on source type.
 * This is a critical component for explainable AI - we need to be
 * transparent about WHY certain sources are weighted differently.
 * 
 * Credibility Tiers:
 * 1. OFFICIAL (0.95) - Company IR, SEC filings, press releases
 * 2. MAJOR_PUBLICATION (0.85) - Bloomberg, Reuters, WSJ, FT
 * 3. ANALYST (0.75) - Research reports from recognized firms
 * 4. MAJOR_PUBLICATION (lower tier) (0.65) - TechCrunch, MarketWatch
 * 5. SOCIAL_MEDIA (0.40) - Twitter/X, Reddit, unverified sources
 * 6. UNKNOWN (0.30) - Unclassified sources
 */

// Credibility score mapping by source type
const CREDIBILITY_SCORES = {
    official: 0.95,        // Company announcements, IR, SEC filings
    major_publication: 0.85, // Bloomberg, Reuters, WSJ
    analyst: 0.75,         // Morgan Stanley, Goldman Sachs research
    social_media: 0.40,    // Twitter, Reddit, forums
    unknown: 0.30          // Unclassified sources
};

// Additional source-specific adjustments
const SOURCE_ADJUSTMENTS = {
    // Premium sources get a boost
    'Bloomberg': 0.05,
    'Reuters': 0.05,
    'Financial Times': 0.05,
    'Apple Investor Relations': 0.05,
    'Microsoft Blog': 0.03,
    'NVIDIA Investor Relations': 0.05,
    'Tesla IR': 0.05,

    // Lower-tier publications
    'TechCrunch': -0.10,
    'DigiTimes': -0.15,
    'Electrek': -0.05,

    // Social media gets penalized
    '@elonmusk': 0.10, // High-profile but still social
    '@mingchikuo': 0.05, // Known leaker, slightly more credible
    'Reddit r/teslamotors': -0.10
};

/**
 * Calculate credibility score for a single article
 * 
 * @param {Object} article - Article object with source and sourceType
 * @returns {Object} Article with credibility metadata attached
 */
export function assignCredibility(article) {
    // Base score from source type
    let baseScore = CREDIBILITY_SCORES[article.sourceType] || CREDIBILITY_SCORES.unknown;

    // Apply source-specific adjustments
    const adjustment = SOURCE_ADJUSTMENTS[article.source] || 0;
    let finalScore = Math.min(1.0, Math.max(0.1, baseScore + adjustment));

    // Determine credibility tier for display
    let tier;
    if (finalScore >= 0.90) tier = 'HIGH';
    else if (finalScore >= 0.70) tier = 'MEDIUM';
    else if (finalScore >= 0.50) tier = 'LOW';
    else tier = 'UNVERIFIED';

    return {
        ...article,
        credibility: {
            score: finalScore,
            tier: tier,
            sourceType: article.sourceType,
            explanation: generateCredibilityExplanation(article, finalScore, tier)
        }
    };
}

/**
 * Generate human-readable explanation for credibility assignment
 */
function generateCredibilityExplanation(article, score, tier) {
    const explanations = {
        official: `Official company source (${article.source}) - highest reliability`,
        major_publication: `Major financial publication (${article.source}) - professionally verified`,
        analyst: `Professional analyst research (${article.source}) - expert opinion`,
        social_media: `Social media source (${article.source}) - requires verification`,
        unknown: `Unclassified source - credibility uncertain`
    };

    return explanations[article.sourceType] || explanations.unknown;
}

/**
 * Filter articles by minimum credibility threshold
 * 
 * @param {Array} articles - Array of articles with credibility scores
 * @param {number} minScore - Minimum credibility score (0-1)
 * @returns {Array} Filtered articles meeting threshold
 */
export function filterByCredibility(articles, minScore = 0.5) {
    const articlesWithCredibility = articles.map(assignCredibility);

    const filtered = articlesWithCredibility.filter(
        article => article.credibility.score >= minScore
    );

    console.log(`[Credibility] Filtered ${articles.length} → ${filtered.length} articles (min score: ${minScore})`);

    return filtered;
}

/**
 * Sort articles by credibility (highest first)
 * 
 * @param {Array} articles - Articles with credibility scores
 * @returns {Array} Sorted articles
 */
export function sortByCredibility(articles) {
    return [...articles].sort(
        (a, b) => (b.credibility?.score || 0) - (a.credibility?.score || 0)
    );
}

/**
 * Get credibility breakdown for a set of articles
 * Useful for explaining the overall confidence of an analysis
 * 
 * @param {Array} articles - Articles with credibility scores
 * @returns {Object} Credibility statistics
 */
export function getCredibilityBreakdown(articles) {
    const scores = articles.map(a => a.credibility?.score || 0);
    const tiers = articles.map(a => a.credibility?.tier || 'UNKNOWN');

    return {
        averageScore: scores.reduce((a, b) => a + b, 0) / scores.length || 0,
        highCredibilityCount: tiers.filter(t => t === 'HIGH').length,
        mediumCredibilityCount: tiers.filter(t => t === 'MEDIUM').length,
        lowCredibilityCount: tiers.filter(t => t === 'LOW').length,
        unverifiedCount: tiers.filter(t => t === 'UNVERIFIED').length,
        totalSources: articles.length
    };
}

export default {
    assignCredibility,
    filterByCredibility,
    sortByCredibility,
    getCredibilityBreakdown
};
