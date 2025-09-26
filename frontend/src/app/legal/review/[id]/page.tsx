'use client';

import { useParams, useRouter } from 'next/navigation';
import { useContracts } from '@/lib/stores/contracts';
import { AppTopbar } from '@/components/app-topbar';
import { PdfViewer } from '@/components/pdf-viewer';
import { LegalPanel } from '@/components/legal-panel';

export default function LegalReview() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const contract = useContracts(s =>
    s.contracts.find(ct => ct.id === params.id)
  );
  const finalizeLegal = useContracts(s => s.finalizeLegal);

  if (!contract) return <div className="p-6">Not found</div>;

  return (
    <main className="min-h-dvh bg-background">
      <AppTopbar />
      <div className="mx-auto max-w-7xl gap-6 px-4 py-6 md:grid md:grid-cols-12">
        <div className="md:col-span-8">
          <PdfViewer src={contract.pdfUrl} />
        </div>
        <div className="md:col-span-4">
          <LegalPanel
            initialSelected={contract.legalNotes || []}
            reviewMode="legal"
            onFinalize={list => {
              finalizeLegal(contract.id, list);
              toast({
                title: 'Moved to Management Review',
                description: contract.name,
              });
              router.push('/legal');
            }}
          />
        </div>
      </div>
    </main>
  );
}
