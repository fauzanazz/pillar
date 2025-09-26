import { env } from '@/configs';
import type { AiDraftResponse, AiMetadata } from '@/types/contract.type';

interface CallAiDraftRequest {
  use_case: string;
  parties: string[];
  end_date: string;
  jurisdiction?: string;
  language?: string;
  presignedUrl?: string;
}

interface CallAiDraftResponse extends AiDraftResponse {
  // Any additional fields that might be returned by the AI service
}

/**
 * Call the AI service to generate a contract draft
 */
export const callAiDraftService = async (
  request: CallAiDraftRequest,
): Promise<{
  aiDraftData: CallAiDraftResponse;
  aiMetadata: AiMetadata;
}> => {
  const startTime = Date.now();
  const correlationId = generateCorrelationId();

  try {
    // Default AI service URL - should be configured in environment
    const aiServiceUrl = env.AI_SERVICE_URL || 'http://localhost:8081';
    
    const response = await fetch(`${aiServiceUrl}/ai/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
      },
      body: JSON.stringify({
        use_case: request.use_case,
        parties: request.parties,
        end_date: request.end_date,
        jurisdiction: request.jurisdiction || 'ID',
        language: request.language || 'id',
        presignedUrl: request.presignedUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI service responded with status: ${response.status}`);
    }

    const aiDraftData: CallAiDraftResponse = await response.json();
    
    const processingTime = Date.now() - startTime;
    
    const aiMetadata: AiMetadata = {
      correlation_id: correlationId,
      model_name: 'gpt-4-turbo-preview', // This could be dynamic based on AI service response
      timestamp: new Date().toISOString(),
      processing_time_ms: processingTime,
    };

    return {
      aiDraftData,
      aiMetadata,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    const aiMetadata: AiMetadata = {
      correlation_id: correlationId,
      timestamp: new Date().toISOString(),
      processing_time_ms: processingTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    throw new Error(`Failed to generate AI draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Generate a correlation ID for tracing requests
 */
function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}