import { signUpSchema } from '@/lib/validation/auth';
import { defineRoute, json } from '@/server/api/route-handler';
import { registerUser } from '@/server/services/auth-service';

/**
 * Create an account and start a session.
 * Guards (CSRF, rate limit, body limits, validation) are applied by `defineRoute`.
 */
export const POST = defineRoute({ schema: signUpSchema }, async ({ body, requestContext }) => {
  const result = await registerUser(body, requestContext);

  // Only non-sensitive display fields cross back to the client. The session itself
  // lives in an httpOnly cookie set by the service.
  return json({ user: { fullName: result.fullName, role: result.role } }, 201);
});

/** Cookies are set here, so this must never be statically evaluated. */
export const dynamic = 'force-dynamic';
