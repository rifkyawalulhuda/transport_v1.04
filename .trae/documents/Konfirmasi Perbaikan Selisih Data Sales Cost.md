Saya telah menemukan penyebab **pasti** dari selisih Rp 1.619.000 tersebut.

**Penyebabnya:**
Terdapat **3 transaksi** pada bulan Januari 2026 yang memiliki data relasi (Customer/Area/Driver/Truck) yang tidak lengkap atau sudah terhapus di tabel masternya.

* ID Transaksi: `40445`, `40454`, `40457`.

* Total Gross Profit dari ketiga transaksi ini adalah tepat **Rp 1.619.000**.

**Mengapa terjadi perbedaan?**

* **Monthly Target (Dashboard)**: Mengambil data langsung dari tabel `sales_cost` tanpa menggabungkan (JOIN) dengan tabel lain, sehingga data ini **tetap terhitung**.

* **Total Sales Cost (Export Lama)**: Menggunakan `INNER JOIN`. Karena data relasinya (misal Customer) hilang, maka transaksi ini **tidak ikut terambil** dalam export.

**Solusi (Sudah Diterapkan):**
Perubahan kode yang saya lakukan sebelumnya (mengubah `INNER JOIN` menjadi `LEFT JOIN` pada file `salesCost.js`) sudah benar dan akan mengatasi masalah ini. Dengan `LEFT JOIN`, transaksi tersebut akan tetap muncul di export meskipun nama customer/driver-nya kosong/null.

**Tindakan Anda:**
Karena saya telah mengubah kode di sisi server (`node_backend`), mohon lakukan langkah berikut agar perubahannya aktif:

1. **Restart server backend** (Node.js) Anda.
2. Lakukan **Export Excel ulang** di halaman Sales Cost.
3. Cek kembali totalnya, seharusnya sekarang sudah sama dengan Dashboard (Rp 494.698.660).

