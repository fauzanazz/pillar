import { env } from '@/configs';
import { createPutObjectPresignedUrl } from '@/lib/s3';
import {
  acceptContract,
  createClause as createClauseRepo,
  createContract as createContractRepo,
  deleteContract as deleteContractRepo,
  getContractById as getContractByIdRepo,
  getContracts as getContractsRepo,
  updateContract as updateContractRepo,
  updateContractWithAiData,
} from '@/repositories/contract.repository';
import type {
  AcceptContract,
  CreateClause,
  CreateContract,
  GetContractsQuery,
  RejectContract,
  UpdateContract,
} from '@/types/contract.type';
import { callAiDraftService } from '@/utils/ai.util';

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

  // Create the contract first
  const newContract = await createContractRepo(
    contractData,
    createdBy,
    url,
    key,
  );

  // Generate AI draft data in the background (optional)
  // This is a non-blocking operation - contract creation proceeds even if AI service is unavailable
  generateAiDraftInBackground(newContract, contractData, url, createdBy);

  return newContract;
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

  return await acceptContract(id, updateData, acceptedBy, 'management');
};

/**
 * Generate AI draft data in the background
 * This is a non-blocking operation that won't fail the contract creation
 */
async function generateAiDraftInBackground(
  contract: any,
  contractData: CreateContract,
  presignedUrl: string,
  createdBy: string,
): Promise<void> {
  try {
    // Check if AI service is configured
    const aiServiceUrl = env.AI_SERVICE_URL || 'http://localhost:8081';
    
    // Quick health check to see if AI service is available
    try {
      const healthResponse = await fetch(`${aiServiceUrl}/healthz`, {
        signal: AbortSignal.timeout(2000), // 2 second timeout for health check
      });
      
      if (!healthResponse.ok) {
        console.warn(
          `AI service health check failed with status ${healthResponse.status}. Skipping AI draft generation.`,
        );
        return;
      }
    } catch (healthError) {
      console.warn(
        'AI service is not available. Contract created without AI draft generation.',
        'To enable AI features, please start the AI service on port 8081.',
      );
      return;
    }

    // Proceed with AI draft generation
    const aiRequest = {
      use_case: `${contractData.title}${contractData.description ? `\n\n${contractData.description}` : ''}`,
      parties: contractData.party.map((p) => p.partyName),
      end_date:
        contractData.endDate ||
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0], // Default to 1 year from now
      jurisdiction: 'ID',
      language: 'id',
      presignedUrl: presignedUrl,
    };

    const { aiDraftData, aiMetadata } = await callAiDraftService(aiRequest);

    // Update the contract with AI data
    await updateContractWithAiData(
      contract.id,
      aiDraftData,
      aiMetadata,
      createdBy,
    );

    console.log(
      `AI draft generated successfully for contract ${contract.id}`,
    );
  } catch (error) {
    console.error(
      `Failed to generate AI draft for contract ${contract.id}:`,
      error instanceof Error ? error.message : 'Unknown error',
    );
    // Don't fail the contract creation if AI generation fails
    // The contract will still be created without AI data
  }
}
