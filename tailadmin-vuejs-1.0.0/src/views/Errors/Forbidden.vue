<template>
  <div
    class="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden z-1"
  >
    <CommonGridShape />
    <div class="mx-auto w-full max-w-[380px] text-center sm:max-w-[520px]">
      <h1
        class="mb-4 font-bold text-gray-800 text-title-md dark:text-white/90 xl:text-title-2xl"
      >
        403
      </h1>
      <p class="mb-8 text-base text-gray-700 dark:text-gray-400 sm:text-lg">
        Akses ditolak. Anda tidak memiliki izin untuk membuka halaman ini.
      </p>
      <router-link
        to="/schedule-pengiriman"
        class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] dark:hover:text-gray-100"
      >
        Kembali ke Schedule Pengiriman
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import CommonGridShape from "../../components/common/CommonGridShape.vue";
</script>
