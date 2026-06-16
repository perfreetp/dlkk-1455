import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

function InitApp() {
  useEffect(() => {
    try {
      if (!document.fonts?.check) return;
      document.fonts.ready.catch(() => {});
    } catch {
      // ignore
    }
  }, []);
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <InitApp />
  </StrictMode>,
);
