@echo off
REM Script de démarrage de l'application Sirof
REM Ce script démarre l'application en mode production

echo ============================================
echo   Démarrage de Sirof Application
echo ============================================
echo.

REM Vérifier que nous sommes dans le bon dossier
if not exist "package.json" (
    echo [ERREUR] Ce script doit être exécuté depuis le dossier next-app
    pause
    exit /b 1
)

REM Vérifier que le build existe
if not exist ".next" (
    echo [ERREUR] L'application n'a pas été construite
    echo Veuillez exécuter d'abord: npm run build
    pause
    exit /b 1
)

echo Démarrage de l'application...
echo L'application sera accessible à: http://localhost:3000
echo.
echo Appuyez sur Ctrl+C pour arrêter l'application
echo.

call npm run start

