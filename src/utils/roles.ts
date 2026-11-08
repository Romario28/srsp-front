/**
 * Quatre profils, un seul par compte :
 *  - ROLE_ADMIN : accès total.
 *  - ROLE_CHEF : comme RH, plus la liste des comptes RH et Agent de son périmètre.
 *  - ROLE_RH : anticipation, limitée à son périmètre (ministère, SOA, localité).
 *  - ROLE_AGENT : son propre espace uniquement.
 * Le rôle ne donne jamais accès à un agent par lui-même : le périmètre (RH, Chef) ou le lien matricule (Agent) décide.
 */
export const aRole = (roles: string[] | undefined, role: string) => !!roles?.includes(role)

export const isAdmin = (roles: string[] | undefined) => aRole(roles, 'ROLE_ADMIN')
export const isChef = (roles: string[] | undefined) => aRole(roles, 'ROLE_CHEF')
export const isRh = (roles: string[] | undefined) => aRole(roles, 'ROLE_RH')
export const isAgent = (roles: string[] | undefined) => aRole(roles, 'ROLE_AGENT')

/** Menus d'anticipation : Alertes, Dossiers, Calendrier, échéances, tableau de bord. */
export const peutVoirAnticipation = (roles: string[] | undefined) => isAdmin(roles) || isChef(roles) || isRh(roles)
/** Menu « Gestion des utilisateurs » : complet pour l'ADMIN, limité au périmètre pour le Chef. */
export const peutVoirUtilisateurs = (roles: string[] | undefined) => isAdmin(roles) || isChef(roles)

export const ROLE_LABELS: Record<string, string> = {
  ROLE_ADMIN: 'Administrateur',
  ROLE_CHEF: 'Chef / Supérieur',
  ROLE_RH: 'Utilisateur RH',
  ROLE_AGENT: 'Agent',
}

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}
