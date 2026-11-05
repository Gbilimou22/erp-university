# Installation locale sous Windows

Ce guide prépare un environnement de développement. Il ne configure pas un serveur de production.

## Prérequis

- PHP 8.2 ou plus récent, avec les extensions `pdo_pgsql`, `mbstring`, `openssl`, `fileinfo`, `zip` et `xml` activées.
- Composer 2.
- Node.js et npm.
- PostgreSQL 17 ou plus récent, démarré en local.

Vérifie les outils dans PowerShell :

```powershell
php -v
php -m | Select-String pdo_pgsql
composer --version
node --version
npm --version
psql --version
```

## Créer la base et son utilisateur

Dans pgAdmin (Query Tool connecté à la base `postgres` en tant qu’administrateur), exécute :

```sql
CREATE ROLE university_erp LOGIN PASSWORD 'local-dev-password';
CREATE DATABASE university_erp OWNER university_erp;
```

Si le rôle ou la base existent déjà, ne recrée pas l’objet : vérifie son propriétaire et utilise le mot de passe configuré dans `.env`.

Le mot de passe ci-dessus est un exemple réservé au développement local. Remplace-le par un mot de passe robuste et mets la même valeur dans `.env` avant toute utilisation durable. Ne réutilise jamais ces identifiants en production.

## Installer l’application

```powershell
Copy-Item .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
npm install
npm run build
```

`CoherentDemoDataSeeder` renouvelle les dossiers synthétiques uniquement dans les environnements `local` et `testing`. Il remplace les anciennes données `DEMO-2026-*`, `UNIV-*`, `ETU20260001`, `enseignant.demo*` et les anciennes références `DEM-*`, puis crée 120 étudiants `UNI-2026-*` répartis sur les filières `LIC-*`, avec un département, une faculté, une année et un groupe correspondants. Chaque semestre des maquettes `LIC-*` totalise 30 crédits (cinq UE de 6 crédits). Les comptes étudiants et enseignants de démonstration ont des mots de passe aléatoires inconnus et exigent une réinitialisation explicite avant toute connexion de test.

La réinitialisation se fait dans la plateforme sans lien de changement de mot de passe : l’utilisateur saisit son adresse, entre le code reçu par e-mail, puis renseigne et confirme son nouveau mot de passe. Le code est haché en base, valable 10 minutes, limité à cinq essais et un renvoi par adresse chaque minute. La réponse ne révèle pas si l’adresse correspond à un compte.

En local, `.env` utilise `MAIL_MAILER=log` : aucun e-mail ne part réellement. Pour tester la réinitialisation, ouvrir `storage/logs/laravel.log` et utiliser le code consigné. Pour une livraison réelle, configurer un serveur SMTP dans `.env` puis vider le cache de configuration Laravel.

Ce rafraîchissement supprime les notes, frais et paiements associés aux dossiers synthétiques ciblés. Il ne réinitialise pas le mot de passe administrateur et préserve les créneaux d’emploi du temps qui ne dépendent pas des anciennes matières/enseignants de démonstration. Ne pas l’exécuter sur une base contenant des données institutionnelles.

Le seeder `DatabaseSeeder` appelle `CoherentDemoDataSeeder`, qui construit aussi la structure via `UniversityStructureSeeder`. Pour renouveler ultérieurement les données synthétiques en local, lancer explicitement `php artisan db:seed --class=CoherentDemoDataSeeder` ; cette opération remplace le jeu étudiant synthétique et les cours/UE/ECUE de démonstration.

Le fichier `.env` est ignoré par Git. Il contient les paramètres locaux et la clé de chiffrement de l’application ; ne le partage pas.

Pour lancer le serveur web et Vite dans deux terminaux PowerShell :

```powershell
php artisan serve
```

```powershell
npm run dev
```

Sur une nouvelle base, le seeder administrateur crée `admin@university.edu` avec le mot de passe initial documenté par l’équipe d’installation. Change-le dès la première connexion. N’utilise pas ce compte ni ces données de démonstration en production.

## Sauvegarder la base locale

Depuis le dossier du projet, cette commande crée un fichier SQL dans le dossier courant :

```powershell
pg_dump -h 127.0.0.1 -p 5433 -U university_erp -d university_erp -F c -f university_erp-backup.dump
```

Garde la sauvegarde dans un emplacement sûr, séparé du dépôt. La base PostgreSQL locale ne remplace pas une sauvegarde.

## Reprendre les données de l’ancien PC

Les migrations permettent de recréer le schéma, mais elles ne recréent pas les données qui se trouvaient sur l’ancienne machine. Si tu as un export `.sql` ou `.dump`, conserve-le et restaure-le dans une base vide avant de reprendre le travail. N’exécute pas `migrate:fresh` sur une base contenant des données à garder : cette commande supprime les tables.

Si aucune sauvegarde n’a été faite et que l’ancien ordinateur est encore accessible, exporte sa base avant de poursuivre les changements de données.
