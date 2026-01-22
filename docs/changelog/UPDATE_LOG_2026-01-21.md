# Log Perubahan Sistem - 21 Januari 2026

Dokumen ini merangkum perubahan yang dilakukan pada modul Master Admin dan pengaturan hak akses role (Mekanik).

## 1. Modul Master Admin

### Frontend (`tailadmin-vuejs-1.0.0/src/views/Master/AdminMaster.vue`)
- **Penambahan Kolom Data**:
  - Menambahkan kolom **Email**, **No Telepon**, dan **Jabatan** pada tabel daftar admin.
  - Menambahkan input field untuk ketiga data tersebut pada formulir Tambah/Edit Admin.
- **Penyusunan Ulang Layout Toolbar**:
  - Memindahkan *Search Bar* ke sebelah kiri.
  - Mengelompokkan tombol aksi (*Tambah Admin*, *Import*, dll) ke sebelah kanan.
  - Memindahkan informasi *Total Data* ke baris bawah toolbar.
- **Perbaikan Form Input**:
  - Mengubah field **NIK** menjadi *editable* (sebelumnya *readonly*).
  - Menambahkan penanganan pesan error dari backend agar notifikasi ("Data NIK sudah ada...") muncul dengan benar di *Toast*.

### Backend (`node_backend/routes/admin.js`)
- **Sinkronisasi Database**:
  - Memperbarui query `SELECT`, `INSERT`, dan `UPDATE` untuk menyertakan kolom `email`, `nomor_telp`, dan `jabatan`.
- **Validasi Data**:
  - Menambahkan validasi sisi server untuk mencegah duplikasi **NIK**.
  - Validasi bersifat *case-insensitive* (misal: "clc003" dianggap sama dengan "CLC003").
  - Menetapkan pesan error khusus: *"Data NIK sudah ada, tolong cek kembali"*.

## 2. Hak Akses & Role (Mekanik)

### Navigasi Sidebar (`tailadmin-vuejs-1.0.0/src/config/navigation.js`)
- **Filter Menu Khusus Mekanik**:
  - **Master**: Menu disembunyikan sepenuhnya.
  - **Transaksi**: Hanya menampilkan sub-menu **Repair**. Menu *Sales Cost* dan *Subcontractor* disembunyikan.

### Proteksi Rute (`tailadmin-vuejs-1.0.0/src/router/index.ts`)
- **Route Guards**:
  - Menambahkan properti `meta.roles` pada rute-rute transaksi.
  - **Repair**: Dapat diakses oleh `['admin', 'user', 'mekanik']`.
  - **Sales Cost & Subcontractor**: Hanya dapat diakses oleh `['admin', 'user']`.
- **Redirect Otomatis**:
  - Jika user dengan role **Mekanik** mencoba mengakses halaman terlarang (via URL langsung), sistem akan otomatis mengalihkan ke halaman `/repair`.
