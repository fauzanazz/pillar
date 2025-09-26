'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Navigation from '@/components/layout/Navigation';
import LegalDashboard from '../../components/legal/LegalDashboard';

export default function LegalPage() {
  const handleEditContract = (contract: any) => {
    console.log('Edit contract:', contract);
  };

  const handleReviewContract = (contract: any) => {
    console.log('Review contract:', contract);
  };

  const handleDeleteContract = (contract: any) => {
    console.log('Delete contract:', contract);
  };

  return (
    <ProtectedRoute allowedRoles={['legal']}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto">
          <LegalDashboard />
        </div>
      </div>
    </ProtectedRoute>
  );
}
