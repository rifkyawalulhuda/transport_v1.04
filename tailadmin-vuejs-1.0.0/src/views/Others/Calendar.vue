<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div
      class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div class="custom-calendar">
        <FullCalendar ref="calendarRef" class="min-h-screen" :options="calendarOptions" />
      </div>

      <!-- Modal -->
      <Modal v-if="isOpen" @close="closeModal = false">
        <template #body>
          <div
            class="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11"
          >
            <h5
              class="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl"
            >
              {{ selectedEvent ? 'Edit Event' : 'Add Event' }}
            </h5>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Plan your next big moment: schedule or edit an event to stay on track
            </p>
            <div class="mt-4 flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <img
                  v-if="modalCreatorAvatarUrl"
                  :src="modalCreatorAvatarUrl"
                  :alt="modalCreatorName"
                  class="h-full w-full object-cover"
                />
                <span v-else>{{ modalCreatorInitials }}</span>
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400">Created by</p>
                <p class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ modalCreatorName }}</p>
              </div>
            </div>

            <div class="mt-8">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Event Title
                </label>
                <input
                  v-model="eventTitle"
                  type="text"
                  :disabled="isReadOnly"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              <div class="mt-6">
                <label class="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Event Color
                </label>
                <div class="flex flex-wrap items-center gap-4 sm:gap-5">
                  <div v-for="(value, key) in calendarsEvents" :key="key" class="n-chk">
                    <div :class="`form-check form-check-${value} form-check-inline`">
                      <label
                        class="flex items-center text-sm text-gray-700 form-check-label dark:text-gray-400"
                        :for="`modal${key}`"
                      >
                        <span class="relative">
                          <input
                            type="radio"
                            :name="'event-level'"
                            :value="key"
                            :id="`modal${key}`"
                            v-model="eventLevel"
                            :disabled="isReadOnly"
                            class="sr-only form-check-input"
                          />
                          <span
                            class="flex items-center justify-center w-5 h-5 mr-2 border border-gray-300 rounded-full box dark:border-gray-700"
                          >
                            <span class="w-2 h-2 bg-white rounded-full dark:bg-transparent"></span>
                          </span>
                        </span>
                        {{ key }}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-6">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Enter Start Date
                </label>
                <input
                  v-model="eventStartDate"
                  type="datetime-local"
                  :disabled="isReadOnly"
                  class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              <div class="mt-6">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Enter End Date
                </label>
                <input
                  v-model="eventEndDate"
                  type="datetime-local"
                  :disabled="isReadOnly"
                  class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
            </div>

            <div class="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
              <button
                @click="closeModal"
                class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Close
              </button>

              <button
                @click="handleAddOrUpdateEvent"
                :disabled="isReadOnly"
                :class="isReadOnly ? 'opacity-60 cursor-not-allowed' : ''"
                class="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
              >
                {{ selectedEvent ? 'Update Changes' : 'Add Event' }}
              </button>
              <button
                v-if="selectedEvent"
                v-show="isOwner"
                @click="handleDeleteEvent"
                :disabled="!isOwner"
                :class="!isOwner ? 'opacity-60 cursor-not-allowed' : ''"
                class="flex w-full justify-center rounded-lg border border-error-500 bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 sm:w-auto"
              >
                Delete Event
              </button>
            </div>
          </div>
        </template>
      </Modal>
      <!-- <Teleport to="body">
        <div v-if="isOpen" class="modal-backdrop" @click="closeModal"></div>
        <div v-if="isOpen" class="modal">
          <div >
            <h5
              class="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl"
            >
              {{ selectedEvent ? 'Edit Event' : 'Add Event' }}
            </h5>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Plan your next big moment: schedule or edit an event to stay on track
            </p>

            <div class="mt-8">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Event Title
                </label>
                <input
                  v-model="eventTitle"
                  type="text"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              <div class="mt-6">
                <label class="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Event Color
                </label>
                <div class="flex flex-wrap items-center gap-4 sm:gap-5">
                  <div v-for="(value, key) in calendarsEvents" :key="key" class="n-chk">
                    <div :class="`form-check form-check-${value} form-check-inline`">
                      <label
                        class="flex items-center text-sm text-gray-700 form-check-label dark:text-gray-400"
                        :for="`modal${key}`"
                      >
                        <span class="relative">
                          <input
                            type="radio"
                            :name="'event-level'"
                            :value="key"
                            :id="`modal${key}`"
                            v-model="eventLevel"
                            class="sr-only form-check-input"
                          />
                          <span
                            class="flex items-center justify-center w-5 h-5 mr-2 border border-gray-300 rounded-full box dark:border-gray-700"
                          >
                            <span class="w-2 h-2 bg-white rounded-full dark:bg-transparent"></span>
                          </span>
                        </span>
                        {{ key }}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-6">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Enter Start Date
                </label>
                <input
                  v-model="eventStartDate"
                  type="date"
                  class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              <div class="mt-6">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Enter End Date
                </label>
                <input
                  v-model="eventEndDate"
                  type="date"
                  class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
            </div>

            <div class="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
              <button
                @click="closeModal"
                class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Close
              </button>
              <button
                @click="handleAddOrUpdateEvent"
                class="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
              >
                {{ selectedEvent ? 'Update Changes' : 'Add Event' }}
              </button>
            </div>
          </div>
        </div>
      </Teleport> -->
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { API_ORIGIN } from '@/config/api'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'

const currentPageTitle = ref('Calendar')
import { ref, reactive, onMounted, computed } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import Modal from '@/components/profile/Modal.vue'
import { useAuthUser } from '@/services/auth'
import { useToast } from '@/composables/useToast'

const calendarRef = ref(null)
const isOpen = ref(false)
const selectedEvent = ref(null)
const eventTitle = ref('')
const eventStartDate = ref('')
const eventEndDate = ref('')
const eventLevel = ref('')
const eventAllDay = ref(true)
const events = ref([])
const authUser = useAuthUser()
const toast = useToast()
const storageKey = 'calendar_events_shared'
const apiBase = API_ORIGIN

const calendarsEvents = reactive({
  Danger: 'danger',
  Success: 'success',
  Primary: 'primary',
  Warning: 'warning',
})

const currentUserId = computed(() => authUser.value?.id_admin ?? authUser.value?.nik_admin ?? null)
const currentUserName = computed(
  () => authUser.value?.nama_admin ?? authUser.value?.nik_admin ?? 'User'
)
const currentUserAvatarUrl = computed(() => {
  const gambar = authUser.value?.gambar
  return gambar ? `${apiBase}/img/${gambar}` : null
})

const getInitials = (name) => {
  const clean = String(name || '').trim()
  if (!clean) {
    return 'U'
  }
  const parts = clean.split(/\s+/).slice(0, 2)
  return parts.map((part) => part.charAt(0).toUpperCase()).join('')
}

const isOwner = computed(() => {
  if (!selectedEvent.value || !currentUserId.value) {
    return false
  }
  const ownerId =
    selectedEvent.value.extendedProps?.created_by_user_id ?? selectedEvent.value.created_by_user_id
  return ownerId !== null && String(ownerId) === String(currentUserId.value)
})
const isReadOnly = computed(() => !!selectedEvent.value && !isOwner.value)

const modalCreatorName = computed(() => {
  if (selectedEvent.value) {
    return (
      selectedEvent.value.extendedProps?.created_by_name ??
      selectedEvent.value.created_by_name ??
      'User'
    )
  }
  return currentUserName.value
})
const modalCreatorAvatarUrl = computed(() => {
  if (selectedEvent.value) {
    return (
      selectedEvent.value.extendedProps?.created_by_avatar_url ??
      selectedEvent.value.created_by_avatar_url ??
      null
    )
  }
  return currentUserAvatarUrl.value
})
const modalCreatorInitials = computed(() => getInitials(modalCreatorName.value))

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const formatDateTimeInput = (date) => {
  if (!date) {
    return ''
  }
  const pad = (value) => String(value).padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const resolveEventLevel = (level) =>
  calendarsEvents[level] ? level : 'Primary'

const normalizeEvent = (event) => {
  const extendedProps = event.extendedProps || {}
  const calendarKey = resolveEventLevel(extendedProps.calendar || event.calendar)
  return {
    id: String(event.id || Date.now()),
    title: event.title || '',
    start: event.start || '',
    end: event.end || null,
    allDay: Boolean(event.allDay),
    extendedProps: {
      calendar: calendarKey,
      created_by_user_id:
        extendedProps.created_by_user_id ?? event.created_by_user_id ?? null,
      created_by_name: extendedProps.created_by_name ?? event.created_by_name ?? 'User',
      created_by_avatar_url:
        extendedProps.created_by_avatar_url ?? event.created_by_avatar_url ?? null,
      description: extendedProps.description ?? event.description ?? '',
    },
  }
}

const loadEvents = () => {
  const raw = localStorage.getItem(storageKey)
  if (!raw) {
    events.value = []
    return
  }
  try {
    const parsed = JSON.parse(raw)
    events.value = Array.isArray(parsed) ? parsed.map(normalizeEvent) : []
  } catch {
    events.value = []
  }
}

const saveEvents = (nextEvents) => {
  localStorage.setItem(storageKey, JSON.stringify(nextEvents))
}

const isOwnerEvent = (event) => {
  if (!currentUserId.value) {
    return false
  }
  const ownerId = event.extendedProps?.created_by_user_id ?? event.created_by_user_id
  return ownerId !== null && String(ownerId) === String(currentUserId.value)
}

onMounted(() => {
  loadEvents()
})

const openModal = () => {
  isOpen.value = true
}

const closeModal = () => {
  isOpen.value = false
  resetModalFields()
}

const resetModalFields = () => {
  eventTitle.value = ''
  eventStartDate.value = ''
  eventEndDate.value = ''
  eventLevel.value = 'Primary'
  eventAllDay.value = true
  selectedEvent.value = null
}

const handleDateSelect = (selectInfo) => {
  resetModalFields()
  eventStartDate.value = formatDateTimeInput(selectInfo.start)
  eventEndDate.value = selectInfo.end ? formatDateTimeInput(selectInfo.end) : ''
  eventAllDay.value = Boolean(selectInfo.allDay)
  openModal()
}

const handleEventClick = (clickInfo) => {
  const event = clickInfo.event
  selectedEvent.value = event
  eventTitle.value = event.title
  eventStartDate.value = formatDateTimeInput(event.start)
  eventEndDate.value = formatDateTimeInput(event.end)
  eventLevel.value = resolveEventLevel(event.extendedProps.calendar)
  eventAllDay.value = Boolean(event.allDay)
  openModal()
}

const handleAddOrUpdateEvent = () => {
  if (!currentUserId.value) {
    toast.error('User tidak ditemukan.')
    return
  }
  if (!eventTitle.value.trim() || !eventStartDate.value) {
    toast.warning('Judul dan tanggal event wajib diisi.')
    return
  }
  if (selectedEvent.value && !isOwner.value) {
    toast.error('Anda tidak memiliki izin untuk mengubah event ini.')
    return
  }
  const calendarKey = resolveEventLevel(eventLevel.value)
  if (selectedEvent.value) {
    // Update existing event
    events.value = events.value.map((event) => {
      if (event.id !== selectedEvent.value.id) {
        return event
      }
      return {
        ...event,
        title: eventTitle.value.trim(),
        start: eventStartDate.value,
        end: eventEndDate.value || null,
        allDay: eventAllDay.value,
        extendedProps: {
          ...event.extendedProps,
          calendar: calendarKey,
        },
      }
    })
  } else {
    // Add new event
    const now = new Date().toISOString()
    const newEvent = {
      id: Date.now().toString(),
      title: eventTitle.value.trim(),
      start: eventStartDate.value,
      end: eventEndDate.value || null,
      allDay: eventAllDay.value,
      created_at: now,
      updated_at: now,
      extendedProps: {
        calendar: calendarKey,
        created_by_user_id: currentUserId.value,
        created_by_name: currentUserName.value,
        created_by_avatar_url: currentUserAvatarUrl.value,
      },
    }
    events.value.push(newEvent)
  }
  saveEvents(events.value.map(normalizeEvent))
  closeModal()
}
const handleDeleteEvent = () => {
  if (selectedEvent.value) {
    if (!isOwner.value) {
      toast.error('Anda tidak memiliki izin untuk menghapus event ini.')
      return
    }
    events.value = events.value.filter((event) => event.id !== selectedEvent.value.id)
    saveEvents(events.value.map(normalizeEvent))
    closeModal()
  }
}

const renderEventContent = (eventInfo) => {
  const calendarKey = resolveEventLevel(eventInfo.event.extendedProps.calendar)
  const colorClass = `fc-bg-${String(calendarKey).toLowerCase()}`
  const ownerName = eventInfo.event.extendedProps.created_by_name || 'User'
  const ownerInitials = getInitials(ownerName)
  const ownerAvatar = eventInfo.event.extendedProps.created_by_avatar_url
  const ownerLabel = escapeHtml(ownerName)
  const avatarHtml = ownerAvatar
    ? `<img src="${escapeHtml(ownerAvatar)}" alt="${ownerLabel}" class="h-4 w-4 rounded-full object-cover" />`
    : `<div class="flex h-4 w-4 items-center justify-center rounded-full bg-white/30 text-[8px] font-semibold text-white">${escapeHtml(ownerInitials)}</div>`
  return {
    html: `
      <div class="event-fc-color flex flex-col gap-1 fc-event-main ${colorClass} p-1 rounded-sm">
        <div class="flex items-center gap-1">
          <div class="fc-daygrid-event-dot"></div>
          <div class="fc-event-time">${escapeHtml(eventInfo.timeText || '')}</div>
          <div class="fc-event-title">${escapeHtml(eventInfo.event.title)}</div>
        </div>
        <div class="flex items-center gap-1 text-[10px] text-white/80">
          ${avatarHtml}
          <span class="truncate">${ownerLabel}</span>
        </div>
      </div>
    `,
  }
}

const handleEventChange = (changeInfo) => {
  if (!isOwnerEvent(changeInfo.event)) {
    changeInfo.revert()
    toast.error('Anda tidak memiliki izin untuk mengubah event ini.')
    return
  }
  const start = formatDateTimeInput(changeInfo.event.start)
  const end = formatDateTimeInput(changeInfo.event.end)
  events.value = events.value.map((event) =>
    event.id === changeInfo.event.id
      ? { ...event, start, end: end || null, allDay: changeInfo.event.allDay }
      : event
  )
  saveEvents(events.value.map(normalizeEvent))
}

const calendarOptions = reactive({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next addEventButton',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  events: events,
  selectable: true,
  select: handleDateSelect,
  eventClick: handleEventClick,
  eventDrop: handleEventChange,
  eventResize: handleEventChange,
  eventContent: renderEventContent,
  customButtons: {
    addEventButton: {
      text: 'Add Event +',
      click: openModal,
    },
  },
})
</script>
