---
title: "BBS — Rumus & Logika Penilaian Skor"
outline: deep
---

# BBS — Rumus & Logika Penilaian Skor

Halaman ini menjelaskan secara teknis bagaimana setiap skor di modul BBS dihitung, alasan di balik pilihan rumus, dan batas threshold yang digunakan.

## 1. Safe Behavior Rate (Observasi Manual)

### Rumus

```
Safe Behavior Rate (%) = ROUND( jumlah_observasi_full_aman / total_observasi × 100 )
```

### Definisi "Full Aman"

Sebuah observasi dianggap **full aman** hanya jika **semua 8 parameter** bernilai `"aman"`:

| Key | Parameter |
|-----|-----------|
| `o1` | Sabuk pengaman |
| `o2` | Kecepatan sesuai batas |
| `o3` | Jarak aman |
| `o4` | Tidak menggunakan HP |
| `o5` | Mematuhi rambu lalu lintas |
| `o6` | Kondisi fisik & mental |
| `o7` | Teknik pengereman |
| `o8` | Tidak merokok saat berkendara |

### Alasan

Pendekatan **all-or-nothing** (semua harus aman) dipilih karena keselamatan berkendara bersifat kumulatif — satu perilaku berisiko tetap menciptakan risiko nyata meskipun 7 parameter lain aman. Menggunakan rata-rata per-parameter akan mengaburkan bahaya yang sebenarnya (misalnya: pengemudi yang tidak memakai sabuk tapi perilaku lainnya sempurna tetap masuk kategori "aman" jika diberi rata-rata).

### Target

Target Safe Behavior Rate ditetapkan **85%** per bulan (ditampilkan sebagai garis referensi di chart tren).

### Threshold Status Observasi

| Kondisi | Status |
|---------|--------|
| Semua 8 parameter = `aman` | **Aman** |
| Satu atau lebih parameter bukan `aman` | **Perlu Perhatian** |

---

## 2. Skor Checklist Kendaraan

### Rumus

```
scorePct (%) = ROUND( jumlah_item_OK / jumlah_item_terjawab × 100 )
```

- **`jumlah_item_OK`** — item yang dinilai `"safe"` (OK)
- **`jumlah_item_terjawab`** — item yang sudah diisi (tidak kosong), dari total 16 item

### Alasan

Penyebut menggunakan **item yang terjawab** (bukan total 16) agar item `N/A` (Not Applicable) tidak menghukum skor. Misalnya, jika 2 item tidak relevan untuk kendaraan tertentu dan ditandai N/A, skor tetap adil berdasarkan 14 item yang diperiksa.

Pembulatan ke bilangan bulat (`Math.round`) digunakan karena skor ditampilkan sebagai persentase integer yang mudah dibaca.

### Threshold Status

| Skor | Status | Warna |
|------|--------|-------|
| ≥ 80% | **Lulus** | Hijau |
| 50–79% | **Perlu Perbaikan** | Kuning |
| < 50% | **Tidak Lulus** | Merah |

### Alasan Threshold 80%

Threshold 80% mengikuti standar umum industri transportasi untuk inspeksi pra-perjalanan (pre-departure check). Ini berarti minimal 13 dari 16 item harus dalam kondisi OK sebelum kendaraan dianggap layak jalan. Jika dipasang terlalu ketat (misalnya 100%), satu item N/A langsung menggagalkan checklist.

---

## 3. Skor ADAS (Advanced Driver Assistance System)

Skor ADAS dihitung dari data alarm yang diimpor dari file CSV/XLSX perangkat kamera kendaraan.

### Langkah 1 — Kategorisasi Alarm

Setiap alarm dikategorikan ke dalam 5 kategori risiko:

| Kategori | Contoh Alarm Type | Bobot (`aggWeight`) | Faktor Penalti (`penaltyFactor`) |
|----------|------------------|---------------------|----------------------------------|
| `fatigue` | eyes closed, yawn, drowsy | **30%** | 5 |
| `distraction` | distracted, phone, smoking, calling | **20%** | 4 |
| `collision` | forward collision, pedestrian collision, tailgating | **20%** | 4 |
| `lane` | lane departure, lane change | **15%** | 3 |
| `speed` | overspeed, speed limit, speeding | **15%** | 3 |

### Langkah 2 — Skor Per Kategori

```
rate[kategori] = alarm_count[kategori] / total_alarms_truk

categoryScore[kategori] = MAX( 0, ROUND( 100 × (1 - rate × penaltyFactor) ) )
```

**Alasan rumus ini:**

- **`rate`** mengukur proporsi alarm kategori tertentu terhadap total alarm truk tersebut — bukan nilai absolut. Ini membuat skor adil untuk truk dengan jam operasional berbeda.
- **`penaltyFactor`** adalah severity multiplier. Kategori yang lebih berbahaya (kelelahan = 5) dihukum lebih berat daripada kategori yang risikonya lebih rendah (lane departure = 3). Misalnya, jika 20% alarm adalah "eyes closed", skor fatigue = `100 × (1 - 0.20 × 5) = 0` — skor langsung jatuh ke nol karena sangat berbahaya.
- `MAX(0, ...)` memastikan skor tidak negatif.

### Langkah 3 — Skor Final (Weighted Average)

```
finalScore = MAX( 0, ROUND(
  categoryScore.fatigue     × 0.30 +
  categoryScore.distraction × 0.20 +
  categoryScore.collision   × 0.20 +
  categoryScore.lane        × 0.15 +
  categoryScore.speed       × 0.15
))
```

**Alasan pembobotan:**

Bobot mencerminkan tingkat bahaya relatif masing-masing kategori berdasarkan data kecelakaan lalu lintas:

- **Kelelahan (30%)** — penyebab kecelakaan fatal terbesar pada pengemudi jarak jauh
- **Distraksi (20%)** — penggunaan HP saat berkendara meningkatkan risiko tabrakan secara signifikan
- **Tabrakan (20%)** — sinyal langsung dari perilaku mengikuti terlalu dekat
- **Lane Departure (15%)** — risiko sedang, sering terjadi saat kelelahan
- **Overspeed (15%)** — dikombinasikan dengan data Wialon untuk akurasi lebih tinggi

### Langkah 4 — Koreksi Wialon Overspeed

Jika truk memiliki `wialon_unit_id`, sistem mengambil jumlah kejadian overspeed dari Wialon GPS untuk periode yang sama dan menerapkan penalti tambahan pada skor kecepatan:

```
wialonPenalty = MIN( wialonOverspeedCount × 2, 40 )   // maksimal -40 poin
categoryScore.speed = MAX( 0, categoryScore.speed - wialonPenalty )
```

Setelah koreksi, `finalScore` dihitung ulang dengan bobot yang sama.

**Alasan:** Data ADAS hanya menangkap alarm yang terdeteksi kamera (jarak dekat). Wialon menangkap overspeed dari GPS secara independen. Menggabungkan keduanya memberikan gambaran kecepatan yang lebih lengkap dan mengurangi blind spot.

### Threshold Status ADAS

| Skor | Status | Warna |
|------|--------|-------|
| ≥ 80 | **Aman** | Hijau |
| 60–79 | **Perlu Perhatian** | Kuning/Oranye |
| < 60 | **Berisiko** | Merah |

---

## 4. Distribusi Risiko Perilaku (Chart Dashboard)

Chart bar di Dashboard menunjukkan **persentase observasi** di bulan terpilih yang memiliki setidaknya satu parameter berisiko/berbahaya per kategori:

```
riskPct[kategori] = ROUND( jumlah_observasi_dengan_risiko[kategori] / total_observasi × 100 )
```

| Kategori | Parameter yang dihitung |
|----------|------------------------|
| Kecepatan | `o2` = berisiko / berbahaya |
| Sabuk | `o1` = berisiko / berbahaya |
| HP/Distraksi | `o4` = berisiko / berbahaya |
| Jarak Aman | `o3` = berisiko / berbahaya |
| Lainnya | `o5`, `o6`, `o7`, atau `o8` = berisiko / berbahaya |

**Alasan:** Kategori "Lainnya" menggabungkan 4 parameter karena masing-masing frekuensinya lebih rendah. Menampilkan keempatnya terpisah akan membuat chart sulit dibaca tanpa menambah wawasan signifikan.

---

## 5. Tren Safe Behavior (6 Bulan)

```
trendPct[bulan] = ROUND( observasi_full_aman[bulan] / total_observasi[bulan] × 100 )
```

Data 6 bulan terakhir dihitung mundur dari bulan yang dipilih. Bulan tanpa data ditampilkan sebagai `0%`.

---

## 6. Hari Tanpa Insiden (Streak)

```
streak = DATEDIFF( akhir_bulan, MAX(tanggal_insiden_non_Near-Miss) )
```

- Hanya menghitung insiden dengan tipe **bukan** Near-Miss (Insiden Ringan, Sedang, atau Berat)
- Jika tidak ada insiden sama sekali, streak dihitung dari awal bulan
- Nilai negatif di-clamp ke `0`

**Alasan memisahkan Near-Miss:** Near-Miss adalah pelaporan proaktif yang justru **dianjurkan** — menghukum streak karena Near-Miss akan mengurangi insentif pelaporan. Hanya insiden nyata yang mereset streak.

---

## Ringkasan Semua Rumus

| Metrik | Rumus Singkat | Sumber Data |
|--------|--------------|-------------|
| Safe Behavior Rate | `ROUND(fullAman / total × 100)` | `bbs_observations` |
| Checklist Score | `ROUND(itemOK / itemTerjawab × 100)` | `bbs_checklists` |
| ADAS Category Score | `MAX(0, ROUND(100 × (1 - rate × penalty)))` | `bbs_observations` (source=adas) |
| ADAS Final Score | Weighted average 5 kategori | Computed |
| Risk Distribution | `ROUND(obsBerisiko / total × 100)` | `bbs_observations` |
| Incident Free Streak | `DATEDIFF(endDate, lastIncidentDate)` | `bbs_incidents` |
