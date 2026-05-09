# PropNexus C-Engine Build Script (Optimized for 64-bit)
$ErrorActionPreference = "Stop"

$CoreDir = Join-Path $PSScriptRoot "..\core"
$InternalGcc = Join-Path $PSScriptRoot "mingw64\mingw64\bin\gcc.exe"

# Use internal 64-bit GCC if available to avoid Win32/64 bitness mismatch
if (Test-Path $InternalGcc) {
    $GccPath = $InternalGcc
    Write-Host "Using Internal 64-bit GCC: $GccPath" -ForegroundColor Cyan
} else {
    $GccPath = "gcc"
    Write-Host "Using System Default GCC: $GccPath" -ForegroundColor Yellow
}

$SourceFiles = @("ds_hash_sort.c", "ds_spatial_heap.c")
$OutputFile = "libds_engine_avl.dll"

Write-Host "Compiling PropNexus AVL Search Engine..." -ForegroundColor Green

Push-Location $CoreDir
try {
    # Compile with optimization and shared library flags
    & $GccPath -O3 -march=native -Wall -Wextra -std=c11 -fPIC -shared -o $OutputFile $SourceFiles
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully built $OutputFile" -ForegroundColor Green
    } else {
        Write-Error "Compilation Failed with exit code $LASTEXITCODE"
    }
}
finally {
    Pop-Location
}

Write-Host "`n--- Build Complete ---" -ForegroundColor Green
