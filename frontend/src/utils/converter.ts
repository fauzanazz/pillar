import { CreateClauseData } from '@/api';
import { ClausesGenerationResponse } from '@/services/ai';
import { LegalClause } from '@/types/clauses';

export function ConvertToLegalClauses(
  clauses: {
    id: number;
    clauseText: string;
    clauseDescription: string;
    riskLevel: string;
  }[]
): LegalClause[] {
  const legalClauses: LegalClause[] = [];
  clauses.forEach(element => {
    legalClauses.push({
      id: element.id,
      clauseText: element.clauseText,
      clauseDescription: element.clauseDescription,
      riskLevel: element.clauseDescription,
    });
  });

  return legalClauses;
}

export function ConvertToContractClauses(
  LegalClauses: LegalClause[]
): { clauseText: string; clauseDescription: string }[] {
  const contractClauses: {
    clauseText: string;
    clauseDescription: string;
  }[] = [];

  LegalClauses.forEach(element => {
    contractClauses.push({
      clauseText: element.clauseText,
      clauseDescription: element.clauseDescription,
    });
  });

  return contractClauses;
}

export const mapGeneratedClausesToLegalClauses = (
  response: ClausesGenerationResponse
): LegalClause[] => {
  const generatedClauses = response?.clauses;

  if (!Array.isArray(generatedClauses)) {
    console.error(
      "Invalid input: response does not contain a 'clauses' array."
    );
    return [];
  }

  return generatedClauses.map(clause => ({
    id: parseInt(clause.id, 10), // Convert the string ID to a number.
    clauseText: clause.clauseText,
    clauseDescription: clause.clauseDescription,
    isEditing: false, // Set a default value for the optional isEditing property.
  }));
};
