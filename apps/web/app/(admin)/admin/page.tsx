export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

import { getServerSession } from "@/lib/auth/server-session";

export default async function AdminDashboardPage() {
  const session = await getServerSession();
  if (!session) redirect('/login');
  if (session.role !== 'admin' && session.role !== 'superadmin') redirect('/workspace');
  redirect(session.role === 'superadmin' ? '/admin/workbench/sup-overview' : '/admin/workbench/adm-users');
}
