import { HomePage } from "@/components/home-page";
import { getServerSession } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession();
  return <HomePage session={session} />;
}
