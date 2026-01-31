/**
 * EmptyState Component
 * Calm, premium empty state message
 */

export default function EmptyState() {
    return (
        <div className="empty-state-container">
            <div className="empty-state">
                <div className="empty-state-icon">◉</div>
                <p className="empty-state-text">
                    Enter a market query to generate explainable intelligence.
                </p>
            </div>
        </div>
    );
}
