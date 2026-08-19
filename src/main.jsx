import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './config/i18n.js'
import App from './App.jsx'

// Trap and prevent iOS Safari "Load failed" / "Failed to fetch" browser alerts
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = String(event.reason?.message || event.reason || '');
    if (msg.includes('Load failed') || msg.includes('Failed to fetch') || msg.includes('Dynamically imported module') || msg.includes('Importing a module script failed')) {
      console.warn('[Mobile Guard] Prevented load rejection popup:', msg);
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = String(event.message || event || '');
    if (msg.includes('Load failed') || msg.includes('Failed to fetch') || msg.includes('Script error')) {
      console.warn('[Mobile Guard] Prevented load error popup:', msg);
      event.preventDefault();
    }
  }, true);
}

// Unregister any old service workers to fix cache issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
