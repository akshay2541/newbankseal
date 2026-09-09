'use client';

import { useId, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Container } from '@/components/ui/container';
import { TabList } from '@/components/ui/tab-list';

export interface TabPanel {
  key: string;
  label: string;
  /** Heading shown inside the panel, e.g. "Bank Auctions by City". */
  title: string;
  items: Array<{ label: string; count: number; href: string }>;
}

/**
 * The filter switcher beneath the hero.
 *
 * All panel content is passed in from the server — the client only tracks which one
 * is visible. Keyboard behaviour lives in `TabList`.
 */
export function AuctionTabs({ tabs }: { tabs: TabPanel[] }) {
  const baseId = useId();
  const [activeKey, setActiveKey] = useState(tabs[0]?.key ?? '');

  if (tabs.length === 0) return null;

  const activeTab = tabs.find((tab) => tab.key === activeKey) ?? tabs[0];
  if (!activeTab) return null;

  return (
    <Container className="pt-6">
      <TabList
        tabs={tabs}
        activeKey={activeTab.key}
        onSelect={setActiveKey}
        ariaLabel="Browse auctions by"
        tabId={(key) => `${baseId}-tab-${key}`}
        panelId={(key) => `${baseId}-panel-${key}`}
        variant="outline"
      />

      <Card
        role="tabpanel"
        id={`${baseId}-panel-${activeTab.key}`}
        aria-labelledby={`${baseId}-tab-${activeTab.key}`}
        tabIndex={0}
        className="p-5"
      >
        <h2 className="text-lg font-semibold text-ink-900">{activeTab.title}</h2>

        {activeTab.items.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">No auctions listed in this category yet. Check back shortly.</p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {activeTab.items.map((item) => (
              <li key={item.href}>
                <Chip href={item.href}>
                  {item.label}
                  <span>({item.count})</span>
                </Chip>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Container>
  );
}
