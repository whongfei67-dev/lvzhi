import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function WorkspaceHomePage() {
  redirect('/workspace/workbench/cli-profile');
}
