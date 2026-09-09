import Image from 'next/image';
import { Container } from '@/components/ui/container';
import { FeatureIcon, type FeatureIconKey } from '@/components/ui/feature-icon';
import { siteConfig } from '@/lib/site-config';

/**
 * "How Bank Seal Makes Asset Ownership Easier".
 *
 * Three columns: two benefits under the heading on the left, the photograph in the
 * middle, three more on the right — the arrangement in the design. Below `lg` the
 * photo moves to the top and the benefits stack into one column.
 */
interface Benefit {
  icon: FeatureIconKey;
  title: string;
  body: string;
  /** Which side of the photograph this benefit sits on in the design. */
  column: 'left' | 'right';
}

const BENEFITS: readonly Benefit[] = [
  {
    icon: 'browse-shortlist',
    column: 'left',
    title: 'Browse & Shortlist',
    body: 'Explore verified bank-repossessed properties, vehicles, and assets with ease.',
  },
  {
    icon: 'exclusive-deals',
    column: 'right',
    title: 'Access Exclusive Deals',
    body: 'Get access to bank-approved listings before they reach the wider market.',
  },
  {
    icon: 'express-interest',
    column: 'left',
    title: 'Express Interest. No Obligation.',
    body: 'Show interest in an asset and receive updates without any commitment.',
  },
  {
    icon: 'better-value',
    column: 'right',
    title: 'Buy at Better Value',
    body: 'Secure quality assets at prices often below market value.',
  },
  {
    icon: 'secure-process',
    column: 'right',
    title: 'Secure & Transparent Process',
    body: 'Review, bid, and purchase with confidence through a clear process.',
  },
];

export function ValueProps() {
  const leftColumn = BENEFITS.filter((benefit) => benefit.column === 'left');
  const rightColumn = BENEFITS.filter((benefit) => benefit.column === 'right');

  return (
    <section className="mt-16 bg-surface py-14" aria-labelledby="value-props-heading">
      <Container>
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-10">
          <div className="lg:pt-2">
            <h2
              id="value-props-heading"
              className="font-display text-2xl leading-tight font-bold tracking-tight text-ink-900 sm:text-3xl"
            >
              How <span className="text-brand-600">{siteConfig.wordmark}</span> Makes Asset Ownership Easier
            </h2>

            <ul className="mt-8 space-y-7">
              {leftColumn.map((benefit) => (
                <BenefitItem key={benefit.title} {...benefit} />
              ))}
            </ul>
          </div>

          {/* The design frames the photo with a white inset border and a soft shadow. */}
          <div className="order-first mx-auto w-full max-w-sm lg:order-none lg:max-w-none">
            <div className="relative aspect-2/3 overflow-hidden rounded-[1.85rem] bg-ink-100 shadow-lift ring-4 ring-white">
              <Image
                src="/images/value-props-couple.jpg"
                alt="A buyer being handed the documents for a property outside the front door"
                fill
                sizes="(min-width: 1024px) 340px, (min-width: 640px) 384px, 90vw"
                className="object-cover"
              />
            </div>
          </div>

          <ul className="space-y-7 lg:pt-2">
            {rightColumn.map((benefit) => (
              <BenefitItem key={benefit.title} {...benefit} />
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

function BenefitItem({ icon, title, body }: Omit<Benefit, 'column'>) {
  return (
    <li>
      <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-600 text-white">
        <FeatureIcon icon={icon} className="size-6" />
      </span>
      <h3 className="mt-3 text-base font-semibold text-ink-900">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{body}</p>
    </li>
  );
}
