import { Hook, OpenAPIHono } from '@hono/zod-openapi';
import type { RequestIdVariables } from 'hono/request-id';

import { authMiddleware } from '@/middlewares';
import { Session, SessionUser } from '@/types/session.type';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const defaultHook: Hook<any, any, any, any> = (result, c) => {
  if (!result.success) {
    return c.json({ errors: result.error.flatten() }, 400);
  }
};

/**
 *
 * @returns basic router with no middleware
 */
export function createRouter() {
  return new OpenAPIHono<{
    Variables: RequestIdVariables;
  }>({ defaultHook });
}

/**
 * For router that use this function, it will have user object in `c.var.user`.
 * @returns router with auth middleware.
 */
export function createAuthRouter() {
  const authRouter = new OpenAPIHono<{
    Variables: {
      user: SessionUser;
      session: Session | null;
    } & RequestIdVariables;
  }>({ defaultHook });

  // Set user middleware
  authRouter.use(authMiddleware());

  return authRouter;
}
