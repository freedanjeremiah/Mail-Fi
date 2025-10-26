@echo off
echo ========================================
echo PYUSD Manifesto - Deploy Contracts
echo ========================================
echo.

REM Check if Solana is installed
where solana >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Solana not found!
    echo Please run install-and-deploy.bat first
    pause
    exit /b 1
)

echo Solana version:
solana --version
echo.

REM Check if Anchor is installed
where anchor >nul 2>&1
if %errorlevel% neq 0 (
    echo Anchor not found. Installing Anchor CLI...
    echo This will take 5-10 minutes. Please wait...
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    call refreshenv
    avm install 0.32.1
    avm use 0.32.1
)

echo Anchor version:
anchor --version
echo.

REM Configure Solana
echo Configuring Solana for devnet...
solana config set --url https://api.devnet.solana.com

REM Check if wallet exists
if not exist "%USERPROFILE%\.config\solana\id.json" (
    echo Creating new Solana wallet...
    echo IMPORTANT: Save the seed phrase that appears!
    solana-keygen new --outfile "%USERPROFILE%\.config\solana\id.json"
)

REM Get wallet address
echo.
echo Your wallet address:
solana address
echo.

REM Check balance
echo Checking SOL balance...
solana balance
echo.

REM Request airdrop
echo Requesting SOL airdrop...
solana airdrop 2
timeout /t 3 >nul
solana airdrop 2
timeout /t 3 >nul
solana airdrop 2
echo.

echo Current balance:
solana balance
echo.

REM Build contracts
echo ========================================
echo Building contracts...
echo ========================================
anchor build

if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Build successful!
echo.

REM Deploy contracts
echo ========================================
echo Deploying to Solana Devnet...
echo ========================================
anchor deploy

if %errorlevel% neq 0 (
    echo Deployment failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.

REM Get program ID
echo Program ID:
solana address -k target\deploy\pyusd_manifesto_contracts-keypair.json
echo.

echo Next steps:
echo 1. Note the Program ID above
echo 2. If it's different from DzsJvHHEdVzx38CqrPxR2KauHBJ7BwSP3FjKhdhGhT1f
echo    Update these files:
echo    - Anchor.toml (line 9)
echo    - lib\contracts\program-id.ts
echo    - lib\contracts\anchor-setup.ts
echo.
echo 3. Test your deployment:
echo    npm run dev
echo.
pause
