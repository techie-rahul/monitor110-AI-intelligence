/**
 * Monitor110 AI Intelligence Backend
 * 
 * Main Express server entry point.
 * Provides the /api/analyze endpoint for market intelligence analysis.
 * 
 * Architecture:
 * - RAG-style retrieval from curated financial data
 * - Source credibility filtering
 * - Content deduplication
 * - Grounded Claude API calls (no hallucination)
 */

import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import analyzeRouter from './routes/analyze.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Enable CORS for frontend communication (Vite runs on port 5173)
app.use(cors({
  origin: [
    'https://monitor110-ai-intelligence.vercel.app'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// IMPORTANT: handle preflight
app.options('*', cors());


// Parse JSON request bodies
app.use(express.json());

// =============================================================================
// ROUTES
// =============================================================================

// Health check endpoint for quick verification
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'monitor110-backend',
        timestamp: new Date().toISOString()
    });
});

// Main analysis endpoint - handles all market intelligence requests
app.use('/api', analyzeRouter);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// Global error handler
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.message);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
        // In production, you wouldn't expose this
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// 404 handler for unknown routes
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// =============================================================================
// SERVER START
// =============================================================================

const server = app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║   Monitor110 AI Intelligence Backend                      ║
║   Running on: http://localhost:${PORT}                       ║
║   Health check: http://localhost:${PORT}/health              ║
║   Analyze endpoint: POST http://localhost:${PORT}/api/analyze║
╚═══════════════════════════════════════════════════════════╝
  `);

    // Check if Gemini API key is configured
   if (!process.env.GROQ_API_KEY) {
  console.warn('⚠️  WARNING: GROQ_API_KEY not set.');
  console.warn('   LLM analysis will run in MOCK mode.');
}

});

// Handle server startup errors (e.g., port already in use)
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`
╔═══════════════════════════════════════════════════════════╗
║   ⚠️  Port ${PORT} is already in use!                        ║
║   Server already running. Use the existing instance.      ║
║                                                           ║
║   To kill the existing process:                           ║
║   PowerShell: Stop-Process -Id (Get-NetTCPConnection      ║
║               -LocalPort ${PORT}).OwningProcess -Force       ║
╚═══════════════════════════════════════════════════════════╝
        `);
        process.exit(0); // Exit gracefully, not an error
    } else {
        console.error('Server error:', err.message);
        process.exit(1);
    }
});

export default app;

