# Alternative Installation Methods (SSL Issue Workaround)

You're getting SSL/TLS errors. Here are alternative methods:

## Method 1: Manual Download from Browser

Since curl is having SSL issues, download directly in your browser:

1. **Open this link in your browser:**
   https://github.com/solana-labs/solana/releases/download/v1.18.26/solana-install-init-x86_64-pc-windows-msvc.exe

2. **Save it as:** `C:\solana-installer.exe`

3. **Run it:**
   ```cmd
   C:\solana-installer.exe
   ```

4. **After installation, restart CMD and verify:**
   ```cmd
   solana --version
   ```

## Method 2: Use PowerShell Instead of CMD

PowerShell handles SSL better. Open PowerShell and run:

```powershell
# Download with PowerShell (better SSL handling)
Invoke-WebRequest -Uri "https://github.com/solana-labs/solana/releases/download/v1.18.26/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile "C:\solana-installer.exe"

# Run installer
C:\solana-installer.exe
```

## Method 3: Use WSL (Windows Subsystem for Linux)

If you have WSL installed:

```bash
# In WSL terminal:
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
export PATH="/home/$(whoami)/.local/share/solana/install/active_release/bin:$PATH"

# Navigate to your Windows directory
cd /mnt/c/Users/aloys/Desktop/Mail-Fi/pyusd-manifesto

# Continue with deployment
```

## Method 4: Use Git Bash (if you have Git installed)

Git Bash has better SSL support:

```bash
curl -o /c/solana-installer.exe https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe
/c/solana-installer.exe
```

## Method 5: Fix curl SSL (Advanced)

Try curl with SSL verification disabled (not recommended for production):

```cmd
curl -k -o C:\solana-installer.exe https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe
C:\solana-installer.exe
```

## Method 6: Use Chocolatey (if installed)

```cmd
choco install solana
```

## After Installing Solana

Once Solana is installed (by any method above), run:

```cmd
cd C:\Users\aloys\Desktop\Mail-Fi\pyusd-manifesto
deploy-contracts.bat
```

This will handle the rest automatically!

## Quick Test

If Solana installed successfully, this should work:

```cmd
solana --version
```

You should see output like: `solana-cli 1.18.26`

## Still Having Issues?

### Option A: Use Solana Playground (Online)

No installation needed! Deploy from your browser:

1. Go to https://beta.solpg.io
2. Click "Create Project" > "Anchor"
3. Replace the code with your contracts from `programs/pyusd-manifesto-contracts/src/`
4. Click "Build" then "Deploy"
5. Copy the Program ID back to your project

### Option B: Use a Different Network

Try connecting through a VPN or different network that doesn't block SSL.

## Recommended: Try Method 1 (Manual Browser Download)

This is the easiest and most reliable:
1. Click this link in your browser: https://github.com/solana-labs/solana/releases/download/v1.18.26/solana-install-init-x86_64-pc-windows-msvc.exe
2. Save to C:\solana-installer.exe
3. Double-click to run
4. Then run: `deploy-contracts.bat`

That's it! 🚀
