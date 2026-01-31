/**
 * QueryPanel Component
 * Hero-style centered search bar with helper text
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
        <div className="query-panel hero">
            <div className="query-hero-content">
                <form className="query-input-group" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        className="query-input"
                        placeholder="Nvidia AI demand • Indian car market • Bitcoin regulation"
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
                <p className="query-helper-text">
                    Analyzes credible sources only. Off-topic queries return neutral insights.
                </p>
            </div>
        </div>
    );
}
