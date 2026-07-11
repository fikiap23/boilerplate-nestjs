import { EAdminRole } from 'src/common/enums/admin.enum';

export const MANAGEMENT_WRITE_ROLES = [
  EAdminRole.SUPERADMIN,
  EAdminRole.ADMIN,
  EAdminRole.EDITOR,
] as const;

export const MANAGEMENT_READ_ROLES = [
  EAdminRole.SUPERADMIN,
  EAdminRole.ADMIN,
  EAdminRole.EDITOR,
  EAdminRole.MODERATOR,
] as const;
