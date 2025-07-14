import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/cacheControl'

// Ensure immediate updates by preventing aggressive caching
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister());
  });
}

// Force reload on back navigation to prevent cached content
window.addEventListener('pageshow', (event) => {
  if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
    window.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
