/**
 * ExplainabilityCard Component
 * Shows confidence explanation and caveats
 */

export default function ExplainabilityCard({ analysis }) {
    if (!analysis) return null;

    const { confidence, confidenceExplanation, dataLimitations } = analysis;
    const isNotConfirmed = confidence?.toUpperCase() !== 'CONFIRMED';

    return (
        <div className="card explainability-card">
            <div className="card-header">
                <span className="card-title">Confidence Explanation</span>
            </div>
            <div className="card-body">
                <p className="explanation-text">
                    {confidenceExplanation || 'No explanation available.'}
                </p>

                {isNotConfirmed && (
                    <div className="explanation-note">
                        <span className="explanation-note-icon">⚠</span>
                        <p className="explanation-note-text">
                            <strong>Why not CONFIRMED?</strong> {
                                confidence?.toUpperCase() === 'RUMOR'
                                    ? 'Sources are primarily unverified (social media, forums). Treat with caution.'
                                    : 'Information is from credible sources but lacks official confirmation or multiple corroborating reports.'
                            }
                        </p>
                    </div>
                )}

                {dataLimitations && (
                    <div className="explanation-note">
                        <span className="explanation-note-icon">ℹ</span>
                        <p className="explanation-note-text">
                            <strong>Data Limitations:</strong> {dataLimitations}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
