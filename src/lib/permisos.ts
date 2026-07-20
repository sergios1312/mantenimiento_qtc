// src/lib/permisos.ts
// Sistema de permisos minimal. Todo usuario autenticado puede ver casos.
// Si más adelante necesitas distinguir, reintroduce flags por rol aquí.
export type UserRole = "admin" | "user";

export interface PermisosUsuario {
  puedeVerCasos: boolean;
}

export const PERMISOS_POR_ROLE: Record<UserRole, PermisosUsuario> = {
  admin: { puedeVerCasos: true },
  user: { puedeVerCasos: true },
};

export function obtenerPermisos(role: UserRole): PermisosUsuario {
  return PERMISOS_POR_ROLE[role];
}
