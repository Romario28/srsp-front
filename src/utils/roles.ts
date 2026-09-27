/**
 * Seuls 2 rôles Spring Security existent désormais : ROLE_ADMIN et ROLE_EMPLOYE.
 * "Chef", "RH central", "RH local" ne sont PAS des rôles — ce sont des positions
 * structurelles (Departement.chef) ou des délégations (PorteeDeleguee), résolues
 * côté backend. Le frontend n'a donc qu'une seule distinction de rôle à faire :
 * ADMIN ou non — tout le reste dépend de ce que l'API retourne déjà filtré.
 */
export function isAdmin(roles: string[] | undefined): boolean {
  return !!roles?.includes('ROLE_ADMIN')
}

export const ROLE_LABELS: Record<string, string> = {
  ROLE_ADMIN: 'Administrateur',
  ROLE_EMPLOYE: 'Employé',
}

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}
