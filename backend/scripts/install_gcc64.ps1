$ErrorActionPreference = "Stop"

$GccZipUrl = "https://github.com/brechtsanders/winlibs_mingw/releases/download/13.2.0-16.0.6-11.0.1-msvcrt-r1/winlibs-x86_64-posix-seh-gcc-13.2.0-mingw-w64msvcrt-11.0.1-r1.zip"
$ZipFile = "$PSScriptRoot\gcc64.zip"
$ExtractDir = "$PSScriptRoot\mingw64"
$GccPath = "$ExtractDir\mingw64\bin\gcc.exe"

if (-Not (Test-Path $GccPath)) {
    Write-Host "Downloading 64-bit GCC compiler (this may take a few minutes)..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $GccZipUrl -OutFile $ZipFile
    
    Write-Host "Extracting compiler..." -ForegroundColor Cyan
    Expand-Archive -Path $ZipFile -DestinationPath $ExtractDir -Force
    
    Write-Host "Cleaning up..." -ForegroundColor Cyan
    Remove-Item $ZipFile
} else {
    Write-Host "64-bit GCC is already downloaded." -ForegroundColor Green
}

Write-Host "Compiling C Engine using 64-bit GCC..." -ForegroundColor Cyan
$CoreDir = "$PSScriptRoot\..\core"
$DllPath = "$CoreDir\libds_engine.dll"

# Execute the 64-bit compiler
& $GccPath -O3 -march=native -Wall -Wextra -std=c11 -fPIC -shared -o $DllPath "$CoreDir\ds_hash_sort.c" "$CoreDir\ds_spatial_heap.c"

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS! 64-bit DLL generated successfully!" -ForegroundColor Green
    Write-Host "You can now restart your Uvicorn server and the C-Engine will load perfectly." -ForegroundColor Yellow
} else {
    Write-Host "Compilation failed." -ForegroundColor Red
}
