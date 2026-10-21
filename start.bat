@echo off
title SpendSmart / Fenno Server
echo ====================================================
echo Starting SpendSmart (Fenno) Local Workspace
echo ====================================================
echo.

:: Automatically check and clean up any orphan process on port 3000
echo Checking port 3000...
powershell -NoProfile -Command "try { $conns = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue; if ($conns) { foreach ($c in $conns) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue }; Write-Host 'Cleared orphan process from port 3000.' } } catch {}"

echo.
echo Starting Fenno server on http://localhost:3000...
echo Waiting for server to initialize...
echo.

:: Launch browser in background once server is actually responding
start /b powershell -NoProfile -Command "for ($i = 0; $i -lt 30; $i++) { Start-Sleep -Seconds 1; try { $res = Invoke-WebRequest -Uri 'http://localhost:3000/api/db-status' -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue; if ($res.StatusCode -eq 200) { Start-Process 'http://localhost:3000'; break } } catch {} }"

:: Start dev server
npm run dev
