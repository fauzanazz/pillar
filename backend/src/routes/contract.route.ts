import { createRoute } from '@hono/zod-openapi';
import z from 'zod';

import { GenericErrorResponses } from '@/lib';
import {
  clauseCreatedResponseSchema,
  contractResponseSchema,
  contractWithRelationsResponseSchema,
  contractsListResponseSchema,
  createClauseSchema,
  createContractSchema,
  getContractParamsSchema,
  getContractsQuerySchema,
  updateContractSchema,
} from '@/types/contract.type';

export const getContractsRoute = createRoute({
  operationId: 'getContracts',
  tags: ['contracts'],
  method: 'get',
  path: '/contracts',
  request: {
    query: getContractsQuerySchema,
  },
  responses: {
    200: {
      description: 'List of contracts retrieved successfully',
      content: {
        'application/json': {
          schema: contractsListResponseSchema,
        },
      },
    },
  },
  ...GenericErrorResponses,
});

export const getContractByIdRoute = createRoute({
  operationId: 'getContractById',
  tags: ['contracts'],
  method: 'get',
  path: '/contracts/{id}',
  request: {
    params: getContractParamsSchema,
    query: z.object({
      includeRelations: z
        .string()
        .optional()
        .transform((val) => val === 'true'),
    }),
  },
  responses: {
    200: {
      description: 'Contract retrieved successfully',
      content: {
        'application/json': {
          schema: contractWithRelationsResponseSchema,
        },
      },
    },
    ...GenericErrorResponses,
  },
});

export const createContractRoute = createRoute({
  operationId: 'createContract',
  tags: ['contracts'],
  method: 'post',
  path: '/contracts',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createContractSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Contract created successfully',
      content: {
        'application/json': {
          schema: contractResponseSchema,
        },
      },
    },
    ...GenericErrorResponses,
  },
});

export const updateContractRoute = createRoute({
  operationId: 'updateContract',
  tags: ['contracts'],
  method: 'put',
  path: '/contracts/{id}',
  request: {
    params: getContractParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: updateContractSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Contract updated successfully',
      content: {
        'application/json': {
          schema: contractResponseSchema,
        },
      },
    },
    ...GenericErrorResponses,
  },
});

export const deleteContractRoute = createRoute({
  operationId: 'deleteContract',
  tags: ['contracts'],
  method: 'delete',
  path: '/contracts/{id}',
  request: {
    params: getContractParamsSchema,
  },
  responses: {
    200: {
      description: 'Contract deleted successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    ...GenericErrorResponses,
  },
});

export const createClauseRoute = createRoute({
  operationId: 'createClause',
  tags: ['contracts'],
  method: 'post',
  path: '/contracts/{id}/clause',
  request: {
    params: getContractParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: createClauseSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Clause created successfully',
      content: {
        'application/json': {
          schema: clauseCreatedResponseSchema,
        },
      },
    },
    ...GenericErrorResponses,
  },
});
