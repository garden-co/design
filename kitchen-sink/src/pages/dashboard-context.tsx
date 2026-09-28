import {useState} from 'react';
import {Copy, LayoutGrid, Plus, Settings, Users} from 'lucide-react';
import {AppShell} from '@astryxdesign/core/AppShell';
import {Badge} from '@astryxdesign/core/Badge';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Code} from '@astryxdesign/core/Code';
import {Grid} from '@astryxdesign/core/Grid';
import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Layout, LayoutContent} from '@astryxdesign/core/Layout';
import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import {SideNav, SideNavItem, SideNavSection} from '@astryxdesign/core/SideNav';
import {HStack, VStack} from '@astryxdesign/core/Stack';
import {StatusDot} from '@astryxdesign/core/StatusDot';
import {Tab, TabList} from '@astryxdesign/core/TabList';
import {Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow} from '@astryxdesign/core/Table';
import {Heading, Text} from '@astryxdesign/core/Text';
import {TextInput} from '@astryxdesign/core/TextInput';
import {TopNav, TopNavHeading} from '@astryxdesign/core/TopNav';
import {JazzLogo} from '../jazz-logo';

/*
 * A Cloud-dashboard-like screen (app list, usage, settings form), to judge
 * the theme on dense, data-heavy UI rather than prose.
 */

const APPS = [
  {name: 'todo-demo', id: 'co_zA4f…9Qk', version: 'alpha.57', status: 'success' as const, rows: '12.4k'},
  {name: 'music-player', id: 'co_b71c…Xe2', version: 'alpha.57', status: 'success' as const, rows: '3.1k'},
  {name: 'chat-staging', id: 'co_Kp0d…7aa', version: 'alpha.55', status: 'warning' as const, rows: '940'},
  {name: 'old-prototype', id: 'co_Q9ee…m1D', version: 'alpha.53', status: 'neutral' as const, rows: '18'},
];

function Stat({label, value, note}: {label: string; value: string; note: string}) {
  return (
    <Card padding={4}>
      <VStack gap={1}>
        <Text type="supporting" color="secondary">
          {label}
        </Text>
        <Heading level={2}>{value}</Heading>
        <Text type="supporting" color="secondary">
          {note}
        </Text>
      </VStack>
    </Card>
  );
}

export function DashboardContextPage() {
  const [tab, setTab] = useState('apps');
  const [name, setName] = useState('todo-demo');
  return (
    <AppShell
      height="auto"
      variant="section"
      topNav={
        <TopNav
          label="Dashboard"
          heading={<TopNavHeading logo={<JazzLogo className="ks-logo" label="Jazz Cloud" />} headingHref="#dashboard" />}
          endContent={<IconButton label="Settings" variant="ghost" size="sm" icon={<Icon icon={Settings} size="sm" />} />}
        />
      }
      sideNav={
        <SideNav>
          <SideNavSection title="Organisation">
            <SideNavItem label="Apps" href="#dashboard" icon={<Icon icon={LayoutGrid} size="sm" />} isSelected />
            <SideNavItem label="Members" href="#dashboard" icon={<Icon icon={Users} size="sm" />} />
          </SideNavSection>
        </SideNav>
      }
    >
      <Layout
        height="auto"
        content={
          <LayoutContent isScrollable={false} padding={8}>
            <VStack gap={6}>
              <HStack gap={3} vAlign="center">
                <Heading level={1}>Apps</Heading>
                <span className="ks-spacer" />
                <Button label="New app" icon={<Icon icon={Plus} size="sm" />} />
              </HStack>
              <Grid columns={{minWidth: 200}} gap={3}>
                <Stat label="Apps" value="4" note="1 needs an upgrade" />
                <Stat label="Rows synced" value="16.5k" note="Last 30 days" />
                <Stat label="Storage" value="212 MB" note="of 1 GB" />
              </Grid>
              <TabList value={tab} onChange={setTab} hasDivider>
                <Tab value="apps" label="All apps" />
                <Tab value="usage" label="Usage" />
                <Tab value="settings" label="Settings" />
              </TabList>
              {tab === 'apps' ? (
                <Table density="compact">
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>App</TableHeaderCell>
                      <TableHeaderCell>App ID</TableHeaderCell>
                      <TableHeaderCell>Version</TableHeaderCell>
                      <TableHeaderCell>Rows</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {APPS.map((app) => (
                      <TableRow key={app.name}>
                        <TableCell>
                          <HStack gap={2} vAlign="center">
                            <StatusDot variant={app.status} label={app.status} />
                            <Text weight="medium">{app.name}</Text>
                          </HStack>
                        </TableCell>
                        <TableCell>
                          <HStack gap={1} vAlign="center">
                            <Code>{app.id}</Code>
                            <IconButton label="Copy app ID" variant="ghost" size="sm" icon={<Icon icon={Copy} size="sm" />} />
                          </HStack>
                        </TableCell>
                        <TableCell>
                          <Badge variant={app.status === 'warning' ? 'warning' : 'neutral'} label={app.version} />
                        </TableCell>
                        <TableCell>{app.rows}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : tab === 'usage' ? (
                <VStack gap={4}>
                  <ProgressBar label="Storage" value={212} max={1024} hasValueLabel />
                  <ProgressBar label="Monthly syncs" value={61} hasValueLabel />
                </VStack>
              ) : (
                <Card padding={6}>
                  <VStack gap={4}>
                    <TextInput label="App name" value={name} onChange={setName} />
                    <HStack gap={2}>
                      <Button label="Save" />
                      <Button label="Delete app" variant="destructive" />
                    </HStack>
                  </VStack>
                </Card>
              )}
            </VStack>
          </LayoutContent>
        }
      />
    </AppShell>
  );
}
