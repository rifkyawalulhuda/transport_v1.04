@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND=%ROOT%node_backend"
set "PM2=C:\Users\Admin\AppData\Roaming\npm\pm2.cmd"

echo ============================================
echo   Transport v1.04 ^| Development Autorun
echo ============================================
echo.

REM ── 1. Jalankan migration production script ──────────────────────────────
echo [1/2] Menjalankan migration database...
cd /d "%BACKEND%"
node migrate-production.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Migration gagal. Periksa output di atas.
    pause
    exit /b 1
)
echo.

REM ── 2. Start atau Restart semua service via PM2 ecosystem ─────────────────
echo [2/2] Menjalankan services via PM2...
cd /d "%ROOT%"
"%PM2%" startOrRestart ecosystem.config.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: PM2 gagal start. Coba jalankan manual:
    echo   pm2 start ecosystem.config.js
    pause
    exit /b 1
)

echo.

REM ── 3. Simpan PM2 process list ────────────────────────────────────────────
"%PM2%" save

echo.
echo ============================================
echo   Services berhasil dijalankan!
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
