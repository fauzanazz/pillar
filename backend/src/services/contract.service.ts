import { env } from '@/configs';
import { createPutObjectPresignedUrl } from '@/lib/s3';
import {
  createClause as createClauseRepo,
  createContract as createContractRepo,
  deleteContract as deleteContractRepo,
  getContractById as getContractByIdRepo,
  getContracts as getContractsRepo,
  updateContract as updateContractRepo,
} from '@/repositories/contract.repository';
import type {
  AcceptContract,
  CreateClause,
  CreateContract,
  GetContractsQuery,
  RejectContract,
  UpdateContract,
} from '@/types/contract.type';

export const getContractsService = async (query: GetContractsQuery) => {
  return await getContractsRepo(query);
};

export const getContractByIdService = async (
  id: number,
  includeRelations = false,
) => {
  return await getContractByIdRepo(id, includeRelations);
};

export const createContractService = async (
  contractData: CreateContract,
  createdBy: string,
) => {
  const key = `${Date.now()}_${contractData.title}_v1`;
  const url = await createPutObjectPresignedUrl(
    key,
    env.S3_BUCKET_NAME,
    60 * 5,
  );

  return await createContractRepo(contractData, createdBy, url, key);
};

export const updateContractService = async (
  id: number,
  contractData: UpdateContract,
  updatedBy: string,
  updaterRole: string,
) => {
  return await updateContractRepo(id, contractData, updatedBy, updaterRole);
};

export const deleteContractService = async (id: number) => {
  return await deleteContractRepo(id);
};

export const createClauseService = async (
  contractId: number,
  clauseData: CreateClause,
  createdBy: string,
) => {
  return await createClauseRepo(contractId, clauseData, createdBy);
};

export const rejectContractService = async (
  id: number,
  rejectData: RejectContract,
  rejectedBy: string,
) => {
  // Determine the status based on reject type
  const status =
    rejectData.rejectType === 'legal' ? 'Rejected Legal' : 'Rejected';

  const updateData: UpdateContract = {
    status: status as 'Rejected' | 'Rejected Legal',
    reason: rejectData.reason,
  };

  return await updateContractRepo(id, updateData, rejectedBy, 'management');
};

export const acceptContractService = async (
  id: number,
  acceptData: AcceptContract,
  acceptedBy: string,
) => {
  const updateData: UpdateContract = {
    status: 'Accepted',
    reason: acceptData.reason,
  };

  return await updateContractRepo(id, updateData, acceptedBy, 'management');
};
