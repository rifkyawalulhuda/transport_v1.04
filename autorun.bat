@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND=%ROOT%node_backend"
set "FRONTEND=%ROOT%tailadmin-vuejs-1.0.0"
set "PM2=%APPDATA%\npm\pm2.cmd"
set "VITE=%FRONTEND%\node_modules\vite\bin\vite.js"

echo ============================================
echo   Transport v1.04 ^| Development Autorun
echo ============================================
echo.

REM ── 1. Jalankan migration production script ──────────────────────────────
echo [1/3] Menjalankan migration database...
cd /d "%BACKEND%"
node migrate-production.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Migration gagal. Periksa output di atas.
    pause
    exit /b 1
)
echo.

REM ── 2. Start / Restart backend via PM2 ───────────────────────────────────
echo [2/3] Menjalankan backend via PM2...
"%PM2%" describe transport-backend >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   Restart: transport-backend
    "%PM2%" restart transport-backend
) else (
    echo   Start baru: transport-backend
    "%PM2%" start "%BACKEND%\server.js" --name transport-backend --cwd "%BACKEND%"
)
echo.

REM ── 3. Start / Restart frontend dev server via PM2 ───────────────────────
echo [3/3] Menjalankan frontend dev server via PM2...
"%PM2%" describe transport-frontend >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   Restart: transport-frontend
    "%PM2%" restart transport-frontend
) else (
    echo   Start baru: transport-frontend
    "%PM2%" start "%VITE%" --name transport-frontend --cwd "%FRONTEND%"
)
echo.

REM ── 4. Simpan PM2 process list ────────────────────────────────────────────
echo Menyimpan PM2 process list...
"%PM2%" save
echo.

echo ============================================
echo   Service berhasil dijalankan!
echo ============================================
echo.
echo   Backend  : http://localhost:3000
echo   Frontend : http://localhost:5173
echo.
echo   Perintah berguna:
echo     pm2 status
echo     pm2 logs transport-backend
echo     pm2 logs transport-frontend
echo     pm2 stop all
echo     pm2 restart all
echo.

"%PM2%" status

endlocal
pause
