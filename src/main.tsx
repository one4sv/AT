import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './scss/index.scss'
import App from './App.tsx'
import "./i18n/i18n.ts";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
