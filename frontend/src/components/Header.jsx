/**
 * Header Component
 * Displays branding and backend connection status
 */

import { useState, useEffect } from 'react';
import { checkHealth } from '../services/api';

export default function Header() {
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        // Check health on mount and every 30 seconds
        const check = async () => {
            const status = await checkHealth();
            setConnected(status.connected);
        };

        check();
        const interval = setInterval(check, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <header className="header">
            <div className="header-brand">
                <h1 className="header-title">Monitor110 AI Intelligence</h1>
                <p className="header-subtitle">Explainable Market Signals</p>
            </div>
            <div className="header-status">
                <span className={`status-indicator ${connected ? '' : 'disconnected'}`}></span>
                <span>{connected ? 'Backend Connected' : 'Backend Disconnected'}</span>
            </div>
        </header>
    );
}
