@echo off
echo ========================================
echo Installing Solana CLI
echo ========================================
echo.

REM Try downloading the installer with version specified
echo Attempting to download Solana installer...

REM Method 1: Try with curl
curl -k -o C:\solana-installer.exe https://release.solana.com/v1.18.26/solana-install-init-x86_64-pc-windows-msvc.exe

if %errorlevel% neq 0 (
    echo.
    echo Download failed. Please try one of these methods:
    echo.
    echo Method 1: Download manually in your browser
    echo Visit: https://github.com/solana-labs/solana/releases/download/v1.18.26/solana-install-init-x86_64-pc-windows-msvc.exe
    echo Save to: C:\solana-installer.exe
    echo.
    echo Method 2: Use PowerShell
    echo Run: Invoke-WebRequest -Uri "https://github.com/solana-labs/solana/releases/download/v1.18.26/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile "C:\solana-installer.exe"
    echo.
    pause
    exit /b 1
)

echo.
echo Download successful! Running installer with version...
echo.

REM Run installer with version specified
C:\solana-installer.exe v1.18.26

if %errorlevel% neq 0 (
    echo.
    echo Installation failed or was cancelled.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo IMPORTANT: Close this window and open a NEW command prompt
echo Then run: solana --version
echo.
echo After verifying Solana works, run: deploy-contracts.bat
echo.
pause
