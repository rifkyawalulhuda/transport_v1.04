@echo off
setlocal

echo Menghapus rule firewall TCP 8080...
netsh advfirewall firewall delete rule name="TransportV104 HTTP 8080"

if %ERRORLEVEL% neq 0 (
  echo Rule tidak ditemukan atau gagal dihapus.
  exit /b %ERRORLEVEL%
)

echo Selesai. Rule firewall 8080 dihapus.
exit /b 0
