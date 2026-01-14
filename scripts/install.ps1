# Script d'installation automatique pour Sirof Application (PowerShell)
# Ce script automatise toutes les étapes d'installation du logiciel

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Installation de Sirof Application" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes dans le bon dossier
if (-not (Test-Path "package.json")) {
    Write-Host "[ERREUR] Ce script doit être exécuté depuis le dossier next-app" -ForegroundColor Red
    Write-Host "Veuillez naviguer vers le dossier next-app avant d'exécuter ce script." -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

# Vérifier que Node.js est installé
try {
    $nodeVersion = node -v 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Node.js not found"
    }
    Write-Host "[INFO] Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] Node.js n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "Veuillez installer Node.js v22.21.1 avant de continuer." -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

# Vérifier que npm est installé
try {
    $npmVersion = npm -v 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "npm not found"
    }
    Write-Host "[INFO] npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] npm n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "Veuillez installer Node.js [qui inclut npm] avant de continuer." -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

Write-Host ""

# Étape 1: Installation des dépendances
Write-Host "[1/4] Installation des dépendances npm..." -ForegroundColor Yellow
try {
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
    Write-Host "[SUCCÈS] Dépendances installées" -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] L'installation des dépendances a échoué" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}
Write-Host ""

# Étape 2: Configuration de la base de données
Write-Host "[2/4] Configuration de la base de données (drizzle-kit push)..." -ForegroundColor Yellow
try {
    # Exécution interactive pour permettre à l'utilisateur de confirmer
    npx drizzle-kit push
    if ($LASTEXITCODE -ne 0) {
        throw "drizzle-kit push failed"
    }
    Write-Host "[SUCCÈS] Base de données configurée" -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] La configuration de la base de données a échoué" -ForegroundColor Red
    Write-Host "Veuillez vérifier que PostgreSQL est démarré et que la base de données 'sirof' existe." -ForegroundColor Yellow
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}
Write-Host ""

# Étape 3: Construction de l'application
Write-Host "[3/4] Construction de l'application (npm run build)..." -ForegroundColor Yellow
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "npm run build failed"
    }
    Write-Host "[SUCCÈS] Application construite" -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] La construction de l'application a échoué" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}
Write-Host ""

# Étape 4: Vérification de l'utilisateur (optionnel, peut échouer si l'utilisateur n'existe pas encore)
Write-Host "[4/4] Vérification de l'utilisateur par défaut..." -ForegroundColor Yellow
try {
    npm run verify-default-user
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCÈS] Utilisateur vérifié" -ForegroundColor Green
    } else {
        Write-Host "[AVERTISSEMENT] La vérification de l'utilisateur a échoué" -ForegroundColor Yellow
        Write-Host "Vous devrez peut-être créer l'utilisateur manuellement via l'interface web." -ForegroundColor Yellow
    }
} catch {
    Write-Host "[AVERTISSEMENT] La vérification de l'utilisateur a échoué" -ForegroundColor Yellow
    Write-Host "Vous devrez peut-être créer l'utilisateur manuellement via l'interface web." -ForegroundColor Yellow
}
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Installation terminée avec succès!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Démarrez l'application: npm run start" -ForegroundColor White
Write-Host ""
Write-Host "2. L'utilisateur par défaut sera créé automatiquement lors du premier démarrage" -ForegroundColor White
Write-Host "   ou exécutez manuellement: npm run verify-default-user" -ForegroundColor Gray
Write-Host "   - Email: sirof@gmail.com" -ForegroundColor Gray
Write-Host "   - Mot de passe: Sirof2025@" -ForegroundColor Gray
Write-Host "   - Email vérifié automatiquement (peut se connecter immédiatement)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Connectez-vous à http://localhost:3000/sign-in avec les identifiants ci-dessus" -ForegroundColor White
Write-Host ""
Write-Host "4. Pour un démarrage automatique au démarrage du PC:" -ForegroundColor White
Write-Host "   Utilisez le script setup-auto-start.ps1" -ForegroundColor Gray
Write-Host ""
Read-Host "Appuyez sur Entrée pour quitter"

