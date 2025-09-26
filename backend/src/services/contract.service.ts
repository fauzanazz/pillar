import { env } from '@/configs';
import { createPutObjectPresignedUrl } from '@/lib/s3';
import {
  createContract as createContractRepo,
  getContractById as getContractByIdRepo,
  getContracts as getContractsRepo,
  updateContract as updateContractRepo,
} from '@/repositories/contract.repository';
import type {
  CreateContract,
  GetContractsQuery,
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
) => {
  return await updateContractRepo(id, contractData, updatedBy);
};
