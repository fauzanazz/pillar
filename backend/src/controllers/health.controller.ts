import { createAuthRouter, createRouter } from '@/lib';
import { healthRoute, protectedHealthRoute } from '@/routes/health.route';
import { healthCheckService } from '@/services/health.service';

export const healthRouter = createRouter();
export const protectedHealthRouter = createAuthRouter();

healthRouter.openapi(healthRoute, async (c) => {
  const res = await healthCheckService();
  return c.json(res, 200);
});

protectedHealthRouter.openapi(protectedHealthRoute, async (c) => {
  const user = c.var.user || undefined;
  const session = c.var.session || undefined;
  const res = await healthCheckService();
  return c.json({ ...res, data: { user, session, ...res.data } }, 200);
});
