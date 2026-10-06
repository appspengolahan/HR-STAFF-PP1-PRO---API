import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker immediately for full PWA compliance and offline support
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('PWA app update available');
  },
  onOfflineReady() {
    console.log('PWA app ready to work offline');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
