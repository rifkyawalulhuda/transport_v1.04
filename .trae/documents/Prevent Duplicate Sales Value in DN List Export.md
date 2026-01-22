# Rencana Implementasi: Mencegah Duplikasi Nilai "Sales" di Sheet DN List Export

## Tujuan

Memastikan bahwa kolom "Sales" di Sheet 2 ("DN List") hanya muncul **sekali** per grup `id_sales_cost`. Baris-baris berikutnya untuk ID yang sama harus memiliki nilai "Sales" yang kosong.

## Strategi Implementasi

1.  **Pengumpulan & Pengurutan Data (Backend)**:
    *   Saat ini `dnDocs` (dari MongoDB) di-iterate secara langsung.
    *   Untuk menjamin konsistensi "first row", kita perlu memastikan urutan iterasi.
    *   Kita akan mengumpulkan semua item DN ke dalam satu array flat terlebih dahulu, lalu mengurutkannya (Sort) berdasarkan:
        1.  `id_sales_cost` (Ascending)
        2.  `no_dn` (Ascending) - sebagai secondary sort key yang stabil.

2.  **Tracking Grup (Set)**:
    *   Gunakan `Set` bernama `salesWritten` untuk melacak `id_sales_cost` yang sudah ditulis nilai Sales-nya.
    *   Saat iterasi penulisan row ke Excel:
        *   Cek `salesWritten.has(currentId)`.
        *   Jika **belum ada** (`false`): Tulis nilai Sales, lalu `salesWritten.add(currentId)`.
        *   Jika **sudah ada** (`true`): Tulis string kosong `""` untuk kolom Sales.

## Langkah Modifikasi Kode (`node_backend/routes/salesCost.js`)

1.  **Flatten & Sort**:
    *   Alih-alih langsung `sheetDN.addRow` di dalam loop `dnDocs`, saya akan kumpulkan dulu ke array `allDnItems`.
    *   Setiap item di `allDnItems` akan menyimpan referensi ke `doc.salesCostId` dan data item DN itu sendiri.
    *   Sort `allDnItems` menggunakan `Array.prototype.sort`.

2.  **Write Rows with Logic**:
    *   Inisialisasi `const salesWritten = new Set();`.
    *   Loop `allDnItems`.
    *   Ambil data parent dari `salesCostMap`.
    *   Hitung `salesValue` (seperti logika sebelumnya).
    *   Terapkan logika `Set`:
        ```javascript
        let finalSales = "";
        if (!salesWritten.has(item.salesCostId)) {
            finalSales = parentSales;
            salesWritten.add(item.salesCostId);
        }
        ```
    *   Panggil `sheetDN.addRow` dengan `sales: finalSales`.
    *   Format cell number (hanya jika `finalSales` tidak kosong/number).

## File yang Diubah
*   `node_backend/routes/salesCost.js`

## Verifikasi
*   Export file Excel.
*   Cek Sheet "DN List".
*   Pastikan jika satu `id_sales_cost` memiliki 3 DN, hanya baris pertama yang ada angkanya di kolom Sales. 2 baris bawahnya kosong.
*   Pastikan urutan baris tetap rapi.

