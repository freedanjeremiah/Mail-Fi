# Quick Fix - Install Solana NOW

## The installer is in your Downloads folder!

Run these commands in CMD (as Administrator):

```cmd
REM Navigate to Downloads where the installer is
cd C:\Users\aloys\Downloads

REM Run the installer with version
solana-install-init-x86_64-pc-windows-msvc.exe v1.18.26

REM After it completes, close CMD and open a NEW CMD window as Admin
REM Then navigate back to your project:
cd C:\Users\aloys\Desktop\Mail-Fi\pyusd-manifesto

REM Verify Solana is installed
solana --version

REM Deploy everything!
deploy-contracts.bat
```

## OR - Use Full Path:

From any directory:

```cmd
C:\Users\aloys\Downloads\solana-install-init-x86_64-pc-windows-msvc.exe v1.18.26
```

## OR - Skip Admin Requirement:

Solana is already partially installed! Just add it to your PATH manually:

```cmd
REM Add Solana to PATH for current session
set PATH=%PATH%;C:\Users\aloys\.local\share\solana\install\releases\1.18.26\bin

REM Verify it works
solana --version

REM If it works, proceed with deployment
cd C:\Users\aloys\Desktop\Mail-Fi\pyusd-manifesto
deploy-contracts.bat
```

## Permanent PATH Fix (No Admin Needed):

Add this to your user PATH permanently:
```
C:\Users\aloys\.local\share\solana\install\releases\1.18.26\bin
```

**How to add to PATH:**
1. Press Windows key
2. Type "environment variables"
3. Click "Edit environment variables for your account"
4. Select "Path" and click "Edit"
5. Click "New"
6. Paste: `C:\Users\aloys\.local\share\solana\install\releases\1.18.26\bin`
7. Click OK
8. Close and reopen CMD

Then just run:
```cmd
solana --version
```

Should work!
