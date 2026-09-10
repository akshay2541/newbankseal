'use client';

import { SendHorizontal } from 'lucide-react';
import { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/csrf-client';
import { cn } from '@/lib/cn';

/**
 * "Ask about this property".
 *
 * Answers come from a server route that reads only this listing's record — see
 * `listing-qa.ts` for why that is deterministic rather than model-generated. The panel
 * repeats that limitation in the visitor's own words, because someone about to commit
 * an EMD deserves to know how much weight to put on what it says.
 *
 * The quota is displayed here but enforced server-side; this counter is a courtesy, not
 * the control. Exhausting it client-side simply stops wasted round-trips.
 */
const MAX_QUESTIONS = 5;

interface Exchange {
  question: string;
  answer: string;
  grounded: boolean;
}

export function AskPanel({
  slug,
  suggestions,
}: {
  slug: string;
  suggestions: readonly string[];
}) {
  const [history, setHistory] = useState<Exchange[]>([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const used = history.length;
  const exhausted = used >= MAX_QUESTIONS;

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || pending || exhausted) return;

    setPending(true);
    setError(null);

    try {
      const response = await apiFetch('/api/listings/ask', {
        method: 'POST',
        body: JSON.stringify({ slug, question: trimmed }),
      });

      if (!response.ok) {
        const problem = (await response.json().catch(() => null)) as { message?: string } | null;
        setError(problem?.message ?? 'That question could not be answered right now.');
        return;
      }

      const result = (await response.json()) as { answer: string; grounded: boolean };
      setHistory((previous) => [...previous, { question: trimmed, answer: result.answer, grounded: result.grounded }]);
      setDraft('');
    } catch {
      setError('We could not reach the server. Please check your connection and try again.');
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  }

  return (
    <Card className="p-card">
      <h2 className="text-h5 font-semibold text-ink-900">Ask about this property</h2>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
        Answers come from this listing&apos;s published details only. For bidding, title or legal decisions, talk to a
        property lawyer.
      </p>

      {history.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {history.map((exchange, index) => (
            <li key={`${exchange.question}-${index}`} className="space-y-1.5">
              <p className="rounded-xl rounded-br-sm bg-brand-600 px-3.5 py-2 text-xs font-medium text-white">
                {exchange.question}
              </p>
              <p
                className={cn(
                  'rounded-xl rounded-bl-sm px-3.5 py-2 text-xs leading-relaxed',
                  exchange.grounded ? 'bg-ink-50 text-ink-700' : 'bg-warning-soft text-ink-700',
                )}
              >
                {exchange.answer}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Suggestions are hidden once the conversation starts; they exist to get it going. */}
      {history.length === 0 ? (
        <ul className="mt-4 space-y-2">
          {suggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => ask(suggestion)}
                disabled={pending}
                className="min-h-control w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-3 text-left text-xs text-ink-700 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-60"
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void ask(draft);
        }}
        className="mt-3 flex items-center gap-2"
      >
        <label htmlFor="ask-input" className="sr-only">
          Ask a question about this listing
        </label>
        <input
          id="ask-input"
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={pending || exhausted}
          maxLength={300}
          placeholder={exhausted ? 'Question limit reached' : 'Ask a question about this listing…'}
          className="h-control min-w-0 flex-1 rounded-xl border border-border-subtle bg-surface px-3.5 text-xs text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 disabled:bg-ink-50"
        />
        <button
          type="submit"
          disabled={pending || exhausted || draft.trim().length < 3}
          aria-label="Send question"
          className="inline-flex size-control shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
        >
          <SendHorizontal className="size-4" />
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-2 text-2xs font-medium text-danger-500">
          {error}
        </p>
      ) : null}

      {/* Polite so it is announced after an answer rather than interrupting it. */}
      <p aria-live="polite" className="mt-2 text-right text-2xs text-ink-400">
        {used} of {MAX_QUESTIONS} questions used
      </p>
    </Card>
  );
}
