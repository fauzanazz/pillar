import {
  createAuthRouter,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib';
import {
  createAlertRoute,
  getAlertByIdRoute,
  getAlertsRoute,
  getUnreadAlertsCountRoute,
  markAlertAsReadRoute,
} from '@/routes/alert.route';
import {
  createAlertService,
  getAlertByIdService,
  getAlertsService,
  getUnreadAlertsCountService,
  markAlertAsReadService,
} from '@/services/alert.service';

export const protectedAlertRouter = createAuthRouter();

protectedAlertRouter.openapi(getAlertsRoute, async (c) => {
  const query = c.req.valid('query');
  const result = await getAlertsService(query);

  return c.json(
    createSuccessResponse(result, 'Alerts retrieved successfully', 200),
    200,
  );
});

protectedAlertRouter.openapi(getAlertByIdRoute, async (c) => {
  const { id } = c.req.valid('param');

  const alert = await getAlertByIdService(id);

  if (!alert) {
    return c.json(createErrorResponse('Alert not found', 404), 404);
  }

  return c.json(
    createSuccessResponse(alert, 'Alert retrieved successfully', 200),
    200,
  );
});

protectedAlertRouter.openapi(markAlertAsReadRoute, async (c) => {
  const { id } = c.req.valid('param');
  const readData = c.req.valid('json');

  try {
    const updatedAlert = await markAlertAsReadService(id, readData);

    if (!updatedAlert) {
      return c.json(createErrorResponse('Alert not found', 404), 404);
    }

    return c.json(
      createSuccessResponse(updatedAlert, 'Alert updated successfully', 200),
      200,
    );
  } catch (error) {
    console.error('Error updating alert:', error);
    return c.json(createErrorResponse('Failed to update alert', 500), 500);
  }
});

protectedAlertRouter.openapi(getUnreadAlertsCountRoute, async (c) => {
  try {
    const count = await getUnreadAlertsCountService();

    return c.json(
      createSuccessResponse(
        count,
        'Unread alerts count retrieved successfully',
        200,
      ),
      200,
    );
  } catch (error) {
    console.error('Error getting unread alerts count:', error);
    return c.json(
      createErrorResponse('Failed to get unread alerts count', 500),
      500,
    );
  }
});

protectedAlertRouter.openapi(createAlertRoute, async (c) => {
  const alertData = c.req.valid('json');
  const user = c.var.user;

  if (!user) {
    return c.json(createErrorResponse('User not authenticated', 401), 401);
  }

  try {
    const newAlert = await createAlertService(alertData, user.id);

    return c.json(
      createSuccessResponse(newAlert, 'Alert created successfully', 201),
      201,
    );
  } catch (error) {
    console.error('Error creating alert:', error);
    if (error instanceof Error && error.message === 'Contract not found') {
      return c.json(createErrorResponse('Contract not found', 404), 404);
    }
    return c.json(createErrorResponse('Failed to create alert', 500), 500);
  }
});
