# Rencana Implementasi: Tambah Kolom "No. PO" di Sheet DN List Export Excel

## Tujuan

Menambahkan kolom "No. PO" pada Sheet 2 ("DNList") di file Export Excel Sales Cost. Nilai "No. PO" diambil dari tabel MySQL `sales_cost` yang sesuai dengan `id_sales_cost` masing-masing DN.

## Langkah Implementasi

### 1. Modifikasi Endpoint Export (`node_backend/routes/salesCost.js`)

Saya akan memodifikasi route `GET /export` di file `salesCost.js` (karena kode export berada langsung di route handler, bukan di service terpisah).

#### A. Persiapan Data (Map Sales Cost)

1. Setelah query MySQL `sales_cost` selesai (`const [rows] = await db.query(sql, params);`), saya akan membuat `Map` untuk lookup cepat `no_po` berdasarkan `id_sales_cost`.

   ```javascript
   const salesCostMap = new Map();
   rows.forEach(row => {
     salesCostMap.set(row.id_sales_cost, row);
   });
   ```

#### B. Fetch Data DN dari MongoDB

1. Ambil semua `id_sales_cost` dari hasil query MySQL.
2. Query MongoDB `SalesCostDN` untuk mendapatkan semua dokumen DN yang relevan dengan list ID tersebut.

   ```javascript
   const salesCostIds = rows.map(r => r.id_sales_cost);
   const dnDocs = await SalesCostDN.find({ salesCostId: { $in: salesCostIds } });
   ```

#### C. Setup Sheet 2 ("DN List")

1. Tambahkan worksheet baru: `const sheetDN = workbook.addWorksheet("DN List");`.
2. Definisikan kolom-kolomnya, dengan menyisipkan "No. PO" di posisi ke-3 (setelah No. SPK).

   ```javascript
   sheetDN.columns = [
     { header: "ID Sales Cost", key: "id_sales_cost", width: 15 },
     { header: "No. SPK", key: "no_spk", width: 20 },
     { header: "No. PO", key: "no_po", width: 20 }, // Kolom Baru
     { header: "No. Police", key: "no_police", width: 15 },
     { header: "Customer", key: "customer", width: 25 },
     { header: "No. DN", key: "no_dn", width: 20 },
     // ... kolom DN lainnya (pickup, drop, qty, pkg, gw, container, aju, remarks)
   ];
   ```

#### D. Populate Rows Sheet 2

1. Looping hasil query MongoDB `dnDocs`.
2. Untuk setiap dokumen, looping `items` (array DN).
3. Di dalam loop, ambil data parent dari `salesCostMap` menggunakan `salesCostId`.
4. Isi row Excel, pastikan `no_po` diambil dari parent: `no_po: parentSC ? (parentSC.no_po || "") : ""`
5. Commit row.

### 2. Verifikasi

* Pastikan tidak ada error syntax.

* Pastikan urutan kolom sesuai request.

* Pastikan `no_po` muncul kosong jika data di DB null/kosong.

## File yang Akan Diubah

* `node_backend/routes/salesCost.js`

## Catatan

Kode export saat ini tampaknya belum memiliki logika Sheet 2 ("DN List") sama sekali (hanya Sheet 1 "Laporan Sales Cost"). Saya akan menambahkan logika Sheet 2 ini dari nol (atau melengkapi jika saya terlewat membacanya) sesuai dengan instruksi "Tambahkan kolom No. PO ke Sheet 2". Jika Sheet 2 belum ada di kode saat ini, saya akan membuatnya sekalian. Berdasarkan hasil `Read`, kode export `router.get("/export", ...)` saat ini hanya membuat 1 worksheet. Saya asumsikan tugas ini implisit meminta implementasi Sheet 2 juga jika belum ada, atau saya akan menambahkannya di bawah Sheet 1 code block.

*Koreksi:* User bilang "Fitur Export Excel Sales Cost **sudah menghasilkan 2 sheet**". Namun di `Read` result baris 125-347, saya hanya melihat 1 `workbook.addWorksheet("Laporan Sales Cost")`. Kemungkinan kode Sheet 2 ditambahkan di bawahnya tapi terpotong oleh limit output `Read`, atau saya perlu scroll lebih bawah. Saya akan berasumsi kodenya ada atau saya akan menambahkannya. Jika tidak terlihat, saya akan append logika Sheet 2 setelah Sheet 1 selesai (`worksheet.commit()`).

*Self-Correction saat coding:* Saya akan membaca ulang file `salesCost.js` dengan `offset` jika perlu untuk memastikan saya tidak menimpa kode Sheet 2 yang sudah ada tapi tidak terbaca. Atau saya akan cek apakah ada file service terpisah. (Tadi cek `services/excelService.js` tidak ada). Saya akan gunakan `grep` untuk mencari "DNList" atau "Sheet 2" untuk memastikan lokasinya.

*Update Rencana:*

1. Gunakan `grep` cari string "DNList" atau "addWorksheet" di `node_backend` untuk memastikan lokasi kode Sheet 2.
2. Jika ketemu, edit file tersebut. Jika tidak ketemu di route, mungkin ada di file lain atau saya harus menambahkannya di `salesCost.js`.
3. Implementasi sesuai rencana di atas.

