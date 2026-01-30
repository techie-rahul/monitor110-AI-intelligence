/**
 * Deduplication Service
 * 
 * Removes near-duplicate content from retrieved articles.
 * This is important for RAG because:
 * 1. Reduces token usage in Claude prompts
 * 2. Prevents the same information from being weighted multiple times
 * 3. Improves clarity of the analysis
 * 
 * Uses Jaccard similarity on word sets - simple but effective for this use case.
 * In production, you might use more sophisticated methods like:
 * - MinHash for efficient similarity estimation
 * - Embeddings-based similarity
 * - SimHash for near-duplicate detection
 */

/**
 * Calculate Jaccard similarity between two strings
 * Jaccard = |A ∩ B| / |A ∪ B|
 * 
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} Similarity score between 0 and 1
 */
function jaccardSimilarity(text1, text2) {
    // Tokenize and normalize
    const words1 = new Set(
        text1.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 2) // Ignore very short words
    );

    const words2 = new Set(
        text2.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 2)
    );

    // Calculate intersection
    const intersection = new Set([...words1].filter(x => words2.has(x)));

    // Calculate union
    const union = new Set([...words1, ...words2]);

    // Avoid division by zero
    if (union.size === 0) return 0;

    return intersection.size / union.size;
}

/**
 * Remove near-duplicate articles from a collection
 * 
 * Algorithm:
 * 1. Sort articles by credibility (highest first) to keep best sources
 * 2. For each article, check similarity against already-kept articles
 * 3. If too similar, mark as duplicate; otherwise, keep it
 * 
 * @param {Array} articles - Array of articles to deduplicate
 * @param {number} threshold - Similarity threshold (default 0.6 = 60% similar)
 * @returns {Object} { unique: Array, duplicates: Array }
 */
export function deduplicateArticles(articles, threshold = 0.6) {
    if (!articles || articles.length === 0) {
        return { unique: [], duplicates: [] };
    }

    // Sort by credibility score if available (keep higher-credibility versions)
    const sorted = [...articles].sort((a, b) => {
        const scoreA = a.credibility?.score || 0;
        const scoreB = b.credibility?.score || 0;
        return scoreB - scoreA;
    });

    const unique = [];
    const duplicates = [];

    for (const article of sorted) {
        const articleText = `${article.headline} ${article.content}`;

        // Check against all already-kept articles
        const isDuplicate = unique.some(kept => {
            const keptText = `${kept.headline} ${kept.content}`;
            const similarity = jaccardSimilarity(articleText, keptText);
            return similarity >= threshold;
        });

        if (isDuplicate) {
            duplicates.push({
                ...article,
                deduplication: { status: 'duplicate', reason: 'Similar content already included' }
            });
        } else {
            unique.push({
                ...article,
                deduplication: { status: 'unique' }
            });
        }
    }

    console.log(`[Deduplication] ${articles.length} articles → ${unique.length} unique, ${duplicates.length} duplicates removed`);

    return { unique, duplicates };
}

/**
 * Calculate similarity matrix for a set of articles
 * Useful for debugging and understanding relationships
 * 
 * @param {Array} articles - Array of articles
 * @returns {Array} 2D array of similarity scores
 */
export function calculateSimilarityMatrix(articles) {
    const matrix = [];

    for (let i = 0; i < articles.length; i++) {
        matrix[i] = [];
        for (let j = 0; j < articles.length; j++) {
            if (i === j) {
                matrix[i][j] = 1.0;
            } else {
                const text1 = `${articles[i].headline} ${articles[i].content}`;
                const text2 = `${articles[j].headline} ${articles[j].content}`;
                matrix[i][j] = jaccardSimilarity(text1, text2);
            }
        }
    }

    return matrix;
}

export default {
    deduplicateArticles,
    jaccardSimilarity,
    calculateSimilarityMatrix
};
