/**
 * Relevance Service
 * 
 * Evaluates relevance between user query and retrieved documents.
 * This is a critical guardrail to prevent misleading sentiment scores
 * when retrieved documents don't actually relate to the query topic.
 * 
 * Approach (no ML, no embeddings):
 * 1. Extract key terms from query
 * 2. Check for entity/topic overlap with documents
 * 3. Score each document's relevance
 * 4. Determine if we have sufficient relevant content
 */

// Known entities in our dataset (tech sector focus)
const KNOWN_ENTITIES = {
    // Company names and their variations
    'apple': ['apple', 'aapl', 'iphone', 'ipad', 'mac', 'tim cook', 'cupertino'],
    'microsoft': ['microsoft', 'msft', 'azure', 'windows', 'satya nadella', 'copilot', 'xbox'],
    'tesla': ['tesla', 'tsla', 'elon musk', 'cybertruck', 'fsd', 'gigafactory', 'ev'],
    'nvidia': ['nvidia', 'nvda', 'jensen huang', 'gpu', 'cuda', 'h100', 'h200', 'geforce'],

    // Topics in our dataset
    'ai': ['ai', 'artificial intelligence', 'machine learning', 'llm', 'chatgpt', 'generative'],
    'cloud': ['cloud', 'azure', 'aws', 'saas', 'data center'],
    'earnings': ['earnings', 'revenue', 'profit', 'q1', 'q2', 'q3', 'q4', 'quarterly', 'fiscal'],
    'stock': ['stock', 'shares', 'market cap', 'valuation', 'price target'],
};

// Topics NOT in our dataset - if query is primarily about these, it's off-topic
const OFF_TOPIC_INDICATORS = [
    'india', 'indian', 'china', 'chinese', 'europe', 'european',
    'silver', 'gold', 'oil', 'crude', 'commodity', 'commodities',
    'real estate', 'property', 'housing',
    'crypto', 'bitcoin', 'ethereum', 'blockchain',
    'bank', 'banking', 'loan', 'mortgage',
    'healthcare', 'pharma', 'biotech',
    'retail', 'fashion', 'luxury',
    'agriculture', 'farming', 'food'
];

/**
 * Extract meaningful terms from a query
 * @param {string} query - User's search query
 * @returns {string[]} Array of normalized terms
 */
function extractQueryTerms(query) {
    return query
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(term => term.length > 2);
}

/**
 * Check if query contains off-topic indicators
 * @param {string[]} queryTerms - Normalized query terms
 * @returns {Object} { isOffTopic: boolean, offTopicTerms: string[] }
 */
function detectOffTopicQuery(queryTerms) {
    const offTopicTerms = queryTerms.filter(term =>
        OFF_TOPIC_INDICATORS.some(indicator =>
            indicator.includes(term) || term.includes(indicator)
        )
    );

    return {
        isOffTopic: offTopicTerms.length > 0,
        offTopicTerms
    };
}

/**
 * Check if query matches known entities in our dataset
 * Uses stricter matching to avoid false positives
 * @param {string[]} queryTerms - Normalized query terms
 * @returns {Object} { hasKnownEntity: boolean, matchedEntities: string[] }
 */
function detectKnownEntities(queryTerms) {
    const matchedEntities = [];

    // Only match company names and core topics - not generic terms
    const STRICT_ENTITIES = {
        'apple': ['apple', 'aapl'],
        'microsoft': ['microsoft', 'msft'],
        'tesla': ['tesla', 'tsla', 'musk'],
        'nvidia': ['nvidia', 'nvda', 'jensen'],
        'ai': ['ai', 'artificial intelligence', 'machine learning', 'llm'],
    };

    for (const [entity, variations] of Object.entries(STRICT_ENTITIES)) {
        // Require exact word match, not substring
        const hasMatch = queryTerms.some(term =>
            variations.some(v => v === term || (term.length > 3 && v.startsWith(term)))
        );
        if (hasMatch) {
            matchedEntities.push(entity);
        }
    }

    return {
        hasKnownEntity: matchedEntities.length > 0,
        matchedEntities
    };
}

/**
 * Calculate relevance score for a single document
 * @param {string[]} queryTerms - Normalized query terms
 * @param {Object} document - Article/document object
 * @returns {number} Relevance score 0-1
 */
function calculateDocumentRelevance(queryTerms, document) {
    const docText = `${document.headline} ${document.content}`.toLowerCase();
    const companies = (document.companies || []).map(c => c.toLowerCase());

    let score = 0;
    let matchedTerms = 0;

    // Check each query term
    for (const term of queryTerms) {
        // Direct text match
        if (docText.includes(term)) {
            matchedTerms++;
            score += 0.3;
        }

        // Company ticker match (strong signal)
        if (companies.some(c => c.includes(term) || term.includes(c))) {
            score += 0.4;
        }

        // Entity variation match
        for (const [entity, variations] of Object.entries(KNOWN_ENTITIES)) {
            if (variations.some(v => v.includes(term) || term.includes(v))) {
                if (docText.includes(entity)) {
                    score += 0.2;
                }
            }
        }
    }

    // Normalize by number of query terms
    const normalizedScore = queryTerms.length > 0
        ? Math.min(1, score / queryTerms.length)
        : 0;

    return normalizedScore;
}

/**
 * Evaluate overall relevance of retrieved documents to query
 * 
 * @param {string} query - Original user query
 * @param {Array} documents - Retrieved documents
 * @returns {Object} Relevance assessment
 */
export function evaluateRelevance(query, documents) {
    const queryTerms = extractQueryTerms(query);
    const offTopicCheck = detectOffTopicQuery(queryTerms);
    const entityCheck = detectKnownEntities(queryTerms);

    // If no documents, definitely not relevant
    if (!documents || documents.length === 0) {
        return {
            isRelevant: false,
            relevantDocCount: 0,
            averageRelevance: 0,
            reason: 'No documents retrieved',
            queryTerms,
            offTopicCheck,
            entityCheck
        };
    }

    // Score each document
    const docScores = documents.map(doc => ({
        id: doc.id,
        score: calculateDocumentRelevance(queryTerms, doc)
    }));

    // Count highly relevant documents (score > 0.3)
    const relevantDocs = docScores.filter(d => d.score > 0.3);
    const averageScore = docScores.reduce((sum, d) => sum + d.score, 0) / docScores.length;

    // Decision logic - be LENIENT when known entities are matched
    let isRelevant = true;
    let reason = 'Documents are relevant to query';

    // IMPORTANT: If query matches a known entity (Apple, Tesla, Nvidia, etc.),
    // we trust that the documents are relevant (our dataset is about these companies)
    if (entityCheck.hasKnownEntity) {
        isRelevant = true;
        reason = `Query matches known entities: ${entityCheck.matchedEntities.join(', ')}`;
    }
    // Case 1: Query is clearly off-topic and no known entities
    else if (offTopicCheck.isOffTopic) {
        isRelevant = false;
        reason = `Query contains off-topic terms (${offTopicCheck.offTopicTerms.join(', ')}) not covered by our tech-sector dataset`;
    }
    // Case 2: No known entities AND low relevance scores
    else if (averageScore < 0.2) {
        isRelevant = false;
        reason = 'Query does not match any known entities or topics in our dataset';
    }
    // Case 3: Too few relevant documents and very low average
    else if (relevantDocs.length < 1 && averageScore < 0.15) {
        isRelevant = false;
        reason = 'Insufficient relevant documents found';
    }

    console.log(`[Relevance] Query: "${query}" | Relevant: ${isRelevant} | Avg Score: ${averageScore.toFixed(2)} | Relevant Docs: ${relevantDocs.length}/${documents.length}`);

    return {
        isRelevant,
        relevantDocCount: relevantDocs.length,
        totalDocCount: documents.length,
        averageRelevance: averageScore,
        reason,
        queryTerms,
        offTopicCheck,
        entityCheck,
        docScores
    };
}

/**
 * Generate a "not relevant" response when query doesn't match dataset
 * @param {string} query - Original query
 * @param {Object} relevanceResult - Result from evaluateRelevance
 * @returns {Object} Safe fallback analysis
 */
export function generateNotRelevantResponse(query, relevanceResult) {
    return {
        success: true,
        analysis: {
            narrative: `Insufficient relevant data to generate a reliable market insight for "${query}". Our dataset focuses on major tech companies (Apple, Microsoft, Tesla, NVIDIA) and may not cover this topic.`,
            sentiment: 'NEUTRAL',
            sentimentScore: 0,
            confidence: 'RUMOR',
            confidenceExplanation: relevanceResult.reason,
            keyInsights: [
                'Query topic not well-covered by available data sources',
                'Consider refining your query to focus on: Apple, Microsoft, Tesla, or NVIDIA',
                'Our dataset covers tech sector earnings, AI developments, and stock performance'
            ],
            sourcesUsed: [],
            dataLimitations: 'Query does not match the focus areas of our curated financial dataset.'
        },
        metadata: {
            model: 'RELEVANCE_GUARDRAIL',
            relevanceFiltered: true,
            timestamp: new Date().toISOString()
        }
    };
}

export default {
    evaluateRelevance,
    generateNotRelevantResponse
};
