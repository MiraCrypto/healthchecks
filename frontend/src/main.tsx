import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from './components/theme-provider.js';
import './index.css';
import App from './App.js';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
