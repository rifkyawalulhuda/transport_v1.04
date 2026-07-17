import { ref, computed } from 'vue'

export type BbsLang = 'id' | 'en'

// Global reactive state — shared across all BBS components
const currentLang = ref<BbsLang>('id')

const translations = {
  id: {
    // Main header
    appTitle: 'BBS — Departemen Transportasi',
    appSub: 'Behavior-Based Safety System',

    // Tab navigation
    tabDashboard: 'Dashboard',
    tabObservasi: 'Observasi',
    tabChecklist: 'Checklist',
    tabInsiden: 'Insiden',
    tabRiwayat: 'Riwayat',

    // Dashboard
    dashTitle: 'Ringkasan Keselamatan',
    dashMonthHint: 'Data ditampilkan berdasarkan bulan yang dipilih',
    metricSafeRate: 'Safe Behavior Rate',
    metricObsMonth: 'Observasi Bulan Ini',
    metricNearMiss: 'Near-Miss Dilaporkan',
    metricIncidentFree: 'Hari Tanpa Insiden',
    vsLastMonth: 'vs bulan lalu',
    target: 'Target',
    streakActive: 'Streak aktif',
    chartTrend: 'Tren Safe Behavior (6 bulan)',
    chartRiskCat: 'Kategori Perilaku Berisiko',
    topRisks: 'Top Risiko Perilaku',
    loading: 'Memuat data dashboard...',
    targetLine: 'Target 85%',

    // Observasi form
    obsTitle: 'Form Observasi Perilaku',
    obsSub: 'Catat dan nilai perilaku pengemudi di lapangan',
    lblObserver: 'Observer',
    lblDriver: 'ID Pengemudi',
    lblDate: 'Tanggal',
    lblLocation: 'Lokasi',
    lblVehicleType: 'Jenis Kendaraan',
    obsRatingTitle: 'Penilaian Perilaku',
    lblFeedback: 'Umpan Balik / Catatan',
    lblFollowUp: 'Tindak Lanjut',
    btnSaveObs: 'Simpan Observasi',
    btnSaving: 'Menyimpan...',
    placeholderSelect: '-- Pilih --',
    placeholderRoute: 'Rute / titik pengamatan',
    placeholderFeedback: 'Tuliskan catatan observasi...',
    placeholderSearchDriver: 'Cari nama driver',
    placeholderSelectDriver: '-Pilih-',
    placeholderDate: 'Pilih tanggal',

    // Observation items
    o1: 'Memakai sabuk pengaman',
    o2: 'Kecepatan sesuai batas',
    o3: 'Menjaga jarak aman',
    o4: 'Tidak menggunakan HP saat berkendara',
    o5: 'Mematuhi rambu lalu lintas',
    o6: 'Kondisi fisik & mental baik',
    o7: 'Teknik pengereman benar',
    o8: 'Tidak merokok saat berkendara',
    catO1: 'APD',
    catO2: 'Kecepatan',
    catO3: 'Jarak',
    catO4: 'Distraksi',
    catO5: 'Kepatuhan',
    catO6: 'Kondisi',
    catO7: 'Teknik',
    catO8: 'Disiplin',

    // Rating labels
    ratingAman: 'Aman',
    ratingBerisiko: 'Berisiko',
    ratingBerbahaya: 'Bahaya',

    // Vehicle options
    vehTrukBesar: 'Truk Besar',
    vehTrukSedang: 'Truk Sedang',
    vehMinibus: 'Minibus',
    vehPickup: 'Pick-up',
    vehMotor: 'Sepeda Motor',

    // Follow-up options
    fuApresiasi: 'Apresiasi langsung',
    fuCoaching: 'Coaching on the spot',
    fuLaporan: 'Pelaporan ke supervisor',
    fuPelatihan: 'Rencana pelatihan',

    // Checklist
    chkTitle: 'Checklist Keselamatan Kendaraan',
    chkSub: 'Pemeriksaan pra-perjalanan wajib dilakukan setiap hari',
    lblChkDriver: 'ID Pengemudi',
    lblChkPlat: 'Plat Kendaraan',
    tabMesin: 'Mesin & Bahan Bakar',
    tabKeselamatan: 'Keselamatan',
    tabEksterior: 'Eksterior',
    chkScoreLabel: 'Skor Checklist',
    btnSaveChk: 'Simpan Checklist',
    chkSafe: 'OK',
    chkUnsafe: 'NOK',
    chkNa: 'N/A',

    // Checklist items - Mesin
    m1: 'Level oli mesin cukup',
    m2: 'Level air radiator cukup',
    m3: 'Bahan bakar cukup untuk rute',
    m4: 'Tidak ada kebocoran oli/cairan',
    m5: 'Belt / fan belt dalam kondisi baik',
    // Checklist items - Keselamatan
    s1: 'Rem utama berfungsi normal',
    s2: 'Rem tangan berfungsi',
    s3: 'Semua lampu berfungsi (depan, belakang, sein)',
    s4: 'APAR tersedia & tidak kadaluarsa',
    s5: 'Sabuk pengaman berfungsi',
    s6: 'Klakson berfungsi',
    // Checklist items - Eksterior
    e1: 'Kaca depan bersih & tidak retak',
    e2: 'Ban dalam kondisi baik (termasuk ban serep)',
    e3: 'Spion lengkap & dalam posisi benar',
    e4: 'Body kendaraan tidak ada kerusakan baru',
    e5: 'Wiper berfungsi normal',

    // Insiden
    incTitle: 'Pelaporan Insiden & Near-Miss',
    incSub: 'Laporkan setiap kejadian, baik insiden maupun hampir terjadi',
    lblReporter: 'Nama Pelapor',
    lblIncDate: 'Tanggal Kejadian',
    lblIncType: 'Jenis Laporan',
    lblIncLocation: 'Lokasi Kejadian',
    lblIncPlat: 'Plat Kendaraan Terlibat',
    lblChronology: 'Kronologi Kejadian',
    lblFactors: 'Faktor Penyebab',
    lblCasualties: 'Korban / Kerugian',
    lblRecommendations: 'Rekomendasi Tindakan',
    btnSubmitInc: 'Kirim Laporan',
    placeholderChronology: 'Jelaskan secara runtut apa yang terjadi...',
    placeholderCasualties: 'Jelaskan korban atau kerugian material...',
    placeholderRecommendations: 'Apa yang sebaiknya dilakukan untuk mencegah kejadian serupa?',

    // Incident type options
    incNearMiss: 'Near-Miss',
    incRingan: 'Insiden Ringan',
    incSedang: 'Insiden Sedang',
    incBerat: 'Insiden Berat',

    // Incident factors
    factKecepatan: 'Kecepatan',
    factKelelahan: 'Kelelahan',
    factCuaca: 'Cuaca',
    factJalan: 'Jalan Rusak',
    factPengendara: 'Perilaku Pengendara Lain',
    factKendaraan: 'Kendaraan',
    factHP: 'HP / Distraksi',
    factLainnya: 'Lainnya',

    // Riwayat
    hisTitle: 'Riwayat Laporan',
    hisSub: 'Semua observasi, checklist, dan insiden yang telah dicatat',
    hisAll: 'Semua',
    hisObs: 'Observasi',
    hisChk: 'Checklist',
    hisInc: 'Insiden',
    hisSearch: 'Cari...',
    hisMonth: 'Bulan',
    hisStatus: 'Status',
    hisExport: 'Export',
    hisPerPage: '/halaman',
    hisNoData: 'Tidak ada data',

    // Detail Drawer
    detailTitle: 'Detail',
    detailEdit: 'Edit',
    detailDelete: 'Hapus',
    detailSave: 'Simpan',
    detailCancel: 'Batal',
    detailClose: 'Tutup',
    detailConfirmDelete: 'Yakin ingin menghapus data ini?',
    detailYes: 'Ya, Hapus',
    detailNo: 'Batal',

    // Toast messages
    toastObsSaved: 'Observasi berhasil disimpan',
    toastChkSaved: 'Checklist berhasil disimpan',
    toastIncSaved: 'Laporan insiden berhasil dikirim',
    toastUpdated: 'Data berhasil diperbarui',
    toastDeleted: 'Data berhasil dihapus',
    toastError: 'Terjadi kesalahan',
    toastDriverRequired: 'ID Pengemudi wajib diisi',
    toastDateRequired: 'Tanggal wajib diisi',
    toastAllItemsRequired: 'Semua item checklist wajib diisi',
    toastPlatRequired: 'Plat kendaraan wajib diisi',
    toastPlatAlready: 'Plat ini sudah dichecklist hari ini',
    toastTypeRequired: 'Jenis laporan wajib diisi',
    toastChronologyRequired: 'Kronologi wajib diisi',

    // Export modal
    exportTitle: 'Export Data BBS',
    exportByMonth: 'Per Bulan',
    exportByYear: 'Per Tahun',
    exportAll: 'Semua Data',
    exportBtn: 'Download',
    exportCancel: 'Batal',

    // Lang toggle
    langToggleLabel: 'EN',

    // Risk labels (from backend)
    riskSpeed: 'Melebihi batas kecepatan',
    riskSeatbelt: 'Tidak pakai sabuk',
    riskPhone: 'Penggunaan HP saat berkendara',
    riskDistance: 'Jarak aman tidak terjaga',

    // Risk chart category labels (from backend)
    riskCatSpeed: 'Kecepatan',
    riskCatSeatbelt: 'Sabuk',
    riskCatPhone: 'HP/Distraksi',
    riskCatDistance: 'Jarak Aman',
    riskCatOther: 'Lainnya',

    // Status labels (from backend)
    statusAman: '✓ Aman',
    statusPerluPerhatian: '⚠ Perlu Perhatian',
    statusLulus: '✓ Lulus',
    statusPerluPerbaikan: '⚠ Perlu Perbaikan',
    statusBadgeAman: 'Aman',
    statusBadgeLulus: 'Lulus',
    statusBadgePerluPerhatian: 'Perlu Perhatian',
    statusBadgePerluPerbaikan: 'Perlu Perbaikan',

    // Riwayat extra
    hisShow: 'Tampilkan',
    hisOf: 'dari',
    hisData: 'data',
    hisAllStatus: 'Semua Status',
    hisStatusAman: 'Aman',
    hisStatusPerlu: 'Perlu Perhatian',
    hisStatusLulus: 'Lulus',
    hisStatusNeedsFix: 'Perlu Perbaikan',
    exportModalSub: 'Pilih rentang data yang akan di-export ke Excel',
    exportMonthSub: 'Export data satu bulan tertentu',
    exportYearSub: 'Export data satu tahun penuh',
    exportAllSub: 'Export seluruh riwayat BBS',
    exportSelectMonth: 'Pilih Bulan',
    exportSelectYear: 'Pilih Tahun',

    // Detail Drawer extra
    detailLoading: 'Memuat detail...',
    detailObserver: 'Observer',
    detailPengemudi: 'Pengemudi',
    detailLokasi: 'Lokasi',
    detailKendaraan: 'Kendaraan',
    detailPlat: 'Plat Kendaraan',
    detailTanggal: 'Tanggal',
    detailTanggalKejadian: 'Tanggal Kejadian',
    detailLokasiKejadian: 'Lokasi Kejadian',
    detailSkorKeseluruhan: 'Skor Keseluruhan',
    detailItemPemeriksaan: 'Item Pemeriksaan',
  },
  en: {
    // Main header
    appTitle: 'BBS — Transportation Department',
    appSub: 'Behavior-Based Safety System',

    // Tab navigation
    tabDashboard: 'Dashboard',
    tabObservasi: 'Observation',
    tabChecklist: 'Checklist',
    tabInsiden: 'Incident',
    tabRiwayat: 'History',

    // Dashboard
    dashTitle: 'Safety Summary',
    dashMonthHint: 'Data displayed based on selected month',
    metricSafeRate: 'Safe Behavior Rate',
    metricObsMonth: 'Observations This Month',
    metricNearMiss: 'Near-Miss Reported',
    metricIncidentFree: 'Incident-Free Days',
    vsLastMonth: 'vs last month',
    target: 'Target',
    streakActive: 'Active streak',
    chartTrend: 'Safe Behavior Trend (6 months)',
    chartRiskCat: 'At-Risk Behavior Categories',
    topRisks: 'Top Behavior Risks',
    loading: 'Loading dashboard data...',
    targetLine: 'Target 85%',

    // Observasi form
    obsTitle: 'Behavior Observation Form',
    obsSub: 'Record and rate driver behavior in the field',
    lblObserver: 'Observer',
    lblDriver: 'Driver ID',
    lblDate: 'Date',
    lblLocation: 'Location',
    lblVehicleType: 'Vehicle Type',
    obsRatingTitle: 'Behavior Rating',
    lblFeedback: 'Feedback / Notes',
    lblFollowUp: 'Follow-up Action',
    btnSaveObs: 'Save Observation',
    btnSaving: 'Saving...',
    placeholderSelect: '-- Select --',
    placeholderRoute: 'Route / observation point',
    placeholderFeedback: 'Write observation notes...',
    placeholderSearchDriver: 'Search driver name',
    placeholderSelectDriver: '-Select-',
    placeholderDate: 'Select date',

    // Observation items
    o1: 'Wearing seatbelt',
    o2: 'Speed within limit',
    o3: 'Maintaining safe distance',
    o4: 'No phone use while driving',
    o5: 'Obeying traffic signs',
    o6: 'Good physical & mental condition',
    o7: 'Correct braking technique',
    o8: 'No smoking while driving',
    catO1: 'PPE',
    catO2: 'Speed',
    catO3: 'Distance',
    catO4: 'Distraction',
    catO5: 'Compliance',
    catO6: 'Condition',
    catO7: 'Technique',
    catO8: 'Discipline',

    // Rating labels
    ratingAman: 'Safe',
    ratingBerisiko: 'At-Risk',
    ratingBerbahaya: 'Danger',

    // Vehicle options
    vehTrukBesar: 'Heavy Truck',
    vehTrukSedang: 'Medium Truck',
    vehMinibus: 'Minibus',
    vehPickup: 'Pick-up',
    vehMotor: 'Motorcycle',

    // Follow-up options
    fuApresiasi: 'Direct appreciation',
    fuCoaching: 'Coaching on the spot',
    fuLaporan: 'Report to supervisor',
    fuPelatihan: 'Training plan',

    // Checklist
    chkTitle: 'Vehicle Safety Checklist',
    chkSub: 'Pre-trip inspection must be done daily',
    lblChkDriver: 'Driver ID',
    lblChkPlat: 'License Plate',
    tabMesin: 'Engine & Fuel',
    tabKeselamatan: 'Safety',
    tabEksterior: 'Exterior',
    chkScoreLabel: 'Checklist Score',
    btnSaveChk: 'Save Checklist',
    chkSafe: 'OK',
    chkUnsafe: 'NOK',
    chkNa: 'N/A',

    // Checklist items - Engine
    m1: 'Engine oil level sufficient',
    m2: 'Radiator water level sufficient',
    m3: 'Fuel sufficient for route',
    m4: 'No oil/fluid leak',
    m5: 'Belt / fan belt in good condition',
    // Checklist items - Safety
    s1: 'Main brake functions normally',
    s2: 'Handbrake functions',
    s3: 'All lights working (front, rear, signal)',
    s4: 'Fire extinguisher available & not expired',
    s5: 'Seatbelt functional',
    s6: 'Horn functional',
    // Checklist items - Exterior
    e1: 'Windshield clean & no cracks',
    e2: 'Tires in good condition (including spare)',
    e3: 'Mirrors complete & properly positioned',
    e4: 'No new body damage',
    e5: 'Wipers functioning normally',

    // Insiden
    incTitle: 'Incident & Near-Miss Report',
    incSub: 'Report every event, whether incident or near-miss',
    lblReporter: 'Reporter Name',
    lblIncDate: 'Date of Incident',
    lblIncType: 'Report Type',
    lblIncLocation: 'Location',
    lblIncPlat: 'Vehicle Plate Involved',
    lblChronology: 'Incident Timeline',
    lblFactors: 'Causal Factors',
    lblCasualties: 'Victims / Losses',
    lblRecommendations: 'Recommended Actions',
    btnSubmitInc: 'Submit Report',
    placeholderChronology: 'Describe what happened in sequence...',
    placeholderCasualties: 'Describe victims or material losses...',
    placeholderRecommendations: 'What should be done to prevent similar events?',

    // Incident type options
    incNearMiss: 'Near-Miss',
    incRingan: 'Minor Incident',
    incSedang: 'Moderate Incident',
    incBerat: 'Severe Incident',

    // Incident factors
    factKecepatan: 'Speeding',
    factKelelahan: 'Fatigue',
    factCuaca: 'Weather',
    factJalan: 'Road Damage',
    factPengendara: 'Other Road Users',
    factKendaraan: 'Vehicle',
    factHP: 'Phone / Distraction',
    factLainnya: 'Other',

    // Riwayat
    hisTitle: 'Report History',
    hisSub: 'All observations, checklists, and incidents recorded',
    hisAll: 'All',
    hisObs: 'Observation',
    hisChk: 'Checklist',
    hisInc: 'Incident',
    hisSearch: 'Search...',
    hisMonth: 'Month',
    hisStatus: 'Status',
    hisExport: 'Export',
    hisPerPage: '/page',
    hisNoData: 'No data found',

    // Detail Drawer
    detailTitle: 'Detail',
    detailEdit: 'Edit',
    detailDelete: 'Delete',
    detailSave: 'Save',
    detailCancel: 'Cancel',
    detailClose: 'Close',
    detailConfirmDelete: 'Are you sure you want to delete this data?',
    detailYes: 'Yes, Delete',
    detailNo: 'Cancel',

    // Toast messages
    toastObsSaved: 'Observation saved successfully',
    toastChkSaved: 'Checklist saved successfully',
    toastIncSaved: 'Incident report submitted successfully',
    toastUpdated: 'Data updated successfully',
    toastDeleted: 'Data deleted successfully',
    toastError: 'An error occurred',
    toastDriverRequired: 'Driver ID is required',
    toastDateRequired: 'Date is required',
    toastAllItemsRequired: 'All checklist items must be filled',
    toastPlatRequired: 'License plate is required',
    toastPlatAlready: 'This plate has already been checked today',
    toastTypeRequired: 'Report type is required',
    toastChronologyRequired: 'Chronology is required',

    // Export modal
    exportTitle: 'Export BBS Data',
    exportByMonth: 'By Month',
    exportByYear: 'By Year',
    exportAll: 'All Data',
    exportBtn: 'Download',
    exportCancel: 'Cancel',

    // Lang toggle
    langToggleLabel: 'ID',

    // Risk labels (from backend)
    riskSpeed: 'Exceeding speed limit',
    riskSeatbelt: 'Not wearing seatbelt',
    riskPhone: 'Phone use while driving',
    riskDistance: 'Unsafe following distance',

    // Risk chart category labels (from backend)
    riskCatSpeed: 'Speed',
    riskCatSeatbelt: 'Seatbelt',
    riskCatPhone: 'Phone/Distraction',
    riskCatDistance: 'Safe Distance',
    riskCatOther: 'Other',

    // Status labels (from backend)
    statusAman: '✓ Safe',
    statusPerluPerhatian: '⚠ Needs Attention',
    statusLulus: '✓ Passed',
    statusPerluPerbaikan: '⚠ Needs Fix',
    statusBadgeAman: 'Safe',
    statusBadgeLulus: 'Passed',
    statusBadgePerluPerhatian: 'Needs Attention',
    statusBadgePerluPerbaikan: 'Needs Fix',

    // Riwayat extra
    hisShow: 'Show',
    hisOf: 'of',
    hisData: 'records',
    hisAllStatus: 'All Status',
    hisStatusAman: 'Safe',
    hisStatusPerlu: 'Needs Attention',
    hisStatusLulus: 'Passed',
    hisStatusNeedsFix: 'Needs Fix',
    exportModalSub: 'Select data range to export to Excel',
    exportMonthSub: 'Export one specific month',
    exportYearSub: 'Export full year data',
    exportAllSub: 'Export all BBS history',
    exportSelectMonth: 'Select Month',
    exportSelectYear: 'Select Year',

    // Detail Drawer extra
    detailLoading: 'Loading detail...',
    detailObserver: 'Observer',
    detailPengemudi: 'Driver',
    detailLokasi: 'Location',
    detailKendaraan: 'Vehicle',
    detailPlat: 'License Plate',
    detailTanggal: 'Date',
    detailTanggalKejadian: 'Date of Incident',
    detailLokasiKejadian: 'Incident Location',
    detailSkorKeseluruhan: 'Overall Score',
    detailItemPemeriksaan: 'Inspection Items',
  },
} as const

export type BbsTranslationKey = keyof typeof translations.id

export function useBbsLang() {
  const t = computed(() => translations[currentLang.value])

  /** Map backend risk labels (Indonesian) to the current language */
  const riskLabelMap = computed<Record<string, string>>(() => ({
    'Melebihi batas kecepatan': t.value.riskSpeed,
    'Tidak pakai sabuk': t.value.riskSeatbelt,
    'Penggunaan HP saat berkendara': t.value.riskPhone,
    'Jarak aman tidak terjaga': t.value.riskDistance,
    // Chart category labels
    'Kecepatan': t.value.riskCatSpeed,
    'Sabuk': t.value.riskCatSeatbelt,
    'HP/Distraksi': t.value.riskCatPhone,
    'Jarak Aman': t.value.riskCatDistance,
    'Lainnya': t.value.riskCatOther,
  }))

  /** Map backend status labels to the current language */
  const statusMap = computed<Record<string, string>>(() => ({
    'Aman': t.value.statusBadgeAman,
    'Perlu Perhatian': t.value.statusBadgePerluPerhatian,
    'Lulus': t.value.statusBadgeLulus,
    'Perlu Perbaikan': t.value.statusBadgePerluPerbaikan,
    'Near-Miss': 'Near-Miss',
    'Insiden Ringan': t.value.incRingan,
    'Insiden Sedang': t.value.incSedang,
    'Insiden Berat': t.value.incBerat,
  }))

  function toggleLang() {
    currentLang.value = currentLang.value === 'id' ? 'en' : 'id'
  }

  function setLang(lang: BbsLang) {
    currentLang.value = lang
  }

  return {
    lang: currentLang,
    t,
    riskLabelMap,
    statusMap,
    toggleLang,
    setLang,
  }
}
