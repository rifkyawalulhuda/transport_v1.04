import { reactive } from 'vue'

type DialogVariant = 'info' | 'success' | 'warning' | 'danger'
type DialogType = 'confirm' | 'alert'

type DialogState = {
  open: boolean
  type: DialogType
  title: string
  message: string
  confirmText: string
  cancelText: string
  okText: string
  variant: DialogVariant
}

type ConfirmOptions = {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: DialogVariant
}

type AlertOptions = {
  title?: string
  message: string
  okText?: string
  variant?: DialogVariant
}

type DialogRequest = {
  type: DialogType
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  okText?: string
  variant?: DialogVariant
  resolve: (value?: boolean) => void
}

const dialogState = reactive<DialogState>({
  open: false,
  type: 'alert',
  title: '',
  message: '',
  confirmText: 'OK',
  cancelText: 'Batal',
  okText: 'OK',
  variant: 'info'
})

const queue: DialogRequest[] = []
let currentResolve: ((value?: boolean) => void) | null = null

const applyRequest = (request: DialogRequest) => {
  dialogState.open = true
  dialogState.type = request.type
  dialogState.title = request.title
  dialogState.message = request.message
  dialogState.confirmText = request.confirmText || 'OK'
  dialogState.cancelText = request.cancelText || 'Batal'
  dialogState.okText = request.okText || 'OK'
  dialogState.variant =
    request.variant || (request.type === 'confirm' ? 'warning' : 'info')
  currentResolve = request.resolve
}

const openDialog = (request: DialogRequest) => {
  if (dialogState.open) {
    queue.push(request)
    return
  }
  applyRequest(request)
}

const closeDialog = (result: boolean) => {
  const resolve = currentResolve
  const dialogType = dialogState.type

  dialogState.open = false
  currentResolve = null

  if (resolve) {
    if (dialogType === 'confirm') {
      resolve(result)
    } else {
      resolve()
    }
  }

  const next = queue.shift()
  if (next) {
    applyRequest(next)
  }
}

const confirm = (options: ConfirmOptions) =>
  new Promise<boolean>((resolve) => {
    openDialog({
      type: 'confirm',
      title: options.title || 'Konfirmasi',
      message: options.message,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      variant: options.variant,
      resolve
    })
  })

const alert = (options: AlertOptions) =>
  new Promise<void>((resolve) => {
    openDialog({
      type: 'alert',
      title: options.title || 'Informasi',
      message: options.message,
      okText: options.okText,
      variant: options.variant,
      resolve
    })
  })

const dialogHandlers = {
  confirm: () => closeDialog(true),
  cancel: () => closeDialog(false)
}

export const useDialog = () => ({
  confirm,
  alert
})

export { dialogState, dialogHandlers }
