import { OpenAPIHono } from '@hono/zod-openapi';

import { healthRouter, protectedHealthRouter } from './health.controller';

const unprotectedRouter = new OpenAPIHono();
unprotectedRouter.route('/', healthRouter);

const protectedRouter = new OpenAPIHono();
protectedRouter.route('/', protectedHealthRouter);

export const apiRouter = new OpenAPIHono();
apiRouter.route('/', unprotectedRouter);
apiRouter.route('/', protectedRouter);
