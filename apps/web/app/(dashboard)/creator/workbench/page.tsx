import { redirect } from "next/navigation";

import { firstWorkbenchSectionId } from "@/lib/workbench/app-section-pages";

export const dynamic = "force-dynamic";

export default function CreatorWorkbenchIndexPage() {
  redirect(`/creator/workbench/${firstWorkbenchSectionId("creator")}`);
}
