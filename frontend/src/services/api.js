/**
 * API Service
 * Handles all communication with the Monitor110 backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Analyze market query using RAG-based AI pipeline
 */
export async function analyzeQuery(query, options = {}) {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
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
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
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
