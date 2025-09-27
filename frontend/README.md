# MODYV Frontend

A modern, responsive frontend application built with **Next.js 15**, **React 19**, and **TypeScript**. This client application provides an intuitive user interface for the MODYV contract management platform with role-based access control and AI-powered features.

## 🚀 Features

- **Modern UI Framework**: Built with Next.js 15 and React 19 for optimal performance
- **Responsive Design**: Mobile-first design with Tailwind CSS and custom components
- **Role-Based Access**: Dedicated interfaces for Legal, Internal, and Management teams
- **Dark/Light Theme**: Seamless theme switching with system preference detection
- **Type-Safe Development**: Full TypeScript support with strict type checking
- **State Management**: Zustand for efficient and scalable state management
- **Form Handling**: React Hook Form with Zod validation for robust form processing
- **Real-time Features**: Live contract updates and notification system
- **AI Integration**: Seamless integration with AI-powered contract drafting
- **PDF Viewer**: Built-in PDF preview and annotation capabilities

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   MODYV Frontend App                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │    Pages    │  │ Components  │  │   Stores    │         │
│  │             │  │             │  │             │         │
│  │ • Legal     │  │ • UI Kit    │  │ • Auth      │         │
│  │ • Internal  │  │ • Business  │  │ • Contracts │         │
│  │ • Management│  │ • Layout    │  │ • Alerts    │         │
│  │ • Auth      │  │ • Forms     │  │ • Theme     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│           │               │               │                 │
│           └───────────────┼───────────────┘                 │
│                           │                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Services  │  │   Hooks     │  │ Middleware  │         │
│  │             │  │             │  │             │         │
│  │ • API Client│  │ • Custom    │  │ • Auth      │         │
│  │ • HTTP      │  │ • State     │  │ • Routes    │         │
│  │ • WebSocket │  │ • Effects   │  │ • Guards    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── (auth)/           # Auth layout group
│   │   │   └── login/        # Login page
│   │   ├── legal/            # Legal team interface
│   │   │   ├── page.tsx      # Legal dashboard
│   │   │   └── review/       # Contract review pages
│   │   ├── internal/         # Internal team interface
│   │   │   └── page.tsx      # Internal dashboard
│   │   ├── management/       # Management interface
│   │   │   └── page.tsx      # Management dashboard
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page
│   │   └── global.css        # Global styles
│   ├── components/           # Reusable components
│   │   ├── ui/              # Base UI components
│   │   │   ├── button.tsx   # Button component
│   │   │   ├── input.tsx    # Input component
│   │   │   ├── dialog.tsx   # Modal component
│   │   │   └── sonner.tsx   # Toast notifications
│   │   ├── auth/            # Authentication components
│   │   │   ├── AuthGuard.tsx # Route protection
│   │   │   └── LoginForm.tsx # Login form
│   │   ├── contracts/       # Contract-related components
│   │   │   ├── ContractList.tsx
│   │   │   ├── ContractForm.tsx
│   │   │   └── ContractViewer.tsx
│   │   ├── dashboard/       # Dashboard components
│   │   │   ├── StatsCard.tsx
│   │   │   ├── ChartWidget.tsx
│   │   │   └── RecentActivity.tsx
│   │   ├── layout/          # Layout components
│   │   │   ├── Header.tsx   # Main header
│   │   │   ├── Sidebar.tsx  # Navigation sidebar
│   │   │   └── Footer.tsx   # Footer component
│   │   └── legal/           # Legal-specific components
│   │       ├── ReviewPanel.tsx
│   │       └── ApprovalFlow.tsx
│   ├── stores/              # Zustand state stores
│   │   ├── authStore.ts     # Authentication state
│   │   ├── contractStore.ts # Contract management
│   │   ├── alertStore.ts    # Notifications state
│   │   └── themeStore.ts    # Theme preferences
│   ├── services/            # API service layer
│   │   ├── api.ts           # Base API configuration
│   │   ├── auth.service.ts  # Authentication service
│   │   ├── contract.service.ts # Contract operations
│   │   └── ai.service.ts    # AI integration
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts       # Authentication hook
│   │   ├── useContracts.ts  # Contract management
│   │   └── useDebounce.ts   # Utility hooks
│   ├── types/               # TypeScript definitions
│   │   ├── auth.types.ts    # Authentication types
│   │   ├── contract.types.ts # Contract types
│   │   ├── api.types.ts     # API response types
│   │   └── ui.types.ts      # UI component types
│   ├── lib/                 # Utility libraries
│   │   ├── utils.ts         # General utilities
│   │   ├── cn.ts            # Class name utilities
│   │   └── constants.ts     # App constants
│   ├── middleware.ts        # Next.js middleware
│   └── provider/            # Context providers
│       └── theme-provider.tsx # Theme context
├── public/                  # Static assets
│   ├── images/             # Image assets
│   ├── icons/              # Icon files
│   └── favicon.ico         # Site favicon
├── package.json            # Dependencies and scripts
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS config
├── tsconfig.json          # TypeScript config
├── eslint.config.mjs      # ESLint configuration
├── postcss.config.mjs     # PostCSS configuration
└── README.md              # This file
```

## 🚦 Quick Start

### Prerequisites

- **Node.js** 18+
- **npm**, **yarn**, **pnpm**, or **bun**
- Backend API running on port 5001
- AI Service running on port 8081

### 1. Install Dependencies

```bash
cd frontend
npm install

# Or with alternative package managers
yarn install
pnpm install
bun install
```

### 2. Environment Configuration

Create a `.env.local` file in the frontend directory:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_AI_API_URL=http://localhost:8081

# App Configuration
NEXT_PUBLIC_APP_NAME=MODYV
NEXT_PUBLIC_APP_VERSION=1.0.0

# Features Flags
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_ENABLE_PDF_VIEWER=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true

# Development
NEXT_PUBLIC_DEBUG_MODE=true
```

### 3. Start Development Server

```bash
# Start with Turbopack (faster)
npm run dev

# Or with standard webpack
npm run dev:webpack

# Alternative package managers
yarn dev
pnpm dev
bun dev
```

### 4. Build for Production

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### 5. Access the Application

- **Development:** http://localhost:3000
- **Production:** Configured domain

## 🎯 User Interfaces

### Legal Team Interface (`/legal`)

- **Contract Review**: Advanced contract review with AI suggestions
- **Risk Assessment**: Visual risk indicators and detailed analysis
- **Approval Workflow**: Multi-step approval process management
- **Legal Library**: Access to templates and legal resources
- **Annotation Tools**: PDF annotation and commenting system

### Internal Team Interface (`/internal`)

- **Contract Management**: Create, edit, and manage contracts
- **AI-Powered Drafting**: Generate contracts using AI assistance
- **Progress Tracking**: Monitor contract status and workflows
- **Collaboration Tools**: Team communication and file sharing
- **Performance Analytics**: Track team productivity metrics

### Management Interface (`/management`)

- **Executive Dashboard**: High-level overview of contract operations
- **Strategic Analytics**: Business intelligence and reporting
- **Resource Management**: Team allocation and capacity planning
- **Risk Overview**: Organization-wide risk assessment
- **Performance KPIs**: Key performance indicators and metrics

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server with Turbopack
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues

# Code Generation
npm run openapi-ts       # Generate TypeScript types from OpenAPI

# Quality Assurance
npm run type-check       # TypeScript type checking
npm run format           # Format code with Prettier
npm run test             # Run tests (if configured)
```

### Component Development

#### Base UI Component Example

```typescript
// src/components/ui/button.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

#### Business Component Example

```typescript
// src/components/contracts/ContractList.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useContracts } from '@/hooks/useContracts';
import { Contract } from '@/types/contract.types';

interface ContractListProps {
  status?: 'draft' | 'active' | 'completed';
  limit?: number;
}

export function ContractList({ status, limit = 10 }: ContractListProps) {
  const { contracts, loading, error, fetchContracts } = useContracts();

  useEffect(() => {
    fetchContracts({ status, limit });
  }, [status, limit, fetchContracts]);

  if (loading) return <div>Loading contracts...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="space-y-4">
      {contracts.map((contract: Contract) => (
        <Card key={contract.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{contract.title}</CardTitle>
            <Badge variant={getStatusVariant(contract.status)}>
              {contract.status}
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {contract.description}
            </p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Updated: {new Date(contract.updatedAt).toLocaleDateString()}
              </span>
              <div className="space-x-2">
                <Button variant="outline" size="sm">
                  View
                </Button>
                <Button size="sm">Edit</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function getStatusVariant(status: string) {
  switch (status) {
    case 'draft': return 'secondary';
    case 'active': return 'default';
    case 'completed': return 'outline';
    default: return 'secondary';
  }
}
```

### State Management with Zustand

```typescript
// src/stores/contractStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Contract, CreateContractData } from '@/types/contract.types';
import { contractService } from '@/services/contract.service';

interface ContractState {
  contracts: Contract[];
  selectedContract: Contract | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchContracts: (params?: any) => Promise<void>;
  createContract: (data: CreateContractData) => Promise<void>;
  updateContract: (id: string, data: Partial<Contract>) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
  selectContract: (contract: Contract | null) => void;
  clearError: () => void;
}

export const useContractStore = create<ContractState>()(
  devtools(
    (set, get) => ({
      contracts: [],
      selectedContract: null,
      loading: false,
      error: null,

      fetchContracts: async (params) => {
        set({ loading: true, error: null });
        try {
          const contracts = await contractService.getContracts(params);
          set({ contracts, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: false
          });
        }
      },

      createContract: async (data) => {
        set({ loading: true, error: null });
        try {
          const contract = await contractService.createContract(data);
          set(state => ({
            contracts: [contract, ...state.contracts],
            loading: false
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: false
          });
        }
      },

      updateContract: async (id, data) => {
        set({ loading: true, error: null });
        try {
          const updated = await contractService.updateContract(id, data);
          set(state => ({
            contracts: state.contracts.map(c => c.id === id ? updated : c),
            selectedContract: state.selectedContract?.id === id ? updated : state.selectedContract,
            loading: false
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: false
          });
        }
      },

      deleteContract: async (id) => {
        set({ loading: true, error: null });
        try {
          await contractService.deleteContract(id);
          set(state => ({
            contracts: state.contracts.filter(c => c.id !== id),
            selectedContract: state.selectedContract?.id === id ? null : state.selectedContract,
            loading: false
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: false
          });
        }
      },

      selectContract: (contract) => set({ selectedContract: contract }),
      clearError: () => set({ error: null }),
    }),
    { name: 'contract-store' }
  )
);
```

### Custom Hooks

```typescript
// src/hooks/useContracts.ts
import { useContractStore } from '@/stores/contractStore';
import { useCallback } from 'react';

export function useContracts() {
  const {
    contracts,
    selectedContract,
    loading,
    error,
    fetchContracts,
    createContract,
    updateContract,
    deleteContract,
    selectContract,
    clearError,
  } = useContractStore();

  const handleFetchContracts = useCallback(
    (params?: any) => fetchContracts(params),
    [fetchContracts]
  );

  const handleCreateContract = useCallback(
    async (data: any) => {
      await createContract(data);
      // Optionally refetch or show success message
    },
    [createContract]
  );

  return {
    contracts,
    selectedContract,
    loading,
    error,
    fetchContracts: handleFetchContracts,
    createContract: handleCreateContract,
    updateContract,
    deleteContract,
    selectContract,
    clearError,
  };
}
```

### API Service Layer

```typescript
// src/services/contract.service.ts
import { apiClient } from './api';
import { Contract, CreateContractData } from '@/types/contract.types';

export const contractService = {
  async getContracts(params?: any): Promise<Contract[]> {
    const { data } = await apiClient.get('/contracts', { params });
    return data.contracts;
  },

  async getContract(id: string): Promise<Contract> {
    const { data } = await apiClient.get(`/contracts/${id}`);
    return data;
  },

  async createContract(data: CreateContractData): Promise<Contract> {
    const { data: response } = await apiClient.post('/contracts', data);
    return response;
  },

  async updateContract(id: string, data: Partial<Contract>): Promise<Contract> {
    const { data: response } = await apiClient.put(`/contracts/${id}`, data);
    return response;
  },

  async deleteContract(id: string): Promise<void> {
    await apiClient.delete(`/contracts/${id}`);
  },

  async generatePDF(id: string): Promise<Blob> {
    const { data } = await apiClient.post(`/contracts/${id}/generate-pdf`, {}, {
      responseType: 'blob'
    });
    return data;
  },
};
```

## 🎨 Styling & Theming

### Tailwind CSS Configuration

The application uses Tailwind CSS with custom design tokens:

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### Theme Provider

```typescript
// src/provider/theme-provider.tsx
'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

## 🔐 Authentication & Authorization

### Route Protection

```typescript
// src/components/auth/AuthGuard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      setIsChecking(false);
    };
    init();
  }, [checkAuth]);

  useEffect(() => {
    if (!isChecking && !loading) {
      const isAuthPage = pathname.startsWith('/login');

      if (!user && !isAuthPage) {
        router.push('/login');
      } else if (user && isAuthPage) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, isChecking, pathname, router]);

  if (isChecking || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
```

### Role-Based Access Control

```typescript
// src/hooks/useRole.ts
import { useAuthStore } from '@/stores/authStore';

type UserRole = 'legal' | 'internal' | 'management';

export function useRole() {
  const { user } = useAuthStore();

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.includes(user?.role as UserRole);
  };

  const isLegal = () => hasRole('legal');
  const isInternal = () => hasRole('internal');
  const isManagement = () => hasRole('management');

  return {
    currentRole: user?.role as UserRole,
    hasRole,
    hasAnyRole,
    isLegal,
    isInternal,
    isManagement,
  };
}
```

## 🧪 Testing

### Component Testing Setup

```typescript
// src/__tests__/components/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant classes correctly', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });
});
```

### E2E Testing with Playwright

```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid=email-input]', 'test@example.com');
    await page.fill('[data-testid=password-input]', 'password123');
    await page.click('[data-testid=login-button]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid=user-menu]')).toBeVisible();
  });

  test('invalid credentials show error message', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid=email-input]', 'wrong@example.com');
    await page.fill('[data-testid=password-input]', 'wrongpassword');
    await page.click('[data-testid=login-button]');

    await expect(page.locator('[data-testid=error-message]')).toBeVisible();
    await expect(page.locator('[data-testid=error-message]')).toContainText('Invalid credentials');
  });
});
```

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Environment Variables

```bash
# Production .env.production
NEXT_PUBLIC_API_URL=https://api.modyv.com
NEXT_PUBLIC_AI_API_URL=https://ai.modyv.com
NEXT_PUBLIC_APP_NAME=MODYV
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_ENABLE_PDF_VIEWER=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_DEBUG_MODE=false
```

### Deployment Platforms

#### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:5001
      - NEXT_PUBLIC_AI_API_URL=http://ai-service:8081
    depends_on:
      - backend
      - ai-service
```

## 📊 Performance Optimization

### Code Splitting

```typescript
// Dynamic imports for route-based code splitting
const LegalDashboard = dynamic(() => import('@/components/legal/LegalDashboard'), {
  loading: () => <div>Loading legal dashboard...</div>
});

const ManagementDashboard = dynamic(() => import('@/components/management/ManagementDashboard'), {
  loading: () => <div>Loading management dashboard...</div>
});
```

### Image Optimization

```typescript
// src/components/ui/OptimizedImage.tsx
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}

export function OptimizedImage({ src, alt, width, height, priority = false }: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      quality={85}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyBohQoUKHV8k6EhV2Uk/9k="
      sizes="(max-width: 768px) 100vw, 50vw"
    />
  );
}
```

### Caching Strategy

```typescript
// src/lib/cache.ts
const cache = new Map();

export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  ttl: number = 5 * 60 * 1000 // 5 minutes
): T {
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.value;
    }

    const result = fn(...args);
    cache.set(key, { value: result, timestamp: Date.now() });

    return result;
  }) as T;
}
```

## 🤝 Contributing

1. Follow TypeScript and React best practices
2. Use the established component patterns
3. Write comprehensive tests for new features
4. Follow the existing file structure
5. Update documentation for new components/features
6. Use semantic commit messages

### Code Style Guidelines

- Use functional components with hooks
- Prefer TypeScript interfaces over types
- Use meaningful component and variable names
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper error boundaries

## 📄 License

This project is proprietary software for PT Integrasi Logistik Cipta Solusi (ILCS).

---

**MODYV Frontend** - Built with Next.js 15, React 19, and TypeScript for a modern, responsive, and performant user experience.

*Last updated: September 2025*