import {
  createAuthRouter,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib';
import {
  createClauseRoute,
  createContractRoute,
  deleteContractRoute,
  getContractByIdRoute,
  getContractsRoute,
  updateContractRoute,
} from '@/routes/contract.route';
import {
  createClauseService,
  createContractService,
  deleteContractService,
  getContractByIdService,
  getContractsService,
  updateContractService,
} from '@/services/contract.service';

export const protectedContractRouter = createAuthRouter();

protectedContractRouter.openapi(getContractsRoute, async (c) => {
  const query = c.req.valid('query');
  const result = await getContractsService(query);

  return c.json(
    createSuccessResponse(result, 'Contracts retrieved successfully', 200),
    200,
  );
});

protectedContractRouter.openapi(getContractByIdRoute, async (c) => {
  const { id } = c.req.valid('param');
  const { includeRelations } = c.req.valid('query');

  const contract = await getContractByIdService(id, includeRelations);

  if (!contract) {
    return c.json(createErrorResponse('Contract not found', 404), 404);
  }

  return c.json(
    createSuccessResponse(contract, 'Contract retrieved successfully', 200),
    200,
  );
});

protectedContractRouter.openapi(createContractRoute, async (c) => {
  const contractData = c.req.valid('json');
  const user = c.var.user;

  if (!user) {
    return c.json(createErrorResponse('User not authenticated', 401), 401);
  }

  try {
    const res = await createContractService(contractData, user.id);

    console.log(res);

    return c.json(
      createSuccessResponse(res, 'Contract created successfully', 201),
      201,
    );
  } catch (_error) {
    return c.json(createErrorResponse('Failed to create contract', 500), 500);
  }
});

protectedContractRouter.openapi(updateContractRoute, async (c) => {
  const { id } = c.req.valid('param');
  const contractData = c.req.valid('json');
  const user = c.var.user;

  if (!user) {
    return c.json(createErrorResponse('User not authenticated', 401), 401);
  }

  try {
    const updatedContract = await updateContractService(
      id,
      contractData,
      user.id,
      user.role as string,
    );

    if (!updatedContract) {
      return c.json(createErrorResponse('Contract not found', 404), 404);
    }

    return c.json(
      createSuccessResponse(
        updatedContract,
        'Contract updated successfully',
        200,
      ),
      200,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (_error: any) {
    return c.json(
      createErrorResponse(_error.message || 'Failed to update contract', 500),
      500,
    );
  }
});

protectedContractRouter.openapi(deleteContractRoute, async (c) => {
  const { id } = c.req.valid('param');
  const user = c.var.user;

  if (!user) {
    return c.json(createErrorResponse('User not authenticated', 401), 401);
  }

  try {
    const deletedContract = await deleteContractService(id);

    if (!deletedContract) {
      return c.json(createErrorResponse('Contract not found', 404), 404);
    }

    return c.json(
      createSuccessResponse(
        { success: true, message: 'Contract deleted successfully' },
        'Contract deleted successfully',
        200,
      ),
      200,
    );
  } catch (_error) {
    return c.json(createErrorResponse('Failed to delete contract', 500), 500);
  }
});

protectedContractRouter.openapi(createClauseRoute, async (c) => {
  try {
    const { id } = c.req.valid('param');
    const clauseData = c.req.valid('json');
    const session = c.get('session');

    if (!session) {
      return c.json(createErrorResponse('Unauthorized', 401), 401);
    }

    const newClause = await createClauseService(id, clauseData, session.userId);

    return c.json(
      createSuccessResponse(newClause, 'Clause created successfully', 201),
      201,
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Contract not found') {
      return c.json(createErrorResponse('Contract not found', 404), 404);
    }
    return c.json(createErrorResponse('Failed to create clause', 500), 500);
  }
});
