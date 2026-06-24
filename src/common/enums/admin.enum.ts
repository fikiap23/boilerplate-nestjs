/* =========================
   ADMIN
========================= */
export enum EAdminRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  MODERATOR = 'MODERATOR',
}

export enum EAdminStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/* =========================
   ERROR
========================= */
export enum ETypeErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}
