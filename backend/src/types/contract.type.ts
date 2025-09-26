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
  'Canceled',
]);

// Base contract schema
export const contractSchema = createSelectSchema(contracts, {
  status: contractStatusEnum,
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

// Contract with relations
export const contractWithRelationsSchema = contractSchema.extend({
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
        clauseType: z.string().nullable(),
        riskLevel: z.string().nullable(),
        aiGenerated: z.boolean(),
        approved: z.boolean(),
      }),
    )
    .optional(),
});

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
});

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

// Types
export type Contract = z.infer<typeof contractSchema>;
export type ContractWithRelations = z.infer<typeof contractWithRelationsSchema>;
export type GetContractParams = z.infer<typeof getContractParamsSchema>;
export type GetContractsQuery = z.infer<typeof getContractsQuerySchema>;
export type CreateContract = z.infer<typeof createContractSchema>;
