'use client';

import { useParams, useRouter } from 'next/navigation';
import { useContractStore } from '@/stores/contractStore';
import { AppTopbar } from '@/components/login/AppTopBar';
import { toast } from 'sonner';
import { getContractById } from '@/api';
import { useEffect } from 'react';
import LegalReviewClient from './page.client';

export default function LegalReview() {
  const params = useParams<{ id: string }>();

  const contract = getContractById({
    path: {
      id: params.id,
    },
  });

  if (!contract) return <div className="p-6">Not found</div>;

  return (
    <main className="min-h-dvh bg-background">
      <AppTopbar />
      <LegalReviewClient id={params.id} />
    </main>
  );
}
