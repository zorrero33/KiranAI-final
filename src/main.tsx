import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const isIframe = typeof window !== 'undefined' && window.self !== window.top;

if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production' && !isIframe) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(<App />);
