import React from 'react';
import ReactDOM from 'react-dom/client';
import { Theme } from '@radix-ui/themes';
// @ts-ignore
import '@radix-ui/themes/styles.css';
import App from './App.js';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Theme accentColor="indigo" radius="small" appearance="light">
      <App />
    </Theme>
  </React.StrictMode>
);
