import { notFound } from '@/lib/errors';
import { listingQuestionSchema } from '@/lib/validation/auth';
import { defineRoute, json } from '@/server/api/route-handler';
import { RATE_LIMITS } from '@/server/security/rate-limit';
import { getListingDetail } from '@/server/services/listing-detail-service';
import { answerListingQuestion } from '@/server/services/listing-qa';

/**
 * Answer a question about one listing.
 *
 * A POST rather than a GET because it is quota-consuming and should never be cached or
 * prefetched. `defineRoute` applies CSRF, the quota and body limits before this runs.
 *
 * The listing is loaded through the same gated path the page uses and the caller's own
 * session, so the assistant cannot reveal a field the page would have withheld.
 */
export const POST = defineRoute(
  { schema: listingQuestionSchema, rateLimit: RATE_LIMITS.listingQuestion },
  async ({ body, session }) => {
    const data = await getListingDetail(body.slug, session);
    if (!data) throw notFound();

    const result = answerListingQuestion(data.listing, body.question);

    return json({ answer: result.answer, grounded: result.grounded });
  },
);

export const dynamic = 'force-dynamic';
