import type { ListingDetail } from '@/domain/listing';
import { POSSESSION_DETAIL_LABEL } from '@/domain/listing';
import { formatDateTime, formatInr } from '@/lib/format';

/**
 * Answers questions about one listing from the listing's own record.
 *
 * Deliberately deterministic rather than model-generated. Everything on this page is
 * financial or legal information about a distressed asset: a confidently wrong answer
 * to "is the title clear?" costs a bidder real money, and a language model has no way
 * to know the answer isn't in the record. So every response below is derived from a
 * field we actually hold, and anything outside that set returns an explicit "I don't
 * have that" with a pointer to who does.
 *
 * This also honours the gate. The engine reads the same `ListingDetail` the page does,
 * so a locked field is locked here too — the assistant cannot be used as a side channel
 * to read the borrower's name or the bank's direct line.
 */

export interface QaAnswer {
  answer: string;
  /** Whether the answer came from the record, so the UI can style uncertainty honestly. */
  grounded: boolean;
}

interface Intent {
  id: string;
  /** Every term must appear for the intent to match, keeping matches deliberate. */
  all?: readonly string[];
  /** At least one term must appear. */
  any: readonly string[];
  answer: (listing: ListingDetail) => string | null;
}

const INTENTS: readonly Intent[] = [
  {
    id: 'emd',
    any: ['emd', 'earnest', 'deposit'],
    answer: (l) => {
      const amount = `The EMD is ${formatInr(l.emdAmountInr)}`;
      const due = l.emdDueAt ? `, and it must reach ${l.bankName} by ${formatDateTime(l.emdDueAt)}.` : '. The bank has not published a submission deadline for this lot yet.';
      return `${amount}${due}`;
    },
  },
  {
    id: 'auction-timing',
    any: ['auction', 'when', 'date', 'timing', 'time', 'schedule'],
    answer: (l) => {
      if (!l.auctionStartsAt) return 'The bank has not published an auction date for this lot yet.';
      const end = l.auctionEndsAt ? ` and closes ${formatDateTime(l.auctionEndsAt)}` : '';
      return `Bidding opens ${formatDateTime(l.auctionStartsAt)}${end}.`;
    },
  },
  {
    id: 'legal-status',
    any: ['legal', 'title', 'clear', 'encumbrance', 'dispute', 'litigation'],
    answer: (l) =>
      `This lot is held under ${POSSESSION_DETAIL_LABEL[l.possessionType]} possession. Bank auctions are conducted on an "as is where is, as is what is" basis — ${l.bankName} does not warrant title, encumbrances or outstanding dues. Commission your own title search before bidding.`,
  },
  {
    id: 'possession',
    any: ['possession', 'occupied', 'occupant', 'tenant', 'vacant', 'keys'],
    answer: (l) =>
      l.possessionType === 'physical'
        ? 'Possession is physical, so the lender holds the keys and can hand the asset over on completion.'
        : `Possession is ${POSSESSION_DETAIL_LABEL[l.possessionType].toLowerCase()}. The lender holds title but an occupant may still be in place, and removing them can require a separate legal process. Factor that time and cost into your bid.`,
  },
  {
    id: 'price',
    any: ['price', 'reserve', 'cost', 'worth', 'valuation', 'increment', 'bid'],
    answer: (l) => {
      const parts = [`The reserve price is ${formatInr(l.reservePriceInr)}.`];
      if (l.bidIncrementInr) parts.push(`Bids must rise in steps of at least ${formatInr(l.bidIncrementInr)}.`);
      if (l.priceDropPercent && l.previousReservePriceInr) {
        parts.push(`It was revised down ${l.priceDropPercent}% from ${formatInr(l.previousReservePriceInr)}.`);
      }
      return parts.join(' ');
    },
  },
  {
    id: 'area',
    any: ['area', 'size', 'sq', 'square', 'yards', 'feet', 'carpet'],
    answer: (l) => (l.areaLabel ? `The notice quotes the area as ${l.areaLabel}.` : null),
  },
  {
    id: 'location',
    any: ['where', 'address', 'location', 'locality', 'city', 'situated'],
    answer: (l) => {
      const publicPart = [l.locality, l.cityName, l.cityState].filter(Boolean).join(', ');
      if (l.fullAddress.locked) {
        return `It is in ${publicPart}. The complete street address is available to premium members.`;
      }
      return l.fullAddress.value ? `The full address is ${l.fullAddress.value}.` : `It is in ${publicPart}.`;
    },
  },
  {
    id: 'bank',
    any: ['bank', 'lender', 'who is selling', 'seller', 'contact'],
    answer: (l) => {
      const who = `This lot is being auctioned by ${l.bankName}.`;
      if (l.bankContact.locked) return `${who} Direct contact details for the auction desk are available to premium members.`;
      const reach = [l.bankContact.phone, l.bankContact.email].filter(Boolean).join(' or ');
      return reach ? `${who} You can reach the auction desk on ${reach}.` : who;
    },
  },
  {
    id: 'borrower',
    any: ['borrower', 'owner', 'defaulter', 'whose'],
    answer: (l) =>
      l.borrowerName.locked
        ? 'The borrower’s name is available to premium members.'
        : (l.borrowerName.value ?? 'The bank has not published a borrower name for this lot.'),
  },
  {
    id: 'inspection',
    any: ['inspect', 'visit', 'viewing', 'see the property'],
    answer: () =>
      'Inspection windows are set by the bank and published in the auction notice. Unlock the notice or contact the bank’s auction desk for the dates.',
  },
];

/** Questions the panel offers up front, chosen because the record can answer them. */
export const SUGGESTED_QUESTIONS = [
  'How much is the EMD and when is the last date?',
  'Is the legal status clear?',
  'When is the auction and what are the timings?',
] as const;

const FALLBACK =
  'I can only answer from this listing’s published details, and that isn’t one of them. For anything about bidding strategy, title or dues, speak to a property lawyer or contact the bank directly.';

export function answerListingQuestion(listing: ListingDetail, question: string): QaAnswer {
  const normalised = question.toLowerCase();

  for (const intent of INTENTS) {
    if (intent.all && !intent.all.every((term) => normalised.includes(term))) continue;
    if (!intent.any.some((term) => normalised.includes(term))) continue;

    const answer = intent.answer(listing);
    if (answer) return { answer, grounded: true };
  }

  return { answer: FALLBACK, grounded: false };
}
