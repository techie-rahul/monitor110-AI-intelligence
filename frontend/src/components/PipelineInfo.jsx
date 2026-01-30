/**
 * PipelineInfo Component
 * Collapsible panel showing RAG pipeline metadata
 */

import { useState } from 'react';

export default function PipelineInfo({ pipeline, metadata }) {
    const [expanded, setExpanded] = useState(false);

    if (!pipeline) return null;

    return (
        <div className="card full-width">
            <div className="card-body">
                <button
                    className="pipeline-toggle"
                    onClick={() => setExpanded(!expanded)}
                >
                    <span>Pipeline Transparency</span>
                    <span className={`pipeline-toggle-icon ${expanded ? 'expanded' : ''}`}>
                        ▼
                    </span>
                </button>

                {expanded && (
                    <div className="pipeline-content">
                        <div className="pipeline-row">
                            <span className="pipeline-label">Documents Retrieved</span>
                            <span className="pipeline-value">{pipeline.retrieved || 0}</span>
                        </div>
                        <div className="pipeline-row">
                            <span className="pipeline-label">After Credibility Filter</span>
                            <span className="pipeline-value">{pipeline.afterCredibilityFilter || 0}</span>
                        </div>
                        <div className="pipeline-row">
                            <span className="pipeline-label">After Deduplication</span>
                            <span className="pipeline-value">{pipeline.afterDeduplication || 0}</span>
                        </div>
                        <div className="pipeline-row">
                            <span className="pipeline-label">Duplicates Removed</span>
                            <span className="pipeline-value">{pipeline.duplicatesRemoved || 0}</span>
                        </div>
                        <div className="pipeline-row">
                            <span className="pipeline-label">Final Sources Used</span>
                            <span className="pipeline-value">{pipeline.finalSourcesUsed || 0}</span>
                        </div>
                        <div className="pipeline-row">
                            <span className="pipeline-label">Processing Time</span>
                            <span className="pipeline-value">{pipeline.processingTimeMs || 0}ms</span>
                        </div>
                        {metadata?.model && (
                            <div className="pipeline-row">
                                <span className="pipeline-label">AI Model</span>
                                <span className="pipeline-value">{metadata.model}</span>
                            </div>
                        )}
                        {pipeline.usedMockResponse && (
                            <div className="pipeline-row">
                                <span className="pipeline-label">Mode</span>
                                <span className="pipeline-value" style={{ color: 'var(--accent-yellow)' }}>
                                    Mock Response (No API Key)
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
