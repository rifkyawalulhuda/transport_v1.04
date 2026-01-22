<template>
  <ThemeProvider>
    <SidebarProvider>
      <RouterView />
      <DialogHost />
      <ToastHost />
    </SidebarProvider>
  </ThemeProvider>
</template>

<script setup lang="ts">
import ThemeProvider from './components/layout/ThemeProvider.vue'
import SidebarProvider from './components/layout/SidebarProvider.vue'
import DialogHost from './components/dialogs/DialogHost.vue'
import ToastHost from './components/common/ToastHost.vue'
</script>
