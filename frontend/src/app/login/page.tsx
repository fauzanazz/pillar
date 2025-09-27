import { LoginFormField } from '@/components/login/LoginFormField';
import Image from 'next/image';

import { FileText, Shield, Users } from 'lucide-react';

const LoginPage = () => {

  
  return (
    <div className="min-h-screen twilight-gradient flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Mobile Branding Header - visible on mobile only */}
        <div className="lg:hidden text-center space-y-4 mb-8">
          <div className="flex items-center justify-center gap-3">
            <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shadow-lg p-2">
              <Image 
                src="/logo.png" 
                alt="Pillar Logo" 
                width={32} 
                height={32}
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black">
                Pillar
              </h1>
              <p className="text-black text-sm sm:text-base font-medium">
                Contract Management System
              </p>
            </div>
          </div>
        </div>

        {/* Left side - Branding */}
        <div className="hidden lg:block space-y-10 pr-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg p-3">
                <Image 
                  src="/logo.png" 
                  alt="iFest 2025 Logo" 
                  width={40} 
                  height={40}
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-black/80 mb-1">
                  Pillar
                </h1>
                <p className="text-black/80 text-lg font-medium">
                  Contract Management System
                </p>
              </div>
            </div>
            <div className="h-px bg-white/20 w-full" />
          </div>

          <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-black">
              Streamline Your Contract Management
            </h2>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                  <FileText className="h-6 w-6 text-black" />
                </div>
                <span className="text-black/90 text-lg font-medium">
                  Centralized contract repository
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                  <Shield className="h-6 w-6 text-black" />
                </div>
                <span className="text-black/90 text-lg font-medium">
                  Legal review & compliance
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                  <Users className="h-6 w-6 text-black" />
                </div>
                <span className="text-black/90 text-lg font-medium">
                  Multi-level approval workflow
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0 space-y-4 sm:space-y-6">
          <LoginFormField />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
