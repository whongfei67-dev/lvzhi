import { FindLawyerClient } from './FindLawyerClient';

export const dynamic = 'force-dynamic';

export default async function FindLawyerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; specialty?: string; region?: string; domain?: string }>;
}) {
  const params = await searchParams;

  return (
    <FindLawyerClient
      initialRegion={params.region || '全国'}
      initialDomain={params.domain || params.specialty || 'all'}
      initialQuery={params.q || ''}
    />
  );
}
