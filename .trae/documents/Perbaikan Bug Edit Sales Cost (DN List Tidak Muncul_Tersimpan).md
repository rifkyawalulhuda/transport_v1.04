# Rencana Perbaikan Bug Edit Sales Cost (DN List Not Saving)

## Analisis Masalah
Berdasarkan investigasi kode, ditemukan beberapa poin penting:
1.  **Backend (`routes/salesCost.js`):**
    *   Endpoint `PUT /:id/dn` mengharapkan body `{ items: [...] }`.
    *   Menggunakan `SalesCostDN.findOneAndUpdate({ salesCostId: Number(id) }, { items: items }, ...)` yang sudah benar (upsert).
2.  **Frontend Service (`salesCostService.js`):**
    *   `fetchDNList(id)` mengembalikan `handleJson(res)`. Backend mengembalikan `{ items: [...] }` atau `{ items: [] }`.
    *   `saveDNList(id, items)` mengirim `{ items }` sebagai body JSON. Ini sudah sesuai dengan ekspektasi backend.
3.  **Frontend View (`EditSalesCost.vue`):**
    *   `loadDetail` memanggil `salesCostService.fetchDNList`.
    *   Hasilnya digabung ke `initialData` sebagai `dnItems`.
    *   `handleSubmit` memisahkan `dnItems` dari payload MySQL, lalu memanggil `salesCostService.saveDNList(idParam, dnItems)`.
    *   **Masalah Potensial:** `initialData` di-pass ke `SalesCostForm`. Di dalam `SalesCostForm`, `dnList` diinisialisasi dari `initialData.dnItems`. Namun, saat submit, `SalesCostForm` meng-emit event `submit` dengan payload yang dibangun oleh `buildPayload`. `buildPayload` mengambil `dnList.value` dan memasukkannya ke `dnItems`.
    *   **Penyebab Bug:** Di `EditSalesCost.vue`, payload yang diterima dari event `@submit` sudah berisi `dnItems` terbaru dari form. Namun, kode di `handleSubmit` (EditSalesCost.vue) mencoba mengambil `dnItems` dari payload tersebut.
    *   Ada kemungkinan `dnItems` yang dikirim dari `SalesCostForm` tidak terbaca dengan benar atau ada masalah reaktivitas di `EditSalesCost.vue`.

Namun, setelah melihat kode `EditSalesCost.vue`:
```javascript
    const { dnItems, ...mysqlPayload } = payload
    await salesCostService.updateSalesCost(idParam, mysqlPayload)
    
    if (Array.isArray(dnItems)) {
      await salesCostService.saveDNList(idParam, dnItems)
    }
```
Logika ini terlihat benar. Masalahnya mungkin ada di **SalesCostForm.vue**.

Di `SalesCostForm.vue`:
```javascript
const buildPayload = () => ({
  // ...
  dnItems: dnList.value
})
```
Ini juga terlihat benar.

**Kemungkinan Penyebab Lain:**
1.  **Backend Response Shape:** `fetchDNList` di backend mengembalikan `{ items: [...] }`. Di `EditSalesCost.vue`:
    ```javascript
    const [detail, dnList] = await Promise.all([
      salesCostService.fetchSalesCostById(idParam),
      salesCostService.fetchDNList(idParam).catch(() => []) // Jika error return array kosong?
    ])
    initialData.value = { ...detail, dnItems: dnList }
    ```
    Jika `fetchDNList` sukses, dia mengembalikan object `{ items: [...] }`.
    Jadi `dnList` di sini adalah `{ items: [...] }`.
    Maka `initialData.value` menjadi `{ ..., dnItems: { items: [...] } }`.

    Sedangkan di `SalesCostForm.vue`:
    ```javascript
    if (data.dnItems && Array.isArray(data.dnItems)) { ... }
    ```
    Karena `data.dnItems` adalah object `{ items: [...] }` (bukan array), maka kondisi `Array.isArray` bernilai `false`.
    Akibatnya, `dnList` di form tidak terisi data dari backend, melainkan reset ke default (1 baris kosong).
    Saat user save, yang tersimpan adalah 1 baris kosong (atau apa adanya), menimpa data lama.

## Solusi
Perbaiki cara parsing response `fetchDNList` di `EditSalesCost.vue`. Backend mengembalikan object `{ items: [...] }`, bukan langsung array.

### Langkah Perbaikan:
1.  **Edit `src/views/Transaksi/EditSalesCost.vue`**:
    *   Ubah logika di `loadDetail`.
    *   Pastikan mengambil properti `.items` dari response `fetchDNList`.
    *   Handle kasus jika response kosong atau error.

```javascript
// Sebelum
const [detail, dnList] = await Promise.all([
  salesCostService.fetchSalesCostById(idParam),
  salesCostService.fetchDNList(idParam).catch(() => [])
])
initialData.value = { ...detail, dnItems: dnList }

// Sesudah (Rencana)
const [detail, dnResponse] = await Promise.all([
  salesCostService.fetchSalesCostById(idParam),
  salesCostService.fetchDNList(idParam).catch(() => ({ items: [] }))
])
// dnResponse adalah { items: [...] }
initialData.value = { ...detail, dnItems: dnResponse.items || [] }
```

2.  **Verifikasi `SalesCostForm.vue`**:
    *   Pastikan `applyInitialData` menerima array di `data.dnItems`. (Sudah benar: `if (data.dnItems && Array.isArray(data.dnItems))`).

3.  **Verifikasi `handleSubmit` di `EditSalesCost.vue`**:
    *   Pastikan `saveDNList` dipanggil dengan parameter yang benar. (Sudah benar).

## Langkah Validasi
1.  Buka Edit Sales Cost.
2.  Pastikan DN List muncul (tidak kosong).
3.  Ubah DN List (tambah/edit).
4.  Simpan.
5.  Reload halaman, pastikan perubahan tersimpan.

## Daftar File yang Diubah
1.  `src/views/Transaksi/EditSalesCost.vue`
