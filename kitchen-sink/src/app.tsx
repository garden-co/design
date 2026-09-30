import {useEffect, useState} from 'react';
import {Theme} from '@astryxdesign/core';
import {SettingsOverlay} from './settings-overlay';
import {SettingsProvider, useSettings} from './settings';
import {OverviewPage} from './pages/overview';
import {DocsContextPage} from './pages/docs-context';
import {DashboardContextPage} from './pages/dashboard-context';
import {PrinciplesPage} from './pages/principles';
import {StipplePage} from './pages/stipple';

export const PAGES = [
  {id: 'principles', label: 'Principles', render: () => <PrinciplesPage />},
  {id: 'overview', label: 'Components', render: () => <OverviewPage />},
  {id: 'docs', label: 'In context: docs', render: () => <DocsContextPage />},
  {id: 'dashboard', label: 'In context: dashboard', render: () => <DashboardContextPage />},
  {id: 'stipple', label: 'Stipple patterns', render: () => <StipplePage />},
] as const;

export type PageId = (typeof PAGES)[number]['id'];

function currentPage(): PageId {
  const id = window.location.hash.slice(1);
  return (PAGES.find((p) => p.id === id)?.id ?? 'overview') as PageId;
}

function ThemedApp() {
  const {settings, theme} = useSettings();
  const [page, setPage] = useState<PageId>(currentPage);
  useEffect(() => {
    const onHash = () => setPage(currentPage());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const active = PAGES.find((p) => p.id === page)!;
  return (
    <>
      <Theme theme={theme} mode={settings.mode}>
        <div className="ks-page">{active.render()}</div>
      </Theme>
      <nav className="ks-pages" aria-label="Kitchen sink pages">
        {PAGES.map((p) => (
          <a key={p.id} href={`#${p.id}`} aria-current={p.id === page ? 'page' : undefined}>
            {p.label}
          </a>
        ))}
      </nav>
      <SettingsOverlay />
    </>
  );
}

export function App() {
  return (
    <SettingsProvider>
      <ThemedApp />
    </SettingsProvider>
  );
}
