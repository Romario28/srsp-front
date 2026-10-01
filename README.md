# Gestion RH & Organigramme — Frontend v2

Frontend React + Vite + TypeScript pour l'API Spring Boot `gestion-utilisateurs`,
reconstruit pour refléter la hiérarchie de départements, la portée de visibilité
dérivée, et les délégations. Build vérifié (`npm run build` ✅) avant livraison.

## Démarrage

```bash
npm install
npm run dev
```

Sur **http://localhost:5173** (autorisé par le CORS du backend). Le backend doit
tourner sur **http://localhost:8080**.

## Comptes de démonstration (seed backend)

| Compte | Mot de passe | Scénario de visibilité |
|---|---|---|
| admin@entreprise.mg | Admin123! | ADMIN — voit tout |
| sophie.martin@entreprise.mg | Chef123! | Chef structurel d'un département — voit son sous-arbre |
| fidy.rakoto@entreprise.mg | Employe123! | Employé standard — se voit lui-même uniquement |
| voahangy.rasoamanana@entreprise.mg | Delegue123! | « RH central » — délégation permanente sur le département racine |
| hanta.rabe@entreprise.mg | Delegue123! | « RH local » — délégation permanente sur une Direction |

La page de connexion propose un bouton par compte quand `VITE_SHOW_DEMO_ACCOUNTS=true` (activé par `npm run dev`).

## Ce qui a changé depuis la v1

| Avant | Maintenant |
|---|---|
| `Employe.departement` était une String libre | `idDepartement` (relation réelle) — un vrai sélecteur, plus un champ texte |
| `Groupe` (IT, RH, Finance…) | Retiré — le rattachement passe uniquement par `Departement` |
| Rôles `ROLE_MANAGER`, `ROLE_RH_LOCAL`, `ROLE_RH_CENTRAL` | Retirés — seuls `ROLE_ADMIN` et `ROLE_EMPLOYE` existent. La capacité de gérer un sous-arbre découle de la structure (chef) ou d'une délégation, pas d'un rôle |
| — | **Organigramme** (nouveau) : arbre interactif, assignation de chef, création de sous-département |
| — | **Délégations** (nouveau) : accorder/révoquer un accès lecture ou lecture-écriture sur un département et son sous-arbre |

## Contraintes de l'API reflétées telles quelles

- **Pas d'endpoint « toutes les délégations »** — uniquement par utilisateur
  (`GET /portees-deleguees/utilisateur/{id}`). La page Délégations tourne donc
  autour d'un ID utilisateur (la vôtre par défaut, ou une autre en la cherchant,
  ou via le lien 🔑 depuis Comptes utilisateurs).
- **Pas de recherche d'utilisateurs pour les non-ADMIN** — accorder une
  délégation demande de connaître l'ID numérique du bénéficiaire (indiqué en
  aide dans le formulaire). `GET /api/utilisateurs` reste ADMIN uniquement.
- **`GET /api/employes/departement/{id}` n'existe plus** — la page Organigramme
  filtre côté client la liste déjà visible pour peupler le sélecteur de chef.
- **Édition/création d'employé ouverte à tous les authentifiés** — l'autorisation
  fine (êtes-vous chef ou délégué sur ce département ?) est vérifiée côté
  service, pas prévisible côté frontend. Le bouton modifier reste donc visible
  pour tous ; une tentative non autorisée échoue proprement avec le message
  du backend. Seule la suppression reste prévisible (ADMIN uniquement).
- **Audit incomplet** — créer/déplacer un département et accorder/révoquer une
  délégation ne sont pas journalisés côté backend. Un rappel apparaît en bas
  de la page Journal d'audit.

## Structure

```
src/
  api/            Un module par ressource (employes, departements, portees-deleguees…)
  types/          Interfaces TS miroir exact des DTO Java vérifiés dans le backend actuel
  context/        AuthContext — session, token, login/logout
  hooks/          useAuth, useFetch
  components/ui/  Button, Input, Select, Modal, Badge, ConfirmDialog…
  components/layout/  Sidebar (nav filtrée ADMIN), Topbar, AppLayout
  pages/
    employes/       Liste + formulaire (sélecteur de département indenté par profondeur)
    departements/   Arbre interactif + détail + assignation de chef
    delegations/    Liste par utilisateur + formulaire d'octroi + révocation
    utilisateurs/   Liste (ADMIN) + création de compte
    audit/          Journal en lecture seule
```
