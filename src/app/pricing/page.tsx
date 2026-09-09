import type { Metadata } from 'next';
import { Container } from '@/components/ui/container';
import { PlanSelector } from '@/features/pricing/components/plan-selector';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Premium plans for Bank Seal: full auction notices, complete addresses, auction history, and daily alerts across multiple cities.',
  alternates: { canonical: '/pricing' },
};

/**
 * Pricing.
 *
 * Static — the plans are configuration and identical for every visitor, so there is
 * nothing here worth rendering per request.
 */
export default function PricingPage() {
  return (
    <Container className="py-14 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-[2.5rem]">
          Ready to get started?
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-500">
          Choose the plan that&apos;s right for your business. Whether you&apos;re just getting started with email
          marketing or well down the path to personalization, we&apos;ve got you covered.
        </p>
      </div>

      <div className="mt-10 sm:mt-12">
        <PlanSelector />
      </div>
    </Container>
  );
}
