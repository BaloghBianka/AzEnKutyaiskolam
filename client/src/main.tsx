import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queries';
import App from './App';
import { PwaBar } from './lib/pwa';
import { ErrorBoundary, clearRecoverFlag } from './lib/recover';
import './styles/site.css';

clearRecoverFlag();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </BrowserRouter>
      <PwaBar />
    </QueryClientProvider>
  </StrictMode>
);
