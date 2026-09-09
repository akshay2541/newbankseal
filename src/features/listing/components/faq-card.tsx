import { Card } from '@/components/ui/card';

/**
 * Frequently asked questions.
 *
 * Built on native `<details>`/`<summary>`: it opens and closes without JavaScript, is
 * keyboard operable and correctly announced, and needs no ARIA of our own. A
 * hand-rolled accordion would be more code and less accessible.
 *
 * The answers below are general guidance about bank auctions in India, deliberately
 * not per-listing legal advice.
 */
const FAQS = [
  {
    question: 'What is EMD and when do I have to pay it?',
    answer:
      'Earnest Money Deposit is a refundable pre-bid deposit, typically 10% of the reserve price. It must reach the bank before the submission deadline shown above, otherwise your bid is not accepted. Unsuccessful bidders are refunded.',
  },
  {
    question: 'What is the difference between physical and symbolic possession?',
    answer:
      'With physical possession the lender holds the keys and can hand the asset over on completion. With symbolic or constructive possession the lender holds title but an occupant may still be in place, and removing them can require a separate legal process. Factor that time and cost into your bid.',
  },
  {
    question: 'Is the title guaranteed to be clear?',
    answer:
      'No. Bank auctions are conducted on an "as is where is, as is what is" basis. The lender does not warrant title, encumbrances or dues. Commission your own title search and check for unpaid taxes and society dues before bidding.',
  },
  {
    question: 'Can I inspect the property before the auction?',
    answer:
      'Usually yes. Inspection windows are set by the bank and listed in the auction notice. Unlock the notice or contact the bank’s auction desk for the dates.',
  },
] as const;

export function FaqCard() {
  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-ink-900">Frequently asked questions</h2>

      <div className="mt-3 divide-y divide-border-subtle">
        {FAQS.map((faq) => (
          <details key={faq.question} className="group py-3">
            <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium text-ink-900 marker:content-none [&::-webkit-details-marker]:hidden">
              {faq.question}
              <span
                aria-hidden="true"
                className="shrink-0 text-lg leading-none text-ink-400 transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-2 pr-8 text-xs leading-relaxed text-ink-600">{faq.answer}</p>
          </details>
        ))}
      </div>
    </Card>
  );
}
