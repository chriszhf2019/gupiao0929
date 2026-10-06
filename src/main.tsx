import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AccessTokenGate } from './components/AccessTokenGate.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccessTokenGate>
      <App />
    </AccessTokenGate>
  </StrictMode>,
);
