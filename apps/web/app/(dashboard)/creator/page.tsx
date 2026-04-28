import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function CreatorHomePage() {
  redirect('/creator/workbench/cre-profile');
}
