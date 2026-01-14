# Scripts d'Installation et de Démarrage

Ce dossier contient les scripts pour automatiser l'installation et le démarrage de l'application Sirof.

## Scripts Disponibles

### 1. `install.bat` - Installation Automatique (Windows Batch)
Script simple en batch pour automatiser l'installation complète de l'application.

**Utilisation :**
- Double-cliquez sur `install.bat` depuis le dossier `next-app`

**Ce que fait le script :**
- Vérifie que Node.js et npm sont installés
- Installe les dépendances (`npm install`)
- Configure la base de données (`npx drizzle-kit push`)
- Construit l'application (`npm run build`)
- Vérifie l'utilisateur par défaut (`npm run verify-default-user`)

### 2. `install.ps1` - Installation Automatique (PowerShell)
Version PowerShell plus robuste avec messages détaillés et meilleure gestion des erreurs.

**Utilisation :**
- Clic droit sur `install.ps1` → **Exécuter avec PowerShell**
- Si Windows demande une autorisation, cliquez sur **Oui**

**Avantages :**
- Messages colorés et détaillés
- Meilleure gestion des erreurs
- Informations de débogage plus complètes

### 3. `start-app.bat` - Démarrage de l'Application
Script pour démarrer l'application en mode production.

**Utilisation :**
- Double-cliquez sur `start-app.bat` depuis le dossier `next-app`

**Note :** L'application doit être construite avant (`npm run build`)

### 4. `setup-auto-start.ps1` - Configuration du Démarrage Automatique
Script pour configurer le démarrage automatique de l'application au démarrage du PC.

**Utilisation :**
1. **Clic droit sur PowerShell → Exécuter en tant qu'administrateur**
2. Naviguez vers le dossier `next-app` :
   ```powershell
   cd "C:\Users\VotreNom\Documents\next-app"
   ```
3. Exécutez le script :
   ```powershell
   .\scripts\setup-auto-start.ps1
   ```
4. Répondez aux questions pour configurer la tâche planifiée

**Ce que fait le script :**
- Crée une tâche planifiée Windows nommée "SirofApplication"
- Configure la tâche pour démarrer au démarrage du système
- Configure les options de redémarrage automatique en cas d'erreur
- Permet de démarrer l'application immédiatement si désiré

**Pour désactiver le démarrage automatique :**
1. Ouvrez le **Planificateur de tâches** (Task Scheduler)
2. Recherchez la tâche **SirofApplication**
3. Clic droit → **Désactiver** ou **Supprimer**

## Ordre d'Exécution Recommandé

1. **Installation initiale :**
   - Exécutez `install.bat` ou `install.ps1` (une seule fois)

2. **Création du compte utilisateur :**
   - Démarrez l'application avec `start-app.bat` ou `npm run start`
   - Visitez http://localhost:3000/sign-up
   - Créez un compte avec email: sirof@gmail.com et mot de passe: Sirof2025@
   - Exécutez `npm run verify-default-user` pour vérifier l'email

3. **Configuration du démarrage automatique (optionnel) :**
   - Exécutez `setup-auto-start.ps1` en tant qu'administrateur

## Prérequis

- Node.js v22.21.1 (ou version compatible)
- PostgreSQL v17 avec base de données "sirof" créée
- Fichier `.env` configuré avec `DATABASE_URL`

## Notes Importantes

- Les scripts doivent être exécutés depuis le dossier `next-app`
- Le script `setup-auto-start.ps1` nécessite des privilèges administrateur
- L'application doit être construite (`npm run build`) avant de pouvoir démarrer
- Le démarrage automatique utilise une tâche Windows qui démarre l'application en arrière-plan

