import { ContractForm } from "@/components/contracts/AddContractModal";


const BASE_AI_URL = 'https://ai.ifest.fauzanazz.com';
// const BASE_AI_URL = 'http://localhost:8081';
export const generateContract = async (data: ContractForm ,  presignedUrl: string ): Promise<string> => {
    try {
      const draftResponse = await fetch(`${BASE_AI_URL}/ai/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          use_case: data.description,
          parties: data.parties.map(party => party.name),
          end_date: data.endDate,
          jurisdiction: 'ID',
          language: 'id',
          presignedUrl: presignedUrl
        })
      });
  
      if (!draftResponse.ok) {
        throw new Error(`Draft API failed: ${draftResponse.status}`);
      }

      return 'Contract generated successfully';
    } catch (error) {
      console.error('Contract generation failed:', error);
      throw error;
    }
  };