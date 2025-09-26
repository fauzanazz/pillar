import { ContractForm } from "@/components/contracts/AddContractModal";
import { Contract } from "@/api/types.gen";


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

export interface SearchMatch {
  contract: {
    id: string;
    template: {
      title: string;
      description: string;
      parties: Array<{
        role: string;
        name: string;
        rep: string;
        address: string;
      }>;
      end_date: string;
      jurisdiction: string;
      language: string;
      value: number | null;
      special_requirements: string | null;
    };
    clauses: any[];
    status: string;
    created_by: string;
    current_assignee: string;
    created_at: string;
    updated_at: string;
    workflow_history: any[];
    management_notes: string | null;
    legal_notes: string | null;
    internal_notes: string | null;
    json_file_path: string | null;
    pdf_file_path: string | null;
    risk_score: number | null;
  };
  score: number;
  match_reasons: string[];
  highlights: {
    keywords: string[];
  };
}

export interface SearchResponse {
  query: {
    original_query: string;
    intent: string;
    filters: any;
    confidence: number;
    explanation: string;
  };
  matches: SearchMatch[];
  total_found: number;
  processing_time_ms: number;
  suggestions: any;
}

export const searchContract = async (query: string): Promise<SearchResponse> => {
  const response = await fetch(`${BASE_AI_URL}/api/v1/search?q=${query}&limit=10`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }
  
  return response.json();
};

// Transform search matches to Contract format
export const transformSearchMatches = (matches: SearchMatch[]): Contract[] => {
  return matches.map(match => {
    const { contract } = match;
    
    // Map AI service status to frontend status
    const mapStatus = (status: string): Contract['status'] => {
      switch (status.toLowerCase()) {
        case 'draft': return 'Draft';
        case 'legal_review': return 'Legal Review';
        case 'management_review': return 'Management Review';
        case 'approved':
        case 'accepted': return 'Accepted';
        case 'rejected': return 'Rejected';
        case 'canceled': return 'Canceled';
        default: return 'Draft';
      }
    };

    return {
      id: parseInt(contract.id),
      title: contract.template.title,
      description: contract.template.description,
      endDate: contract.template.end_date,
      status: mapStatus(contract.status),
      riskScore: contract.risk_score || 0,
      createdBy: contract.created_by,
      updatedBy: contract.current_assignee,
      urlContract: contract.pdf_file_path || '',
      createdAt: contract.created_at,
      updatedAt: contract.updated_at,
    };
  });
};