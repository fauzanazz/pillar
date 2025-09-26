import { LoginFormField } from '@/components/login/LoginFormField';

import { FileText, Shield, Users } from 'lucide-react';

const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center ifest-gradient-bg p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="hidden lg:block space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-accent rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  iFest 2025
                </h1>
                <p className="text-muted-foreground">
                  Contract Management System
                </p>
              </div>
            </div>
            <div className="h-px bg-border w-full" />
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">
              Streamline Your Contract Management
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-accent/10 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-accent" />
                </div>
                <span className="text-muted-foreground">
                  Centralized contract repository
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Shield className="h-4 w-4 text-accent" />
                </div>
                <span className="text-muted-foreground">
                  Legal review & compliance
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-accent" />
                </div>
                <span className="text-muted-foreground">
                  Multi-level approval workflow
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="space-y-6">
          <LoginFormField />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
