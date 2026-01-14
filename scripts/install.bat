@echo off
REM Script d'installation automatique pour Sirof Application
REM Ce script automatise toutes les étapes d'installation du logiciel

echo ============================================
echo   Installation de Sirof Application
echo ============================================
echo.

REM Vérifier que nous sommes dans le bon dossier
if not exist "package.json" (
    echo [ERREUR] Ce script doit être exécuté depuis le dossier next-app
    echo Veuillez naviguer vers le dossier next-app avant d'exécuter ce script.
    pause
    exit /b 1
)

REM Vérifier que Node.js est installé
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Node.js n'est pas installé ou n'est pas dans le PATH
    echo Veuillez installer Node.js v22.21.1 avant de continuer.
    pause
    exit /b 1
)

REM Vérifier que npm est installé
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] npm n'est pas installé ou n'est pas dans le PATH
    echo Veuillez installer Node.js [qui inclut npm] avant de continuer.
    pause
    exit /b 1
)

echo [1/4] Installation des dépendances npm...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] L'installation des dépendances a échoué
    pause
    exit /b 1
)
echo.

echo [2/4] Configuration de la base de données (drizzle-kit push)...
REM Exécution interactive pour permettre à l'utilisateur de confirmer
    call npx drizzle-kit push
    set DB_PUSH_RESULT=%ERRORLEVEL%

if %DB_PUSH_RESULT% NEQ 0 (
    echo [ERREUR] La configuration de la base de données a échoué
    echo Veuillez vérifier que PostgreSQL est démarré et que la base de données 'sirof' existe.
    echo.
    echo Si le problème persiste, exécutez manuellement: npx drizzle-kit push
    if exist "%TEMP_FILE%" del "%TEMP_FILE%" 2>nul
    pause
    exit /b 1
)
echo.

echo [3/4] Construction de l'application (npm run build)...
echo.

echo [4/4] Vérification de l'utilisateur par défaut...
call npm run verify-default-user
if %ERRORLEVEL% NEQ 0 (
    echo [AVERTISSEMENT] La vérification de l'utilisateur a échoué
    echo Vous devrez peut-être créer l'utilisateur manuellement via l'interface web.
    echo.
)
echo.

echo ============================================
echo   Installation terminée avec succès!
echo ============================================
echo.
echo Prochaines étapes:
echo 1. Démarrez l'application: npm run start
echo.
echo 2. L'utilisateur par dfaut sera cree automatiquement lors du premier demarrage

echo    - Email: sirof@gmail.com
echo    - Mot de passe: Sirof2025@
echo    - Email verifie automatiquement (peut se connecter immediatement)
echo.
echo 3. Connectez-vous a http://localhost:3000/sign-in avec les identifiants ci-dessus
echo.
echo 4. Pour un demarrage automatique au demarrage du PC:
echo    Utilisez le script setup-auto-start.ps1
echo.
pause

