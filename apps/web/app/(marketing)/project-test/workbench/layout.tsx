import type { ReactNode } from "react";

import "./workbench-integration.css";

export default function WorkbenchIntegrationLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {children}
    </div>
  );
}
