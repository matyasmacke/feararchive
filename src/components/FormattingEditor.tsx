import { useRef, type ReactNode, type TextareaHTMLAttributes } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  CircleHelp,
} from 'lucide-react';

interface FormattingEditorProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  showHelp?: boolean;
  compact?: boolean;
}

interface ToolbarButtonProps {
  label: string;
  onClick: () => void;
  children: ReactNode;
}

function ToolbarButton({ label, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-8 min-w-8 items-center justify-center rounded-md border border-transparent px-2 text-gray-400 transition-all hover:border-purple-700/40 hover:bg-purple-900/30 hover:text-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
    >
      {children}
    </button>
  );
}

export function FormattingEditor({
  value,
  onChange,
  showHelp = true,
  compact = false,
  className = '',
  ...textareaProps
}: FormattingEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const focusSelection = (start: number, end: number) => {
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(start, end);
    });
  };

  const insertInline = (before: string, after: string, placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const replacement = `${before}${selected}${after}`;
    onChange(`${value.slice(0, start)}${replacement}${value.slice(end)}`);
    focusSelection(start + before.length, start + before.length + selected.length);
  };

  const insertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || 'link text';
    const before = '{url=https://example.com,text=';
    const replacement = `${before}${selected}}`;
    onChange(`${value.slice(0, start)}${replacement}${value.slice(end)}`);
    focusSelection(start + before.length, start + before.length + selected.length);
  };

  const formatLines = (kind: 'heading-2' | 'heading-3' | 'bullet' | 'ordered' | 'quote') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const lineStart = value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1;
    const nextBreak = value.indexOf('\n', selectionEnd);
    const lineEnd = nextBreak === -1 ? value.length : nextBreak;
    const selectedBlock = value.slice(lineStart, lineEnd) || ({
      'heading-2': 'Heading',
      'heading-3': 'Subheading',
      bullet: 'List item',
      ordered: 'Numbered item',
      quote: 'Quote',
    } as const)[kind];
    const lines = selectedBlock.split('\n');

    const prefixes = {
      'heading-2': '## ',
      'heading-3': '### ',
      bullet: '- ',
      quote: '> ',
    } as const;

    let replacement: string;
    if (kind === 'ordered') {
      const allFormatted = lines.every(line => /^\d+[.)]\s+/.test(line));
      replacement = lines
        .map((line, index) => allFormatted ? line.replace(/^\d+[.)]\s+/, '') : `${index + 1}. ${line}`)
        .join('\n');
    } else {
      const prefix = prefixes[kind];
      const allFormatted = lines.every(line => line.startsWith(prefix));
      replacement = lines
        .map(line => allFormatted ? line.slice(prefix.length) : `${prefix}${line}`)
        .join('\n');
    }

    onChange(`${value.slice(0, lineStart)}${replacement}${value.slice(lineEnd)}`);
    focusSelection(lineStart, lineStart + replacement.length);
  };

  const baseTextareaClass = compact
    ? 'min-h-20 w-full resize-y rounded-lg border border-purple-900/30 bg-gray-900/80 px-3 py-2 font-mono text-sm text-gray-200 placeholder-gray-600 transition-all focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/20'
    : 'w-full resize-y rounded-xl border border-purple-900/30 bg-gray-900/80 px-4 py-3 font-mono text-sm leading-relaxed text-gray-200 placeholder-gray-600 transition-all focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/20';

  return (
    <div className="overflow-hidden rounded-xl border border-purple-900/30 bg-gray-950/30 focus-within:border-purple-500/40">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-purple-900/30 bg-gray-950/70 p-1.5">
        <ToolbarButton label="Bold" onClick={() => insertInline('**', '**', 'bold text')}><Bold className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => insertInline('*', '*', 'italic text')}><Italic className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton label="Underline" onClick={() => insertInline('__', '__', 'underlined text')}><Underline className="h-4 w-4" /></ToolbarButton>
        <span className="mx-1 h-5 w-px bg-purple-900/40" aria-hidden="true" />
        <ToolbarButton label="Heading" onClick={() => formatLines('heading-2')}><Heading2 className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton label="Subheading" onClick={() => formatLines('heading-3')}><Heading3 className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton label="Bullet list" onClick={() => formatLines('bullet')}><List className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton label="Numbered list" onClick={() => formatLines('ordered')}><ListOrdered className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton label="Quote" onClick={() => formatLines('quote')}><Quote className="h-4 w-4" /></ToolbarButton>
        <span className="mx-1 h-5 w-px bg-purple-900/40" aria-hidden="true" />
        <ToolbarButton label="Link" onClick={insertLink}><LinkIcon className="h-4 w-4" /></ToolbarButton>
      </div>

      <textarea
        {...textareaProps}
        ref={textareaRef}
        value={value}
        onChange={event => onChange(event.target.value)}
        className={`${baseTextareaClass} rounded-none border-0 bg-transparent focus:ring-0 ${className}`}
      />

      {showHelp && (
        <details className="group border-t border-purple-900/20 bg-purple-950/10 px-3 py-2 text-xs text-gray-500">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-gray-400 transition-colors hover:text-purple-300">
            <CircleHelp className="h-3.5 w-3.5 text-purple-500" />
            Formatting help
            <span className="ml-auto text-[10px] text-gray-600 group-open:hidden">show</span>
            <span className="ml-auto hidden text-[10px] text-gray-600 group-open:inline">hide</span>
          </summary>
          <div className="mt-3 grid gap-2 border-t border-purple-900/20 pt-3 sm:grid-cols-2">
            <p>Select text and click a toolbar button. A blank line starts a new paragraph.</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px]">
              <span><code className="text-purple-300">**text**</code> bold</span>
              <span><code className="text-purple-300">*text*</code> italic</span>
              <span><code className="text-purple-300">__text__</code> underline</span>
              <span><code className="text-purple-300">## text</code> heading</span>
              <span><code className="text-purple-300">- text</code> bullet</span>
              <span><code className="text-purple-300">1. text</code> numbered</span>
              <span><code className="text-purple-300">&gt; text</code> quote</span>
              <span><code className="text-purple-300">{'{url=...,text=...}'}</code> link</span>
            </div>
          </div>
        </details>
      )}
    </div>
  );
}
