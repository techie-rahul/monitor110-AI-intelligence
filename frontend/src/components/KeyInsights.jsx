/**
 * KeyInsights Component
 * Displays bullet-point insights from analysis
 */

export default function KeyInsights({ analysis }) {
    if (!analysis?.keyInsights?.length) return null;

    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title">Key Insights</span>
            </div>
            <div className="card-body">
                <div className="insights-list">
                    {analysis.keyInsights.map((insight, index) => (
                        <div key={index} className="insight-item">
                            <span className="insight-bullet">→</span>
                            <span>{insight}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
