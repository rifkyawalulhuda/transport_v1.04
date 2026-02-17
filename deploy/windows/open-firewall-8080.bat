@echo off
setlocal

echo Menambahkan rule firewall untuk TCP 8080...
netsh advfirewall firewall add rule name="TransportV104 HTTP 8080" dir=in action=allow protocol=TCP localport=8080

if %ERRORLEVEL% neq 0 (
  echo Gagal menambahkan firewall rule. Jalankan sebagai Administrator.
  exit /b %ERRORLEVEL%
)

echo Selesai. Port 8080 sudah dibuka.
exit /b 0
