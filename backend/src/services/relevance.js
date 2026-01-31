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

// ============================================================================
// KNOWN ENTITIES - Companies, sectors, and topics covered by our dataset
// ============================================================================
const KNOWN_ENTITIES = {
    // Global Tech Companies
    'apple': ['apple', 'aapl', 'iphone', 'ipad', 'mac', 'tim cook', 'cupertino', 'vision pro'],
    'microsoft': ['microsoft', 'msft', 'azure', 'windows', 'satya nadella', 'copilot', 'xbox'],
    'tesla': ['tesla', 'tsla', 'elon musk', 'cybertruck', 'fsd', 'gigafactory', 'supercharger'],
    'nvidia': ['nvidia', 'nvda', 'jensen huang', 'gpu', 'cuda', 'h100', 'h200', 'geforce'],
    'google': ['google', 'googl', 'alphabet', 'sundar pichai', 'android', 'chrome'],
    'amazon': ['amazon', 'amzn', 'aws', 'bezos', 'prime'],
    'meta': ['meta', 'facebook', 'zuckerberg', 'instagram', 'whatsapp'],

    // Indian Companies
    'reliance': ['reliance', 'jio', 'mukesh ambani', 'ril'],
    'tata': ['tata', 'tata motors', 'tata group', 'ratan tata', 'tcs', 'tata power'],
    'infosys': ['infosys', 'infy', 'salil parekh', 'infosys technologies'],
    'tcs': ['tcs', 'tata consultancy', 'tata consulting'],
    'hdfc': ['hdfc', 'hdfc bank', 'housing development finance'],
    'icici': ['icici', 'icici bank'],

    // EV Companies
    'byd': ['byd', 'build your dreams'],
    'nio': ['nio', 'nio inc'],
    'rivian': ['rivian', 'rivn'],
    'ola': ['ola', 'ola electric', 'bhavish aggarwal'],
    'ather': ['ather', 'ather energy'],

    // Crypto
    'bitcoin': ['bitcoin', 'btc', 'satoshi', 'btc etf', 'spot etf'],
    'ethereum': ['ethereum', 'eth', 'ether', 'vitalik', 'eth2'],
    'crypto': ['crypto', 'cryptocurrency', 'blockchain', 'defi', 'web3'],

    // Banking & Financial Policy
    'banking': ['bank', 'banking', 'rbi', 'interest rate', 'repo rate', 'monetary policy', 'npa', 'credit growth'],
    'rbi': ['rbi', 'reserve bank', 'repo', 'monetary'],
    'sbi': ['sbi', 'state bank'],
    'fed': ['fed', 'federal reserve', 'fomc', 'powell'],
    'jpmorgan': ['jpmorgan', 'jpm', 'jp morgan', 'jamie dimon'],

    // Commodities
    'commodities': ['commodity', 'commodities'],
    'oil': ['oil', 'crude', 'brent', 'wti', 'opec', 'petroleum'],
    'gold': ['gold', 'bullion', 'precious metal'],
    'silver': ['silver'],
    'copper': ['copper'],
    'gas': ['natural gas', 'lng', 'gas prices'],

    // Energy & Power
    'energy': ['energy', 'power', 'electricity', 'grid', 'utility'],
    'solar': ['solar', 'photovoltaic', 'pv'],
    'wind': ['wind power', 'wind energy', 'wind turbine'],
    'renewable': ['renewable', 'clean energy', 'green energy'],
    'hydrogen': ['hydrogen', 'green hydrogen', 'electrolyzer'],
    'adani': ['adani', 'adani green', 'adani power'],

    // Healthcare & Pharma
    'healthcare': ['healthcare', 'health care', 'hospital', 'medical'],
    'pharma': ['pharma', 'pharmaceutical', 'drug', 'medicine', 'fda'],
    'biocon': ['biocon'],
    'sunpharma': ['sun pharma', 'sunpharma', 'sun pharmaceutical'],
    'apollo': ['apollo', 'apollo hospitals'],
    'drreddy': ['dr reddy', 'drreddy', 'dr. reddy'],

    // Sectors & Topics
    'ev': ['ev', 'electric vehicle', 'electric car', 'electric scooter', 'battery', 'charging'],
    'auto': ['auto', 'automobile', 'car sales', 'vehicle', 'automotive', 'car market'],
    'ai': ['ai', 'artificial intelligence', 'machine learning', 'llm', 'chatgpt', 'generative'],
    'cloud': ['cloud', 'azure', 'aws', 'saas', 'data center'],
    'earnings': ['earnings', 'revenue', 'profit', 'q1', 'q2', 'q3', 'q4', 'quarterly', 'fiscal'],
    'stock': ['stock', 'shares', 'market cap', 'valuation', 'price target', 'ipo'],
    'markets': ['sensex', 'nifty', 'bse', 'nse', 'fii', 'market', 'index'],
    'india': ['india', 'indian', 'rupee', 'inr', 'sebi'],
    'finance': ['finance', 'financial', 'fintech', 'payment'],
    'semiconductor': ['semiconductor', 'chip', 'chips', 'tsmc', 'foundry', 'fab']
};

// ============================================================================
// OFF-TOPIC INDICATORS - Topics truly NOT in our dataset
// ============================================================================
const OFF_TOPIC_INDICATORS = [
    // Real Estate  
    'real estate', 'property', 'mortgage', 'rent',
    // Consumer & Retail
    'retail', 'fashion', 'luxury', 'apparel', 'clothing',
    // Agriculture
    'agriculture', 'farming', 'food', 'crop',
    // Entertainment & Sports
    'movie', 'cinema', 'bollywood', 'hollywood', 'sports', 'football', 'cricket', 'olympics', 'youtube', 'entertainment',
    // Travel
    'travel', 'tourism', 'hotel', 'airline', 'flight',
    // Other
    'weather', 'recipe', 'cooking', 'gaming', 'video game'
];


/**
 * Extract meaningful terms from a query
 * @param {string} query - User's search query
 * @returns {string[]} Array of normalized terms
 */
function extractQueryTerms(query) {
    // Important 2-character terms that should not be filtered out
    const importantShortTerms = ['ev', 'ai', 'it', 'uk', 'us'];

    return query
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(term => term.length > 2 || importantShortTerms.includes(term));
}


/**
 * Check if query contains off-topic indicators WITHOUT matching any known entity
 * @param {string[]} queryTerms - Normalized query terms
 * @param {boolean} hasKnownEntity - Whether query has a known entity match
 * @returns {Object} { isOffTopic: boolean, offTopicTerms: string[] }
 */
function detectOffTopicQuery(queryTerms, hasKnownEntity) {
    // If query matches a known entity, it's NOT off-topic
    if (hasKnownEntity) {
        return { isOffTopic: false, offTopicTerms: [] };
    }

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
 * Dynamically matches against all supported companies, sectors, and topics
 * @param {string[]} queryTerms - Normalized query terms
 * @returns {Object} { hasKnownEntity: boolean, matchedEntities: string[] }
 */
function detectKnownEntities(queryTerms) {
    const matchedEntities = [];
    const queryText = queryTerms.join(' ');

    for (const [entity, variations] of Object.entries(KNOWN_ENTITIES)) {
        // Check if any variation matches any query term
        const hasMatch = variations.some(variation => {
            // Exact term match (highest priority)
            if (queryTerms.includes(variation)) return true;

            // Multi-word variation match (e.g., "electric vehicle", "tata motors")
            if (variation.includes(' ') && queryText.includes(variation)) return true;

            // For single-word variations, require exact match or very close prefix
            // Only allow prefix matching if term is 4+ chars and variation starts with term
            return queryTerms.some(term => {
                if (term.length < 4) return false; // Don't do fuzzy match on short terms
                // Term must be a significant prefix of the variation (>80% length)
                if (variation.startsWith(term) && term.length >= variation.length * 0.8) return true;
                // Variation must be an exact prefix of a longer term
                if (term.startsWith(variation) && variation.length >= 4) return true;
                return false;
            });
        });

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
 * Check if retrieved documents contain companies/sectors matching query
 * @param {string[]} queryTerms - Normalized query terms
 * @param {Array} documents - Retrieved documents
 * @returns {Object} { hasDocumentOverlap: boolean, overlappingCompanies: string[] }
 */
function checkDocumentOverlap(queryTerms, documents) {
    const overlappingCompanies = new Set();
    const queryText = queryTerms.join(' ');

    for (const doc of documents) {
        // Check document companies
        const companies = (doc.companies || []).map(c => c.toLowerCase());

        for (const company of companies) {
            // Check if query relates to this company
            if (queryTerms.some(term => company.includes(term) || term.includes(company))) {
                overlappingCompanies.add(company.toUpperCase());
            }
        }

        // Check document sector
        const sector = (doc.sector || '').toLowerCase();
        if (sector && queryTerms.some(term => sector.includes(term) || term.includes(sector))) {
            overlappingCompanies.add(sector.toUpperCase());
        }
    }

    return {
        hasDocumentOverlap: overlappingCompanies.size > 0,
        overlappingCompanies: Array.from(overlappingCompanies)
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
    const sector = (document.sector || '').toLowerCase();

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

        // Sector match
        if (sector && (sector.includes(term) || term.includes(sector))) {
            score += 0.3;
        }

        // Entity variation match
        for (const [entity, variations] of Object.entries(KNOWN_ENTITIES)) {
            if (variations.some(v => v.includes(term) || term.includes(v))) {
                if (docText.includes(entity) || companies.some(c => c.includes(entity))) {
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
    const entityCheck = detectKnownEntities(queryTerms);
    const offTopicCheck = detectOffTopicQuery(queryTerms, entityCheck.hasKnownEntity);
    const docOverlap = documents?.length > 0
        ? checkDocumentOverlap(queryTerms, documents)
        : { hasDocumentOverlap: false, overlappingCompanies: [] };

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

    // Decision logic
    let isRelevant = true;
    let reason = 'Documents are relevant to query';

    // PRIORITY 1: If query matches known entities, trust the match
    if (entityCheck.hasKnownEntity) {
        isRelevant = true;
        reason = `Query matches known entities: ${entityCheck.matchedEntities.join(', ')}`;
    }
    // PRIORITY 2: If retrieved documents have company/sector overlap with query
    else if (docOverlap.hasDocumentOverlap) {
        isRelevant = true;
        reason = `Query matches document topics: ${docOverlap.overlappingCompanies.join(', ')}`;
    }
    // PRIORITY 3: Query is clearly off-topic (no entity match, no doc overlap)
    else if (offTopicCheck.isOffTopic) {
        isRelevant = false;
        reason = `Query topic (${offTopicCheck.offTopicTerms.join(', ')}) not covered by our dataset`;
    }
    // PRIORITY 4: Low relevance scores and no known entities
    else if (averageScore < 0.15) {
        isRelevant = false;
        reason = 'Query does not match any known entities or topics in our dataset';
    }
    // PRIORITY 5: Too few relevant documents
    else if (relevantDocs.length < 1 && averageScore < 0.1) {
        isRelevant = false;
        reason = 'Insufficient relevant documents found';
    }

    console.log(`[Relevance] Query: "${query}" | Relevant: ${isRelevant} | Entities: ${entityCheck.matchedEntities.join(',')} | Avg Score: ${averageScore.toFixed(2)} | Docs: ${relevantDocs.length}/${documents.length}`);

    return {
        isRelevant,
        relevantDocCount: relevantDocs.length,
        totalDocCount: documents.length,
        averageRelevance: averageScore,
        reason,
        queryTerms,
        offTopicCheck,
        entityCheck,
        docOverlap,
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
            narrative: `Insufficient relevant data to generate a reliable market insight for "${query}". Our dataset covers Technology, EVs, Indian markets, Crypto, and Finance. This query falls outside the current coverage.`,
            sentiment: 'NEUTRAL',
            sentimentScore: 0,
            confidence: 'RUMOR',
            confidenceExplanation: relevanceResult.reason,
            keyInsights: [
                'Query topic not well-covered by available data sources',
                'Our dataset covers: Tech (Apple, Microsoft, Tesla, NVIDIA), Indian markets (Tata, Reliance, Infosys), Crypto (Bitcoin, Ethereum), and EV sector',
                'Consider refining your query to match these focus areas'
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
