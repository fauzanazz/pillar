import { createSelectSchema } from 'drizzle-zod';
import z from 'zod';

import { contracts } from '@/db/schema';
import { createResponseSchema } from '@/lib/response-factory';

// Contract status enum
export const contractStatusEnum = z.enum([
  'Draft',
  'Legal Review',
  'Management Review',
  'Accepted',
  'Rejected',
  'Rejected Legal',
  'Canceled',
]);
export type ContractStatusEnum = z.infer<typeof contractStatusEnum>;

// Base contract schema
export const contractSchema = createSelectSchema(contracts, {
  status: contractStatusEnum,
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
}).openapi('Contract');

// Contract with relations
export const contractWithRelationsSchema = contractSchema
  .extend({
    versions: z
      .array(
        z.object({
          id: z.number(),
          filePath: z.string(),
          versionNo: z.number(),
          uploadedAt: z.string().datetime(),
        }),
      )
      .optional(),
    parties: z
      .array(
        z.object({
          id: z.number(),
          partyName: z.string(),
          partyRole: z.string(),
        }),
      )
      .optional(),
    clauses: z
      .array(
        z.object({
          id: z.number(),
          clauseText: z.string(),
          clauseDescription: z.string().nullable(),
          riskLevel: z.string().nullable(),
        }),
      )
      .optional(),
  })
  .openapi('ContractWithRelations');

// Request schemas
export const getContractParamsSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10)),
});

export const getContractsQuerySchema = z.object({
  page: z
    .string()
    .default('1')
    .transform((val) => parseInt(val, 10)),
  limit: z
    .string()
    .default('10')
    .transform((val) => parseInt(val, 10)),
  status: contractStatusEnum.optional(),
  search: z.string().optional(),
});

export const createContractSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  endDate: z.string().optional(),
  status: contractStatusEnum.default('Draft'),
  party: z
    .array(
      z.object({
        partyName: z.string().min(1, 'Party name is required'),
        partyRole: z.string().min(1, 'Party role is required'),
      }),
    )
    .min(1, 'At least one party is required'),
});

export const updateContractSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  endDate: z.string().optional(),
  status: contractStatusEnum.optional(),
  reason: z.string().optional(),
});

export const rejectContractSchema = z.object({
  rejectType: z.enum(['legal', 'all'], {
    message: 'Reject type must be either "legal" or "all"',
  }),
  reason: z.string().min(1, 'Rejection reason is required'),
});

export const acceptContractSchema = z.object({
  reason: z.string().min(1, 'Acceptance reason is required'),
});

export const createClauseSchema = z.array(
  z.object({
    clauseText: z.string().min(1, 'Clause text is required'),
    clauseDescription: z.string().optional(),
  }),
);

export const clauseResponseSchema = z.array(
  z.object({
    id: z.number(),
    contractId: z.number(),
    clauseText: z.string(),
    clauseDescription: z.string(),
    createdBy: z.string().nullable(),
    updatedBy: z.string().nullable(),
    createdAt: z.union([z.string(), z.date()]),
    updatedAt: z.union([z.string(), z.date()]),
  }),
);

// Response schemas
export const contractResponseSchema = createResponseSchema(
  contractSchema.extend({ presignedUrl: z.string() }),
);
export const contractWithRelationsResponseSchema = createResponseSchema(
  contractWithRelationsSchema,
);
export const contractsListResponseSchema = createResponseSchema(
  z.object({
    contracts: z.array(contractSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  }),
);

// Clause response schema
export const clauseCreatedResponseSchema =
  createResponseSchema(clauseResponseSchema);

// Types
export type Contract = z.infer<typeof contractSchema>;
export type ContractWithRelations = z.infer<typeof contractWithRelationsSchema>;
export type GetContractParams = z.infer<typeof getContractParamsSchema>;
export type GetContractsQuery = z.infer<typeof getContractsQuerySchema>;
export type CreateContract = z.infer<typeof createContractSchema>;
export type UpdateContract = z.infer<typeof updateContractSchema>;
export type RejectContract = z.infer<typeof rejectContractSchema>;
export type AcceptContract = z.infer<typeof acceptContractSchema>;
export type CreateClause = z.infer<typeof createClauseSchema>;
export type ClauseResponse = z.infer<typeof clauseResponseSchema>;
