/**
 * QueryPanel Component
 * Input for market queries with analyze button
 */

import { useState } from 'react';

export default function QueryPanel({ onAnalyze, isLoading }) {
    const [query, setQuery] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim() && !isLoading) {
            onAnalyze(query.trim());
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            handleSubmit(e);
        }
    };

    return (
        <div className="query-panel">
            <label className="query-label">Market Intelligence Query</label>
            <form className="query-input-group" onSubmit={handleSubmit}>
                <input
                    type="text"
                    className="query-input"
                    placeholder="e.g., Apple earnings, Tesla FSD, NVIDIA AI demand, Microsoft Azure..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className={`query-button ${isLoading ? 'loading' : ''}`}
                    disabled={isLoading || !query.trim()}
                >
                    {isLoading ? 'Analyzing...' : 'Analyze'}
                </button>
            </form>
        </div>
    );
}
