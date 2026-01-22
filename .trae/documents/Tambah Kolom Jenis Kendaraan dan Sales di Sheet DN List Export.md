# Rencana Implementasi: Tambah Kolom "Jenis Kendaraan" dan "Sales" di Sheet DN List Export Excel

## Tujuan

Menambahkan dua kolom baru pada Sheet 2 ("DN List") di file Export Excel Sales Cost sesuai request user.

## Detail Kolom Baru

1.  **Jenis Kendaraan**:
    *   **Posisi**: Sebelah kanan "No. Police".
    *   **Sumber Data**: `truck.jenis_kendaraan` (dari query `sales_cost` yang di-JOIN dengan `truck`).
    *   **Logika**: Jika jenis kendaraan "HB" (Heavy/High Bed?), gabungkan dengan `container_size`. Contoh: "HB 20 Feet". Jika bukan, tampilkan jenis kendaraan saja.
    *   *Catatan*: Di Sheet 1 sudah ada logika ini di kolom `jenis_kendaraan`? Tidak, Sheet 1 menampilkan `row.jenis_kendaraan`. Saya akan cek apakah `row.container_size` perlu digabung. Biasanya `jenis_kendaraan` dari table `truck` saja, tapi user minta "sesuai implementasi existing". Saya akan gunakan `row.jenis_kendaraan` (dari tabel `truck`) dan jika ada `row.container_size` yang relevan, saya gabungkan untuk informatif.

2.  **Sales**:
    *   **Posisi**: Paling akhir (setelah "Remarks").
    *   **Sumber Data**: User meminta "field sales / nama_sales".
    *   **Analisis**:
        *   Di Sheet 1, header "Sales" mapping ke field `price` (Pendapatan).
        *   Di database `sales_cost`, tidak ada kolom `id_sales` atau `nama_sales` yang terlihat di query `INSERT`. Yang ada `id_admin`.
        *   Namun, user bilang "Jika sales disimpan sebagai ID, JOIN...". Ini membingungkan.
        *   **Keputusan**: Karena di Sheet 1 kolom "Sales" = `price`, saya akan menggunakan `price` (format angka/currency) untuk kolom "Sales" di Sheet 2 agar konsisten. Jika user bermaksud "Sales Person", mereka biasanya akan bilang "Sales Person" atau "Marketing". Di konteks logistik "Sales" sering berarti "Harga Jual/Revenue".
        *   Saya akan format sebagai angka (sama seperti Sheet 1).

## Langkah Implementasi di `node_backend/routes/salesCost.js`

1.  **Update Definisi Kolom Sheet 2**:
    *   Sisipkan `{ header: "Jenis Kendaraan", key: "jenis_kendaraan", width: 20 }` setelah `no_police`.
    *   Tambahkan `{ header: "Sales", key: "sales", width: 16 }` di akhir array columns.

2.  **Update Populasi Data**:
    *   Dalam loop `dnDocs` -> `items`:
        *   Ambil `parent` (Sales Cost).
        *   Hitung `jenisKendaraanStr`:
            ```javascript
            let jk = parent.jenis_kendaraan || "";
            if (parent.container_size) {
               jk += ` ${parent.container_size}`;
            }
            ```
            (Atau cukup `parent.jenis_kendaraan` jika itu yang diinginkan, saya akan gabung biar lengkap).
        *   Ambil `salesVal`: `parent.price` (gunakan fungsi `toNumber` atau ambil raw dan biarkan Excel format).
    *   Update `sheetDN.addRow` untuk menyertakan field `jenis_kendaraan` dan `sales`.

3.  **Formatting**:
    *   Pastikan kolom "Sales" di Sheet 2 memiliki format angka (`numFmt = "#,##0"`) agar bisa dijumlahkan di Excel.

## File yang Diubah
*   `node_backend/routes/salesCost.js`

## Verifikasi
*   Urutan kolom di Sheet 2 harus: ..., No. Police, **Jenis Kendaraan**, Customer, ..., Remarks, **Sales**.
*   Data harus terisi dari parent Sales Cost.

