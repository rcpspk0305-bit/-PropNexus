# PropertyScan Pro: Automated Build Script for C Core

Write-Host "--- Starting C-Core Build Process ---" -ForegroundColor Cyan

$CoreDir = "$PSScriptRoot\..\core"
$LibName = "libds_engine.dll"

# Check for GCC
if (!(Get-Command gcc -ErrorAction SilentlyContinue)) {
    Write-Error "GCC not found. Please install MinGW-w64 (64-bit) or another GCC compiler."
    exit 1
}

Push-Location $CoreDir

Write-Host "Compiling Optimized Shared Library..." -ForegroundColor Yellow
# -O3: Maximum optimization
# -march=native: Tune for current CPU
# -shared: Create DLL
# -fPIC: Position Independent Code
gcc -O3 -march=native -Wall -Wextra -std=c11 -fPIC -shared -o $LibName ds_hash_sort.c ds_spatial_heap.c

if ($LASTEXITCODE -eq 0) {
    Write-Host "Success! $LibName created in core/" -ForegroundColor Green
} else {
    Write-Error "Compilation Failed."
}

Pop-Location
Write-Host "--- Build Complete ---" -ForegroundColor Cyan
