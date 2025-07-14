// Cache control utilities for immediate updates across all browsers

export const forceRefresh = () => {
  // Clear all caches and force page reload
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
  
  // Clear localStorage cache items
  Object.keys(localStorage).forEach(key => {
    if (key.includes('cache') || key.includes('version')) {
      localStorage.removeItem(key);
    }
  });
  
  // Force hard reload
  window.location.reload();
};

export const addCacheBustingParam = (url: string): string => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${Date.now()}`;
};

export const preventCaching = () => {
  // Add meta tags to prevent caching
  const metaTags = [
    { httpEquiv: 'Cache-Control', content: 'no-cache, no-store, must-revalidate' },
    { httpEquiv: 'Pragma', content: 'no-cache' },
    { httpEquiv: 'Expires', content: '0' }
  ];
  
  metaTags.forEach(tag => {
    const meta = document.createElement('meta');
    if (tag.httpEquiv) {
      meta.httpEquiv = tag.httpEquiv;
    }
    meta.content = tag.content;
    document.head.appendChild(meta);
  });
};

// Initialize cache prevention on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', preventCaching);
  
  // Clear any existing service worker cache
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
      });
    });
  }
  
  // Force refresh on back button
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      window.location.reload();
    }
  });
}