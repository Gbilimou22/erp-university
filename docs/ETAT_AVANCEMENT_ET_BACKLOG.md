# État d’avancement et backlog — University ERP

**Date de l’audit :** 19 novembre 2026

**Statut général :** démonstrateur fonctionnel avancé, pas encore un ERP prêt pour une exploitation institutionnelle en production.

**Estimation générale :** 45 à 50 % du cahier des charges fonctionnel global.

**Dernière validation :** 62 tests réussis sur 62, avec 615 assertions ; build TypeScript/Vite client et SSR réussi.

**Priorité 2 — Permissions et périmètres :** migrations rôles/permissions/scopes appliquées, seeder disponible, middleware de permission actif, policy étudiant limitée par département/faculté/campus et tests verticaux/horizontaux ajoutés.

**Base locale vérifiée :** PostgreSQL, 48 migrations locales appliquées jusqu’à la migration `2026_11_18_000002_link_enrollment_to_admission`.

## 1. Synthèse technique

### Stack observée

- PHP `^8.2`
- Laravel 12
- Sanctum
- Inertia.js
- React 18
- TypeScript
- Tailwind CSS
- PostgreSQL
- Vite
- Docker / Apache
- Ziggy
- PHPUnit

### Inventaire du dépôt

- 34 modèles Eloquent
- 40 contrôleurs
- 56 pages React
- 48 migrations
- 20 fichiers de tests
- 93 routes déclarées lors du dernier inventaire global

### Validation actuelle

- Build TypeScript/Vite client réussi
- Build SSR réussi
- Migrations locales appliquées
- Suite complète : 54 tests réussis, 2 tests en échec, 488 assertions

## 2. État d’avancement estimé

| Domaine                        | Avancement | Statut           |
|--------------------------------|------------|------------------|
| Socle technique                | 65 %       | Partiel à solide |
| Authentification               | 70 %       | Avancé           |
| Structure universitaire        | 65 %       | Avancé           |
| Admissions                     | 65 %       | Avancé           |
| Étudiants                      | 65 %       | Avancé           |
| Enseignants                    | 60 %       | Avancé           |
| Emplois du temps               | 65 %       | Avancé           |
| Évaluations et notes           | 55 %       | Amorcé/avancé    |
| Portail étudiant               | 55 %       | Partiel          |
| Portail enseignant             | 50 %       | Partiel          |
| Finance                        | 30 %       | Module initial   |
| Sécurité et permissions        | 25 %       | Insuffisant      |
| Portail parent                 | 10 %       | Maquette         |
| Présences                      | 5 %        | Absent           |
| Comptabilité                   | 5 %        | Absent           |
| RH                             | 5 %        | Absent           |
| Bibliothèque                   | 0 %        | Absent           |
| Stages                         | 0 %        | Absent           |
| Mémoires                       | 0 %        | Absent           |
| Production et exploitation     | 20 %       | Insuffisant      |
| Cahier des charges global      | 45 %       | Prototype avancé |

## 3. Ce qui est réellement achevé ou solide

### 3.1 Authentification et comptes

- Connexion, déconnexion et profil
- Confirmation de mot de passe
- Vérification d’e-mail
- Mot de passe temporaire imposé à la première connexion
- Récupération administrative du compte
- Compte actif/inactif
- Middleware de rôle
- Inscription publique désactivée ; les comptes sont provisionnés par l’administration

Fichiers principaux :

- `routes/web.php`
- `app/Http/Middleware/EnsureRole.php`
- `app/Http/Middleware/EnsureActive.php`
- `app/Http/Middleware/RequirePasswordChange.php`
- `app/Models/User.php`

### 3.2 Structure universitaire

- Campuses
- Facultés
- Départements
- Filères
- Années universitaires
- Groupes/classes
- Salles
- Maquettes
- Semestres
- UE/ECUE
- Matières
- Affectations enseignant-matière

Contrôleurs principaux :

- `app/Http/Controllers/Admin/AcademicStructureController.php`
- `app/Http/Controllers/Admin/AcademicYearController.php`
- `app/Http/Controllers/Admin/CurriculumController.php`
- `app/Http/Controllers/Admin/ClassGroupController.php`
- `app/Http/Controllers/Admin/TeachingController.php`

### 3.3 Étudiants et inscriptions

- Liste paginée
- Recherche et filtres
- Création avec matricule
- Modification
- Consultation
- Archivage
- Création du compte étudiant
- Création des frais lors de l’inscription
- Affectation à un groupe
- Historique des inscriptions
- Statuts administratif et pédagogique
- Relation candidature-admission-inscription

Fichiers principaux :

- `app/Http/Controllers/Admin/StudentController.php`
- `app/Models/Student.php`
- `app/Models/Enrollment.php`
- `resources/js/Pages/Admin/Students/`

### 3.4 Admissions

- Enregistrement d’une candidature
- Information générale du candidat
- Filière et niveau souhaités
- Téléversement des pièces
- Statut de vérification des pièces
- Décision acceptée/refusée/en étude/pièces complémentaires
- Motif et auteur de décision
- Conversion unique candidature admise vers étudiant
- Lien permanent admission-inscription

Fichiers principaux :

- `app/Http/Controllers/Admin/AdmissionController.php`
- `app/Models/Admission.php`
- `app/Models/AdmissionDocument.php`
- `resources/js/Pages/Admin/Admissions/Index.tsx`

### 3.5 Enseignants

- Création de compte
- Liste paginée
- Dossier enseignant
- Matières affectées
- Planning personnel
- Volumes horaires prévus
- Saisie de présence pédagogique basique
- Accès aux notes et évaluations

Fichiers principaux :

- `app/Http/Controllers/Admin/TeacherController.php`
- `app/Http/Controllers/Teacher/WorkspaceController.php`
- `app/Http/Controllers/Teacher/TimetableController.php`
- `app/Http/Controllers/Teacher/TeachingProgressController.php`
- `resources/js/Pages/Admin/Teachers/`
- `resources/js/Pages/Teacher/`

### 3.6 Emplois du temps

- Création des salles
- Création des créneaux
- Affectation enseignant/groupe/salle
- Vérification de certains chevauchements
- Planning enseignant
- Planning étudiant
- Planning administratif

Contrôleur principal :

- `app/Http/Controllers/Admin/TimetableController.php`

### 3.7 Notes et évaluations

- Saisie enseignant sur 10
- Brouillons
- Publication administrative
- Blocage des notes publiées
- Résultats visibles par l’étudiant
- Évaluations en ligne
- Questions QCM
- Réponses écrites
- Tentatives
- Sauvegarde automatique
- Correction automatique/manuelle
- Anti-triche par perte de focus
- Suivi de la progression des cours

Contrôleurs principaux :

- `app/Http/Controllers/GradeController.php`
- `app/Http/Controllers/Admin/GradePublicationController.php`
- `app/Http/Controllers/Teacher/AssessmentController.php`
- `app/Http/Controllers/Student/AssessmentController.php`

### 3.8 Finance initiale

- Frais d’inscription
- Trois échéances de scolarité
- Montants décimaux
- Paiement manuel
- Calcul du solde
- Statuts soldé/partiel/en retard/à payer
- Activation d’une inscription en attente après paiement complet de l’inscription
- Paramètres des barèmes par département

Fichiers principaux :

- `app/Http/Controllers/Admin/FinanceController.php`
- `app/Http/Controllers/Student/FinanceController.php`
- `app/Models/StudentFee.php`
- `app/Models/Payment.php`
- `app/Models/DepartmentFeeSchedule.php`

### 3.9 Qualité d’interface

- Modales professionnelles pour les décisions sensibles
- Modales de confirmation réutilisables
- Validation professionnelle des formulaires
- Résumé d’erreur français
- Erreurs sous les champs
- Boutons désactivés tant que les données obligatoires sont absentes
- Boutons Voir dans les listes étudiants et enseignants
- Fiches étudiants et enseignants

## 4. Ce qui est partiellement réalisé

### 4.1 Sécurité

Présent :

- Rôle simple
- Compte actif
- Changement obligatoire du mot de passe
- Policy étudiant limitée
- Middleware de rôle

Absent ou incomplet :

- Permissions fines
- Rôles multiples
- Périmètres campus/faculté/département
- Règles sur les dossiers sensibles
- Tests d’accès horizontal/vertical
- MFA
- Limitation avancée des tentatives
- Rotation de secrets
- Gestion des sessions privilégiées
- Scopes API Sanctum

### 4.2 Données institutionnelles

À stabiliser :

- Convention des clés UUID ou entiers
- Unicités réalistes
- Règles de suppression
- Historique des changements
- États normalisés
- Relations faculté/département/programme
- Niveau, promotion, option et cohorte
- Tracabilité des décisions

### 4.3 Résultats académiques

À finaliser :

- Moyennes
- Crédits acquis
- Compensations
- Rattrapages
- Mentions
- Classements
- Délibération
- Rectification motivée
- Historique des versions
- Bulletins PDF
- Relevés PDF
- Attestations
- Procès-verbaux

### 4.4 Portail étudiant

Présent :

- Tableau de bord
- Groupe
- Emploi du temps
- Notes publiées
- Évaluations
- Situation financière

Absent :

- Documents personnels
- Demande d’attestation
- Suivi de candidature
- Historique complet
- Paiement en ligne
- Relevé téléchargeable
- Messagerie

### 4.5 Portail enseignant

Présent :

- Matières
- Planning
- Saisie des notes
- Évaluations
- Résultats étudiants
- Suivi des cours

Absent :

- Présence
- Supports de cours
- Ressources numériques
- Messagerie
- Récurrence avancée du planning
- Statistiques pédagogiques
- Évaluation des enseignements

### 4.6 Finance

Présent :

- Frais
- Échéances
- Paiements simples
- Soldes

Absent :

- Bourses
- Remises
- Pénalités
- Rejets
- Annulations
- Remboursements
- Réconciliation
- Références externes
- Idempotence
- Reçus numérotés
- Mobile Money
- Carte/Virement opérationnels
- États par caisse/période/méthode
- Comptabilité en partie double

## 5. Modules absents

### Présences

À construire :

- présence étudiant
- présence enseignant
- présence personnel
- auteur
- source
- date
- correction tracée
- rapports d’absence
- QR code
- badge
- biométrie uniquement après analyse juridique

### Comptabilité

À construire :

- plan comptable
- écritures journalisées
- débits/crédits
- périodes comptables
- grand livre
- balance
- budgets
- rapprochement bancaire
- états comptables

### RH et personnel

À construire :

- profils employés
- CV/diplômes
- contrats
- fonctions
- rémunération
- congés
- présence RH
- documents confidentiels
- séparation des droits RH

### Bibliothèque

À construire :

- catalogue
- exemplaires
- prêts
- retours
- réservations
- pénalités
- ressources numériques

### Stages

À construire :

- entreprises
- conventions
- encadreurs
- suivi
- évaluations
- rapports

### Mémoires

À construire :

- sujets proposés
- encadrement
- jalons
- documents
- soutenance
- archivage

### Communication

À construire :

- annonces ciblées
- e-mails institutionnels
- SMS
- notifications push
- messagerie
- préférences
- consentements
- suivi d’envoi

### Portail parent

État actuel : maquette

À construire :

- rattachement étudiant/tuteur
- consentement
- paiement
- résultats
- absences
- documents
- messages autorisés

### Production

À construire :

- CI/CD
- sauvegardes chiffrées
- restauration testée
- supervision
- métriques
- alertes
- plan de reprise
- RPO/RTO
- tests de charge
- revue sécurité OWASP
- MFA
- gestion des secrets
- runbooks
- gestion des incidents
- guide utilisateur
- guide administrateur
- documentation API

## 6. Risques techniques critiques

### R1 — Convention des identifiants

Certaines entités utilisent des identifiants entiers, d’autres des UUID.

Risque : incohérence des clés étrangères, erreurs de migration, difficulté d’intégration mobile/API.

Action : choisir une convention unique avant les nouveaux modules majeurs.

### R2 — Permissions insuffisantes

Le rôle seul ne tient pas compte du campus, de la faculté, du département, de l’étudiant ou de l’état du processus.

Action : mettre en place permissions, scopes et policies Laravel testées.

### R3 — Fichiers sensibles

Les pièces de dossier ne sont pas encore sécurisées de bout en bout.

Action : stockage privé, checksum, taille/type, antivirus, URL temporaires, rétention et audit.

### R4 — Audit incomplet

L’audit existe pour quelques actions seulement.

Action : journal immuable, acteur, action, cible, date UTC, résultat et corrélation.

### R5 — Historique financier et académique fragile

Les notes, frais et paiements sont liés, mais les règles de correction, annulation et remboursement restent incomplètes.

Action : états, événements, allocations, refunds, rectifications motivées.

### R6 — Tests insuffisants

Résultat actuel : 54 réussis sur 56.

Échecs connus :

1. pagination des matières : 15 éléments reçus au lieu de 20 attendus
2. relation `class_group.code` absente dans le tableau étudiant testé

Action : corriger le chargement des relations, vérifier les paginations et augmenter la couverture.

### R7 — Production non prête

Absence de CI/CD, restauration, supervision, objectifs de disponibilité, charge, sécurité, sauvegarde vérifiée et procédures d’exploitation.

## 7. Suite priorisée

### Priorité 1 — Terminée

- pagination matières corrigée à 20 éléments
- pagination administrative validée
- relation groupe étudiant chargée dans le dashboard
- test étudiant/groupe validé
- suite complète validée : 62 tests, 615 assertions
- migration RBAC appliquée
- permissions et périmètres étudiants testés


## Priorité 2 — Fiabiliser les rôles et permissions

- Corriger les deux tests rouges
- Corriger la pagination matières
- Charger les relations de groupe dans les dashboards étudiant
- Vérifier toutes les routes avec une base PostgreSQL neuve
- Exécuter les migrations de bout en bout sur une base vierge
- Vérifier les contraintes, suppressions et historiques
- Corriger les écarts entre migrations, modèles et écrans
- Unifier UUID/entiers avant toute extension

Critères de sortie :

- 100 % des tests principaux verts
- aucune migration manquante sur une base neuve
- aucune erreur de relation Eloquent
- aucun accès interdit qui contredit les rôles

### Priorité 2 — Rôles et permissions — terminée sur le socle

Créer :

- administrateur système
- direction/scolarité
- responsable faculté
- responsable département
- enseignant
- finance/comptabilité
- bibliothécaire
- étudiant
- parent/tuteur
- auditeur
- RH/personnel

Implémenter :

- permissions Laravel
- politiques métier
- scopes campus/faculté/département
- filtres serveur obligatoires
- tests d’accès horizontal
- tests d’accès vertical

Critères de sortie :

- aucun contrôle reposant uniquement sur le champ role
- chaque lecture/écriture passe une policy
- les données hors périmètre retournent 403

## Priorité 3 — Admission jusqu’à l’inscription

Terminer :

- préinscription
- pièces obligatoires configurables
- vérification des dossiers
- décisions multi-niveaux
- création effective d’étudiant depuis l’admission
- matricule stable
- réinscription annuelle
- changement de parcours
- transfert
- suspension
- abandon
- exclusion
- historique scolaire
- parents/tuteurs
- pièces privées

Critères de sortie :

- parcours admissible totalement testable
- une admission ne crée qu’une seule inscription liée
- aucune donnée de candidature perdue lors de la conversion
- chaque changement conserve l’auteur, la date et le motif

## Priorité 4 — Académique complet

Terminer :

- règles de poids des évaluations
- plages de notes
- règles de calcul
- crédits
- compensation
- rattrapage
- mention
- classement
- délibération
- publication
- rectification
- versions de résultat
- bulletins
- relevés
- attestations
- procès-verbaux
- présence

Critères de sortie :

- jeux de données pédagogiques approuvés
- moyenne et crédits vérifiés automatiquement
- aucune modification d’une note publiée sans historique
- génération PDF testée

## Priorité 5 — Finance

Développer :

- frais
- tarifs
- échéanciers
- remises
- bourses
- pénalités
- méthodes de paiement
- référence externe
- idempotence
- rapprochement
- rejets
- annulations
- remboursements
- reçus
- états par étudiant/période/caisse/statut
- exports

Critères de sortie :

- paiement confirmé une seule fois
- aucune suppression historique
- chaque correction est tracée
- soldes toujours cohérents

## Priorité 6 — Comptabilité

Après stabilisation de la finance :

- plan comptable
- écritures en partie double
- journaux
- comptes
- grand livre
- balance
- périodes comptables
- clôture
- rapprochement bancaire
- budgets
- rapports

Critères de sortie :

- chaque écriture est équilibrée
- chaque paiement peut être relié à une écriture
- aucune clôture ne masque ou efface une transaction

## Priorité 7 — Modules secondaires

Ordre proposé :

1. RH/personnel
2. bibliothèque
3. stages
4. mémoires
5. communication
6. parent/tuteur
7. rapports/export

Pour chaque module :

- migrations validées
- contrôleurs
- policies
- écrans
- notifications
- audit
- tests
- documentation

## Priorité 8 — Production

Mettre en place :

- CI et commandes de test/build
- Docker reproductible
- PostgreSQL séparé des bases locales
- variables d’environnement sécurisées
- HTTPS
- sauvegarde chiffrée
- exercice de restauration
- logs centralisés
- métriques
- alertes
- limite des tentatives de connexion
- MFA pour les comptes privilégiés
- scan de dépendances
- revue OWASP
- test de charge
- test de reprise
- procédures d’incident
- documentation d’exploitation
- guide utilisateur par profil
- guide administrateur
- documentation API

## 8. Matrice de décision produit

Décisions urgentes à valider avec l’université :

- Entité juridique unique ou plusieurs établissements
- Niveaux et durées exacts
- Règles de crédits et compensation
- Candidat autonome ou candidature administrée
- Pièces obligatoires
- Inscriptions actives multiples autorisées ou non
- Règles de changement de filière
- Circuits de suspension/exclusion
- Devises et arrondis
- Mobile Money et prestataires réels
- Portée des données parentales
- Obligations locales de données personnelles
- Rétention des documents
- Volume maximal simultané
- RPO/RTO
- Mode hors ligne exact
- API propriétaire ou OAuth2 tiers

## 9. Jalon recommandé

### Jalons courts

- Semaine 1 : stabiliser les tests et les relations
- Semaine 2 : finaliser permissions et audit
- Semaines 3 à 4 : finaliser le parcours admission/inscription
- Semaines 5 à 6 : résultats et délibération
- Semaines 7 à 8 : finance
- Semaines 9 à 10 : comptabilité
- Semaines 11 à 12 : présence/RH/bibliothèque selon choix métier
- Ensuite : durcissement production

### Critère de fin du MVP institutionnel

Le MVP sera suffisamment mature lorsque :

- un candidat peut être enregistré, vérifié, décidé et inscrit
- l’étudiant possède un dossier et un compte cohérents
- les enseignants peuvent saisir et publier les évaluations
- les étudiants consultent uniquement les données publiées
- les paiements, soldes et reçus sont cohérents
- les permissions empêchent tout accès hors périmètre
- les actions sensibles sont auditées
- les migrations fonctionnent sur une base neuve
- les tests critiques passent
- les sauvegardes peuvent être restaurées
- le déploiement est reproductible

## 10. Conclusion

L’application possède déjà un socle utile : structure académique, admissions, étudiants, enseignants, groupes, maquettes, emploi du temps, évaluations et première finance.

Le travail restant doit être organisé en priorité autour de la **fiabilité, des permissions, de l’audit, des règles académiques, de la finance et de l’exploitation**.

Il ne faut pas élargir immédiatement vers RH, bibliothèque, stages ou IA tant que les modules existants ne sont pas stables, testés et validés par les métiers concernés.
