import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './config/i18n.js'
import App from './App.jsx'

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
