---
title: "Admin Guide" 
outline: deep
---

# Admin Guide <Badge type="tip" text="^0.3" />

## Pendahuluan
Panduan ini menjelaskan tugas admin dalam mengelola data, pengguna, dan konfigurasi sistem TMS.

## Peran & Hak Akses Admin
- Mengelola master data dan transaksi.
- Mengatur akun pengguna dan hak akses.
- Melakukan monitoring serta audit aktivitas.

## Manajemen Pengguna
### Tambah user
- Masuk ke menu admin pengguna.
- Isi data user baru dan simpan.

### Assign role
- Pilih role sesuai fungsi (admin atau user).
- Pastikan role konsisten dengan kebutuhan operasional.

## Pengelolaan Data Transaksi
- Verifikasi transaksi Sales Cost dan Subcontractor.
- Pastikan data yang diinput sesuai dokumen pendukung.

## Pengelolaan Subcontractor
- Update data subcontractor dan hubungan kerja.
- Pastikan status kontrak dan biaya selalu valid.

## Manajemen Event Kalender
- Tambah event untuk aktivitas operasional penting.
- Update event agar user melihat informasi terbaru.

## Monitoring & Audit
- Tinjau perubahan data melalui audit log.
- Pastikan setiap perubahan memiliki jejak yang jelas.

## Keamanan & Kontrol Akses
- Gunakan password kuat dan lakukan rotasi berkala.
- Batasi akses berdasarkan kebutuhan peran.

## Best Practices Admin
- Lakukan validasi data sebelum disimpan.
- Simpan dokumentasi perubahan penting.
- Koordinasikan perubahan besar dengan tim terkait.

## Pengembangan Lanjutan
- Evaluasi kebutuhan fitur baru berdasarkan feedback pengguna.
- Dokumentasikan perubahan skema data dan API.

## Troubleshooting Admin
- Gagal login: verifikasi kredensial dan status akun.
- Data tidak tersimpan: cek validasi input dan koneksi backend.
- User tidak bisa akses menu: periksa role dan izin.
- Grafik tidak tampil: pastikan API dashboard berjalan dan tidak error.
- Audit log kosong: cek layanan logging dan koneksi database.
