/**
 * Deux rôles : ROLE_ADMIN (accès total) et ROLE_GESTIONNAIRE. Le rôle ne donne aucun accès aux agents :
 * ce que voit un gestionnaire vient exclusivement de son périmètre (ministères, SOA, localités).
 */
export function isAdmin(roles: string[] | undefined): boolean {
  return !!roles?.includes('ROLE_ADMIN')
}

export const ROLE_LABELS: Record<string, string> = {
  ROLE_ADMIN: 'Administrateur',
  ROLE_GESTIONNAIRE: 'Gestionnaire',
}

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}