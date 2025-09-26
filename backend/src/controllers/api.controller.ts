import { OpenAPIHono } from '@hono/zod-openapi';

import { protectedAlertRouter } from './alert.controller';
import { protectedContractRouter } from './contract.controller';
import { healthRouter, protectedHealthRouter } from './health.controller';

const unprotectedRouter = new OpenAPIHono();
unprotectedRouter.route('/', healthRouter);

const protectedRouter = new OpenAPIHono();
protectedRouter.route('/', protectedHealthRouter);
protectedRouter.route('/', protectedContractRouter);
protectedRouter.route('/', protectedAlertRouter);

export const apiRouter = new OpenAPIHono();
apiRouter.route('/', unprotectedRouter);
apiRouter.route('/', protectedRouter);
