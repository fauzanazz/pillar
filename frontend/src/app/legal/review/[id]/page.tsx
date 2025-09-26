'use client';

import { useParams, useRouter } from 'next/navigation';
import { useContractStore } from '@/stores/contractStore';
import { AppTopbar } from '@/components/login/AppTopBar';
import { toast } from 'sonner';

export default function LegalReview() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const contract = useContractStore(s =>
    s.contracts.find(ct => ct.id === params.id)
  );
  const updateContract = useContractStore(s => s.updateContract);

  if (!contract) return <div className="p-6">Not found</div>;

  return (
    <main className="min-h-dvh bg-background">
      <AppTopbar />
      <div className="mx-auto max-w-7xl gap-6 px-4 py-6 md:grid md:grid-cols-12">
        <div className="md:col-span-8">
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <p>PDF Viewer - {contract.title}</p>
          </div>
        </div>
        <div className="md:col-span-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Legal Review Panel</h3>
            <div className="space-y-4">
              <div>
                <p>
                  <strong>Status:</strong> {contract.status}
                </p>
                {/* <p><strong>Priority:</strong> {contract.priority}</p>
                <p><strong>Type:</strong> {contract.type}</p> */}
              </div>
              <button
                // onClick={() => {
                //   updateContract(contract.id, { status: 'reviewed' });
                //   toast('Moved to Management Review', {
                //     description: contract.name,
                //   });
                //   router.push('/legal');
                // }}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Complete Legal Review
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
