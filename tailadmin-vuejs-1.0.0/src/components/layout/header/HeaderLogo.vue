<template>
  <router-link :to="homePath" class="lg:hidden">
    <img class="dark:hidden" src="/images/logo/logo.svg" alt="Logo" />
    <img class="hidden dark:block" src="/images/logo/logo-dark.svg" alt="Logo" />
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthUser } from '@/services/auth'

const authUser = useAuthUser()
const homePath = computed(() => (authUser.value?.level === 'cs' ? '/schedule-pengiriman' : '/'))
</script>
