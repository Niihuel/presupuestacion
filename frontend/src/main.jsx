import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryProvider } from '@nucleo/providers';
<<<<<<< Current (Your changes)
import { LimiteErrores as ErrorBoundary } from '@compartido/components';
=======
import ErrorBoundary from '@compartido/componentes/LimiteErrores.jsx';
>>>>>>> Incoming (Background Agent changes)
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryProvider>
        <BrowserRouter>
          <App />
          <Toaster
            position="top-right"
            expand={true}
            richColors
            closeButton
          />
        </BrowserRouter>
      </QueryProvider>
    </ErrorBoundary>
  </StrictMode>
);
