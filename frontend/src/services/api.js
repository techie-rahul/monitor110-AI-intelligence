/**
 * API Service
 * Handles all communication with the Monitor110 backend
 */

const API_BASE_URL = '/api';

/**
 * Analyze market query using RAG-based AI pipeline
 * @param {string} query - The market intelligence query
 * @param {Object} options - Optional configuration
 * @returns {Promise<Object>} Analysis response
 */
export async function analyzeQuery(query, options = {}) {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, options }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP error: ${response.status}`);
    }

    return response.json();
}

/**
 * Check backend health status
 * @returns {Promise<Object>} Health status
 */
export async function checkHealth() {
    try {
        const response = await fetch('/health');
        if (!response.ok) throw new Error('Backend not responding');
        return { connected: true, ...(await response.json()) };
    } catch (error) {
        return { connected: false, error: error.message };
    }
}

export default {
    analyzeQuery,
    checkHealth,
};
