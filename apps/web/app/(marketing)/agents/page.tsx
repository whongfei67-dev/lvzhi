import { AgentsClient } from './AgentsClient';

export const dynamic = "force-dynamic";

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; mode?: string }>;
}) {
  const params = await searchParams;

  return (
    <AgentsClient
      initialSearchParams={{
        q: params.q,
        category: params.category,
        mode: params.mode,
      }}
    />
  );
}
