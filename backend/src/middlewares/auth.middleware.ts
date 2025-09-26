import { Session } from 'better-auth';
import { createFactory } from 'hono/factory';

import { auth } from '@/lib';
import { SessionUser } from '@/types/session.type';

const factory = createFactory<{
  Variables: {
    user: SessionUser | null;
    session: Session | null;
  };
}>();

export const authMiddleware = () => {
  return factory.createMiddleware(async (c, next) => {
    // Skip authentication for /api/auth routes
    if (c.req.url.includes('/api/auth/')) {
      return next();
    }

    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      c.set('user', null);
      c.set('session', null);
      return c.json(
        {
          success: false,
          message: 'Unauthorized',
          code: 401,
        },
        401,
      );
    }

    c.set('user', session.user);
    c.set('session', session.session);
    return next();
  });
};
