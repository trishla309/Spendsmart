@echo off
title SpendSmart / Fenno Server
echo ====================================================
echo Starting SpendSmart (Fenno) Local Workspace
echo ====================================================
echo.

set PORT=3001
echo Starting Fenno server on http://localhost:3001...
echo Waiting for server to initialize...
echo.

:: Launch browser in background once server is actually responding
start /b powershell -NoProfile -Command "for ($i = 0; $i -lt 30; $i++) { Start-Sleep -Seconds 1; try { $res = Invoke-WebRequest -Uri 'http://localhost:3001/api/db-status' -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue; if ($res.StatusCode -eq 200) { Start-Process 'http://localhost:3001'; break } } catch {} }"

:: Start dev server
npm run dev
