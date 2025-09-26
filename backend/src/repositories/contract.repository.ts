import { and, eq, ilike, or, sql } from 'drizzle-orm';

import { env } from '@/configs';
import { db } from '@/db/drizzle';
import {
  clauses,
  contractParties,
  contractVersions,
  contracts,
} from '@/db/schema';
import { getPresignedUrlByUrl } from '@/lib/s3';
import type {
  ContractWithRelations,
  CreateContract,
  GetContractsQuery,
  UpdateContract,
} from '@/types/contract.type';

export const getContracts = async (query: GetContractsQuery) => {
  const { page, limit, status, search } = query;
  const offset = (page - 1) * limit;

  // Build where conditions
  const whereConditions = [];

  if (status) {
    whereConditions.push(eq(contracts.status, status));
  }

  if (search) {
    whereConditions.push(
      or(
        ilike(contracts.title, `%${search}%`),
        ilike(contracts.description, `%${search}%`),
      ),
    );
  }

  // Get contracts with pagination
  const contractsList = await db
    .select()
    .from(contracts)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .limit(limit)
    .offset(offset)
    .orderBy(contracts.createdAt);

  // Get total count for pagination
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(contracts)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  const totalPages = Math.ceil(count / limit);

  // Transform dates to ISO strings
  const transformedContracts = await Promise.all(
    contractsList.map(async (contract) => ({
      ...contract,
      urlContract: await getPresignedUrlByUrl(contract.urlContract || ''),
      status: contract.status as
        | 'Draft'
        | 'Legal Review'
        | 'Management Review'
        | 'Accepted'
        | 'Rejected'
        | 'Canceled',
      createdAt: contract.createdAt.toISOString(),
      updatedAt: contract.updatedAt.toISOString(),
    })),
  );

  return {
    contracts: transformedContracts,
    pagination: {
      page,
      limit,
      total: count,
      totalPages,
    },
  };
};

export const getContractById = async (
  id: number,
  includeRelations = false,
): Promise<ContractWithRelations | null> => {
  const contract = await db
    .select()
    .from(contracts)
    .where(eq(contracts.id, id))
    .limit(1);

  if (contract.length === 0) {
    return null;
  }

  const baseContract = {
    ...contract[0],
    urlContract: await getPresignedUrlByUrl(contract[0].urlContract || ''),
    status: contract[0].status as
      | 'Draft'
      | 'Legal Review'
      | 'Management Review'
      | 'Accepted'
      | 'Rejected'
      | 'Canceled',
    createdAt: contract[0].createdAt.toISOString(),
    updatedAt: contract[0].updatedAt.toISOString(),
  };

  if (!includeRelations) {
    return baseContract;
  }

  // Get related data
  const [versions, parties, contractClauses] = await Promise.all([
    db
      .select({
        id: contractVersions.id,
        filePath: contractVersions.filePath,
        versionNo: contractVersions.versionNo,
        uploadedAt: contractVersions.uploadedAt,
      })
      .from(contractVersions)
      .where(eq(contractVersions.contractId, id)),

    db
      .select({
        id: contractParties.id,
        partyName: contractParties.partyName,
        partyRole: contractParties.partyRole,
      })
      .from(contractParties)
      .where(eq(contractParties.contractId, id)),

    db
      .select({
        id: clauses.id,
        clauseText: clauses.clauseText,
        clauseType: clauses.clauseType,
        riskLevel: clauses.riskLevel,
        aiGenerated: clauses.aiGenerated,
        approved: clauses.approved,
      })
      .from(clauses)
      .where(eq(clauses.contractId, id)),
  ]);

  return {
    ...baseContract,
    urlContract: await getPresignedUrlByUrl(baseContract.urlContract || ''),
    versions: versions.map((v) => ({
      ...v,
      uploadedAt: v.uploadedAt.toISOString(),
    })),
    parties,
    clauses: contractClauses,
  };
};

export const createContract = async (
  contractData: CreateContract,
  createdBy: string,
  url: string,
  key: string,
) => {
  const [newContract] = await db
    .insert(contracts)
    .values({
      ...contractData,
      urlContract: `https://${env.S3_ENDPOINT}/${env.S3_BUCKET_NAME}/${key}`,
      createdBy,
      updatedBy: createdBy,
    })
    .returning();

  return {
    ...newContract,
    status: newContract.status as
      | 'Draft'
      | 'Legal Review'
      | 'Management Review'
      | 'Accepted'
      | 'Rejected'
      | 'Canceled',
    presignedUrl: url,
    createdAt: newContract.createdAt.toISOString(),
    updatedAt: newContract.updatedAt.toISOString(),
  };
};

export const updateContract = async (
  id: number,
  contractData: UpdateContract,
  updatedBy: string,
) => {
  const [updatedContract] = await db
    .update(contracts)
    .set({
      ...contractData,
      updatedBy,
      updatedAt: new Date(),
    })
    .where(eq(contracts.id, id))
    .returning();

  if (!updatedContract) {
    return null;
  }

  return {
    ...updatedContract,
    urlContract: await getPresignedUrlByUrl(updatedContract.urlContract || ''),
    status: updatedContract.status as
      | 'Draft'
      | 'Legal Review'
      | 'Management Review'
      | 'Accepted'
      | 'Rejected'
      | 'Canceled',
    createdAt: updatedContract.createdAt.toISOString(),
    updatedAt: updatedContract.updatedAt.toISOString(),
  };
};
