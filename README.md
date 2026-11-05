# University ERP

ERP universitaire développé avec Laravel, React, Inertia et TypeScript. Le dépôt fournit un prototype de travail, pas encore un logiciel prêt pour une exploitation réelle.

> **État au 3 novembre 2026 :** les fonctions décrites comme présentes ci-dessous sont celles repérées dans le code et les routes. Leur présence ne signifie pas qu’elles ont toutes été vérifiées de bout en bout ou validées par les métiers. La production, la conformité réglementaire et la sécurité complète ne sont pas acquises.

## État du projet en bref

- **Socle technique :** Laravel 12, PHP `^8.2`, React 18, Inertia, TypeScript, Tailwind CSS et PostgreSQL.
- **État de la base locale observée :** PostgreSQL 18.6, base `university_erp`, port `5433`, 35 migrations appliquées.
- **Données synthétiques locales :** 120 étudiants UNI-2026 répartis sur 18 filières LIC-* ; 4 campus, 8 facultés, 22 départements, 28 filières, 61 classes, 87 UE et 166 ECUE ; 18 enseignants au total, dont 12 comptes synthétiques ; 16 salles.
- **Application :** 93 routes déclarées. Le noyau comprend l’authentification, l’administration académique, les étudiants, les emplois du temps et quelques pages de portail.
- **Qualité :** 16 fichiers de tests et 42 méthodes nommées `test_` repérés. La suite n’a pas été exécutée pendant cet inventaire ; les modules métier importants restent peu couverts.
- **Conclusion :** prototype local fonctionnel par endroits, encore incomplet et non prêt pour des données réelles ou la production.

Les données ci-dessus sont des données de démonstration créées pour le développement. Elles ne sont pas des données institutionnelles validées.

## Ce qui est déjà présent

### Socle et installation

- Application Laravel avec rendu React/Inertia, routage TypeScript, interface Tailwind et dépendances frontend installées dans le dépôt de travail.
- Connexion PostgreSQL opérationnelle dans l’environnement local observé. La configuration réelle se trouve dans `.env`, fichier ignoré par Git.
- Migrations pour l’identité, l’organisation académique, les étudiants, les inscriptions, les cursus, l’enseignement, les salles et la planification.
- Pages d’authentification issues de Laravel Breeze : inscription, connexion, déconnexion, confirmation et gestion du profil. La récupération sans e-mail est assistée par un administrateur après vérification d’identité ; un mot de passe temporaire est généré, affiché une seule fois et doit être changé à la prochaine connexion. Les comptes administrateurs ne peuvent pas être récupérés depuis cette page.
- Contrôles applicatifs déjà amorcés : rôle, compte actif, changement obligatoire du mot de passe temporaire, politique d’accès aux dossiers étudiants.
- Documentation de cadrage dans [`docs/CAHIER_DES_CHARGES_ERP.md`](docs/CAHIER_DES_CHARGES_ERP.md) : besoins, proposition d’architecture, modèle de données conceptuel/logique/physique, diagrammes Mermaid, sécurité, stratégie qualité et feuille de route. Ces éléments restent des propositions à valider.
- Instructions d’installation, de sauvegarde locale et de reprise de données dans [`docs/INSTALLATION_LOCALE.md`](docs/INSTALLATION_LOCALE.md).

### Fonctions applicatives amorcées

- **Structure universitaire :** pages et routes d’administration pour campus, facultés, départements, filières et cours. La création et la suppression des filières sont présentes dans les routes ; la modification de filière n’y est pas exposée. Le jeu de démonstration ajoute des données à la structure.
- **Étudiants :** liste paginée, recherche et filtres, création, consultation, modification et archivage. Une création rattache un compte, génère un matricule, crée l’inscription annuelle et affiche des identifiants temporaires. L’édition met à jour le profil et l’inscription la plus récente.
- **Années universitaires :** liste, création, choix de l’année courante et suppression avec contrôle métier.
- **Enseignement :** création/modification/suppression d’UE et ECUE, affectation et retrait d’enseignants pour une année ; doublon matière/enseignant/année refusé côté formulaire, serveur et contrainte PostgreSQL.
- **Maquettes :** création/versionnement d’une maquette, gestion des semestres et rattachement d’UE de la faculté correspondante.
- **Groupes pédagogiques :** liste, création, affectation d’étudiants actifs sans groupe, déplacement entre groupes compatibles, limite de capacité contrôlée sous verrou transactionnel et protection contre la suppression d’un groupe occupé.
- **Salles et emplois du temps :** l’administration planifie les cours par enseignant, groupe, salle et créneau ; les enseignants consultent leur planning personnel et les étudiants celui de leur inscription active (année courante en priorité). Les salles sont affectées aux créneaux (et non fixées définitivement à un groupe). Le contrôleur vérifie les chevauchements de salle, d’enseignant et de groupe et utilise des transactions/verrous.
- **Portail étudiant :** résumé du parcours, accès à la page du groupe et à l’emploi du temps. Les résultats, paiements et documents ne sont pas intégrés.
- **Portail enseignant :** tableau de bord montrant les matières affectées pour l’année courante.
- **Tableaux de bord :** page publique avec quelques indicateurs ; tableau administrateur avec effectifs, répartition par faculté, inscriptions récentes et utilisateurs récents.
- **API :** route `/api/user` et lecture paginée/consultation de dossiers étudiants. Les routes étudiants sont actuellement réservées au rôle administrateur.
- **Audit :** table et modèle d’événements ; les opérations d’inscription/modification d’étudiant et les changements d’année ont des traces ciblées. Il n’existe pas de journal d’audit complet ni d’écran de consultation.

## État par module demandé

| Module | État constaté | Travail restant principal |
|---|---|---|
| Université, campus, facultés, départements | Partiel | Compléter les règles de suppression/historique, les périmètres par campus et la gestion des dépendances. |
| Filières, options, promotions, classes, locaux | Partiel | Options et promotions métier absentes ; éditions de filières/cours incomplètes ; harmoniser le sens et les identifiants des classes. |
| Admissions et dossiers étudiants | Partiel | Pas de workflow de candidature/préinscription/admission, de pièces, photo, adresse, nationalité, parents/tuteurs ou historique scolaire. Les changements de statut métier ne sont pas complets. |
| Comptes étudiants | Partiel | Création initiale liée à un dossier académique et mot de passe temporaire présents ; création autonome publique désactivée. Le processus de candidature/préinscription reste à concevoir. |
| Enseignants | Partiel | Création/listing et affectations existent ; pas de dossier RH enseignant complet, CV, diplômes, contrats, disponibilités, charge horaire consolidée ou workflow de recrutement. |
| Personnel et RH | Absent | Pas de modèle métier ni d’écrans pour postes, services, contrats, congés, présence RH ou paie. |
| Années, semestres, UE/ECUE, crédits | Partiel | Années et maquettes/semestres/UE existent ; les règles officielles de crédits, coefficients, compensation et validation ne sont pas définies. |
| Programmes et ressources pédagogiques | Partiel | Cours/matières sont amorcés ; pas de dépôt sécurisé de PDF/vidéos, exercices, TP, bibliothèque de ressources ni versionnement de contenus. |
| Emplois du temps | Partiel | Planification admin, consultation par l’étudiant inscrit et consultation du planning propre à l’enseignant présentes ; examens/soutenances séparés, récurrence calendaire, fuseaux et vérification concurrente exhaustive à traiter. |
| Présences | Absent | Aucun parcours de présence étudiant/enseignant/personnel, QR, badge, correction ou rapport. |
| Notes et résultats | Saisie et publication initiales | Les enseignants affectés à une matière de l’année courante saisissent des brouillons notés sur 10. Un administrateur publie une évaluation entière ; les étudiants ne voient que les notes publiées. Une note publiée est verrouillée pour l’enseignant. Les règles de calcul des moyennes/crédits et le processus de rectification avec historique restent à définir. |
| Frais, paiements, bourses | Modèles alignés, module non opérationnel | `StudentFee` et `Payment` suivent maintenant les colonnes existantes et utilisent des montants décimaux. Aucune interface/API métier, règle de paiement, rapprochement, remboursement, reçu ou intégration Mobile Money. |
| Comptabilité | Absent | Pas de plan comptable, journaux, écritures équilibrées, grand livre, balance, budget ou rapports. |
| Bibliothèque | Absent | Aucun catalogue, exemplaire, prêt, retour, réservation ou pénalité. |
| Évaluations en ligne | Première version | Création par enseignant, QCM et réponses écrites, horaires, lancement manuel, visibilité actualisée toutes les 15 secondes, tentative unique et sauvegarde automatique. L’anti-triche de perte de focus/navigation est activable par l’enseignant pour chaque évaluation ; lorsqu’il est activé, la copie est soumise automatiquement au changement d’onglet/fenêtre ou à la navigation. Le tableau de bord enseignant affiche les évaluations à suivre ; la page des copies présente le classement des tentatives corrigées (ex æquo au même rang). Correction automatique QCM et correction manuelle sur 10. Pas de surveillance vidéo, détection anti-plagiat ni publication au relevé académique. |
| Stages et mémoires | Absent | Aucun modèle ni processus métier correspondant. |
| Communication | Absent | Pas de messagerie interne, annonces, SMS, e-mails métier ou notifications push. |
| Portail étudiant | Partiel | Tableau, groupe, emploi du temps, notes publiées et évaluations en cours ; paiements, demandes et téléchargements absents. |
| Portail enseignant | Partiel | Consultation des matières, emploi du temps propre, saisie de notes et création/lancement/correction d’évaluations présents ; présence, supports, messagerie et outils avancés de planning absents. |
| Portail parent | Maquette seulement | Route et écran existent, mais les cartes affichées sont inactives ; aucun rattachement parent/enfant ni consentement. |
| Administration et permissions | Partiel | Rôles simples `admin`, `teacher`, `student`, `parent` et compte actif ; pas de permissions fines/scopes, de gestion d’utilisateurs complète, ni de console d’audit/sauvegarde. |
| Mobile, hors ligne et QR/RFID | Absent | Pas d’application Android/iOS, synchronisation hors ligne, stockage local protégé ou notifications mobiles. |
| IA et statistiques avancées | Absent | Pas de modèle de prédiction, chatbot ni recommandations ; les graphiques présents sont des indicateurs de base. |
| Exports et documents | Absent | Pas de génération métier PDF/Excel/Word/CSV ni de contrôle des exports. |
| Exploitation production | Absent | Pas de CI/CD, supervision, sauvegarde automatisée/chiffrée vérifiée, reprise testée, procédure de déploiement, objectifs de service ou validation de charge/sécurité. |

## Points techniques à traiter avant d’élargir le périmètre

1. **Modèles alignés sur le schéma courant ; conception financière à compléter.** `Grade` est maintenant lié à `Enrollment` et `Subject`; `AcademicYear::grades()` traverse les inscriptions. `StudentFee` utilise `enrollment_id`, `title`, `amount` et `due_date`. `Payment` utilise `reference_number`, `amount`, `payment_method` et `paid_at`. Les montants sont maintenant castés en décimaux. Le schéma reste un premier brouillon : il ne stocke pas l’auteur d’une note, les statuts de paiement, les remboursements, les événements d’annulation ni une piste financière complète.
2. **Choisir une convention de clés stable.** Les tables utilisent un mélange d’IDs numériques et d’UUID (filières, classes, cours, maquettes). Les migrations historiques sont incrémentales ; définir la cible avant d’ajouter des relations supplémentaires.
3. **Faire évoluer l’architecture réelle.** Le code suit surtout le MVC Laravel classique ; les frontières de domaine, cas d’usage et services proposés dans le cahier des charges ne sont pas encore organisés en couches dédiées.
4. **Inscription publique désactivée.** `/register` explique que les comptes sont créés par l’administration ; la route POST qui créait un compte sans dossier étudiant ni inscription a été retirée. Les comptes créés par l’administration doivent être rattachés à un dossier métier. La préinscription publique et la validation d’identité restent à concevoir comme un véritable processus d’admission.
5. **Renforcer l’autorisation.** Les accès sont principalement filtrés par rôle. Il manque les permissions par action et périmètre (campus/faculté/département), les relations parent-enfant avec consentement et les tests systématiques d’accès horizontal.
6. **Étendre et rendre cohérent l’audit.** Les traces couvrent quelques changements, pas toutes les actions sensibles ; prévoir consultation, conservation, intégrité et règles d’accès.
7. **Préserver l’historique relationnel.** La migration `2026_11_03_000001_preserve_academic_and_financial_history` est appliquée : les suppressions d’inscriptions référencées par des notes ou frais, et de frais référencés par des paiements, sont désormais refusées par PostgreSQL au lieu d’effacer ces historiques en cascade. Le rôle `university_erp` est propriétaire des tables modifiées, ce qui lui permet d’exécuter les migrations Laravel correspondantes.
8. **Saisie et publication initiales des notes sur 10.** `2026_11_03_000002_add_grade_assessment_metadata` ajoute le libellé d’évaluation, l’auteur et l’unicité d’une évaluation par étudiant/matière/type ; `2026_11_03_000003_limit_grade_score_to_ten` impose en base une note comprise entre 0 et 10. La migration `2026_11_05_000001_add_grade_publication_workflow` ajoute brouillon/publication et l’auteur/date de publication. Les enseignants saisissent les brouillons ; un administrateur publie un lot d’évaluation ; l’étudiant ne consulte que les notes publiées. Les enseignants ne peuvent pas modifier ces notes ensuite. Le calcul des moyennes/crédits et les rectifications avec historique doivent encore être définis avec l’université.
9. **Accès enseignant limité aux étudiants qui suivent son cours.** La saisie des notes filtre les inscriptions actives par année, faculté de l’UE et maquette de programme contenant cette UE ; la même règle est appliquée à l’enregistrement pour empêcher la modification de requêtes. Le planning enseignant ne retourne que les créneaux de l’enseignant connecté. Le schéma rattache les UE aux facultés et les programmes aux départements, sans affectation directe d’une UE à un département.
8. **Sécuriser les données synthétiques.** Les seeders sont limités à `local`/`testing`. Les comptes de test ont des secrets aléatoires non distribués et doivent être remplacés par des comptes provisionnés avant une mise en service.
9. **Valider les règles métier avec l’université.** Les règles de notation, crédits, matricule, devise, paiements, conservation des documents, accès parent et parcours d’admission restent à confirmer.

## Priorités proposées pour la suite

### Priorité 1 — Fondation fiable

- Confirmer le modèle métier et la convention d’identifiants ; corriger les écarts migration/modèle.
- Définir le périmètre des rôles/permissions, fermer ou encadrer l’inscription libre et appliquer correctement la vérification e-mail.
- Ajouter des tests d’intégration PostgreSQL pour les parcours existants, erreurs de permissions, relations, suppressions et concurrence.
- Compléter les opérations manquantes de structure (notamment modification des filières/cours), vérifier les suppressions et harmoniser les codes/données existantes.

### Priorité 2 — Premier parcours académique complet

- Finaliser le dossier/admission étudiant et son historique annuel.
- Définir les règles de notation puis implémenter saisie, validation, publication et rectification avec historique.
- Compléter emplois du temps et vérification des conflits, puis ajouter la présence.
- Finaliser le portail enseignant et afficher uniquement les données publiées/autorisées dans chaque portail.

### Priorité 3 — Finance et services universitaires

- Stabiliser frais, échéanciers, paiements, rapprochement et reçus avant tout branchement Mobile Money.
- Concevoir séparément la comptabilité en partie double.
- Développer RH, bibliothèque, examens, stages, mémoires et communication selon des critères d’acceptation validés.

### Priorité 4 — Production et extensions

- Durcir authentification et permissions (MFA des comptes privilégiés, limitation de tentatives, gestion des secrets), revue OWASP et protection des données.
- Mettre en place CI/CD, journaux, métriques, sauvegardes/restauration répétées, supervision et procédures d’incident.
- Vérifier accessibilité, performance, charge, documentation utilisateur/API et déploiement.
- Étudier ensuite les applications mobiles, le hors-ligne et l’IA sur des cas d’usage et données validés.

## Démarrage local

Les instructions Windows/PostgreSQL, la sauvegarde et la reprise d’une base sont dans [`docs/INSTALLATION_LOCALE.md`](docs/INSTALLATION_LOCALE.md). L’installation locale observée utilise PostgreSQL sur le port `5433`; adapte `.env` si ton serveur écoute sur un autre port.

Commandes utiles depuis la racine du dépôt :

```powershell
php artisan migrate:status
php artisan route:list
php artisan db:seed --class=CoherentDemoDataSeeder
php artisan serve
```

Dans un second terminal pour Vite :

```powershell
npm run dev
```

`CoherentDemoDataSeeder` est réservé aux bases `local`/`testing`. Il remplace les anciens dossiers synthétiques identifiés (`DEMO-2026-*`, `UNIV-*`, `ETU20260001`), anciens enseignants `enseignant.demo*` et cours/UE/ECUE `DEM-*`, puis crée 120 dossiers `UNI-2026-*`, affectés à une filière, un département, une faculté, une année et un groupe cohérents. Les maquettes des filières `LIC-*` contiennent deux semestres de cinq UE à 6 crédits (30 crédits par semestre). Les créneaux d’emploi du temps non liés aux anciennes données de démonstration sont préservés.

La commande de rafraîchissement efface les notes, frais et paiements associés à ces dossiers synthétiques avant de les recréer. Ne pas l’exécuter sur une base contenant des données institutionnelles. Elle ne réinitialise pas le mot de passe administrateur.

Les mots de passe aléatoires des comptes synthétiques ne sont pas affichés ni connus. Pour tester une connexion étudiant/enseignant, créer ou réinitialiser explicitement le compte concerné en local.

## Tests et vérifications

Les tests existants couvrent surtout l’authentification Laravel, le CRUD étudiant, la gestion des groupes, les cursus et quelques créations administratives. Ils ne couvrent pas encore suffisamment les notes, paiements, accès par périmètre, sécurité complète, présence, restauration ou charge.

Pour exécuter la suite quand l’environnement de test PostgreSQL est prêt :

```powershell
php artisan test
```

La configuration PHPUnit cible une base PostgreSQL distincte nommée `university_erp_test`. Vérifie son existence et ses identifiants avant de lancer les tests : certaines suites réinitialisent le schéma de cette base de test.

## Documentation

- [Cahier des charges, architecture et conception](docs/CAHIER_DES_CHARGES_ERP.md)
- [Installation locale, PostgreSQL et sauvegarde](docs/INSTALLATION_LOCALE.md)

Il reste à produire les guides utilisateur par profil, un guide d’administration/exploitation et une documentation API formelle.
