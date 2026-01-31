/**
 * Retrieval Service
 * 
 * RAG-style document retrieval using keyword matching.
 * This is a lightweight approach suitable for hackathon demo.
 * 
 * In production, you would use:
 * - Vector embeddings (OpenAI, Cohere, etc.)
 * - Vector database (Pinecone, Weaviate, etc.)
 * - Semantic similarity search
 * 
 * For this MVP, we use keyword matching which is:
 * - Fast and simple
 * - Requires no external dependencies
 * - Sufficient for demo purposes
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load financial content from JSON file
const dataPath = join(__dirname, '../data/financial-content.json');
const financialData = JSON.parse(readFileSync(dataPath, 'utf-8'));

/**
 * Retrieve relevant articles based on a search query.
 * Uses keyword matching with scoring for relevance ranking.
 * 
 * @param {string} query - User's search query (e.g., "Apple earnings")
 * @param {Object} options - Configuration options
 * @param {number} options.maxResults - Maximum number of articles to return (default: 5)
 * @param {string[]} options.companies - Filter by company tickers (e.g., ["AAPL", "MSFT"])
 * @returns {Array} Ranked array of relevant articles
 */
export function retrieveRelevantContent(query, options = {}) {
    const { maxResults = 5, companies = [] } = options;

    // Normalize query for matching
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);

    // Company name to ticker mapping for better matching
    const companyAliases = {
        // Global Tech
        'apple': 'AAPL',
        'microsoft': 'MSFT',
        'tesla': 'TSLA',
        'nvidia': 'NVDA',
        'google': 'GOOGL',
        'amazon': 'AMZN',
        'meta': 'META',

        // Indian Markets
        'reliance': 'RELIANCE',
        'tata': 'TATA',
        'tcs': 'TCS',
        'infosys': 'INFY',
        'hdfc': 'HDFC',
        'icici': 'ICICI',

        // EV Sector
        'byd': 'BYD',
        'nio': 'NIO',
        'rivian': 'RIVN',
        'ola': 'OLA',
        'ather': 'ATHER',

        // Crypto
        'bitcoin': 'BTC',
        'ethereum': 'ETH',
        'crypto': 'CRYPTO',
        'blockchain': 'BLOCKCHAIN',

        // Banking & Financial Policy
        'rbi': 'RBI',
        'sbi': 'SBI',
        'bank': 'BANKS',
        'banking': 'BANKS',
        'interest': 'BANKS',
        'repo': 'RBI',
        'inflation': 'BANKS',
        'fed': 'FED',
        'credit': 'BANKS',
        'loan': 'BANKS',
        'jpmorgan': 'JPM',

        // Commodities
        'oil': 'OIL',
        'crude': 'CRUDE',
        'gold': 'GOLD',
        'silver': 'SILVER',
        'copper': 'COPPER',
        'commodity': 'COMMODITIES',
        'commodities': 'COMMODITIES',
        'opec': 'OIL',
        'gas': 'GAS',

        // Energy & Power
        'power': 'POWER',
        'solar': 'SOLAR',
        'renewable': 'RENEWABLE',
        'wind': 'WIND',
        'energy': 'ENERGY',
        'hydrogen': 'HYDROGEN',
        'battery': 'BATTERY',
        'grid': 'ENERGY',
        'adani': 'ADANI',

        // Healthcare & Pharma
        'pharma': 'PHARMA',
        'healthcare': 'HEALTHCARE',
        'drug': 'PHARMA',
        'fda': 'PHARMA',
        'biocon': 'BIOCON',
        'sunpharma': 'SUNPHARMA',
        'apollo': 'APOLLO',
        'hospital': 'HEALTHCARE',

        // Sectors
        'ev': 'EV',
        'automobile': 'AUTO',
        'semiconductor': 'CHIPS',

        // Ticker aliases (lowercase)
        'msft': 'MSFT',
        'aapl': 'AAPL',
        'tsla': 'TSLA',
        'nvda': 'NVDA',
        'googl': 'GOOGL',
        'amzn': 'AMZN',
        'btc': 'BTC',
        'eth': 'ETH'
    };



    // Expand query terms to include ticker matches
    const expandedTerms = queryTerms.map(term => {
        const ticker = companyAliases[term];
        return ticker ? [term, ticker.toLowerCase()] : [term];
    }).flat();

    // Score each article based on relevance
    const scoredArticles = financialData.articles.map(article => {
        let score = 0;
        const searchText = `${article.headline} ${article.content}`.toLowerCase();

        // Score based on term frequency
        expandedTerms.forEach(term => {
            const regex = new RegExp(term, 'gi');
            const matches = searchText.match(regex);
            if (matches) {
                // Headline matches are worth more
                const headlineMatches = article.headline.toLowerCase().match(regex);
                score += matches.length * 1;
                score += (headlineMatches?.length || 0) * 2; // Bonus for headline matches
            }
        });

        // Filter by company if specified
        if (companies.length > 0) {
            const hasCompany = article.companies.some(c =>
                companies.map(x => x.toUpperCase()).includes(c)
            );
            if (!hasCompany) score = 0;
        }

        return { ...article, relevanceScore: score };
    });

    // Filter and sort by relevance
    const relevantArticles = scoredArticles
        .filter(article => article.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxResults);

    console.log(`[Retrieval] Query: "${query}" | Found ${relevantArticles.length} relevant articles`);

    return relevantArticles;
}

/**
 * Get all available articles (for testing/debugging)
 * @returns {Array} All articles in the dataset
 */
export function getAllArticles() {
    return financialData.articles;
}

/**
 * Get articles by company ticker
 * @param {string} ticker - Company ticker (e.g., "AAPL")
 * @returns {Array} Articles mentioning the company
 */
export function getArticlesByCompany(ticker) {
    return financialData.articles.filter(article =>
        article.companies.includes(ticker.toUpperCase())
    );
}

export default {
    retrieveRelevantContent,
    getAllArticles,
    getArticlesByCompany
};
