@echo off
echo ========================================
echo PYUSD Manifesto - Install and Deploy
echo ========================================
echo.

REM Step 1: Download Solana installer
echo Step 1: Downloading Solana installer...
curl -o C:\solana-installer.exe https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe
if %errorlevel% neq 0 (
    echo Error downloading Solana installer
    pause
    exit /b 1
)

echo.
echo Solana installer downloaded to C:\solana-installer.exe
echo.
echo Please run: C:\solana-installer.exe
echo.
echo After installation, close this window and run deploy-contracts.bat
echo.
pause
