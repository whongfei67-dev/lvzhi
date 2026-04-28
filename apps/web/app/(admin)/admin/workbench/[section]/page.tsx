import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const ADMIN_ROUTE: Record<string, string> = {
  'adm-overview': '/admin/users',
  'adm-users': '/admin/users',
  'adm-content': '/admin/review',
  'adm-trade': '/admin/orders',
  'adm-queue': '/admin/review',
  'adm-risk': '/admin/community',
  'adm-audit': '/admin/data',
  'adm-config': '/admin/settings',
  'sup-overview': '/admin/admins',
  'sup-admin-all': '/admin/admins',
  'sup-env': '/admin/settings',
  'sup-perm': '/admin/admins',
  'sup-tenant': '/admin/data',
  'sup-danger': '/admin/blocked',
};

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  redirect(ADMIN_ROUTE[section] ?? '/admin/users');
}
