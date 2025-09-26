'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LegalDashboard from '../legal/LegalDashboard';
import InternalDashboard from '../internal/page';
import ManagementDashboard from '../management/page';

type DashboardType = 'legal' | 'internal' | 'management';

const DashboardRouter = () => {
  const [currentDashboard, setCurrentDashboard] = useState<DashboardType>('legal');

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

  const renderDashboard = () => {
    switch (currentDashboard) {
      case 'legal':
        return (
          <LegalDashboard
            onEditContract={handleEditContract}
            onReviewContract={handleReviewContract}
            onDeleteContract={handleDeleteContract}
          />
        );
      case 'internal':
        return (
          <InternalDashboard
            onEditContract={handleEditContract}
            onReviewContract={handleReviewContract}
            onDeleteContract={handleDeleteContract}
            onCreateContract={handleCreateContract}
          />
        );
      case 'management':
        return (
          <ManagementDashboard
            onEditContract={handleEditContract}
            onReviewContract={handleReviewContract}
            onDeleteContract={handleDeleteContract}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Switcher */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contract Management System</h1>
              <p className="text-sm text-gray-600">Switch between different dashboard views</p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={currentDashboard === 'legal' ? 'default' : 'outline'}
                onClick={() => setCurrentDashboard('legal')}
              >
                Legal Dashboard
              </Button>
              <Button
                variant={currentDashboard === 'internal' ? 'default' : 'outline'}
                onClick={() => setCurrentDashboard('internal')}
              >
                Internal Dashboard
              </Button>
              <Button
                variant={currentDashboard === 'management' ? 'default' : 'outline'}
                onClick={() => setCurrentDashboard('management')}
              >
                Management Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Current Dashboard */}
      <div className="max-w-7xl mx-auto">
        {renderDashboard()}
      </div>

      {/* Dashboard Info */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">Legal Dashboard</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Review contracts requiring legal approval</li>
                  <li>• Track pending legal reviews</li>
                  <li>• Monitor rejected contracts</li>
                  <li>• Focus on compliance and risk</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-green-600 mb-2">Internal Dashboard</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Manage all contract lifecycle stages</li>
                  <li>• Create and edit draft contracts</li>
                  <li>• Monitor active contracts</li>
                  <li>• Track expiring contracts</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-purple-600 mb-2">Management Dashboard</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Strategic oversight and final approvals</li>
                  <li>• Financial insights and contract values</li>
                  <li>• Partnership and counterparty analytics</li>
                  <li>• High-level performance metrics</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardRouter;