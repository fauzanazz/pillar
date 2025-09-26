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
  ContractStatusEnum,
  ContractWithRelations,
  CreateClause,
  CreateContract,
  GetContractsQuery,
  UpdateContract,
} from '@/types/contract.type';
import { validateContractStatus } from '@/utils/validateContractStatus';

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
      status: contract.status as ContractStatusEnum,
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
    status: contract[0].status as ContractStatusEnum,
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
        clauseDescription: clauses.clauseDescription,
        riskLevel: clauses.riskLevel,
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
  const { party, ...restContractData } = contractData;
  const result = await db.transaction(async (tx) => {
    const [newContract] = await tx
      .insert(contracts)
      .values({
        ...restContractData,
        urlContract: `https://${env.S3_ENDPOINT}/${env.S3_BUCKET_NAME}/${key}`,
        createdBy,
        updatedBy: createdBy,
      })
      .returning();

    // Insert parties
    if (party && party.length > 0) {
      const partyValues = party.map((p) => ({
        contractId: newContract.id,
        partyName: p.partyName,
        partyRole: p.partyRole,
        createdBy,
        updatedBy: createdBy,
      }));
      await tx.insert(contractParties).values(partyValues);
    }

    // Insert version 1
    await tx.insert(contractVersions).values({
      contractId: newContract.id,
      filePath: `https://${env.S3_ENDPOINT}/${env.S3_BUCKET_NAME}/${key}`,
      versionNo: 1,
      createdBy,
      updatedBy: createdBy,
    });

    return newContract;
  });

  return {
    ...result,
    status: result.status as ContractStatusEnum,
    presignedUrl: url,
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
  };
};

export const updateContract = async (
  id: number,
  contractData: UpdateContract,
  updatedBy: string,
  updaterRole: string,
) => {
  const [contract] = await db
    .select()
    .from(contracts)
    .where(eq(contracts.id, id))
    .limit(1);

  if (!contract) {
    return null;
  }

  // Validate status
  const prevStatus = contract.status;
  const nextStatus = contractData.status || contract.status;
  if (!validateContractStatus(prevStatus, nextStatus, updaterRole)) {
    console.error('Error: ', prevStatus, ' To: ', nextStatus);
    throw new Error('Invalid contract status');
  }

  // If status changes from Accepted to Draft, increment version
  let newVersionNo: number | null = null;
  if (prevStatus === 'Accepted' && nextStatus === 'Draft') {
    // Get latest version number
    const latestVersion = await db
      .select({ versionNo: contractVersions.versionNo })
      .from(contractVersions)
      .where(eq(contractVersions.contractId, id))
      .orderBy(contractVersions.versionNo)
      .limit(1);
    const lastVersion =
      latestVersion.length > 0 ? latestVersion[0].versionNo : 1;
    newVersionNo = lastVersion + 1;
  }

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

  // Insert new version if needed
  if (newVersionNo) {
    await db.insert(contractVersions).values({
      contractId: id,
      filePath: updatedContract.urlContract || '',
      versionNo: newVersionNo,
      createdBy: updatedBy,
      updatedBy: updatedBy,
    });
  }

  return {
    ...updatedContract,
    urlContract: await getPresignedUrlByUrl(updatedContract.urlContract || ''),
    status: updatedContract.status as ContractStatusEnum,
    createdAt: updatedContract.createdAt.toISOString(),
    updatedAt: updatedContract.updatedAt.toISOString(),
  };
};

export const deleteContract = async (id: number) => {
  // First, check if the contract exists
  const existingContract = await db
    .select()
    .from(contracts)
    .where(eq(contracts.id, id))
    .limit(1);

  if (existingContract.length === 0) {
    return null;
  }

  // Finally, delete the contract
  const [deletedContract] = await db
    .update(contracts)
    .set({ deleted: true })
    .where(eq(contracts.id, id))
    .returning();

  return deletedContract;
};

export const createClause = async (
  contractId: number,
  clauseData: CreateClause,
  createdBy: string,
) => {
  // First check if contract exists
  const existingContract = await db
    .select()
    .from(contracts)
    .where(eq(contracts.id, contractId))
    .limit(1);

  if (existingContract.length === 0) {
    throw new Error('Contract not found');
  }

  const mappedClauseData = clauseData.map((clause) => ({
    contractId,
    clauseText: clause.clauseText,
    clauseDescription: clause.clauseDescription,
    createdBy,
    updatedBy: createdBy,
  }));

  const [newClause] = await db
    .insert(clauses)
    .values(mappedClauseData)
    .returning();

  return newClause;
};
