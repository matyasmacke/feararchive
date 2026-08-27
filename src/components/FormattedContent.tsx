import { Fragment, type ReactNode } from 'react';

interface FormattedContentProps {
  content: string;
  className?: string;
  compact?: boolean;
  allowLinks?: boolean;
}

type InlineTokenType = 'link' | 'pipe-link' | 'url' | 'bold' | 'underline' | 'italic';

interface InlineMatch {
  type: InlineTokenType;
  match: RegExpMatchArray;
}

const inlinePatterns: { type: InlineTokenType; pattern: RegExp }[] = [
  { type: 'link', pattern: /\{url=([^},]+?)(?:,text=([^}]+?))?\}/ },
  { type: 'pipe-link', pattern: /\|\s*(https?:\/\/[^\s|]+)\s*\|/ },
  { type: 'url', pattern: /https?:\/\/[^\s<>{}|]+/ },
  { type: 'bold', pattern: /\*\*(.+?)\*\*/ },
  { type: 'underline', pattern: /__(.+?)__/ },
  { type: 'italic', pattern: /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/ },
];

function findNextInlineMatch(value: string): InlineMatch | null {
  let best: InlineMatch | null = null;
  for (const rule of inlinePatterns) {
    const match = value.match(rule.pattern);
    if (!match || match.index === undefined) continue;
    if (!best || match.index < (best.match.index ?? Number.POSITIVE_INFINITY)) {
      best = { type: rule.type, match };
    }
  }
  return best;
}

function safeHref(rawUrl: string): string | null {
  const url = rawUrl.trim();
  return /^(https?:\/\/|mailto:)/i.test(url) ? url : null;
}

function renderInline(value: string, keyPrefix: string, allowLinks: boolean): ReactNode[] {
  const nodes: ReactNode[] = [];
  let remaining = value;
  let index = 0;

  while (remaining) {
    const token = findNextInlineMatch(remaining);
    if (!token || token.match.index === undefined) {
      nodes.push(remaining);
      break;
    }

    const before = remaining.slice(0, token.match.index);
    if (before) nodes.push(before);

    const key = `${keyPrefix}-${index}`;
    const fullMatch = token.match[0];

    if (token.type === 'bold') {
      nodes.push(
        <strong key={key} className="font-bold text-gray-100">
          {renderInline(token.match[1], `${key}-bold`, allowLinks)}
        </strong>,
      );
    } else if (token.type === 'underline') {
      nodes.push(
        <u key={key} className="decoration-purple-400/70 underline-offset-2">
          {renderInline(token.match[1], `${key}-underline`, allowLinks)}
        </u>,
      );
    } else if (token.type === 'italic') {
      nodes.push(
        <em key={key} className="italic text-gray-300">
          {renderInline(token.match[1], `${key}-italic`, allowLinks)}
        </em>,
      );
    } else {
      const rawUrl = token.type === 'link'
        ? token.match[1]
        : token.type === 'pipe-link'
          ? token.match[1]
          : fullMatch;
      const href = safeHref(rawUrl);
      const label = token.type === 'link' ? (token.match[2] || rawUrl) : rawUrl;

      if (!allowLinks) {
        nodes.push(label.trim());
      } else if (href) {
        const renderedLabel = token.type === 'link' && token.match[2]
          ? renderInline(label.trim(), `${key}-link`, allowLinks)
          : label.trim();
        nodes.push(
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-purple-400 underline decoration-purple-500/40 underline-offset-2 transition-colors hover:text-purple-300"
          >
            {renderedLabel}
          </a>,
        );
      } else {
        nodes.push(fullMatch);
      }
    }

    remaining = remaining.slice(token.match.index + fullMatch.length);
    index += 1;
  }

  return nodes;
}

function isBlockStart(line: string): boolean {
  const trimmed = line.trimStart();
  return /^###?\s+/.test(trimmed)
    || /^[-*]\s+/.test(trimmed)
    || /^\d+[.)]\s+/.test(trimmed)
    || /^>\s?/.test(trimmed);
}

export function FormattedContent({ content, className = '', compact = false, allowLinks = true }: FormattedContentProps) {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;

  const headingLarge = compact
    ? 'mb-2 mt-4 text-base font-bold text-gray-100 first:mt-0'
    : 'mb-3 mt-8 text-2xl font-bold leading-tight text-gray-100 first:mt-0';
  const headingSmall = compact
    ? 'mb-2 mt-3 text-sm font-bold text-purple-200 first:mt-0'
    : 'mb-3 mt-7 text-xl font-semibold leading-tight text-purple-100 first:mt-0';
  const paragraphClass = compact
    ? 'mb-2 leading-relaxed last:mb-0'
    : 'mb-5 leading-8 last:mb-0';
  const listClass = compact
    ? 'mb-2 space-y-1 pl-5 last:mb-0 marker:text-purple-500'
    : 'mb-5 space-y-2 pl-7 leading-8 last:mb-0 marker:text-purple-500';

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      blocks.push(<h4 key={`h4-${index}`} className={headingSmall}>{renderInline(trimmed.slice(4), `h4-${index}`, allowLinks)}</h4>);
      index += 1;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      blocks.push(<h3 key={`h3-${index}`} className={headingLarge}>{renderInline(trimmed.slice(3), `h3-${index}`, allowLinks)}</h3>);
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ''));
        index += 1;
      }
      blocks.push(
        <ul key={`ul-${index}`} className={`list-disc ${listClass}`}>
          {items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item, `ul-${index}-${itemIndex}`, allowLinks)}</li>)}
        </ul>,
      );
      continue;
    }

    if (/^\d+[.)]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+[.)]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+[.)]\s+/, ''));
        index += 1;
      }
      blocks.push(
        <ol key={`ol-${index}`} className={`list-decimal ${listClass}`}>
          {items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item, `ol-${index}-${itemIndex}`, allowLinks)}</li>)}
        </ol>,
      );
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''));
        index += 1;
      }
      blocks.push(
        <blockquote
          key={`quote-${index}`}
          className={`${compact ? 'my-2 py-1.5' : 'my-6 py-2'} border-l-4 border-purple-600/60 pl-4 italic text-gray-400`}
        >
          {quoteLines.map((quoteLine, quoteIndex) => (
            <Fragment key={quoteIndex}>
              {quoteIndex > 0 && <br />}
              {renderInline(quoteLine, `quote-${index}-${quoteIndex}`, allowLinks)}
            </Fragment>
          ))}
        </blockquote>,
      );
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    blocks.push(
      <p key={`p-${index}`} className={paragraphClass}>
        {paragraphLines.map((paragraphLine, lineIndex) => (
          <Fragment key={lineIndex}>
            {lineIndex > 0 && <br />}
            {renderInline(paragraphLine, `p-${index}-${lineIndex}`, allowLinks)}
          </Fragment>
        ))}
      </p>,
    );
  }

  return <div className={`formatted-content min-w-0 max-w-full [overflow-wrap:anywhere] [word-break:break-word] ${className}`}>{blocks}</div>;
}

export function stripFormatting(content: string): string {
  return content
    .replace(/\{url=([^},]+?)(?:,text=([^}]+?))?\}/g, (_match, url: string, label?: string) => label?.trim() || url.trim())
    .replace(/\|\s*(https?:\/\/[^\s|]+)\s*\|/g, '$1')
    .replace(/^\s*#{2,3}\s+/gm, '')
    .replace(/^\s*[-*]>?\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
