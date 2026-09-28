import {useState, type ReactNode} from 'react';
import {ArrowLeft, ArrowRight, Copy, Moon, Search} from 'lucide-react';
import {AppShell} from '@astryxdesign/core/AppShell';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {ClickableCard} from '@astryxdesign/core/ClickableCard';
import {Code} from '@astryxdesign/core/Code';
import {CodeBlock} from '@astryxdesign/core/CodeBlock';
import {Collapsible, CollapsibleGroup} from '@astryxdesign/core/Collapsible';
import {Divider} from '@astryxdesign/core/Divider';
import {Grid} from '@astryxdesign/core/Grid';
import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Kbd} from '@astryxdesign/core/Kbd';
import {Layout, LayoutContent, LayoutPanel} from '@astryxdesign/core/Layout';
import {Link} from '@astryxdesign/core/Link';
import {SideNav, SideNavItem, SideNavSection} from '@astryxdesign/core/SideNav';
import {HStack, VStack} from '@astryxdesign/core/Stack';
import {Tab, TabList} from '@astryxdesign/core/TabList';
import {Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow} from '@astryxdesign/core/Table';
import {Heading, Text} from '@astryxdesign/core/Text';
import {TopNav, TopNavHeading, TopNavItem} from '@astryxdesign/core/TopNav';
import {JazzLogo} from '../jazz-logo';

/*
 * A docs page assembled the way jazz.tools/docs assembles it (garden-co/jazz
 * docs/components/site, docs/components/docs), with representative content,
 * so theme changes can be judged where components meet each other.
 */

function DocsTopNav() {
  return (
    <TopNav
      label="Main"
      heading={<TopNavHeading logo={<JazzLogo className="ks-logo" label="Jazz home" />} headingHref="#docs" />}
      startContent={
        <>
          <TopNavItem label="Blog" href="#docs" />
          <TopNavItem label="Docs" href="#docs" isSelected />
          <TopNavItem label="Dashboard" href="#docs" />
        </>
      }
      centerContent={
        <Button label="Search the docs" variant="secondary" size="lg" width={320} icon={<Icon icon={Search} size="sm" />}>
          <span className="ks-search-label">
            <span>Search the docs</span>
            <Kbd keys="mod+k" />
          </span>
        </Button>
      }
      endContent={<IconButton label="Theme" variant="ghost" size="sm" icon={<Icon icon={Moon} size="sm" />} />}
    />
  );
}

function DocsSideNav() {
  return (
    <SideNav>
      <SideNavSection title="Overview" isHeaderHidden>
        <SideNavItem label="Overview" href="#docs" />
        <SideNavItem label="Quickstart" href="#docs" />
        <SideNavItem label="Install" href="#docs" collapsible={{defaultIsCollapsed: true}}>
          <SideNavItem label="Client" href="#docs" />
          <SideNavItem label="TypeScript Server" href="#docs" />
        </SideNavItem>
      </SideNavSection>
      <SideNavSection title="Getting Started">
        <SideNavItem label="Client Setup" href="#docs" />
        <SideNavItem label="Server Setup" href="#docs" />
      </SideNavSection>
      <SideNavSection title="Working with Data">
        <SideNavItem label="Reading Data" href="#docs" collapsible={{defaultIsCollapsed: false}}>
          <SideNavItem label="Queries" href="#docs" isSelected />
          <SideNavItem label="Filters, Sorting & Pagination" href="#docs" />
          <SideNavItem label="Includes & Relations" href="#docs" />
        </SideNavItem>
        <SideNavItem label="Writing Data" href="#docs" collapsible={{defaultIsCollapsed: true}}>
          <SideNavItem label="Inserts" href="#docs" />
        </SideNavItem>
      </SideNavSection>
      <SideNavSection title="Reference">
        <SideNavItem label="FAQ" href="#docs" />
      </SideNavSection>
    </SideNav>
  );
}

function Outline() {
  const items = [
    ['One-shot queries', 0, true],
    ['Subscriptions', 0, false],
    ['Read durability', 0, false],
    ['Choosing a tier', 1, false],
    ['Framework hooks', 0, false],
  ] as const;
  return (
    <nav className="ks-outline" aria-label="On this page">
      <Text type="supporting" color="secondary" display="block">
        On this page
      </Text>
      {items.map(([label, depth, active]) => (
        <a key={label} href="#docs" data-depth={depth} aria-current={active ? 'true' : undefined}>
          {label}
        </a>
      ))}
    </nav>
  );
}

function Neighbour({direction, title}: {direction: 'Previous' | 'Next'; title: string}) {
  return (
    <ClickableCard label={`${direction}: ${title}`} href="#docs" padding={3}>
      <VStack gap={0.5}>
        <Text type="supporting" color="secondary" display="block">
          <span className={`ks-neighbour ${direction === 'Next' ? 'is-next' : ''}`}>
            <Icon icon={direction === 'Next' ? ArrowRight : ArrowLeft} size="sm" />
            {direction}
          </span>
        </Text>
        <Text weight="medium" display="block">
          {title}
        </Text>
      </VStack>
    </ClickableCard>
  );
}

function P({children}: {children: ReactNode}) {
  return (
    <Text as="p" display="block">
      {children}
    </Text>
  );
}

export function DocsContextPage() {
  const [lang, setLang] = useState('ts');
  return (
    <AppShell height="auto" variant="section" topNav={<DocsTopNav />} sideNav={<DocsSideNav />}>
      <Layout
        height="auto"
        contentWidth={1120}
        end={
          <LayoutPanel isScrollable={false} label="On this page" role="complementary" width={240}>
            <Outline />
          </LayoutPanel>
        }
        content={
          <LayoutContent isScrollable={false} padding={8}>
            <article className="ks-docs-body">
              <VStack gap={2}>
                <Heading level={1}>Queries</Heading>
                <Text type="large" color="secondary">
                  One-shot queries, subscriptions, framework hooks and read durability options.
                </Text>
                <HStack gap={2}>
                  <Button label="Copy Markdown" variant="secondary" size="sm" icon={<Icon icon={Copy} size="sm" />} />
                  <Button label="Open" variant="secondary" size="sm" />
                </HStack>
              </VStack>
              <Divider />

              <Heading level={2}>One-shot queries</Heading>
              <P>
                A one-shot query runs once against the database without subscribing to changes. Use{' '}
                <Code>db.all</Code> when you need a value now, and <Link href="#docs">subscriptions</Link> when the UI
                should follow changes.
              </P>
              <TabList value={lang} onChange={setLang} hasDivider>
                <Tab value="ts" label="TypeScript" />
                <Tab value="rust" label="Rust" />
              </TabList>
              <CodeBlock
                language={lang === 'ts' ? 'typescript' : 'rust'}
                code={
                  lang === 'ts'
                    ? 'export async function readTodos(db: Db) {\n  return db.all(app.todos.where({ done: false }));\n}'
                    : 'let todos = db.all(app.todos().filter(done.eq(false))).await?;'
                }
              />
              <Banner
                status="warning"
                title="Warning"
                description={
                  <>
                    A one-shot read at the <Code>local</Code> tier can miss rows another device wrote. Read{' '}
                    <Link href="#docs">read durability</Link> before relying on it.
                  </>
                }
              />

              <Heading level={2}>Read durability</Heading>
              <P>Every read names how far it waits before resolving.</P>
              <Table density="compact" verticalAlign="top">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Tier</TableHeaderCell>
                    <TableHeaderCell>Waits for</TableHeaderCell>
                    <TableHeaderCell>Typical use</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ['local', 'Nothing', 'Rendering from the local replica'],
                    ['edge', 'Nearest relay', 'Collaborative views'],
                    ['global', 'Core server', 'Checks that must see every write'],
                  ].map(([tier, waits, use]) => (
                    <TableRow key={tier}>
                      <TableCell>
                        <Code>{tier}</Code>
                      </TableCell>
                      <TableCell>{waits}</TableCell>
                      <TableCell>{use}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Banner status="info" title="Note" description="Writes are always local first and sync in the background." />

              <Heading level={3}>Choosing a tier</Heading>
              <ul>
                <li>
                  Use <Code>local</Code> for anything the user is looking at.
                </li>
                <li>Use a stronger tier for checks before irreversible actions.</li>
              </ul>

              <Heading level={2}>FAQ</Heading>
              <CollapsibleGroup type="multiple" hasDividers>
                <Collapsible value="reset" trigger="How do I reset browser storage?" defaultIsOpen={false}>
                  <P>Clear the site data for the app's origin, then reload.</P>
                </Collapsible>
                <Collapsible value="offline" trigger="Can I use Jazz without a server?" defaultIsOpen={false}>
                  <P>Yes. Local-only apps keep everything on the device.</P>
                </Collapsible>
              </CollapsibleGroup>

              <Heading level={2}>Keep reading</Heading>
              <Grid columns={{minWidth: 220}} gap={3}>
                <ClickableCard label="Subscriptions" href="#docs" padding={4}>
                  <VStack gap={1}>
                    <Text weight="semibold">Subscriptions</Text>
                    <Text type="supporting" color="secondary">
                      Follow a query as it changes.
                    </Text>
                  </VStack>
                </ClickableCard>
                <ClickableCard label="Includes & Relations" href="#docs" padding={4}>
                  <VStack gap={1}>
                    <Text weight="semibold">Includes & Relations</Text>
                    <Text type="supporting" color="secondary">
                      Load related rows in one query.
                    </Text>
                  </VStack>
                </ClickableCard>
              </Grid>

              <Divider />
              <nav className="ks-neighbours" aria-label="More pages">
                <Neighbour direction="Previous" title="Reading Data" />
                <Neighbour direction="Next" title="Filters, Sorting & Pagination" />
              </nav>
            </article>
          </LayoutContent>
        }
      />
    </AppShell>
  );
}
