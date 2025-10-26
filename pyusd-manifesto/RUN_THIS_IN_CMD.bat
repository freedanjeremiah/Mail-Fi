@echo off
echo Setting environment variables...
set HOME=C:\Users\aloys
set PATH=%PATH%;C:\Users\aloys\solana-release\bin

echo.
echo Running: cargo build-sbf
echo.

cd C:\Users\aloys\Desktop\Mail-Fi\pyusd-manifesto\programs\pyusd-manifesto-contracts
cargo build-sbf

if %errorlevel% neq 0 (
    echo Build failed. Press any key to exit.
    pause
    exit /b 1
)

echo.
echo Build successful! Now deploying...
echo.

cd ..\..
solana program deploy programs\pyusd-manifesto-contracts\target\deploy\pyusd_manifesto_contracts.so

echo.
echo DONE! Note the Program ID above.
pause
