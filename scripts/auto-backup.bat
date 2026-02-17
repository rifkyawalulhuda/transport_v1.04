@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0auto-backup.ps1" %*
exit /b %ERRORLEVEL%
