import { Theme } from '@radix-ui/themes'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.js'
import '@radix-ui/themes/styles.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Theme accentColor="indigo" radius="small" appearance="light">
      <App />
    </Theme>
  </React.StrictMode>,
)
