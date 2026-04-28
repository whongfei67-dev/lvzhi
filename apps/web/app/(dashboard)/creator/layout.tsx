import "@/app/(marketing)/project-test/workbench/workbench-integration.css";

import { CreatorWorkbenchFrame } from "@/components/workbench-app/creator-workbench-frame";

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return <CreatorWorkbenchFrame>{children}</CreatorWorkbenchFrame>;
}
