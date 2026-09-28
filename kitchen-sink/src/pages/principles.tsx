import type {ComponentProps, ReactNode} from 'react';
import type {MDXComponents} from 'mdx/types';
import {Code} from '@astryxdesign/core/Code';
import {Link} from '@astryxdesign/core/Link';
import {Heading, Text} from '@astryxdesign/core/Text';
import Principles from '../../../principles.mdx';

/*
 * principles.mdx at the repo root is the source agents read (also served as
 * /principles.mdx); this page renders it with the theme's own components.
 */

const components: MDXComponents = {
  h1: ({children}) => <Heading level={1}>{children}</Heading>,
  h2: ({children}) => <Heading level={2}>{children}</Heading>,
  h3: ({children}) => <Heading level={3}>{children}</Heading>,
  p: ({children}) => (
    <Text as="p" display="block">
      {children}
    </Text>
  ),
  a: ({href, children}: ComponentProps<'a'>) => <Link href={href ?? '#'}>{children as ReactNode}</Link>,
  code: ({children}) => <Code>{children}</Code>,
};

export function PrinciplesPage() {
  return (
    <main className="ks-principles">
      <article className="ks-docs-body">
        <Principles components={components} />
        <Text type="supporting" color="secondary" as="p" display="block">
          Source for agents: <Link href="/principles.mdx">/principles.mdx</Link> ·{' '}
          <Link href="https://github.com/garden-co/design/blob/main/principles.mdx">principles.mdx on GitHub</Link>
        </Text>
      </article>
    </main>
  );
}
