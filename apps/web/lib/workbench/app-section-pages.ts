import { getWorkbenchShellFixture } from './shell-fixtures';
import type { WorkbenchDemoRole } from './types';

export type WorkbenchSectionInfo = {
  id: string;
  label: string;
  groupLabel: string;
};

function stripHash(href: string): string {
  return href.replace(/^#/, '');
}

const ROLE_MAP: Record<WorkbenchDemoRole, WorkbenchDemoRole> = {
  client: 'client',
  creator: 'creator',
  admin: 'admin',
  super: 'super',
};

export function workbenchSectionInfos(role: WorkbenchDemoRole): WorkbenchSectionInfo[] {
  const shell = getWorkbenchShellFixture(ROLE_MAP[role]);
  return shell.navGroups.flatMap((group) =>
    group.items.map((item) => ({
      id: stripHash(item.href),
      label: item.label,
      groupLabel: group.label,
    })),
  );
}

export function getWorkbenchSectionInfo(role: WorkbenchDemoRole, id: string): WorkbenchSectionInfo | null {
  return workbenchSectionInfos(role).find((s) => s.id === id) ?? null;
}

export function firstWorkbenchSectionId(role: WorkbenchDemoRole): string {
  const infos = workbenchSectionInfos(role);
  const profileFirst = infos.find((item) => /profile/i.test(item.id));
  return profileFirst?.id ?? infos[0]?.id ?? 'overview';
}
