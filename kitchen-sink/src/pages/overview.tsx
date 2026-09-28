import {useState, type ReactNode} from 'react';
import {ArrowRight, Bell, Copy, Download, Moon, Plus, Search, Settings, Trash2} from 'lucide-react';
import {Avatar} from '@astryxdesign/core/Avatar';
import {Badge} from '@astryxdesign/core/Badge';
import {Banner} from '@astryxdesign/core/Banner';
import {Breadcrumbs, BreadcrumbItem} from '@astryxdesign/core/Breadcrumbs';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {CheckboxInput} from '@astryxdesign/core/CheckboxInput';
import {ClickableCard} from '@astryxdesign/core/ClickableCard';
import {Code} from '@astryxdesign/core/Code';
import {CodeBlock} from '@astryxdesign/core/CodeBlock';
import {Collapsible, CollapsibleGroup} from '@astryxdesign/core/Collapsible';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {Divider} from '@astryxdesign/core/Divider';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Grid} from '@astryxdesign/core/Grid';
import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Kbd} from '@astryxdesign/core/Kbd';
import {Link} from '@astryxdesign/core/Link';
import {Pagination} from '@astryxdesign/core/Pagination';
import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import {RadioList, RadioListItem} from '@astryxdesign/core/RadioList';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Selector} from '@astryxdesign/core/Selector';
import {Skeleton} from '@astryxdesign/core/Skeleton';
import {Spinner} from '@astryxdesign/core/Spinner';
import {HStack, VStack} from '@astryxdesign/core/Stack';
import {StatusDot} from '@astryxdesign/core/StatusDot';
import {Switch} from '@astryxdesign/core/Switch';
import {Tab, TabList} from '@astryxdesign/core/TabList';
import {Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow} from '@astryxdesign/core/Table';
import {Heading, Text} from '@astryxdesign/core/Text';
import {TextArea} from '@astryxdesign/core/TextArea';
import {TextInput} from '@astryxdesign/core/TextInput';
import {ToggleButton} from '@astryxdesign/core/ToggleButton';
import {Token} from '@astryxdesign/core/Token';
import {Tooltip} from '@astryxdesign/core/Tooltip';

const BUTTON_VARIANTS = ['primary', 'secondary', 'ghost', 'destructive'] as const;
const BUTTON_SIZES = ['sm', 'md', 'lg'] as const;
const BADGE_VARIANTS = [
  'neutral',
  'info',
  'success',
  'warning',
  'error',
  'blue',
  'cyan',
  'green',
  'orange',
  'pink',
  'purple',
  'red',
  'teal',
  'yellow',
] as const;
const BANNER_STATUSES = ['info', 'success', 'warning', 'error'] as const;
const CARD_VARIANTS = ['default', 'muted', 'transparent', 'blue', 'green', 'yellow'] as const;
const TEXT_TYPES = ['display-1', 'display-2', 'display-3', 'large', 'body', 'label', 'supporting', 'code'] as const;
const TEXT_COLORS = ['primary', 'secondary', 'disabled', 'placeholder', 'accent'] as const;
const STATUS_DOTS = ['success', 'warning', 'error', 'accent', 'neutral'] as const;
const TOKEN_COLORS = ['default', 'blue', 'green', 'yellow', 'red', 'purple', 'gray'] as const;

const COLOR_TOKENS = [
  '--color-background-body',
  '--color-background-surface',
  '--color-background-card',
  '--color-background-muted',
  '--color-neutral',
  '--color-border',
  '--color-border-emphasized',
  '--color-text-primary',
  '--color-text-secondary',
  '--color-text-disabled',
  '--color-accent',
  '--color-text-accent',
  '--color-accent-muted',
  '--color-overlay-hover',
];
const RADII = ['--radius-inner', '--radius-element', '--radius-container', '--radius-page', '--radius-full'];
const SPACING = ['0-5', '1', '2', '3', '4', '6', '8', '12'];

const SAMPLE_CODE = `import { schema as s } from "jazz-tools";

const schema = {
  todos: s.table({ title: s.string(), done: s.boolean() }),
};

// Read: reactive, stays up to date across devices
db.subscribe(app.todos.where({ done: false }), (todos) => {
  console.log(todos);
});`;

/** One section of the overview: a heading, a short note and the specimens. */
function Specimen({id, title, note, children}: {id: string; title: string; note?: string; children: ReactNode}) {
  return (
    <section id={id} className="ks-specimen">
      <VStack gap={1}>
        <Heading level={2}>{title}</Heading>
        {note ? (
          <Text color="secondary" type="supporting">
            {note}
          </Text>
        ) : null}
      </VStack>
      <div className="ks-specimen-body">{children}</div>
    </section>
  );
}

function Label({children}: {children: ReactNode}) {
  return (
    <Text type="supporting" color="secondary" display="block">
      {children}
    </Text>
  );
}

function Swatch({name}: {name: string}) {
  return (
    <div className="ks-swatch-card">
      <div className="ks-swatch-chip" style={{background: `var(${name})`}} />
      <code>{name.replace('--color-', '')}</code>
    </div>
  );
}

export const OVERVIEW_SECTIONS = [
  ['tokens', 'Tokens'],
  ['type', 'Type'],
  ['buttons', 'Buttons'],
  ['labels', 'Badges and tokens'],
  ['feedback', 'Banners and progress'],
  ['forms', 'Form controls'],
  ['cards', 'Cards'],
  ['navigation', 'Tabs and navigation'],
  ['data', 'Tables and code'],
  ['disclosure', 'Disclosure and overlays'],
] as const;

export function OverviewPage() {
  const [text, setText] = useState('Ship it');
  const [area, setArea] = useState('Local-first, with sync.');
  const [isOn, setOn] = useState(true);
  const [isChecked, setChecked] = useState<boolean | 'indeterminate'>(true);
  const [radio, setRadio] = useState('react');
  const [segment, setSegment] = useState('ts');
  const [tab, setTab] = useState('overview');
  const [select, setSelect] = useState('global');
  const [page, setPage] = useState(3);
  const [isPressed, setPressed] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="ks-overview">
      <nav className="ks-toc" aria-label="Sections">
        {OVERVIEW_SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`} onClick={(e) => (e.preventDefault(), document.getElementById(id)?.scrollIntoView())}>
            {label}
          </a>
        ))}
      </nav>

      <div className="ks-overview-main">
        <VStack gap={2}>
          <Heading level={1}>Jazz design system</Heading>
          <Text color="secondary">
            Every Astryx component in the Jazz theme. Open the settings (bottom right) to dial the theme live; "Copy
            changes" gives the diff to paste into themes/jazz/jazzTheme.ts.
          </Text>
        </VStack>

        <Specimen id="tokens" title="Tokens" note="Resolved values of the current theme, in the current mode.">
          <Label>Colours</Label>
          <div className="ks-grid-swatches">
            {COLOR_TOKENS.map((t) => (
              <Swatch key={t} name={t} />
            ))}
          </div>
          <Label>Radii</Label>
          <HStack gap={4} wrap="wrap">
            {RADII.map((r) => (
              <div key={r} className="ks-radius" style={{borderRadius: `var(${r})`}}>
                <code>{r.replace('--radius-', '')}</code>
              </div>
            ))}
          </HStack>
          <Label>Spacing</Label>
          <VStack gap={1}>
            {SPACING.map((s) => (
              <HStack key={s} gap={3} vAlign="center">
                <code className="ks-mono-label">spacing-{s}</code>
                <div className="ks-spacing-bar" style={{width: `var(--spacing-${s})`}} />
              </HStack>
            ))}
          </VStack>
        </Specimen>

        <Specimen id="type" title="Type" note="Heading levels, text types and colours.">
          <VStack gap={3}>
            <Heading level={1}>Heading level 1: The database that syncs</Heading>
            <Heading level={2}>Heading level 2: Subscriptions</Heading>
            <Heading level={3}>Heading level 3: Choosing a tier</Heading>
            <Divider />
            {TEXT_TYPES.map((t) => (
              <HStack key={t} gap={4} vAlign="center">
                <code className="ks-mono-label">{t}</code>
                <Text type={t} display="block">
                  {t.startsWith('display') ? 'jazz' : 'Local-first relational database with sync.'}
                </Text>
              </HStack>
            ))}
            <Divider />
            <HStack gap={4} wrap="wrap">
              {TEXT_COLORS.map((c) => (
                <Text key={c} color={c}>
                  {c}
                </Text>
              ))}
            </HStack>
            <Text>
              Body text with <Code>inline code</Code>, a <Link href="#type">link</Link>, <strong>bold</strong> and{' '}
              <em>italic</em>, and a shortcut <Kbd keys="mod+k" />.
            </Text>
          </VStack>
        </Specimen>

        <Specimen id="buttons" title="Buttons" note="Variants × sizes, with icons, loading and disabled states.">
          <VStack gap={3}>
            {BUTTON_VARIANTS.map((v) => (
              <HStack key={v} gap={2} vAlign="center" wrap="wrap">
                <code className="ks-mono-label">{v}</code>
                {BUTTON_SIZES.map((s) => (
                  <Button key={s} label={`${v} ${s}`} variant={v} size={s} />
                ))}
                <Button label="With icon" variant={v} icon={<Icon icon={Plus} size="sm" />} />
                <Button label="Loading" variant={v} isLoading />
                <Button label="Disabled" variant={v} isDisabled />
              </HStack>
            ))}
            <HStack gap={2} vAlign="center" wrap="wrap">
              <code className="ks-mono-label">icon</code>
              {BUTTON_VARIANTS.map((v) => (
                <IconButton key={v} label={`${v} icon`} variant={v} icon={<Icon icon={Settings} size="sm" />} />
              ))}
              <IconButton label="Search" variant="ghost" size="sm" icon={<Icon icon={Search} size="sm" />} />
              <IconButton label="Theme" variant="ghost" size="sm" icon={<Icon icon={Moon} size="sm" />} />
              <ToggleButton
                label="Notify"
                icon={<Icon icon={Bell} size="sm" />}
                isPressed={isPressed}
                onPressedChange={setPressed}
              />
            </HStack>
          </VStack>
        </Specimen>

        <Specimen id="labels" title="Badges and tokens">
          <HStack gap={2} wrap="wrap">
            {BADGE_VARIANTS.map((v) => (
              <Badge key={v} variant={v} label={v} />
            ))}
          </HStack>
          <HStack gap={2} wrap="wrap">
            {TOKEN_COLORS.map((c) => (
              <Token key={c} label={c} color={c} />
            ))}
            <Token label="removable" onRemove={() => {}} />
          </HStack>
          <HStack gap={4} wrap="wrap">
            {STATUS_DOTS.map((v) => (
              <HStack key={v} gap={1} vAlign="center">
                <StatusDot variant={v} label={v} />
                <Text type="supporting">{v}</Text>
              </HStack>
            ))}
          </HStack>
          <HStack gap={3} vAlign="center">
            <Avatar name="Ada Lovelace" size="sm" />
            <Avatar name="Grace Hopper" />
            <Avatar name="Alan Kay" size="lg" />
          </HStack>
        </Specimen>

        <Specimen id="feedback" title="Banners and progress">
          <VStack gap={3}>
            {BANNER_STATUSES.map((s) => (
              <Banner
                key={s}
                status={s}
                title={s[0].toUpperCase() + s.slice(1)}
                description={
                  <>
                    Callout body text with a <Link href="#feedback">link</Link> and <Code>code</Code>.
                  </>
                }
              />
            ))}
            <ProgressBar label="Syncing" value={64} hasValueLabel />
            <ProgressBar label="Loading" isIndeterminate />
            <HStack gap={4} vAlign="center">
              <Spinner size="sm" />
              <Spinner />
              <Spinner size="lg" />
              <Skeleton width={160} height={16} />
              <Skeleton width={80} height={16} />
            </HStack>
          </VStack>
        </Specimen>

        <Specimen id="forms" title="Form controls">
          <Grid columns={{minWidth: 260}} gap={4}>
            <TextInput label="Title" value={text} onChange={setText} description="What the todo says" />
            <TextInput label="Search" value="" onChange={() => {}} startIcon={Search} placeholder="Search the docs" />
            <TextInput label="Invalid" value="not an email" onChange={() => {}} status={{type: 'error', message: 'Enter an email address'}} />
            <TextInput label="Disabled" value="read only" onChange={() => {}} isDisabled />
            <Selector
              label="Read tier"
              value={select}
              onChange={setSelect}
              options={[
                {value: 'local', label: 'Local'},
                {value: 'global', label: 'Global'},
              ]}
            />
            <TextArea label="Notes" value={area} onChange={setArea} rows={3} />
          </Grid>
          <HStack gap={6} wrap="wrap" vAlign="start">
            <VStack gap={2}>
              <Switch label="Offline mode" value={isOn} onChange={setOn} />
              <CheckboxInput label="Done" value={isChecked} onChange={setChecked} />
              <CheckboxInput label="Partly done" value="indeterminate" onChange={() => {}} />
            </VStack>
            <RadioList label="Framework" value={radio} onChange={setRadio}>
              <RadioListItem value="react" label="React" />
              <RadioListItem value="vue" label="Vue" />
              <RadioListItem value="svelte" label="Svelte" />
            </RadioList>
            <SegmentedControl label="Language" value={segment} onChange={setSegment}>
              <SegmentedControlItem value="ts" label="TypeScript" />
              <SegmentedControlItem value="rust" label="Rust" />
            </SegmentedControl>
          </HStack>
        </Specimen>

        <Specimen id="cards" title="Cards">
          <Grid columns={{minWidth: 200}} gap={3}>
            {CARD_VARIANTS.map((v) => (
              <Card key={v} variant={v} padding={4}>
                <VStack gap={1}>
                  <Text weight="semibold">{v}</Text>
                  <Text type="supporting" color="secondary">
                    Card variant
                  </Text>
                </VStack>
              </Card>
            ))}
          </Grid>
          <Grid columns={{minWidth: 220}} gap={3}>
            <ClickableCard label="Client" href="#cards" padding={4}>
              <VStack gap={1}>
                <Text weight="semibold">Client</Text>
                <Text type="supporting" color="secondary">
                  Install Jazz in a web or native app.
                </Text>
              </VStack>
            </ClickableCard>
            <ClickableCard label="Next: Subscriptions" href="#cards" padding={3}>
              <VStack gap={0.5}>
                <Text type="supporting" color="secondary">
                  Next <Icon icon={ArrowRight} size="sm" />
                </Text>
                <Text weight="medium">Subscriptions</Text>
              </VStack>
            </ClickableCard>
          </Grid>
        </Specimen>

        <Specimen id="navigation" title="Tabs and navigation">
          <TabList value={tab} onChange={setTab}>
            <Tab value="overview" label="Overview" />
            <Tab value="usage" label="Usage" />
            <Tab value="billing" label="Billing" />
          </TabList>
          <Breadcrumbs>
            <BreadcrumbItem href="#navigation">Docs</BreadcrumbItem>
            <BreadcrumbItem href="#navigation">Reading data</BreadcrumbItem>
            <BreadcrumbItem>Queries</BreadcrumbItem>
          </Breadcrumbs>
          <Pagination page={page} onChange={setPage} totalPages={12} />
          <HStack gap={4} wrap="wrap">
            <Link href="#navigation">Inline link</Link>
            <Link href="https://jazz.tools" isExternalLink>
              External link
            </Link>
            <Link href="#navigation" isStandalone>
              Standalone link
            </Link>
          </HStack>
        </Specimen>

        <Specimen id="data" title="Tables and code">
          <Table density="compact" verticalAlign="top">
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Tier</TableHeaderCell>
                <TableHeaderCell>Waits for</TableHeaderCell>
                <TableHeaderCell>Use when</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Code>local</Code>
                </TableCell>
                <TableCell>Nothing</TableCell>
                <TableCell>Instant UI from the local replica</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Code>global</Code>
                </TableCell>
                <TableCell>The core server</TableCell>
                <TableCell>You need the latest state everywhere</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <CodeBlock code={SAMPLE_CODE} language="typescript" title="schema.ts" />
          <CodeBlock code="pnpm add jazz-tools" language="bash" />
          <HStack gap={2} vAlign="center">
            <Text>Shortcuts:</Text>
            <Kbd keys="mod+k" />
            <Kbd keys="shift+enter" />
            <Kbd keys="escape" />
          </HStack>
        </Specimen>

        <Specimen id="disclosure" title="Disclosure and overlays">
          <CollapsibleGroup type="multiple" hasDividers>
            <Collapsible value="a" trigger="How do I reset browser storage?" defaultIsOpen={false}>
              <Text>Clear the site data for the app's origin, then reload.</Text>
            </Collapsible>
            <Collapsible value="b" trigger="Can I use Jazz without a server?" defaultIsOpen={false}>
              <Text>Yes. A local-only app keeps everything on the device.</Text>
            </Collapsible>
          </CollapsibleGroup>
          <HStack gap={2} vAlign="center">
            <Tooltip content="Copies the page as Markdown">
              <Button label="Hover for tooltip" variant="secondary" icon={<Icon icon={Copy} size="sm" />} />
            </Tooltip>
            <Button label="Open dialog" onClick={() => setDialogOpen(true)} />
          </HStack>
          <Dialog isOpen={isDialogOpen} onOpenChange={setDialogOpen} width={440}>
            <VStack gap={4}>
              <DialogHeader title="Delete app?" onOpenChange={setDialogOpen} />
              <Text>This removes the app and its data from Jazz Cloud. It cannot be undone.</Text>
              <HStack gap={2} hAlign="end">
                <Button label="Cancel" variant="secondary" onClick={() => setDialogOpen(false)} />
                <Button
                  label="Delete"
                  variant="destructive"
                  icon={<Icon icon={Trash2} size="sm" />}
                  onClick={() => setDialogOpen(false)}
                />
              </HStack>
            </VStack>
          </Dialog>
          <Card padding={4}>
            <EmptyState
              title="No apps yet"
              description="Create an app to get an app ID for your client."
              icon={<Icon icon={Download} />}
              actions={<Button label="Create app" icon={<Icon icon={Plus} size="sm" />} />}
            />
          </Card>
        </Specimen>
      </div>
    </div>
  );
}
