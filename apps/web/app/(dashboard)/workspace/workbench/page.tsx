import { redirect } from "next/navigation";

import { firstWorkbenchSectionId } from "@/lib/workbench/app-section-pages";

export const dynamic = "force-dynamic";

export default function WorkspaceWorkbenchIndexPage() {
  redirect(`/workspace/workbench/${firstWorkbenchSectionId("client")}`);
}
