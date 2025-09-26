import { CreateClauseData } from '@/api';
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
