@echo off
REM This script must be run as Administrator!

echo ========================================
echo PYUSD Manifesto - Final Deployment
echo ========================================
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: This script must be run as Administrator!
    echo Right-click this file and select "Run as administrator"
    pause
    exit /b 1
)

echo Running as Administrator - OK
echo.

REM Add Solana to PATH
set PATH=%PATH%;C:\Users\aloys\solana-release\bin

REM Verify Solana is available
solana --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Solana not found!
    echo Please ensure Solana is installed at C:\Users\aloys\solana-release\
    pause
    exit /b 1
)

echo Solana CLI:
solana --version
echo.

echo Wallet:
solana address
echo.

echo Balance:
solana balance
echo.

REM Check if we need more SOL
echo Getting additional SOL...
solana airdrop 2 2>nul
timeout /t 3 >nul
solana airdrop 2 2>nul
echo.

echo Current balance:
solana balance
echo.

REM Navigate to contract directory
cd programs\pyusd-manifesto-contracts

echo ========================================
echo Building Contracts...
echo ========================================
echo This may take 5-10 minutes...
echo.

cargo build-sbf

if %errorlevel% neq 0 (
    echo.
    echo Build failed! Trying cargo update...
    cargo update
    cargo build-sbf

    if %errorlevel% neq 0 (
        echo Build still failed!
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo Build Successful!
echo ========================================
echo.

REM Go back to root
cd ..\..

echo ========================================
echo Deploying to Solana Devnet...
echo ========================================
echo.

solana program deploy programs\pyusd-manifesto-contracts\target\deploy\pyusd_manifesto_contracts.so

if %errorlevel% neq 0 (
    echo.
    echo Deployment failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! Deployment Complete!
echo ========================================
echo.

echo Next steps:
echo 1. Note the Program ID shown above
echo 2. If different from DzsJvHHEdVzx38CqrPxR2KauHBJ7BwSP3FjKhdhGhT1f, update:
echo    - Anchor.toml (line 9)
echo    - lib\contracts\program-id.ts
echo    - lib\contracts\anchor-setup.ts
echo.
echo 3. Test your deployment:
echo    npm run dev
echo.

pause
