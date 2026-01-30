/**
 * Analyze Route
 * 
 * POST /api/analyze
 * 
 * The main endpoint for market intelligence analysis.
 * Orchestrates the full RAG-style pipeline:
 * 
 * 1. RETRIEVE - Find relevant documents based on query
 * 2. FILTER - Apply credibility thresholds
 * 3. DEDUPE - Remove near-duplicate content
 * 4. RELEVANCE CHECK - Verify query matches documents (GUARDRAIL)
 * 5. ANALYZE - Send to Gemini with grounded prompt
 * 6. RESPOND - Return structured, explainable results
 * 
 * This endpoint is the heart of the Monitor110 revival.
 */

import { Router } from 'express';
import { retrieveRelevantContent } from '../services/retrieval.js';
import { filterByCredibility, getCredibilityBreakdown, sortByCredibility } from '../services/credibility.js';
import { deduplicateArticles } from '../services/deduplication.js';
import { analyzeWithLLM, generateMockAnalysis } from '../services/gemini.js';
import { evaluateRelevance, generateNotRelevantResponse } from '../services/relevance.js';

const router = Router();

/**
 * POST /api/analyze
 * 
 * Request body:
 * {
 *   "query": "string - the market intelligence query",
 *   "options": {
 *     "maxSources": number (default: 8),
 *     "minCredibility": number 0-1 (default: 0.4),
 *     "companies": ["AAPL", "MSFT"] (optional filter),
 *     "useMock": boolean (default: false, use mock Gemini response)
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": boolean,
 *   "query": "original query",
 *   "analysis": { ... Gemini's structured analysis ... },
 *   "sources": [ ... filtered/deduped sources used ... ],
 *   "pipeline": { ... metadata about each processing step ... },
 *   "timestamp": "ISO timestamp"
 * }
 */
router.post('/analyze', async (req, res) => {
    const startTime = Date.now();

    try {
        // ==========================================================================
        // 1. VALIDATE INPUT
        // ==========================================================================
        const { query, options = {} } = req.body;

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Query is required and must be a non-empty string',
                example: { query: 'Apple earnings Q4', options: { maxSources: 5 } }
            });
        }

        // Extract options with defaults
        const {
            maxSources = 8,
            minCredibility = 0.4,
            companies = [],
            useMock = false
        } = options;

        console.log(`\n${'='.repeat(60)}`);
        console.log(`[Analyze] New request: "${query}"`);
        console.log(`[Analyze] Options: maxSources=${maxSources}, minCredibility=${minCredibility}`);
        console.log('='.repeat(60));

        // ==========================================================================
        // 2. RETRIEVE RELEVANT CONTENT
        // ==========================================================================
        const retrieved = retrieveRelevantContent(query, {
            maxResults: maxSources * 2, // Retrieve more to account for filtering
            companies
        });

        if (retrieved.length === 0) {
            return res.json({
                success: true,
                query: query,
                analysis: null,
                message: 'No relevant content found for this query. Try different keywords or company names.',
                sources: [],
                pipeline: {
                    retrieved: 0,
                    filtered: 0,
                    deduplicated: 0,
                    processingTimeMs: Date.now() - startTime
                },
                timestamp: new Date().toISOString()
            });
        }

        // ==========================================================================
        // 3. FILTER BY CREDIBILITY
        // ==========================================================================
        const credibleSources = filterByCredibility(retrieved, minCredibility);

        if (credibleSources.length === 0) {
            return res.json({
                success: true,
                query: query,
                analysis: null,
                message: 'Found content but all sources below credibility threshold. Try lowering minCredibility.',
                sources: [],
                pipeline: {
                    retrieved: retrieved.length,
                    filtered: 0,
                    filteredOutReason: `All ${retrieved.length} sources below ${minCredibility} credibility`,
                    deduplicated: 0,
                    processingTimeMs: Date.now() - startTime
                },
                timestamp: new Date().toISOString()
            });
        }

        // ==========================================================================
        // 4. DEDUPLICATE CONTENT
        // ==========================================================================
        const { unique: dedupedSources, duplicates } = deduplicateArticles(credibleSources);

        // Limit to maxSources after deduplication
        const finalSources = sortByCredibility(dedupedSources).slice(0, maxSources);

        // ==========================================================================
        // 5. RELEVANCE GUARDRAIL - Verify query matches document topic
        // ==========================================================================
        const relevanceResult = evaluateRelevance(query, finalSources);

        // If query is not relevant to retrieved documents, return safe neutral response
        if (!relevanceResult.isRelevant) {
            console.log(`[Analyze] Relevance guardrail triggered: ${relevanceResult.reason}`);
            const safeResponse = generateNotRelevantResponse(query, relevanceResult);

            return res.json({
                ...safeResponse,
                query: query,
                sources: [],
                credibilityBreakdown: null,
                pipeline: {
                    retrieved: retrieved.length,
                    afterCredibilityFilter: credibleSources.length,
                    afterDeduplication: dedupedSources.length,
                    duplicatesRemoved: duplicates.length,
                    finalSourcesUsed: 0,
                    relevanceFiltered: true,
                    relevanceReason: relevanceResult.reason,
                    averageRelevanceScore: relevanceResult.averageRelevance,
                    processingTimeMs: Date.now() - startTime,
                    usedMockResponse: false
                },
                timestamp: new Date().toISOString()
            });
        }

        // ==========================================================================
        // 6. GET CREDIBILITY BREAKDOWN (for Gemini context)
        // ==========================================================================
        const credibilityBreakdown = getCredibilityBreakdown(finalSources);

        // ==========================================================================
        // 7. GENERATE ANALYSIS WITH GEMINI
        // ==========================================================================
        let result;

        // Check if we should use mock mode
        const shouldUseMock = useMock;


        if (shouldUseMock) {
            console.log('[Analyze] Using MOCK Gemini response');
            result = generateMockAnalysis(query, finalSources);
        } else {
            result = await analyzeWithLLM(query, finalSources);

        }

        // ==========================================================================
        // 8. PREPARE RESPONSE
        // ==========================================================================
        const processingTimeMs = Date.now() - startTime;

        // Prepare source summary for response (don't send full content)
        const sourceSummary = finalSources.map(source => ({
            id: source.id,
            headline: source.headline,
            source: source.source,
            sourceType: source.sourceType,
            credibility: source.credibility,
            timestamp: source.timestamp,
            companies: source.companies
        }));

        const response = {
            success: result.success,
            query: query,
            analysis: result.analysis,
            error: result.error || null,
            sources: sourceSummary,
            credibilityBreakdown: credibilityBreakdown,
            pipeline: {
                retrieved: retrieved.length,
                afterCredibilityFilter: credibleSources.length,
                afterDeduplication: dedupedSources.length,
                duplicatesRemoved: duplicates.length,
                finalSourcesUsed: finalSources.length,
                relevanceFiltered: false,
                averageRelevanceScore: relevanceResult.averageRelevance,
                processingTimeMs: processingTimeMs,
                usedMockResponse: shouldUseMock
            },
            metadata: result.metadata,
            timestamp: new Date().toISOString()
        };

        console.log(`[Analyze] Complete in ${processingTimeMs}ms`);
        console.log(`[Analyze] Pipeline: ${retrieved.length} → ${credibleSources.length} → ${finalSources.length} sources`);

        res.json(response);

    } catch (error) {
        console.error('[Analyze] Error:', error);
        res.status(500).json({
            success: false,
            error: 'Analysis failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/analyze/health
 * Quick health check for the analyze endpoint
 */
router.get('/analyze/health', (req, res) => {
    res.json({
        status: 'healthy',
        endpoint: '/api/analyze',
        hasApiKey: !!process.env.GEMINI_API_KEY,
        timestamp: new Date().toISOString()
    });
});

/**
 * GET /api/sources
 * List available data sources for debugging/demo
 */
router.get('/sources', (req, res) => {
    const { retrieveRelevantContent, getAllArticles } = require('../services/retrieval.js');
    const articles = getAllArticles();

    res.json({
        totalArticles: articles.length,
        companies: [...new Set(articles.flatMap(a => a.companies))],
        sourceTypes: [...new Set(articles.map(a => a.sourceType))],
        dateRange: {
            earliest: articles.reduce((min, a) => a.timestamp < min ? a.timestamp : min, articles[0].timestamp),
            latest: articles.reduce((max, a) => a.timestamp > max ? a.timestamp : max, articles[0].timestamp)
        }
    });
});

export default router;
