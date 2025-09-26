'use client';

import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, LogOut, User } from 'lucide-react';

const Navigation = () => {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-accent rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {user.role === 'legal' && 'Legal Dashboard'}
                {user.role === 'internal' && 'Internal Dashboard'}
                {user.role === 'management' && 'Management Dashboard'}
              </h1>
              <p className="text-sm text-gray-600">Contract Management System</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span className="font-medium">{user.name}</span>
              <span className="text-gray-500">({user.role})</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;