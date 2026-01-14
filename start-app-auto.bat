@echo off
REM Script de démarrage automatique de l'application Sirof (pour tâche planifiée)
REM Ce script démarre l'application en mode production sans interaction utilisateur

REM Obtenir le chemin du script
set "SCRIPT_DIR=%~dp0"
set "APP_DIR=%SCRIPT_DIR%.."

REM Changer vers le dossier de l'application
cd /d "%APP_DIR%"

REM Vérifier que nous sommes dans le bon dossier
if not exist "package.json" (
    exit /b 1
)

REM Vérifier que le build existe
if not exist ".next" (
    exit /b 1
)

REM Démarrer l'application
npm run start

