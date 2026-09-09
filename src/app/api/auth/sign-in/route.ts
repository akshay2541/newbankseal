import { signInSchema } from '@/lib/validation/auth';
import { defineRoute, json } from '@/server/api/route-handler';
import { authenticateUser } from '@/server/services/auth-service';

export const POST = defineRoute({ schema: signInSchema }, async ({ body, requestContext }) => {
  const result = await authenticateUser(body, requestContext);

  return json({
    user: { fullName: result.fullName, role: result.role },
    // Already validated as a site-relative path by the schema, so it cannot redirect
    // off-origin. Defaults to the dashboard.
    redirectTo: body.next ?? '/dashboard',
  });
});

export const dynamic = 'force-dynamic';
