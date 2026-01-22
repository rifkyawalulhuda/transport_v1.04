# Hapus Field DN Lama dari UI Sales Cost

## Deskripsi
Rencana ini bertujuan untuk menghapus semua field input dan tampilan lama terkait DN (No. DN, Alamat Pickup, Alamat Drop, No. Aju, No. Container) dari UI Sales Cost karena fitur tersebut telah dipindahkan ke "DN List" (MongoDB).

## Langkah-langkah Implementasi

### 1. Update `SalesCostForm.vue`
*   **Hapus Elemen UI:**
    *   Hapus blok grid yang berisi field `No. DN`, `Alamat Pickup`, dan `Alamat Drop` (baris 141-180).
    *   Hapus field `No. Aju` dan `No. Container` dari bagian "BIAYA OPSIONAL & DETAIL" (baris 361-383).
*   **Hapus Logic/State:**
    *   Hapus properti `no_dn`, `almt_pickup`, `almt_drop`, `no_aju`, `no_container` dari interface `SalesCostFormData`.
    *   Hapus properti tersebut dari objek reactive `form`.
    *   Hapus logika reset (`resetForm`) dan inisialisasi (`applyInitialData`) untuk field tersebut.
    *   Hapus field tersebut dari payload `buildPayload`.

### 2. Update `DetailSalesCost.vue`
*   **Hapus Elemen UI:**
    *   Hapus tampilan `No. SPK` dan `Customer` jika field `No. DN` sebelumnya ada di sana, atau sesuaikan grid agar rapi. (Catatan: `No. DN` sudah dihapus sebelumnya dari Detail, tapi perlu dipastikan bersih).
    *   Hapus blok grid yang menampilkan `Alamat Pickup` dan `Alamat Drop` (jika masih ada sisa komentar atau elemen).
    *   Hapus tampilan `No. Container` dari grid (baris 167-177).
*   **Hapus Logic/State:**
    *   Hapus properti `no_dn`, `almt_pickup`, `almt_drop`, `no_container` dari type `DetailData`.
    *   Hapus properti tersebut dari inisialisasi `detail`.

### 3. Verifikasi
*   Pastikan form Create/Edit tetap bisa disubmit tanpa error.
*   Pastikan "DN List" (MongoDB) tetap muncul dan berfungsi sebagai satu-satunya cara input/view DN.
*   Pastikan layout halaman tetap rapi (tidak ada area kosong yang aneh).
