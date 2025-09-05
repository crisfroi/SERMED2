import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/resizeObserverPatch'

// Suppress known noisy dev-time unhandled fetch errors from Vite HMR ping/FullStory
if (import.meta.env.DEV) {
  window.addEventListener('unhandledrejection', (event) => {
    try {
      const reason = event.reason as any;
      const message = String(reason?.message || reason || '');
      const stack = String(reason?.stack || '');
      const isNoisyDevFetch = message.includes('Failed to fetch') && (
        stack.includes('/@vite/client') ||
        stack.includes('edge.fullstory.com')
      );
      if (isNoisyDevFetch) {
        event.preventDefault();
      }
    } catch {
      // no-op
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
