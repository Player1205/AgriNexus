import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

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
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
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
    <App />
  </React.StrictMode>,
)
