/**
 * SourcesTable Component
 * Displays sources with credibility information
 */

export default function SourcesTable({ sources }) {
    if (!sources?.length) return null;

    const getCredibilityClass = (tier) => {
        switch (tier?.toUpperCase()) {
            case 'HIGH': return 'high';
            case 'MEDIUM': return 'medium';
            case 'LOW': return 'low';
            default: return 'unverified';
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="card full-width">
            <div className="card-header">
                <span className="card-title">Sources & Credibility</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {sources.length} source{sources.length !== 1 ? 's' : ''}
                </span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
                <table className="sources-table">
                    <thead>
                        <tr>
                            <th>Source</th>
                            <th>Type</th>
                            <th>Credibility</th>
                            <th>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sources.map((source, index) => (
                            <tr key={source.id || index}>
                                <td>
                                    <span className="source-name">{source.source}</span>
                                    <br />
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {source.headline?.substring(0, 60)}...
                                    </span>
                                </td>
                                <td style={{ textTransform: 'capitalize' }}>
                                    {source.sourceType?.replace('_', ' ') || '-'}
                                </td>
                                <td>
                                    <span className={`credibility-badge ${getCredibilityClass(source.credibility?.tier)}`}>
                                        {source.credibility?.tier || 'UNKNOWN'}
                                    </span>
                                </td>
                                <td>{formatDate(source.timestamp)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
