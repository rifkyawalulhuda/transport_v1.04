@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0auto-restore.ps1" %*
exit /b %ERRORLEVEL%
