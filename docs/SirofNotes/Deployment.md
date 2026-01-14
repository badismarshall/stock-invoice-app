### Prérequis

- Node.js v22.21.1
- Postgres v17
- Google Chrome, Mozilla Firefox ou Opera

### Installation

### 1 - Installer Node.js

- Installez Node.js dans le dossier Requirement ==(node-v22.21.1-x64)== (installation par défaut : next → next).
- Pour vérifier que l’installation a réussi, ouvrez le CMD et exécutez la commande `node -v`. La version installée s'affichera.
- Utilisez cette vidéo [https://www.youtube.com/watch?v=\_AW2kcE5VkQ](https://www.youtube.com/watch?v=_AW2kcE5VkQ) si vous rencontrez un problème.

### 2 - Installer Postgres

- Suivez cette vidéo [https://www.youtube.com/watch?v=SBEtF7EfY6w](https://www.youtube.com/watch?v=SBEtF7EfY6w) pour l’installation.
- Lancez l’exécutable ==(postgresql-17.7-2-windows-x64)== dans le dossier Requirement (installation par défaut : next → next). Vous devrez créer un mot de passe pour la base de données ; mémorisez-le car nous en aurons besoin pour déployer notre logiciel.
- À cette étape, vous pouvez décocher ==Stack Builder== (nous n'en avons pas besoin).
  ![[Postgres-setup.png]]
- Dans cette étape, entrez le mot de passe et mémorisez-le pour la prochaine utilisation.
  ![[Postgres-password-setup.png]]

- Dans l’étape suivante, vous pouvez décocher "Stack Builder may be used…".
  ![[Postgres-finale-setup.png]]

- Lancez le logiciel pgAdmin 4.
  ![[pgadmin4.png]]

- Cliquez sur Serveurs.
  ![[pgadmin4-servers.png]]
- Vous devrez entrer le mot de passe créé précédemment lors de l’étape d’installation.
  ![[pgadmin4-password.png]]
- Nous devons ensuite créer notre base de données pour le logiciel. Il suffit de faire un clic droit sur Databases → Create → Database.
  ![[pgadmin4-db.png]]
- Dans le champ Database, entrez le nom de la base de données ==sirof== (ATTENTION : il faut que le nom soit **sirof** exactement comme écrit ici). Cliquez sur Save pour sauvegarder les changements. ==(Votre base de données est installée avec succès)==.
  ![[db-setup.png]]

### 3 - Installer le Logiciel

- Copiez le dossier `next-app` dans le dossier Documents de Windows ou sur le Disque D://.
- Ouvrez le fichier `.env` et modifiez la dernière ligne de manière à ce que le mot de passe créé précédemment remplace la phrase "badismca20" : `postgresql://postgres:==votre_mot_de_passe==@localhost/sirof` et sauvegardez les changements.

#### Installation Automatique (Recommandé)

**Option 1 - Script Batch (Simple) :**

- Ouvrez le dossier `next-app` que vous avez copié.
- Double-cliquez sur le fichier `scripts/install.bat` pour lancer l'installation automatique.
- Le script exécutera automatiquement toutes les étapes d'installation :
  - Installation des dépendances (`npm install`)
  - Configuration de la base de données (`npx drizzle-kit push`)
  - Construction de l'application (`npm run build`)
  - Vérification de l'utilisateur par défaut (`npm run verify-default-user`)

**Option 2 - Script PowerShell (Recommandé pour plus de détails) :**

- Clic droit sur le fichier `scripts/install.ps1` → **Exécuter avec PowerShell**
- Si Windows demande une autorisation, cliquez sur **Oui** ou **Autoriser**
- Le script exécutera automatiquement toutes les étapes d'installation avec des messages détaillés

#### Installation Manuelle (Si nécessaire)

Si vous préférez installer manuellement ou si les scripts automatiques ne fonctionnent pas :

- Lancez le CMD dans le dossier `next-app` que vous avez collé dans Documents ou dans le disque D.
- Lancez la commande ==npm install== (une connexion internet est requise pour cette installation, à faire une seule fois).
  ![[npminstall.png]]
- Lancez la commande ==npx drizzle-kit push== et choisissez **Yes**.
  ![[pushdbschema.png]]
- Lancez la commande ==npm run build==.
  ![[npmrunbuild.png]]

#### Création du Compte Utilisateur

- Pour vérifier que tout fonctionne, lancez la commande ==npm run start==.
  ![[npmrunstart.png]]
- Visitez le lien [http://localhost:3000/sign-in](http://localhost:3000/sign-in)
  ![[signin.png]]
- Créez un utilisateur en appuyant sur le lien de S'inscrire: - **Email** : sirof@gmail.com (Vous devez vous inscrire avec ce email en premier) - **Mot de passe** : Sirof2025@
  ![[signup.png]]
- Lancez la commande ==npm run verify-default-user== pour créer et vérifier l'utilisateur par défaut automatiquement. Cette commande :
  - Crée l'utilisateur avec l'email "sirof@gmail.com" et le mot de passe "Sirof2025@" si l'utilisateur n'existe pas
  - Vérifie automatiquement l'email (emailVerified = true) pour permettre la connexion immédiate
- Connectez-vous avec le compte créé précédemment pour accéder au logiciel.
  ![[dashboard.png]]

### 4 - Configuration du Démarrage Automatique (Optionnel)

Pour que l'application démarre automatiquement au démarrage du PC :

1. **Clic droit sur PowerShell → Exécuter en tant qu'administrateur**
2. Naviguez vers le dossier `next-app` :
   ```powershell
   cd "C:\Users\VotreNom\Documents\next-app"
   ```
   (Remplacez le chemin par l'emplacement réel de votre dossier `next-app`)
3. Exécutez le script de configuration :
   ```powershell
   .\scripts\setup-auto-start.ps1
   ```
4. Répondez **O** pour créer/recréer la tâche planifiée
5. Répondez **O** si vous voulez démarrer l'application immédiatement

**Note :** Le script configurera une tâche Windows qui démarrera automatiquement l'application en arrière-plan au démarrage du PC.

**Pour désactiver le démarrage automatique :**

1. Ouvrez le **Planificateur de tâches** (Task Scheduler)
2. Recherchez la tâche **SirofApplication**
3. Clic droit → **Désactiver** ou **Supprimer**

**Pour démarrer l'application manuellement :**

- Double-cliquez sur `scripts/start-app.bat` ou exécutez `npm run start` dans le dossier `next-app`
