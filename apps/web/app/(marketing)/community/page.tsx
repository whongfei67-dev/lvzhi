import { CommunityClient } from './CommunityClient';

export const dynamic = 'force-dynamic';

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string; tag?: string; date?: string }>;
}) {
  const params = await searchParams;

  return (
    <div>
      <CommunityClient
        initialSearchParams={{
          q: params.q,
          tab: params.tab,
          tag: params.tag,
          date: params.date,
        }}
      />
    </div>
  );
}
