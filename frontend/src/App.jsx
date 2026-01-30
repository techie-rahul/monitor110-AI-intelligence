/**
 * Monitor110 AI Intelligence Dashboard
 * Main Application Component
 * 
 * Orchestrates the market intelligence UI with:
 * - Query input and analysis triggering
 * - Intelligence display with sentiment/confidence
 * - Explainability and transparency features
 * - Sentiment trend tracking
 */

import { useState, useCallback } from 'react';
import Header from './components/Header';
import QueryPanel from './components/QueryPanel';
import IntelligenceCard from './components/IntelligenceCard';
import ExplainabilityCard from './components/ExplainabilityCard';
import KeyInsights from './components/KeyInsights';
import SentimentChart from './components/SentimentChart';
import SourcesTable from './components/SourcesTable';
import PipelineInfo from './components/PipelineInfo';
import EmptyState from './components/EmptyState';
import { analyzeQuery } from './services/api';

export default function App() {
    // State management
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [sentimentHistory, setSentimentHistory] = useState([]);

    // Handle analyze request
    const handleAnalyze = useCallback(async (query) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await analyzeQuery(query);

            if (!response.success && response.error) {
                throw new Error(response.error);
            }

            setResult(response);

            // Add to sentiment history if we have a score
            if (response.analysis?.sentimentScore !== undefined) {
                setSentimentHistory(prev => {
                    const newHistory = [
                        ...prev.slice(-9), // Keep last 9, add new one
                        {
                            query: query.length > 15 ? query.substring(0, 15) + '...' : query,
                            score: response.analysis.sentimentScore,
                            timestamp: new Date().toISOString()
                        }
                    ];
                    return newHistory;
                });
            }

        } catch (err) {
            console.error('Analysis error:', err);
            setError(err.message || 'Failed to analyze query. Please try again.');
            setResult(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return (
        <div className="app-container">
            <Header />

            <QueryPanel onAnalyze={handleAnalyze} isLoading={isLoading} />

            {/* Error Banner */}
            {error && (
                <div className="error-banner">
                    <span className="error-icon">✕</span>
                    <span className="error-text">{error}</span>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="card full-width">
                    <div className="card-body">
                        <div className="loading-overlay">
                            <div className="loading-spinner"></div>
                            <span className="loading-text">Analyzing market intelligence...</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Grid */}
            {!isLoading && result?.analysis ? (
                <div className="dashboard-grid">
                    {/* Hero: Intelligence Summary */}
                    <IntelligenceCard analysis={result.analysis} />

                    {/* Left Column */}
                    <ExplainabilityCard analysis={result.analysis} />

                    {/* Right Column */}
                    <KeyInsights analysis={result.analysis} />

                    {/* Sentiment Chart - Full Width */}
                    <div className="full-width">
                        <SentimentChart history={sentimentHistory} />
                    </div>

                    {/* Sources Table - Full Width */}
                    <SourcesTable sources={result.sources} />

                    {/* Pipeline Transparency - Full Width */}
                    <PipelineInfo
                        pipeline={result.pipeline}
                        metadata={result.metadata}
                    />
                </div>
            ) : (
                !isLoading && !error && <EmptyState />
            )}

            {/* No Results Message */}
            {!isLoading && result && !result.analysis && result.message && (
                <div className="card full-width">
                    <div className="card-body">
                        <div className="empty-state">
                            <div className="empty-state-icon">∅</div>
                            <h3 className="empty-state-title">No Results Found</h3>
                            <p className="empty-state-text">{result.message}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
