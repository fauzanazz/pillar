'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Navigation from '@/components/layout/Navigation';
import InternalDashboard from './InternalDashboard';

export default function InternalPage() {
  const handleEditContract = (contract: any) => {
    console.log('Edit contract:', contract);
  };

  const handleReviewContract = (contract: any) => {
    console.log('Review contract:', contract);
  };

  const handleDeleteContract = (contract: any) => {
    console.log('Delete contract:', contract);
  };

  const handleCreateContract = () => {
    console.log('Create new contract');
  };

  return (
    <ProtectedRoute allowedRoles={['internal']}>
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
    </ProtectedRoute>
  );
}