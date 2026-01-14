# Script pour configurer le démarrage automatique de l'application Sirof
# Ce script configure une tâche planifiée Windows pour démarrer l'application au démarrage du PC

# Nécessite des privilèges administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[ERREUR] Ce script nécessite des privilèges administrateur" -ForegroundColor Red
    Write-Host "Veuillez exécuter PowerShell en tant qu'administrateur" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Cliquez droit sur PowerShell -> Exécuter en tant qu'administrateur" -ForegroundColor Yellow
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Configuration du démarrage automatique" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Obtenir le chemin actuel du script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$appPath = $scriptPath

# Vérifier que nous sommes dans le bon dossier
if (-not (Test-Path (Join-Path $appPath "package.json"))) {
    Write-Host "[ERREUR] Ce script doit être exécuté depuis le dossier next-app" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

# Vérifier que le build existe
if (-not (Test-Path (Join-Path $appPath ".next"))) {
    Write-Host "[ERREUR] L'application n'a pas été construite" -ForegroundColor Red
    Write-Host "Veuillez exécuter d'abord: npm run build ou le script install.ps1" -ForegroundColor Yellow
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

# Nom de la tâche
$taskName = "SirofApplication"

# Vérifier si la tâche existe déjà
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "[INFO] La tâche '$taskName' existe déjà" -ForegroundColor Yellow
    $response = Read-Host "Voulez-vous la supprimer et la recréer? (O/N)"
    if ($response -eq "O" -or $response -eq "o") {
        Write-Host "Suppression de la tâche existante..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-Host "[SUCCÈS] Tâche supprimée" -ForegroundColor Green
    } else {
        Write-Host "Annulation..." -ForegroundColor Yellow
        Read-Host "Appuyez sur Entrée pour quitter"
        exit 0
    }
}

# Obtenir le chemin de Node.js
$nodePath = (Get-Command node).Source
if (-not $nodePath) {
    Write-Host "[ERREUR] Node.js n'est pas trouvé dans le PATH" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

Write-Host "[INFO] Chemin de l'application: $appPath" -ForegroundColor Gray
Write-Host "[INFO] Chemin de Node.js: $nodePath" -ForegroundColor Gray
Write-Host ""

# Utiliser le script start-app-auto.bat pour le démarrage automatique
$startScriptPath = Join-Path $appPath "scripts\start-app-auto.bat"
if (-not (Test-Path $startScriptPath)) {
    Write-Host "[ERREUR] Le script start-app-auto.bat n'existe pas" -ForegroundColor Red
    Write-Host "Le fichier devrait être à: $startScriptPath" -ForegroundColor Yellow
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

# Créer l'action (commande à exécuter)
$action = New-ScheduledTaskAction -Execute $startScriptPath -WorkingDirectory $appPath

# Créer le déclencheur (au démarrage du système)
$trigger = New-ScheduledTaskTrigger -AtStartup

# Créer les paramètres de la tâche
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

# Créer le principal (utilisateur système)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest

# Créer la tâche
try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Démarrage automatique de l'application Sirof" | Out-Null
    Write-Host "[SUCCÈS] Tâche planifiée créée avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "La tâche '$taskName' démarrera automatiquement au démarrage du PC" -ForegroundColor Cyan
    Write-Host ""
    
    # Proposer de démarrer maintenant
    $startNow = Read-Host "Voulez-vous démarrer l'application maintenant? (O/N)"
    if ($startNow -eq "O" -or $startNow -eq "o") {
        Write-Host "Démarrage de l'application..." -ForegroundColor Yellow
        Start-Process -FilePath $startScriptPath -WorkingDirectory $appPath
        Write-Host "[SUCCÈS] Application démarrée" -ForegroundColor Green
        Write-Host "L'application est accessible à: http://localhost:3000" -ForegroundColor Cyan
    }
} catch {
    Write-Host "[ERREUR] Impossible de créer la tâche planifiée: $_" -ForegroundColor Red
    Write-Host "Détails de l'erreur: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Configuration terminée avec succès!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour désactiver le démarrage automatique:" -ForegroundColor Yellow
Write-Host "1. Ouvrez le Planificateur de tâches (Task Scheduler)" -ForegroundColor White
Write-Host "2. Recherchez la tâche '$taskName'" -ForegroundColor White
Write-Host "3. Clic droit -> Désactiver ou Supprimer" -ForegroundColor White
Write-Host ""
Read-Host "Appuyez sur Entrée pour quitter"

