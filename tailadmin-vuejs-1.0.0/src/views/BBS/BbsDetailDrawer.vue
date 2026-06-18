<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open" class="fixed inset-0 z-[100]">
        <div
          class="fixed inset-0 bg-gray-400/50 backdrop-blur-sm"
          @click="handleClose"
        ></div>
        <div class="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl dark:bg-gray-900 drawer-panel">
          <div class="flex h-full flex-col">
            <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <div class="flex items-center gap-3">
                <div
                  :class="iconBg"
                  class="flex h-8 w-8 items-center justify-center rounded-full"
                >
                  <component :is="iconComp" :class="iconColor" class="h-4 w-4" />
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ title }}</h3>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ subtitle }}</p>
                </div>
              </div>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                @click="handleClose"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="flex-1 overflow-y-auto px-5 py-4">
              <div v-if="loading" class="py-8 text-center text-sm text-gray-500">Memuat detail...</div>
              <div v-else-if="error" class="py-8 text-center text-sm text-error-500">{{ error }}</div>

              <!-- Observation Detail -->
              <template v-else-if="detail && rowType === 'observation'">
                <div v-if="!editing" class="space-y-5">
                  <!-- Status Badge -->
                  <div class="flex items-center gap-2">
                    <span :class="scoreBadge(computeOverallObs(scoresObj))" class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold">
                      {{ computeOverallObs(scoresObj) === 'aman' ? '✓ Aman' : '⚠ Perlu Perhatian' }}
                    </span>
                    <span class="text-xs text-gray-400 dark:text-gray-500">{{ fmt(detail.date) }}</span>
                  </div>

                  <!-- Info Utama -->
                  <div class="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div class="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-800">
                      <div class="p-3">
                        <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Observer</p>
                        <p class="text-sm font-medium text-gray-800 dark:text-gray-100 mt-1">{{ detail.observer_name }}</p>
                      </div>
                      <div class="p-3">
                        <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Pengemudi</p>
                        <p class="text-sm font-medium text-gray-800 dark:text-gray-100 mt-1">{{ detail.nama_driver || detail.driver_id }}</p>
                      </div>
                    </div>
                    <div class="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-800 border-t border-gray-200 dark:border-gray-800">
                      <div class="p-3">
                        <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Lokasi</p>
                        <p class="text-sm text-gray-800 dark:text-gray-100 mt-1">{{ detail.location || '-' }}</p>
                      </div>
                      <div class="p-3">
                        <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Kendaraan</p>
                        <p class="text-sm text-gray-800 dark:text-gray-100 mt-1">{{ detail.vehicle_type || '-' }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Penilaian Perilaku -->
                  <div class="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div class="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.02]">
                      <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      <p class="text-xs font-semibold text-gray-600 dark:text-gray-300">Penilaian Perilaku</p>
                    </div>
                    <div class="divide-y divide-gray-100 dark:divide-gray-800">
                      <div v-for="item in observationItems" :key="item.id" class="flex items-center justify-between px-4 py-2.5">
                        <span class="text-sm text-gray-700 dark:text-gray-200">{{ item.label }}</span>
                        <span :class="scoreBadge(scoresObj[item.id])" class="inline-flex rounded-md px-2 py-0.5 text-xs font-medium">
                          {{ scoreLabel(scoresObj[item.id]) }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Feedback & Follow Up -->
                  <div class="grid grid-cols-1 gap-4">
                    <div v-if="detail.feedback" class="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                      <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Umpan Balik</p>
                      <p class="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{{ detail.feedback }}</p>
                    </div>
                    <div v-if="detail.follow_up" class="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                      <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Tindak Lanjut</p>
                      <p class="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{{ detail.follow_up }}</p>
                    </div>
                  </div>
                </div>
                <div v-else class="space-y-4">
                  <div>
                    <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">ID Pengemudi</label>
                    <input v-model="editForm.driver_id" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200" />
                  </div>
                  <div>
                    <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Tanggal</label>
                    <DatePickerInput v-model="editForm.date" placeholder="Pilih tanggal" />
                  </div>
                  <div>
                    <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Lokasi</label>
                    <input v-model="editForm.location" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200" />
                  </div>
                  <div>
                    <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Jenis Kendaraan</label>
                    <select v-model="editForm.vehicle_type" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                      <option value="">-- Pilih --</option>
                      <option v-for="v in vehicleOptions" :key="v" :value="v">{{ v }}</option>
                    </select>
                  </div>
                  <div>
                    <p class="mb-2 text-xs font-medium text-gray-600 dark:text-gray-300">Penilaian Perilaku</p>
                    <div class="rounded-lg border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                      <div v-for="item in observationItems" :key="item.id" class="flex items-center gap-2 px-3 py-2.5">
                        <span class="flex-1 text-sm text-gray-700 dark:text-gray-200">{{ item.label }}</span>
                        <div class="flex gap-1">
                          <button v-for="opt in ratingOpts" :key="opt.v" type="button" :class="['rounded-md px-2.5 py-1 text-xs font-medium border', editScores[item.id] === opt.v ? opt.cls : 'border-gray-200 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400']" @click="editScores[item.id] = opt.v">{{ opt.l }}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Umpan Balik</label>
                    <textarea v-model="editForm.feedback" rows="2" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"></textarea>
                  </div>
                  <div>
                    <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Tindak Lanjut</label>
                    <select v-model="editForm.follow_up" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                      <option value="">-- Pilih --</option>
                      <option v-for="f in followUpOptions" :key="f" :value="f">{{ f }}</option>
                    </select>
                  </div>
                </div>
              </template>

              <!-- Checklist Detail -->
              <template v-else-if="detail && rowType === 'checklist'">
                <div v-if="!editing" class="space-y-5">
                  <!-- Status + Score -->
                  <div class="flex items-center gap-3">
                    <span :class="detail.score >= 80 ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400' : 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-orange-400'" class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold">
                      {{ detail.status === 'passed' ? '✓ Lulus' : '⚠ Perlu Perbaikan' }}
                    </span>
                    <span class="text-sm font-bold text-gray-800 dark:text-white/90">{{ detail.score }}%</span>
                    <span class="text-xs text-gray-400 dark:text-gray-500">{{ fmt(detail.date) }}</span>
                  </div>

                  <!-- Info Utama -->
                  <div class="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div class="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-800">
                      <div class="p-3">
                        <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Pengemudi</p>
                        <p class="text-sm font-medium text-gray-800 dark:text-gray-100 mt-1">{{ detail.nama_driver || detail.driver_id }}</p>
                      </div>
                      <div class="p-3">
                        <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Plat Kendaraan</p>
                        <p class="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-1 tracking-wide">{{ detail.plate_number }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Score Bar -->
                  <div class="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                    <div class="flex items-center justify-between mb-2">
                      <p class="text-xs font-semibold text-gray-600 dark:text-gray-300">Skor Keseluruhan</p>
                      <p class="text-sm font-bold" :class="detail.score >= 80 ? 'text-success-600' : detail.score >= 50 ? 'text-warning-600' : 'text-error-600'">{{ detail.score }}%</p>
                    </div>
                    <div class="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div class="h-2.5 rounded-full transition-all" :style="{ width: detail.score + '%', background: detail.score >= 80 ? '#3B6D11' : detail.score >= 50 ? '#EF9F27' : '#E24B4A' }"></div>
                    </div>
                  </div>

                  <!-- Item Pemeriksaan -->
                  <div class="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div class="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.02]">
                      <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                      <p class="text-xs font-semibold text-gray-600 dark:text-gray-300">Item Pemeriksaan</p>
                    </div>
                    <div class="divide-y divide-gray-100 dark:divide-gray-800">
                      <div v-for="(val, key) in itemsObj" :key="key" class="flex items-center justify-between px-4 py-2.5">
                        <span class="text-sm text-gray-700 dark:text-gray-200">{{ chkItemLabel(key) }}</span>
                        <span :class="chkBadge(val)" class="inline-flex rounded-md px-2 py-0.5 text-xs font-medium">{{ chkStatusLabel(val) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="space-y-4">
                  <div>
                    <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">ID Pengemudi</label>
                    <input v-model="editForm.driver_id" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200" />
                  </div>
                  <div>
                    <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Plat Kendaraan</label>
                    <input v-model="editForm.plate_number" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 uppercase outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200" />
                  </div>
                  <div>
                    <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Tanggal</label>
                    <DatePickerInput v-model="editForm.date" placeholder="Pilih tanggal" />
                  </div>
                  <div>
                    <p class="mb-2 text-xs font-medium text-gray-600 dark:text-gray-300">Item Pemeriksaan</p>
                    <div class="rounded-lg border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                      <div v-for="(val, key) in editCheckItems" :key="key" class="flex items-center gap-2 px-3 py-2.5">
                        <span class="flex-1 text-sm text-gray-700 dark:text-gray-200">{{ chkItemLabel(key) }}</span>
                        <div class="flex gap-1">
                          <button v-for="opt in chkOpts" :key="opt.v" type="button" :class="['rounded-md px-2.5 py-1 text-xs font-medium border', editCheckItems[key] === opt.v ? opt.cls : 'border-gray-200 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400']" @click="editCheckItems[key] = opt.v">{{ opt.l }}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Incident Detail -->
              <template v-else-if="detail && rowType === 'incident'">
                <div v-if="!editing" class="space-y-5">
                  <!-- Status Badge -->
                  <div class="flex items-center gap-2">
                    <span :class="incidentBadgeClass(detail.type)" class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold">
                      <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-2.97L13.73 4.99c-.77-1.33-2.69-1.33-3.46 0L3.34 16.03c-.77 1.3.19 2.97 1.73 2.97z"/></svg>
                      {{ detail.type }}
                    </span>
                    <span class="text-xs text-gray-400 dark:text-gray-500">{{ fmt(detail.date) }}</span>
                  </div>

                  <!-- Info Utama -->
                  <div class="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div class="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-800">
                      <div class="p-3">
                        <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Pelapor</p>
                        <p class="text-sm font-medium text-gray-800 dark:text-gray-100 mt-1">{{ detail.reporter_name }}</p>
                      </div>
                      <div class="p-3">
                        <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Lokasi</p>
                        <p class="text-sm font-medium text-gray-800 dark:text-gray-100 mt-1">{{ detail.location }}</p>
                      </div>
                    </div>
                    <div class="border-t border-gray-200 dark:border-gray-800 p-3">
                      <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Plat Kendaraan</p>
                      <p class="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-1 tracking-wide">{{ detail.plate_number || '-' }}</p>
                    </div>
                  </div>

                  <!-- Kronologi -->
                  <div class="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                    <div class="flex items-center gap-2 mb-2.5">
                      <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      <p class="text-xs font-semibold text-gray-600 dark:text-gray-300">Kronologi Kejadian</p>
                    </div>
                    <p class="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{{ detail.chronology || 'Tidak ada data kronologi.' }}</p>
                  </div>

                  <!-- Faktor Penyebab -->
                  <div v-if="parsedFactors.length > 0" class="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                    <div class="flex items-center gap-2 mb-2.5">
                      <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      <p class="text-xs font-semibold text-gray-600 dark:text-gray-300">Faktor Penyebab</p>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <span v-for="f in parsedFactors" :key="f" class="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">{{ f }}</span>
                    </div>
                  </div>

                  <!-- Korban & Rekomendasi -->
                  <div class="grid grid-cols-1 gap-4">
                    <div v-if="detail.casualties" class="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                      <div class="flex items-center gap-2 mb-2">
                        <svg class="h-4 w-4 text-error-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M4.93 4.93l14.14 14.14M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <p class="text-xs font-semibold text-gray-600 dark:text-gray-300">Korban / Kerugian</p>
                      </div>
                      <p class="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{{ detail.casualties }}</p>
                    </div>
                    <div v-if="detail.recommendations" class="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                      <div class="flex items-center gap-2 mb-2">
                        <svg class="h-4 w-4 text-brand-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                        <p class="text-xs font-semibold text-gray-600 dark:text-gray-300">Rekomendasi Tindakan</p>
                      </div>
                      <p class="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{{ detail.recommendations }}</p>
                    </div>
                  </div>
                </div>
                <div v-else class="space-y-4">
                  <div>
                    <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Nama Pelapor</label>
                    <input v-model="editForm.reporter_name" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200" />
                  </div>
                  <div>
                    <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Tanggal Kejadian</label>
                    <DatePickerInput v-model="editForm.date" placeholder="Pilih tanggal" />
                  </div>
                  <div>
                    <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Jenis Laporan</label>
                    <select v-model="editForm.type" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                      <option v-for="t in incidentTypes" :key="t" :value="t">{{ t }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Lokasi Kejadian</label>
                    <input v-model="editForm.location" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200" />
                  </div>
                  <div>
                    <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Plat Kendaraan</label>
                    <input v-model="editForm.plate_number" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 uppercase outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200" />
                  </div>
                  <div>
                    <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Kronologi</label>
                    <textarea v-model="editForm.chronology" rows="3" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"></textarea>
                  </div>
                  <div>
                    <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Korban / Kerugian</label>
                    <textarea v-model="editForm.casualties" rows="2" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"></textarea>
                  </div>
                  <div>
                    <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Rekomendasi</label>
                    <textarea v-model="editForm.recommendations" rows="2" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"></textarea>
                  </div>
                </div>
              </template>
            </div>

            <div class="flex items-center gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-800">
              <button
                v-if="!editing && !props.viewOnly"
                type="button"
                class="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                @click="startEditing"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit
              </button>
              <button
                v-if="!editing && !props.viewOnly"
                type="button"
                :disabled="deleting"
                class="flex items-center gap-1.5 rounded-lg border border-error-300 bg-white px-4 py-2 text-sm font-medium text-error-600 hover:bg-error-50 disabled:opacity-50 dark:border-error-800 dark:text-error-400 dark:hover:bg-error-500/10"
                @click="handleDelete"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                {{ deleting ? 'Menghapus...' : 'Hapus' }}
              </button>
              <div class="flex-1"></div>
              <template v-if="editing">
                <button
                  type="button"
                  :disabled="saving"
                  class="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                  @click="handleSave"
                >
                  {{ saving ? 'Menyimpan...' : 'Simpan' }}
                </button>
                <button
                  type="button"
                  class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                  @click="cancelEdit"
                >
                  Batal
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import EyeIcon from '@/icons/EyeIcon.vue'
import ChecklistIcon from '@/icons/ChecklistIcon.vue'
import AlertTriangleIcon from '@/icons/AlertTriangleIcon.vue'
import DatePickerInput from '@/components/DatePickerInput.vue'
import { useToast } from '@/composables/useToast'
import { useDialog } from '@/composables/useDialog'
import { bbsService, type BbsHistoryRow } from '@/services/bbsService'

type Props = { open: boolean; row: BbsHistoryRow | null; viewOnly?: boolean }
const props = withDefaults(defineProps<Props>(), { viewOnly: false })
const emit = defineEmits<{ (e: 'close'): void; (e: 'updated'): void; (e: 'deleted'): void }>()

const toast = useToast()
const { confirm } = useDialog()
const loading = ref(false)
const error = ref('')
const detail = ref<any>(null)
const editing = ref(false)
const saving = ref(false)
const deleting = ref(false)

const rowType = computed(() => props.row?.type || 'observation')
const title = computed(() => props.row?.title || 'Detail')
const subtitle = computed(() => props.row?.meta || '')

const iconComp = computed(() => {
  if (rowType.value === 'observation') return EyeIcon
  if (rowType.value === 'checklist') return ChecklistIcon
  return AlertTriangleIcon
})
const iconBg = computed(() => {
  if (rowType.value === 'observation') return 'bg-blue-light-50 dark:bg-blue-light-500/15'
  if (rowType.value === 'checklist') return 'bg-success-50 dark:bg-success-500/15'
  return 'bg-warning-50 dark:bg-warning-500/15'
})
const iconColor = computed(() => {
  if (rowType.value === 'observation') return 'text-blue-light-500'
  if (rowType.value === 'checklist') return 'text-success-600'
  return 'text-warning-600'
})

const vehicleOptions = ['Truk Besar', 'Truk Sedang', 'Minibus', 'Pick-up', 'Sepeda Motor']
const followUpOptions = ['Apresiasi langsung', 'Coaching on the spot', 'Pelaporan ke supervisor', 'Rencana pelatihan']
const incidentTypes = ['Near-Miss', 'Insiden Ringan', 'Insiden Sedang', 'Insiden Berat']

const ratingOpts = [
  { v: 'aman', l: 'Aman', cls: 'border-success-500 bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400' },
  { v: 'berisiko', l: 'Berisiko', cls: 'border-warning-500 bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-orange-400' },
  { v: 'berbahaya', l: 'Bahaya', cls: 'border-error-500 bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400' },
]
const chkOpts = [
  { v: 'safe', l: '✓ OK', cls: 'border-success-500 bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400' },
  { v: 'unsafe', l: '✗ NOK', cls: 'border-error-500 bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400' },
  { v: 'na', l: 'N/A', cls: 'border-gray-300 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
]

const observationItems = [
  { id: 'o1', label: 'Memakai sabuk pengaman' },
  { id: 'o2', label: 'Kecepatan sesuai batas' },
  { id: 'o3', label: 'Menjaga jarak aman' },
  { id: 'o4', label: 'Tidak menggunakan HP saat berkendara' },
  { id: 'o5', label: 'Mematuhi rambu lalu lintas' },
  { id: 'o6', label: 'Kondisi fisik & mental baik' },
  { id: 'o7', label: 'Teknik pengereman benar' },
  { id: 'o8', label: 'Tidak merokok saat berkendara' },
]

const chkItemLabels: Record<string, string> = {
  m1: 'Level oli mesin cukup', m2: 'Level air radiator cukup', m3: 'Bahan bakar cukup untuk rute',
  m4: 'Tidak ada kebocoran oli/cairan', m5: 'Belt / fan belt dalam kondisi baik',
  s1: 'Rem utama berfungsi normal', s2: 'Rem tangan berfungsi', s3: 'Semua lampu berfungsi',
  s4: 'APAR tersedia & tidak kadaluarsa', s5: 'Sabuk pengaman berfungsi', s6: 'Klakson berfungsi',
  e1: 'Kaca depan bersih & tidak retak', e2: 'Wiper berfungsi', e3: 'Tekanan ban sesuai standar',
  e4: 'Kondisi ban tidak aus berlebihan', e5: 'Spion lengkap & dapat diatur',
}

const chkItemLabel = (key: string) => chkItemLabels[key] || key

const scoresObj = computed(() => detail.value?.scores || {})
const itemsObj = computed(() => detail.value?.items || {})

const parsedFactors = computed(() => {
  try {
    const f = detail.value?.factors
    return typeof f === 'string' ? JSON.parse(f) : Array.isArray(f) ? f : []
  } catch { return [] }
})

const editScores = reactive<Record<string, string>>({})
const editCheckItems = reactive<Record<string, string>>({})
const editForm = reactive<Record<string, any>>({})

function scoreBadge(val: string) {
  if (val === 'aman') return 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400'
  if (val === 'berisiko') return 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400'
  if (val === 'berbahaya') return 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400'
  return 'bg-gray-100 text-gray-500'
}
function computeOverallObs(scores: Record<string, string>) {
  const vals = Object.values(scores || {})
  if (vals.length === 0) return ''
  return vals.every(v => v === 'aman') ? 'aman' : 'berisiko'
}
function scoreLabel(val: string) {
  if (val === 'aman') return 'Aman'
  if (val === 'berisiko') return 'Berisiko'
  if (val === 'berbahaya') return 'Bahaya'
  return '-'
}
function chkBadge(val: string) {
  if (val === 'safe') return 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400'
  if (val === 'unsafe') return 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400'
  return 'bg-gray-100 text-gray-500'
}
function incidentBadgeClass(type: string) {
  if (type === 'Near-Miss') return 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-orange-400'
  if (type === 'Insiden Ringan') return 'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300'
  if (type === 'Insiden Sedang') return 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400'
  return 'bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-300'
}
function chkStatusLabel(val: string) {
  if (val === 'safe') return 'OK'
  if (val === 'unsafe') return 'NOK'
  return 'N/A'
}
function fmt(val: any) {
  if (!val) return '-'
  const d = val instanceof Date ? val : new Date(val)
  if (Number.isNaN(d.getTime())) return String(val)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const pad2 = (n: number) => String(n).padStart(2, '0')
function norm(val: any) {
  if (!val) return ''
  const d = val instanceof Date ? val : new Date(val)
  if (Number.isNaN(d.getTime())) return String(val)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function handleClose() {
  if (editing.value) {
    editing.value = false
    return
  }
  emit('close')
}

function startEditing() {
  if (rowType.value === 'observation') {
    editForm.driver_id = detail.value?.driver_id || ''
    editForm.date = norm(detail.value?.date)
    editForm.location = detail.value?.location || ''
    editForm.vehicle_type = detail.value?.vehicle_type || ''
    editForm.feedback = detail.value?.feedback || ''
    editForm.follow_up = detail.value?.follow_up || ''
    observationItems.forEach((i) => { editScores[i.id] = detail.value?.scores?.[i.id] || '' })
  } else if (rowType.value === 'checklist') {
    editForm.driver_id = detail.value?.driver_id || ''
    editForm.plate_number = detail.value?.plate_number || ''
    editForm.date = norm(detail.value?.date)
    const items = detail.value?.items || {}
    Object.keys(items).forEach((k) => { editCheckItems[k] = items[k] || '' })
  } else if (rowType.value === 'incident') {
    editForm.reporter_name = detail.value?.reporter_name || ''
    editForm.date = norm(detail.value?.date)
    editForm.type = detail.value?.type || ''
    editForm.location = detail.value?.location || ''
    editForm.plate_number = detail.value?.plate_number || ''
    editForm.chronology = detail.value?.chronology || ''
    editForm.casualties = detail.value?.casualties || ''
    editForm.recommendations = detail.value?.recommendations || ''
  }
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

async function handleSave() {
  saving.value = true
  try {
    const id = props.row?.id
    if (!id) return

    if (rowType.value === 'observation') {
      await bbsService.updateObservation(id, {
        driver_id: editForm.driver_id,
        date: editForm.date || new Date().toISOString().slice(0, 10),
        location: editForm.location || undefined,
        vehicle_type: editForm.vehicle_type || undefined,
        scores: { ...editScores },
        feedback: editForm.feedback || undefined,
        follow_up: editForm.follow_up || undefined,
      })
    } else if (rowType.value === 'checklist') {
      await bbsService.updateChecklist(id, {
        driver_id: editForm.driver_id,
        plate_number: editForm.plate_number,
        date: editForm.date || new Date().toISOString().slice(0, 10),
        items: { ...editCheckItems },
      })
    } else if (rowType.value === 'incident') {
      await bbsService.updateIncident(id, {
        reporter_name: editForm.reporter_name,
        date: editForm.date || new Date().toISOString().slice(0, 10),
        type: editForm.type,
        location: editForm.location,
        plate_number: editForm.plate_number || undefined,
        chronology: editForm.chronology || undefined,
        casualties: editForm.casualties || undefined,
        recommendations: editForm.recommendations || undefined,
      })
    }
    toast.success('Data berhasil diperbarui')
    editing.value = false
    emit('updated')
    await fetchDetail(id)
  } catch (err: any) {
    toast.error(err?.message || 'Gagal menyimpan perubahan')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  const id = props.row?.id
  if (!id) return
  const ok = await confirm({
    title: 'Hapus Data',
    message: 'Yakin hapus data ini? Tindakan tidak dapat dibatalkan.',
    confirmText: 'Ya, hapus',
    cancelText: 'Batal',
    variant: 'danger',
  })
  if (!ok) return

  deleting.value = true
  try {
    if (rowType.value === 'observation') await bbsService.deleteObservation(id)
    else if (rowType.value === 'checklist') await bbsService.deleteChecklist(id)
    else await bbsService.deleteIncident(id)
    toast.success('Data berhasil dihapus')
    emit('deleted')
    emit('close')
  } catch (err: any) {
    toast.error(err?.message || 'Gagal menghapus data')
  } finally {
    deleting.value = false
  }
}

async function fetchDetail(id: number) {
  loading.value = true
  error.value = ''
  try {
    if (rowType.value === 'observation') detail.value = await bbsService.fetchObservationDetail(id)
    else if (rowType.value === 'checklist') detail.value = await bbsService.fetchChecklistDetail(id)
    else detail.value = await bbsService.fetchIncidentDetail(id)
  } catch (err: any) {
    error.value = err?.message || 'Gagal memuat detail'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.open && props.row?.id,
  (shouldFetch) => {
    if (shouldFetch && props.row?.id) {
      editing.value = false
      fetchDetail(props.row.id)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.25s ease;
}
.drawer-enter-active .drawer-panel,
.drawer-leave-active .drawer-panel {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
.drawer-enter-from .drawer-panel {
  transform: translateX(100%);
}
.drawer-leave-to .drawer-panel {
  transform: translateX(100%);
}
</style>
