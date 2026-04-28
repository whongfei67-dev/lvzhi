import "@/app/(marketing)/project-test/workbench/workbench-integration.css";

import { WorkspaceWorkbenchFrame } from "@/components/workbench-app/workspace-workbench-frame";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceWorkbenchFrame>{children}</WorkspaceWorkbenchFrame>;
}
