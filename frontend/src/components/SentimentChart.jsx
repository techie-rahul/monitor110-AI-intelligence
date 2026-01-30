/**
 * SentimentChart Component
 * Line chart showing sentiment score history
 */

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function SentimentChart({ history }) {
    // If no history, show placeholder with current data point
    const data = history && history.length > 0
        ? history
        : [{ query: 'Current', score: 0 }];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const score = payload[0].value;
            const sentiment = score > 0.2 ? 'Positive' : score < -0.2 ? 'Negative' : 'Neutral';
            return (
                <div style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '0.75rem'
                }}>
                    <p style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>{label}</p>
                    <p style={{ color: 'var(--accent-blue)' }}>
                        Score: {score.toFixed(2)} ({sentiment})
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title">Sentiment Trend</span>
            </div>
            <div className="card-body">
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                            <XAxis
                                dataKey="query"
                                stroke="var(--text-muted)"
                                fontSize={11}
                                tickLine={false}
                                axisLine={{ stroke: 'var(--border-secondary)' }}
                            />
                            <YAxis
                                domain={[-1, 1]}
                                stroke="var(--text-muted)"
                                fontSize={11}
                                tickLine={false}
                                axisLine={{ stroke: 'var(--border-secondary)' }}
                                tickFormatter={(v) => v.toFixed(1)}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine y={0} stroke="var(--border-primary)" strokeDasharray="3 3" />
                            <Line
                                type="monotone"
                                dataKey="score"
                                stroke="var(--accent-blue)"
                                strokeWidth={2}
                                dot={{ fill: 'var(--accent-blue)', r: 4 }}
                                activeDot={{ r: 6, fill: 'var(--accent-blue)' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
