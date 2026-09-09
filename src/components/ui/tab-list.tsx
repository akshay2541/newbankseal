'use client';

import { cn } from '@/lib/cn';
import { useRef } from 'react';

export interface TabItem {
  key: string;
  label: string;
}

/**
 * The pill tab strip used above the auction panels and the Top Properties rail.
 *
 * Implements the WAI-ARIA tabs pattern — roving tabindex, Left/Right arrows and
 * Home/End — so a keyboard user moves through the strip with one Tab stop rather
 * than one per pill. Selection state is owned by the caller; this only reports it.
 *
 * `soft` is the design's default treatment (grey fill, no border). `outline` is the
 * bordered variant the auction panel switcher uses.
 */
export function TabList({
  tabs,
  activeKey,
  onSelect,
  ariaLabel,
  tabId,
  panelId,
  variant = 'soft',
  className,
}: {
  tabs: TabItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  ariaLabel: string;
  /** Element id for a tab, so the panel can point back at it with aria-labelledby. */
  tabId: (key: string) => string;
  /** Element id of the panel a tab controls. */
  panelId: (key: string) => string;
  variant?: 'soft' | 'outline';
  className?: string;
}) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.key === activeKey),
  );

  const focusTab = (index: number) => {
    const bounded = (index + tabs.length) % tabs.length;
    const tab = tabs[bounded];
    if (!tab) return;
    onSelect(tab.key);
    tabRefs.current[bounded]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        focusTab(activeIndex + 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        focusTab(activeIndex - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusTab(0);
        break;
      case 'End':
        event.preventDefault();
        focusTab(tabs.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-3', className)}
    >
      {tabs.map((tab, index) => {
        const selected = tab.key === tabs[activeIndex]?.key;
        return (
          <button
            key={tab.key}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            type="button"
            role="tab"
            id={tabId(tab.key)}
            aria-selected={selected}
            aria-controls={panelId(tab.key)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(tab.key)}
            onKeyDown={onKeyDown}
            className={cn(
              'shrink-0 rounded-btn px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
              selected && 'bg-brand-600 text-white',
              !selected &&
                variant === 'soft' &&
                'bg-ink-100 text-ink-600 hover:bg-ink-200 hover:text-ink-900',
              !selected &&
                variant === 'outline' &&
                'border border-border-subtle bg-surface text-ink-600 hover:bg-ink-50 hover:text-ink-900',
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
