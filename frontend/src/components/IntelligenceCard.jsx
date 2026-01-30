/**
 * IntelligenceCard Component
 * Hero section displaying narrative, sentiment, and confidence
 */

export default function IntelligenceCard({ analysis }) {
    if (!analysis) return null;

    const { narrative, sentiment, confidence } = analysis;

    const getSentimentClass = (s) => {
        switch (s?.toUpperCase()) {
            case 'POSITIVE': return 'positive';
            case 'NEGATIVE': return 'negative';
            default: return 'neutral';
        }
    };

    const getConfidenceClass = (c) => {
        switch (c?.toUpperCase()) {
            case 'CONFIRMED': return 'confirmed';
            case 'EMERGING': return 'emerging';
            case 'RUMOR': return 'rumor';
            default: return 'emerging';
        }
    };

    return (
        <div className="card intelligence-card">
            <div className="card-header">
                <span className="card-title">Intelligence Summary</span>
            </div>
            <div className="card-body">
                <div className="intelligence-content">
                    <p className="narrative-text">{narrative}</p>
                    <div className="intelligence-meta">
                        <div className={`badge badge-sentiment ${getSentimentClass(sentiment)}`}>
                            {sentiment || 'NEUTRAL'}
                        </div>
                        <div className={`badge badge-confidence ${getConfidenceClass(confidence)}`}>
                            {confidence || 'EMERGING'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
