import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Fuentes (Brand Guidelines § 3.2 — Opción B)
import '@fontsource/barlow-condensed/400.css';
import '@fontsource/barlow-condensed/800.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-mono/400.css';

// Tokens y globals (orden importa — tokens primero)
import './styles/tokens.css';
import './styles/globals.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/landing.css';
import './styles/docs.css';

import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
