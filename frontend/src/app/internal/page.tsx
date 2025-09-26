'use client';

import Navigation from '@/components/layout/Navigation';
import InternalDashboard from './InternalDashboard';
import { ContractWithRelations } from '@/api';

export default function InternalPage() {
  const handleEditContract = (contract: ContractWithRelations) => {
    console.log('Edit contract:', contract);
  };

  const handleReviewContract = (contract: ContractWithRelations) => {
    console.log('Review contract:', contract);
  };

  const handleDeleteContract = (contract: ContractWithRelations) => {
    console.log('Delete contract:', contract);
  };

  const handleCreateContract = () => {
    console.log('Create new contract');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto">
        <InternalDashboard
          onEditContract={handleEditContract}
          onReviewContract={handleReviewContract}
          onDeleteContract={handleDeleteContract}
          onCreateContract={handleCreateContract}
        />
      </div>
    </div>
  );
}
