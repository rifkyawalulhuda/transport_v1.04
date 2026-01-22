Berdasarkan pemeriksaan saya terhadap file `node_backend/routes/salesCost.js`, saya menemukan bahwa:

1.  **Acuan Tanggal**: Filter **SUDAH BENAR** menggunakan kolom `delivery_order` (baris 85 & 90).
2.  **Penyebab Perbedaan Data**: Ada dua kemungkinan penyebab jumlah transaksi berbeda dengan chart `MonthlyTarget.vue`:
    *   **Masalah JOIN (Paling Mungkin)**: Halaman Sales Cost menggunakan `INNER JOIN customer`. Artinya, jika ada data transaksi yang `id_customer`-nya tidak valid atau kosong, data tersebut **tidak akan muncul** di daftar, tetapi tetap terhitung di chart dashboard (karena dashboard menghitung langsung dari tabel `sales_cost` tanpa join).
    *   **Masalah Jam (Time Boundary)**: Filter tanggal akhir saat ini (`<= endDate`) mungkin melewatkan transaksi yang terjadi di jam-jam akhir pada tanggal tersebut (jika kolom menggunakan format waktu).

**Rencana Perbaikan:**
1.  **Mengubah Query Daftar (`/`)**: Mengganti `INNER JOIN customer` menjadi `LEFT JOIN customer` agar semua transaksi tetap muncul meskipun data customernya bermasalah.
2.  **Mengubah Query Export (`/export`)**: Menyamakan logika dengan daftar, yaitu mengubah semua `INNER JOIN` menjadi `LEFT JOIN` (saat ini export menggunakan INNER JOIN untuk semua tabel relasi, yang sangat berisiko menyembunyikan data).
3.  **Memperbaiki Filter Tanggal**: Menambahkan waktu `23:59:59` pada filter `end_date` untuk memastikan seluruh transaksi pada hari terakhir tetap terambil.

Apakah Anda setuju dengan perbaikan ini?