$ErrorActionPreference = "Stop"

# Configuración
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$rootDir = Resolve-Path "$PSScriptRoot\.."
$backupDir = Join-Path $rootDir "_backups"
$stagingDir = Join-Path $backupDir "temp_staging_$timestamp"
$backupFile = Join-Path $backupDir "ProyectoChatbot_Backup_$timestamp.zip"

Write-Host "Iniciando backup optimizado..."
Write-Host "Directorio raiz: $rootDir"

# Crear directorio de backups si no existe
if (-not (Test-Path -Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

# 1. Copiar archivos a staging excluyendo carpetas pesadas usando Robocopy
# Robocopy es nativo de Windows y muy eficiente para excluir directorios recursivamente
Write-Host "Copiando archivos..."
$robocopyParams = @(
    $rootDir,
    $stagingDir,
    "/E",           # Copiar subdirectorios, incluyendo vacíos
    "/XD",          # Excluir directorios (nombres exactos)
    "node_modules",
    ".git",
    "_backups",
    "dist",
    "build",
    ".vs",
    ".vscode",
    "__pycache__",
    "/XF",          # Excluir archivos específicos
    "*.lock",       # Opcional: a veces no queremos los lockfiles, pero suelen ser útiles. Lo dejo comentado o quito si quieres.
    ".DS_Store",
    "Thumbs.db"
)

# Robocopy devuelve códigos de salida no estándar (0-7 son éxito), así que ignoramos errores menores
try {
    & robocopy @robocopyParams | Out-Null
}
catch {
    # Robocopy a veces lanza error en powershell si el exit code > 0, aunque sea éxito parcial.
    # Lo manejamos silenciosamente si existe el directorio destino.
}

if (-not (Test-Path -Path $stagingDir)) {
    Write-Error "Error: No se pudo crear el directorio temporal de copia."
    exit 1
}

# 2. Comprimir el directorio staging
Write-Host "Comprimiendo archivos (esto será rápido)..."
try {
    Compress-Archive -Path "$stagingDir\*" -DestinationPath $backupFile -CompressionLevel Optimal
    Write-Host "✅ Backup guardado en: $backupFile" -ForegroundColor Green
}
catch {
    Write-Error "Error al comprimir: $_"
}
finally {
    # 3. Limpiar directorio temporal
    Write-Host "Limpiando archivos temporales..."
    Remove-Item -Path $stagingDir -Recurse -Force -ErrorAction SilentlyContinue
}
