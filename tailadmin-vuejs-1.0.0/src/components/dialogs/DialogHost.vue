<template>
  <ConfirmDialog
    v-if="dialogState.open && dialogState.type === 'confirm'"
    :open="dialogState.open"
    :title="dialogState.title"
    :message="dialogState.message"
    :confirm-text="dialogState.confirmText"
    :cancel-text="dialogState.cancelText"
    :variant="dialogState.variant"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  />
  <AlertDialog
    v-else-if="dialogState.open && dialogState.type === 'alert'"
    :open="dialogState.open"
    :title="dialogState.title"
    :message="dialogState.message"
    :ok-text="dialogState.okText"
    :variant="dialogState.variant"
    @confirm="handleConfirm"
  />
</template>

<script setup lang="ts">
import AlertDialog from '@/components/dialogs/AlertDialog.vue'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog.vue'
import { dialogHandlers, dialogState } from '@/composables/useDialog'

const handleConfirm = () => dialogHandlers.confirm()
const handleCancel = () => dialogHandlers.cancel()
</script>
