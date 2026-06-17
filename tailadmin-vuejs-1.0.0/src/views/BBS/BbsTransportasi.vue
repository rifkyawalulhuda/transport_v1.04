<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="pageTitle" />

    <div class="space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex items-center gap-3 mb-5">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-light-50 dark:bg-blue-light-500/15">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-light-500">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
              <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
              <path d="M5 17h-2v-11a1 1 0 0 1 1 -1h9v12h-4" />
              <path d="M13 5h2l4 4v8h-3" />
              <path d="M9 17h6" />
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">BBS — Departemen Transportasi</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Behavior-Based Safety System</p>
          </div>
        </div>

        <nav class="flex flex-wrap gap-1.5 border-b border-gray-100 pb-4 dark:border-gray-800">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            :class="[
              'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-white'
                : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'
            ]"
            @click="activeTab = tab.key"
          >
            <component :is="tab.icon" class="h-4 w-4" />
            {{ tab.label }}
          </button>
        </nav>

        <div class="pt-5">
          <BbsDashboardTab v-if="activeTab === 'dashboard'" :key="'dash'" />
          <BbsObservasiTab v-else-if="activeTab === 'observasi'" :key="'obs'" @saved="onSaved" />
          <BbsChecklistTab v-else-if="activeTab === 'checklist'" :key="'chk'" @saved="onSaved" />
          <BbsInsidenTab v-else-if="activeTab === 'insiden'" :key="'inc'" @saved="onSaved" />
          <BbsRiwayatTab v-else-if="activeTab === 'riwayat'" :key="'his'" :refresh-trigger="historyRefresh" @select="openDetail" />
        </div>
      </div>
    </div>

    <BbsDetailDrawer :open="drawerOpen" :row="selectedRow" @close="closeDetail" @updated="onDetailUpdated" @deleted="onDetailUpdated" />
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import BarChartIcon from '@/icons/BarChartIcon.vue'
import EyeIcon from '@/icons/EyeIcon.vue'
import ChecklistIcon from '@/icons/ChecklistIcon.vue'
import AlertTriangleIcon from '@/icons/AlertTriangleIcon.vue'
import { ListIcon } from '@/icons'
import BbsDashboardTab from './BbsDashboardTab.vue'
import BbsObservasiTab from './BbsObservasiTab.vue'
import BbsChecklistTab from './BbsChecklistTab.vue'
import BbsInsidenTab from './BbsInsidenTab.vue'
import BbsRiwayatTab from './BbsRiwayatTab.vue'
import BbsDetailDrawer from './BbsDetailDrawer.vue'
import type { BbsHistoryRow } from '@/services/bbsService'

const pageTitle = 'BBS Transportasi'

const tabs = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChartIcon },
  { key: 'observasi', label: 'Observasi', icon: EyeIcon },
  { key: 'checklist', label: 'Checklist', icon: ChecklistIcon },
  { key: 'insiden', label: 'Insiden', icon: AlertTriangleIcon },
  { key: 'riwayat', label: 'Riwayat', icon: ListIcon },
]

const activeTab = ref<string>('dashboard')
const historyRefresh = ref(0)
const selectedRow = ref<BbsHistoryRow | null>(null)
const drawerOpen = computed(() => selectedRow.value !== null)

function openDetail(row: BbsHistoryRow) {
  selectedRow.value = row
}

function closeDetail() {
  selectedRow.value = null
}

function onDetailUpdated() {
  historyRefresh.value++
}

function onSaved(type: string) {
  activeTab.value = 'riwayat'
  historyRefresh.value++
}
</script>
