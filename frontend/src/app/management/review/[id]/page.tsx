import { PageTopBar } from '@/components/login/PageTopBar';
import ManagementReviewClient from './page.client';

export default function ManagementReviewPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main className="min-h-dvh bg-background">
      <PageTopBar
        title={'Management Review'}
        subtitle="Approve or reject the contract"
      />
      <ManagementReviewClient id={params.id} />
    </main>
  );
}
