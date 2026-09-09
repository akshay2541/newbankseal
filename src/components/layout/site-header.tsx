import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { getCurrentSession } from '@/server/auth/current-user';
import { logger } from '@/lib/logger';
import { siteConfig } from '@/lib/site-config';
import { MainNav } from './main-nav';
import { MobileNav } from './mobile-nav';
import { UserMenu } from './user-menu';
import { Wordmark } from './wordmark';

/**
 * Sticky top bar. Server Component so the signed-in state is resolved before the
 * first paint — no auth flicker, and no session data is shipped to the client
 * beyond the display name and role.
 *
 * Layout follows the design: three groups spaced apart, which leaves the nav sitting
 * between the wordmark and the actions rather than crowded against the logo.
 */
export async function SiteHeader() {
  const session = await safeSession();

  // The bar is opaque rather than blurred on purpose. `backdrop-filter` makes an
  // element the containing block for its `position: fixed` descendants, which trapped
  // the mobile menu's full-screen backdrop inside the 72px bar. The blur bought very
  // little and cost that.
  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-surface">
      <Container className="flex h-18 items-center justify-between gap-6 lg:h-header">
        <Wordmark />

        <MainNav items={siteConfig.primaryNav} className="hidden lg:flex" />

        <div className="flex items-center gap-3">
          {session ? (
            <UserMenu name={session.user.fullName} email={session.user.email} role={session.user.role} />
          ) : (
            <div className="hidden items-center gap-3 sm:flex">
              <Button asChild variant="primary" className="h-11 px-5 text-[0.9375rem]">
                <Link href="/sign-up">Sign up</Link>
              </Button>
              <Button asChild variant="soft" className="h-11 px-5 text-[0.9375rem]">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </div>
          )}

          <MobileNav items={siteConfig.primaryNav} isAuthenticated={Boolean(session)} />
        </div>
      </Container>
    </header>
  );
}

/**
 * A failure to resolve the session must render the signed-out header, not a 500.
 * Failing closed here is both the safe and the available behaviour.
 *
 * Next's control-flow signals (the dynamic-rendering bailout, `redirect`, `notFound`)
 * travel as thrown values. Swallowing them would silently break rendering, so they are
 * re-thrown and only genuine lookup failures are absorbed.
 */
async function safeSession() {
  try {
    return await getCurrentSession();
  } catch (error) {
    if (isNextControlFlowSignal(error)) throw error;
    logger.warn('header.session_lookup_failed', { error });
    return null;
  }
}

function isNextControlFlowSignal(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const digest = (error as { digest?: unknown }).digest;
  if (typeof digest !== 'string') return false;
  return (
    digest.startsWith('DYNAMIC_SERVER_USAGE') ||
    digest.startsWith('NEXT_REDIRECT') ||
    digest === 'NEXT_NOT_FOUND' ||
    digest.startsWith('NEXT_HTTP_ERROR_FALLBACK')
  );
}
