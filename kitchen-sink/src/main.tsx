import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import '@astryxdesign/core/astryx.css';
import '../../themes/jazz/fonts.css';
import '../../themes/jazz/components.css';
import './sink.css';
import {App} from './app';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
