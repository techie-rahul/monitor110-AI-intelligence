/**
 * EmptyState Component
 * Displayed when no analysis has been performed yet
 */

export default function EmptyState() {
    return (
        <div className="card full-width">
            <div className="card-body">
                <div className="empty-state">
                    <div className="empty-state-icon">◎</div>
                    <h3 className="empty-state-title">No Analysis Yet</h3>
                    <p className="empty-state-text">
                        Enter a market query above to analyze financial news and generate
                        explainable, confidence-scored intelligence using our RAG-based AI pipeline.
                    </p>
                </div>
            </div>
        </div>
    );
}
