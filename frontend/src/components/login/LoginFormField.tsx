'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

import { FileText, Shield, Users } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';

const loginSchema = z.object({
  email: z.email('Email is not valid'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const demoCredentials = [
  {
    role: 'Internal Team',
    email: 'internal',
    password: 'internal123',
    icon: FileText,
  },
  {
    role: 'Legal Team',
    email: 'legal',
    password: 'legal123',
    icon: Shield,
  },
  {
    role: 'Management Team',
    email: 'management',
    password: 'management123',
    icon: Users,
  },
];

export const LoginFormField = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const login = useAuthStore(state => state.login);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const role = useAuthStore(state => state.user?.role);


  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        toast.success('Login successful!');
        if (result.redirectUrl) {
          router.push(result.redirectUrl);
        }
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      toast.error(`An error occurred during login: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="w-full card-glass shadow-2xl shadow-purple-500/20 border-0 rounded-2xl overflow-hidden">
        <CardHeader className="space-y-2 pb-4 sm:pb-6 text-center">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-800">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-slate-700 text-sm sm:text-base font-medium">
            Sign in to access the contract management system
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pb-6 sm:pb-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="text"
                placeholder="miklos@mail.co"
                className="input-twilight h-11 sm:h-12 text-base rounded-xl border-0 focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50 transition-all duration-200"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500 font-medium">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••"
                  className="input-twilight h-11 sm:h-12 text-base rounded-xl border-0 focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50 transition-all duration-200 pr-12"
                  {...form.register('password')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-500 font-medium">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full btn-twilight h-11 sm:h-12 text-base font-semibold rounded-xl border-0 shadow-lg" 
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>

    </>
  );
};
