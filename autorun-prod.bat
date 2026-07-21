@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND=%ROOT%node_backend"
set "FRONTEND=%ROOT%tailadmin-vuejs-1.0.0"
set "PM2=C:\Users\Admin\AppData\Roaming\npm\pm2.cmd"

echo ============================================
echo   Transport v1.04 ^| Production Autorun
echo ============================================
echo.

REM ── 1. Build frontend (production) ───────────────────────────────────────
echo [1/3] Build frontend (production)...
cd /d "%FRONTEND%"
call npm run build-only -- --mode local-prod
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Frontend build gagal. Periksa output di atas.
    pause
    exit /b 1
)
echo.

REM ── 2. Sinkronisasi database ──────────────────────────────────────────────
echo [2/3] Sinkronisasi database...
cd /d "%BACKEND%"
node scripts/fix-missing-tables.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Database sync gagal. Periksa output di atas.
    pause
    exit /b 1
)
echo.

REM ── 3. Start atau Restart service via PM2 production ecosystem ────────────
echo [3/3] Menjalankan service via PM2 (production)...
cd /d "%ROOT%"
"%PM2%" startOrRestart ecosystem.prod.config.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: PM2 gagal start. Coba jalankan manual:
    echo   pm2 start ecosystem.prod.config.js
    pause
    exit /b 1
)

echo.

REM ── 4. Simpan PM2 process list ────────────────────────────────────────────
"%PM2%" save

echo.
echo ============================================
echo   Production berhasil dijalankan!
echo ============================================
echo.
echo   App      : http://localhost:3000
echo   Mode     : Production (serving dist/)
echo.
echo   Perintah berguna:
echo     pm2 status
echo     pm2 logs transport-backend-prod
echo     pm2 stop transport-backend-prod
echo     pm2 restart transport-backend-prod
echo.

"%PM2%" status

endlocal
pause
