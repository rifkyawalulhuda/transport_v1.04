Saya telah menganalisis file-file terkait fitur **Subcontractor** dan **Repair** dan menemukan pola masalah yang sama dengan yang terjadi di Sales Cost:

1.  **Frontend (Vue.js)**:
    *   `SubcontractorForm.vue` (line 407): Fungsi `normalizeDate` menggunakan `.split('T')[0]`, yang menyebabkan tanggal mundur 1 hari saat diedit jika zona waktu pengguna > UTC.
    *   `RepairForm.vue` (line 264): Fungsi `normalizeDateInput` juga menggunakan `.toISOString().slice(0, 10)` atau logika split serupa, yang juga rentan terhadap masalah pergeseran zona waktu.

2.  **Backend (Node.js)**:
    *   `subcontractor.js` (line 163 - Export): Tidak ada fungsi format tanggal khusus. Tanggal dari database (MySQL `DATE`) dikirim mentah ke Excel, yang bisa diinterpretasikan berbeda oleh ExcelJS tergantung zona waktu server/client.
    *   `repair.js` (line 57 - Export): Sama seperti subcontractor, data tanggal dikirim langsung tanpa format eksplisit `YYYY-MM-DD`.

**Rencana Perbaikan:**

1.  **Frontend - SubcontractorForm.vue**:
    *   Mengganti logika `normalizeDate` agar menggunakan `Local Time` (getFullYear, getMonth, getDate) daripada split string ISO/UTC.

2.  **Frontend - RepairForm.vue**:
    *   Mengganti logika `normalizeDateInput` agar menggunakan `Local Time`.

3.  **Backend - subcontractor.js**:
    *   Menambahkan fungsi helper `formatDate` (seperti di salesCost.js) untuk memastikan tanggal diformat string `YYYY-MM-DD` secara tegas.
    *   Menerapkan `formatDate` pada kolom `order_date`, `delivery_date`, dan `arrival_date` di endpoint `/export`.

4.  **Backend - repair.js**:
    *   Menambahkan fungsi helper `formatDate` yang sama.
    *   Menerapkan `formatDate` pada kolom `tgl_input`, `tgl_kerusakan`, dan `jadwal_berkala` di endpoint `/export/excel`.

Apakah Anda setuju dengan rencana perbaikan menyeluruh ini?