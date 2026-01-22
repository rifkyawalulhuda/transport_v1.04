import { reactive } from 'vue'

type ToastVariant = 'success' | 'error' | 'warning' | 'info'

type ToastItem = {
  id: number
  message: string
  variant: ToastVariant
  timeout: number
}

const toastState = reactive<{ items: ToastItem[] }>({
  items: []
})

let toastSeed = 0

const removeToast = (id: number) => {
  const index = toastState.items.findIndex((item) => item.id === id)
  if (index >= 0) {
    toastState.items.splice(index, 1)
  }
}

const pushToast = (variant: ToastVariant, message: string, timeout = 4000) => {
  const id = (toastSeed += 1)
  toastState.items.push({
    id,
    message,
    variant,
    timeout
  })

  if (timeout > 0) {
    window.setTimeout(() => removeToast(id), timeout)
  }
}

export const useToast = () => ({
  success: (message: string, timeout?: number) =>
    pushToast('success', message, timeout ?? 4000),
  error: (message: string, timeout?: number) =>
    pushToast('error', message, timeout ?? 5000),
  warning: (message: string, timeout?: number) =>
    pushToast('warning', message, timeout ?? 5000),
  info: (message: string, timeout?: number) => pushToast('info', message, timeout ?? 4000)
})

export { toastState, removeToast }
