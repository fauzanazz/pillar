'use client';

import Navigation from '@/components/layout/Navigation';
import LegalDashboard from '../../components/legal/LegalDashboard';
import { ContractWithRelations } from '@/api';

export default function LegalPage() {
  const handleEditContract = (contract: ContractWithRelations) => {
    console.log('Edit contract:', contract);
  };

  const handleReviewContract = (contract: ContractWithRelations) => {
    console.log('Review contract:', contract);
  };

  const handleDeleteContract = (contract: ContractWithRelations) => {
    console.log('Delete contract:', contract);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto">
        <LegalDashboard />
      </div>
    </div>
  );
}
