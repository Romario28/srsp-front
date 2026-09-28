# Proposition v2 — État des lieux, écrans & parcours, lots de livraison

> **Objet** : cadrage fonctionnel validable **avant d'écrire du code**, conformément au brief.
> Remplace la proposition v1 (dont plusieurs hypothèses — périmètre sur les agents, fiche agent,
> recherche à onglets — sont closes par le brief : les agents ne sont **pas** rattachés à
> l'organigramme, il y a **un écran par type**, la consultation des agents est à trancher).
> Basé sur la lecture du code du front v2 et sur les comportements backend connus.

---

## 1. État des lieux — module par module

| # | Module | Verdict | Constat (vérifié dans le code) |
|---|---|---|---|
| 1 | Connexion & profil | 🟡 À ajuster | Le bloc « comptes de démonstration » (emails **et mots de passe**) est affiché sans condition (`LoginPage.tsx`). Le topbar montre nom/rôle/département mais pas la dernière connexion (pourtant renvoyée par `GET /auth/me`). |
| 2 | Tableau de bord | 🟡 À ajuster | Carte « Mes délégations » affiche un **0 factice** pour les non-admins (`DashboardPage.tsx`). À enrichir plus tard de la synthèse d'anticipation (lot F). |
| 3 | Organigramme | 🟡 À ajuster | L'API `PATCH /departements/{id}/deplacer` est encapsulée (`departementsApi.deplacer`) mais **aucune UI** n'expose le déplacement. |
| 4 | Employés | 🟡 À ajuster | Le supérieur hiérarchique (`idManager`/`nomManager`, déjà fournis) n'est **jamais affiché**. Le bouton « modifier » est visible de tous (seule la suppression est gardée admin). Liste plafonnée aux **100 premiers** (`getAll(0, 100)`), pas de pagination/recherche serveur. |
| 5 | Comptes utilisateurs | 🟡 À ajuster | **Bug confirmé** : la modale filtre `!e.aUnCompte` alors que le champ s'appelle `aunCompte` → `undefined` → **tous** les employés apparaissent « sans compte ». Liste plafonnée à 200. |
| 6 | Délégations | 🟡 À ajuster | La recherche « ID utilisateur… » (consulter un autre utilisateur) est visible **même pour un non-admin**. La révocation envoie `idUtilisateur` en query param, **devenu inutile**. Statut réduit à Active/Inactive (pas de distinction à venir / clôturée / annulée — la donnée n'existe pas dans le DTO). |
| 7 | Journal d'audit | 🟢 Conforme | Bandeau « actions non journalisées » exact : seuls employés, comptes et connexions sont journalisés côté backend. Bandeau à conserver tant que le backend ne couvre pas davantage. |
| 8 | Imports de référentiels | 🔴 À créer | Rien n'existe. |
| 9 | Anticipation — consultation à la demande | 🔴 À créer | Rien n'existe. |
| 10 | Anticipation — fil d'alertes | 🔴 À créer | Rien n'existe (badge navigation inclus). |
| 11 | Anticipation — configuration des fenêtres | 🔴 À créer | Rien n'existe. |
| 12 | Navigation | 🟡 À ajuster | Liste plate à 6 entrées — à regrouper par domaine + badge alertes. |

**Socle conservé tel quel** (à ne pas réécrire) : authentification & routes protégées, charte
visuelle (theme Tailwind, composants `ui/`), `useFetch`, découpage `api/` + `types/`, filtration
de navigation par rôle, pages d'erreur. Tout nouvel écran réutilise ce socle.

---

## 2. Ajustements de l'existant — écrans & parcours

### 2.1 Connexion — comptes de démonstration
- Le bloc démo n'apparaît que si l'environnement est un environnement de démo
  (`import.meta.env.DEV`, surchargeable par `VITE_DEMO_HINTS=on|off` dans `.env`).
- En production : formulaire nu, sans indice.
- **Parcours** : l'écran de démo reste utilisable pour les jeux d'essai (un clic préremplit),
  mais un déploiement réel n'expose plus de mots de passe.

### 2.2 Profil courant (topbar)
- Nom → menu déroulant : identité, rôle(s), département, **dernière connexion** (donnée déjà
  dans `MeResponse`), bouton *Déconnexion*. Rien d'autre ne change.

### 2.3 Comptes utilisateurs — liste « sans compte »
- Correction : `!e.aUnCompte` → `!e.aunCompte` (une ligne). La liste des employés proposés au
  rattachement redevient exacte.
- Amélioration d'affichage : indiquer sous le sélecteur combien d'employés sans compte sont
  listés (et rappeler la limite 200 — voir évolutions backend B4).

### 2.4 Délégations
- La zone « rechercher un utilisateur par ID » **ne s'affiche que pour l'admin**. Un non-admin
  voit l'écran figé sur « Vos délégations » (titre, sous-titre, sans champ de recherche).
- `revoquer(id)` — suppression du paramètre `idUtilisateur` devenu inutile (MODIFIÉ dans
  `api/porteesDeleguees.ts`).
- Statut dérivé amélioré à données constantes : **À venir** (début > aujourd'hui) / **Active** /
  **Terminée**, à partir de `dateDebut`/`dateFin`/`active`. Distinguer *annulée* (révocation
  avant début) et *clôturée* (révocation en cours) exigerait une donnée réelle du backend →
  évolution B2, pas de simulation côté écran.
- La confirmation de révocation conserve son rappel : « cette délégation permanente sera close
  à la date du jour ».
- Point à trancher : vue « accordées par moi » → § 5 / question 4.

### 2.5 Tableau de bord — carte factice
- Remplacer le `value={0}` par le vrai compte : `getPourUtilisateur(user.id)` filtré sur les
  actives (aujourd'hui) — puis, au lot F, par la synthèse d'anticipation.

### 2.6 Organigramme — déplacement
- Nouvelle action **« Déplacer »** dans le panneau de détail (admin uniquement) :
  - sélecteur « nouveau parent » (ou racine si le backend l'accepte) dans lequel **le
    département déplacé et tout son sous-arbre sont exclus** des options — la règle « impossible
    de déplacer sous un de ses descendants » est rendue visible par le sélecteur lui-même ;
  - mention chiffrée « N sous-départements suivront ce déplacement » (calcul local sur l'arbre
    déjà chargé) ;
  - erreur du backend (si elle survient) affichée telle quelle via `ErrorBanner`.
- **Parcours** : sélection d'un nœud → Déplacer → choix du parent → confirmation → l'arbre se
  recharge, le `chemin` du nœud mis à jour est visible dans le détail.

### 2.7 Employés
- **Supérieur hiérarchique** : colonne « Supérieur » (nom du manager ou « — ») + rappel en
  fiche/modale : « calculé automatiquement d'après la structure — jamais saisi ».
- **Modification** : à réserver selon la décision (question 6). Recommandation : boutons
  modifier/supprimer masqués pour les non-admins (le périmètre lecture reste ouvert).
- **Suppression bloquée par le compte** : si `aunCompte === true`, la confirmation est remplacée
  par un refus explicite « cette personne possède un compte utilisateur — désactivez d'abord le
  compte » + lien vers `/utilisateurs` (le garde-fou backend reste la dernière barrière).
- Volumes (100 lignes) : en attendant une pagination serveur (B4), un avertissement discret
  « liste tronquée aux 100 premiers » s'affiche si `totalElements > size`.

### 2.8 Audit — journalisation élargie
- Le bandeau reste, listant honnêtement ce qui n'est pas journalisé.
- **Recommandation** : journaliser aussi départements, délégations, imports et modifications de
  configuration (cohérent avec la traçabilité exigée pour les acquittements d'alertes) —
  évolution backend B1 ; le bandeau se réduira d'autant, sans changement de structure d'écran.

---

## 3. À créer — écrans & parcours

### 3.1 Imports de référentiels `/imports` (admin)

**Écran principal — une carte par référentiel, dans l'ordre d'import**

Panneau « ordre recommandé » en tête de page, 3 étapes numérotées :

1. **Référentiels de base** — Grades · Corps (code + catégorie) · Situations administratives
   (codes de sanction) · SOA · Localités · Ministères · HEE.
2. **Indices grade × corps** — porte la **durée requise** qui pilote avancement et titularisation.
3. **Agents** — fichier principal.

Chaque carte : libellé du référentiel, **format attendu** (colonnes clés, rappelé à
l'écran), date + auteur + résumé du dernier import, bouton **Téléverser**.

**Modale de téléversement** : sélection .xlsx/.xls → rappel du format → confirmation
(« ce référentiel sera peuplé ou mis à jour ») → traitement.

**Compte-rendu** (panneau affiché à la fin, conservé dans l'historique) :

| Section | Contenu | Conséquence métier expliquée à l'écran |
|---|---|---|
| Compteurs | lignes lues · **créées** · **mises à jour** · rejetées | — |
| Erreurs par ligne | n° de ligne + message | ligne non intégrée |
| Doublons de clé dans le fichier | valeur + lignes en conflit | intégrés une seule fois (dernière occurrence) |
| Références inconnues, **par champ**, avec exemples | ex. corps « XYZ » (9 lignes) | corps/grade inconnu → l'agent ressortira en **anomalie** ; situation administrative inconnue → agent **réputé en activité** ; durée requise absente pour une combinaison corps/grade → avancement/titularisation en **anomalie** |

**Historique des imports** : tableau chronologique (date, référentiel, fichier, auteur,
résumé), chaque ligne rouvrant son compte-rendu.

**Note permanente en pied de page** : « après un import, la consultation à la demande est
aussitôt à jour ; le fil d'alertes attend le passage de nuit » (+ bouton de recalcul si la
question 3 retient « oui »).

**Parcours type** : premier import → l'écran signale les prérequis manquants (agents importés
avant les corps ⇒ alerte d'ordre) → import des référentiels → indices → agents → compte-rendu
→ 14 références inconnues listées avec exemples → correction du fichier/référentiel → réimport
→ consultation à la demande immédiatement cohérente.

### 3.2 Anticipation — consultation à la demande

**5 routes** : `/anticipation/retraite`, `/avancement`, `/titularisation`, `/fin-contrat`,
`/anomalies`. Même gabarit, un type par écran (pas d'onglets).

**Rappels affichés en tête de chaque écran** :
- « Seuls les agents **en activité** comptent : situation administrative « 00 » ou non
  renseignée. Les agents sortis du service sont exclus. »
- Écran titularisation : « même calcul que l'avancement — seul l'intitulé change (grade de
  stagiaire) ; catégorie distincte car c'est ainsi que le métier la désigne. »

**Filtres** (4 écrans d'échéances) :

| Filtre | Comportement |
|---|---|
| Statut de l'agent | Tous / Fonctionnaires / Contractuels / ELD / Non renseigné |
| Fenêtre relative (par défaut) | **Prévenance** (jours avant) + **Retard** (jours après, `0` = « aucun retard affiché ») — **préremplie avec la configuration active** |
| Dates absolues | « Du » et/ou « Au » — **dès qu'une seule est renseignée, la fenêtre relative est entièrement neutralisée** : elle se grise, un bandeau « intervalle de dates prioritaire sur la fenêtre » apparaît. Fin < début refusée à la saisie |
| Lancement | Bouton **« Lancer le calcul »** — le recalcul n'a pas lieu à chaque frappe ; indicateur de traitement visible |

**Résultats — groupés par statut** : sections *Fonctionnaires / Contractuels / ELD /
Non renseigné* (groupes vides masqués ; le filtre statut permet de n'en voir qu'un).

Colonnes : Agent (nom, prénom, matricule) · Statut · Corps / Catégorie / Grade · **Échéance**
(date) · **Jours restants** — badge `+n` vert « à venir » / `−n` rouge « dépassé », avec
« dépassé de X mois » dès que ≥ 1 mois · **Note d'ancrage** : icône + info-bulle « calcul ancré
sur la date de début de contrat, faute de date d'avancement » quand c'est le cas.

**Écran Anomalies** — même gabarit, **sans filtre temporel ni fenêtre** :
- Colonnes : Agent (ce qui est connu : matricule, nom, statut…) · **Raison** — date de
  naissance manquante, grade non renseigné, corps non renseigné, date d'ancrage manquante,
  durée requise introuvable pour cette combinaison corps/grade.
- En-tête : « ces agents sont signalés pour **correction de la donnée par ré-import** — ils ne
  sont pas ignorés ». Lien vers `/imports`.

**Parcours type** : import des agents → lancer le calcul des avancements → n résultats + 7
anomalies « durée requise introuvable » → importer les indices manquants → relancer → les 7
disparaissent des anomalies et intègrent les résultats.

### 3.3 Anticipation — fil d'alertes `/anticipation/alertes`

- **Génération** : chaque nuit, avec la fenêtre configurée ; **les anomalies sont toujours
  signalées** (catégorie à part, hors fenêtre).
- **Liste paginée**, filtres : **type** (retraite / avancement / titularisation / fin de
  contrat / anomalie), **statut** (nouvelle / vue / acquittée), **matricule**.
- **Ouvrir une alerte** (panneau de détail) ⇒ passage automatique de *nouvelle* à *vue*, sans
  action — le détail porte la trace « passée en vue le … ».
- **Acquitter** : action explicite + confirmation ⇒ trace **qui / quand** conservée et affichée
  ; l'alerte est figée en historique (disparaît des nouvelles, reste consultable via le filtre
  « acquittées »).
- **Règles de cycle de vie rappelées à l'écran** (pied de page + détail) :
  - une échéance **acquittée n'est jamais régénérée**, même si elle re-rentre dans la fenêtre ;
  - si la **date calculée change**, une **nouvelle** alerte apparaît — l'ancienne reste ;
  - une alerte **ne disparaît pas** quand son agent sort de la fenêtre : elle reste jusqu'à
    acquittement.
- **Badge « nouvelles »** dans la navigation (+ carte du tableau de bord, lot F).
- **Recalcul manuel** — **décision retenue (3)** : bouton « Recalculer maintenant » (**admin**)
  en tête du fil, avec confirmation ; nécessite l'endpoint B3 (sans lui, pas de bouton — le fil
  ne bouge que la nuit).
- **Périmètre d'accès** — **décision retenue (1)** : admin + détenteurs d'une **délégation active
  sur le département racine** (lecture ou L/E) ; contrôle serveur à prévoir (B6).

### 3.4 Anticipation — configuration des fenêtres `/anticipation/fenetres`

Table des **4 types** :

| Colonne | Contenu |
|---|---|
| Type d'évènement | Retraite · Avancement · Titularisation · Fin de contrat |
| Valeurs actuelles | prévenance + retard, **en jours avec équivalent en mois** (ex. « 120 j ≈ 3,9 mois ») |
| Valeurs par défaut | idem |
| Personnalisation | indicateur ⚪ Défaut / 🟡 **Personnalisé** |

- **Admin** : *Modifier* (modale, entiers **≥ 0**, valeur par défaut rappelée à côté) et
  *Réinitialiser au défaut*.
- **Autres utilisateurs** : page accessible **en lecture seule** (pas d'actions).
- Note affichée : « une modification joue sur les recherches et sur le **prochain calcul de
  nuit** ; les alertes déjà créées ne sont pas modifiées ».

### 3.5 Navigation regroupée & tableau de bord

**Navigation — 3 domaines** (Tableau de bord en tête, hors groupe) :

```
Tableau de bord
─── Organisation ───
  Employés · Organigramme · Délégations
─── Anticipation RH ───
  Consultation (Retraite · Avancement · Titularisation · Fin de contrat · Anomalies)
  Alertes [badge: nouvelles]
  Fenêtres de visibilité (admin)
─── Administration ───
  Comptes utilisateurs · Imports · Journal d'audit
```

La visibilité du groupe *Anticipation RH* suit la décision sur l'accès (question 1).
Les sous-entrées « Consultation » se déplient dans la barre latérale (ou en 5 liens à plat —
au choix graphique, même fonction).

**Tableau de bord — bloc « Synthèse d'anticipation »** (visible selon accès) :
alertes **nouvelles** · échéances par type dans la **fenêtre par défaut** (4 compteurs) ·
**anomalies** — chaque chiffre cliquable vers son écran.

---

## 4. Points à trancher avant de coder (recommandations)

| # | Question | Recommandation |
|---|---|---|
| 1 | **Accès à l'anticipation** (agents non rattachés à l'organigramme — pas de filtrage possible) | **Profil RH par délégation** : accès réservé à l'admin + détenteurs d'une **délégation active sur le département racine** (lecture ou L/E). Cohérent avec « une délégation racine L/E tient lieu d'autorité RH », sans nouveau rôle. Les comptes de démo « RH central/local » servent de jeu d'essai. Fallback simple si jugé trop strict : ouvert à tout connecté. |
| 2 | **Consultation des agents** (ni recherche ni fiche n'existent) | **Non pour la v1** — les écrans d'anticipation (identité + référentiel + échéance + anomalie) suffisent ; une consultation dédiée serait une évolution (endpoint backend à créer, B5). |
| 3 | **Recalcul manuel du fil d'alertes** | **Oui** — bouton « Recalculer maintenant » (admin) sur le fil, précieux après un import. **Nécessite un endpoint backend** (B3) ; sans lui, on s'en tient au passage de nuit. |
| 4 | **Délégations « accordées par moi »** | **Oui** — sinon un non-admin ne peut ni revoir ni révoquer ce qu'il a accordé. **Nécessite un endpoint backend** (B2). En attendant, statu quo assumé et signalé à l'écran. |
| 5 | **Exposer âge légal & grades de stagiaire** | **Lecture seule** dans l'écran de configuration, si le backend les expose ; pas de modification (réglages techniques, risque métier). S'ils ne sont pas exposés : invisibles. |
| 6 | **Auto-modification de la fiche employé** | **Non** — CRUD employés réservé à l'admin (boutons masqués pour les non-admins). La consultation reste ouverte selon le périmètre. |
| + | **Journaliser départements, délégations, imports, config** | **Oui** (B1) — le bandeau d'audit s'ajustera automatiquement. |

---

## 5. Évolutions backend à signaler (aucun contournement côté écran)

| Ref | Évolution | Impact si absente |
|---|---|---|
| B1 | Journaliser départements, délégations, imports, modifications de fenêtres (et acquittements d'alertes) | Le bandeau d'audit reste plus large |
| B2 | Endpoint « délégations **accordées par** {utilisateur} » (+ idéalement statut réel : à venir / active / clôturée / annulée) | Pas de vue « accordées par moi » ; statuts dérivés approximatifs |
| B3 | Endpoint « recalcul immédiat du fil d'alertes » (admin) | Pas de bouton ; le fil ne bouge que la nuit |
| B4 | Pagination et recherche **serveur** pour employés, comptes, et employés d'un département (choix du chef) | Listes tronquées aux 100/200 premiers, avec avertissement affiché |
| B5 | Contrat d'API **anticipation** à convenir : agents, recherches par type + anomalies, alertes (liste/consultation/acquittement + compteur + recalcul), fenêtres **et paramètres techniques** (âge légal, grades de stagiaire — lecture/écriture admin, décision 5), imports (téléversement + compte-rendu + historique) | Les lots 2 à 5 ne peuvent pas démarrer sans |
| B6 | Contrôle d'accès **serveur** des écrans d'anticipation si la décision 1 ≠ « tout connecté » | Le filtrage serait purement cosmétique côté front (à signaler, pas à masquer) |

---

## 6. Lots de livraison (ordre demandé)

| Lot | Contenu | Prérequis |
|---|---|---|
| **A — Corrections de l'existant** | § 2.1 à 2.7 : bug `aunCompte`, délégations (recherche admin-only, révocation sans paramètre, statuts dérivés), carte délégations du tableau de bord, blocage démo, déplacement de département, supérieur hiérarchique, suppression bloquée par compte, profil (dernière connexion), avertissement de troncature | Aucun — immédiat |
| **B — Anticipation : consultation à la demande + anomalies** | § 3.2 (5 écrans, filtres, lancement explicite, groupes par statut, badges jours restants, note d'ancrage) + entrées de navigation provisoires | B5 |
| **C — Fil d'alertes** | § 3.3 (liste paginée, filtres, vue automatique, acquittement tracé, badge navigation) | B5 (+ B3 si recalcul retenu) |
| **D — Configuration des fenêtres** | § 3.4 (lecture pour tous, modification/réinitialisation admin, équivalents mois) | B5 |
| **E — Imports de référentiels** | § 3.1 (ordre guidé, formats, compte-rendu expliqué, historique) | B5 |
| **F — Navigation regroupée & tableau de bord** | § 3.5 (3 domaines, badge alertes, synthèse d'anticipation cliquable) | Lots B–E |

Chaque lot est livré, compilé (`npm run build`) et vérifiable indépendamment.

## 7. Convention de marquage (comme côté backend)

- `// NOUVEAU — …` : fichier ou bloc entièrement nouveau ;
- `// AJOUTÉ — …` : élément ajouté dans un fichier existant ;
- `// MODIFIÉ — …` : changement d'un comportement existant (raison en clair).

## 8. Ce qui ne bouge pas

Authentification & `ProtectedRoute`, charte et composants `ui/`, arbre et fiche département,
journal d'audit (hors bandeau), logique de périmètre côté backend (jamais réimplémentée côté
client), structure `api/` + `types/` miroir des DTO.
