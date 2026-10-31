import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[AgriNexus ErrorBoundary Caught Exception]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#020612] p-6 text-center font-sans text-white">
          <div className="max-w-md rounded-2xl border border-rose-500/30 bg-rose-950/20 p-6 shadow-2xl backdrop-blur-md">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-lg font-bold text-white mb-2">Offline Swarm Exception Recovered</h1>
            <p className="text-xs text-rose-200/80 mb-4">
              AgriNexus caught an unexpected application error. Your local offline database and scans remain 100% safe.
            </p>
            <div className="mb-4 overflow-x-auto rounded-lg bg-black/60 p-3 text-left font-mono text-[11px] text-rose-300">
              {String(this.state.error?.message || this.state.error || 'Unknown Application Error')}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 hover:from-emerald-500 hover:to-green-500 transition cursor-pointer"
            >
              Reload AgriNexus
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Register Offline Service Worker for PWA 100% Offline Capability
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registered:', reg.scope);
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              // Only reload if device is ONLINE so we don't disrupt an active offline field session
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller && navigator.onLine) {
                console.log('[PWA] Fresh build deployed. Updating application cache...');
                window.location.reload();
              }
            });
          }
        });
      })
      .catch((err) => console.warn('[PWA] Service Worker registration failed:', err));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
