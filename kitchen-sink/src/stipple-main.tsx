// The stipple generator on a page of its own (/stipple/): the plain Jazz
// theme, without the kitchen sink's page nav and theme settings.
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {Theme} from '@astryxdesign/core';
import '@astryxdesign/core/astryx.css';
import '../../themes/jazz/fonts.css';
import '../../themes/jazz/components.css';
import './sink.css';
import {jazzTheme} from '../../themes/jazz/jazzTheme';
import {StipplePage} from './pages/stipple';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Theme theme={jazzTheme} mode="system">
      <div className="ks-page">
        <StipplePage />
      </div>
    </Theme>
  </StrictMode>,
);
