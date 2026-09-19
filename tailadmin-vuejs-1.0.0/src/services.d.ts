/**
 * Deklarasi tipe untuk modul JavaScript di folder src/.
 *
 * Modul-modul berikut ditulis dalam JavaScript (tanpa tipe), sehingga TypeScript
 * melempar TS7016 ("Could not find a declaration file") di setiap file yang
 * meng-import-nya. Deklarasi ini memberi bentuk tipe yang akurat tanpa perlu
 * mengubah (atau menulis ulang) file .js yang sudah berjalan.
 *
 * Ditulis berdasarkan API publik sebenarnya di masing-masing file .js.
 */

declare module '@/config/api' {
  /** Origin backend, mis. `https://sankyu-transport.fun`. */
  export const API_ORIGIN: string
  /** Origin + `/api`, mis. `https://sankyu-transport.fun/api`. */
  export const API_BASE: string
}

declare module '@/services/auth' {
  import type { Ref } from 'vue'

  export interface AuthUser {
    id_admin?: number | string
    nik_admin?: string
    nama_admin?: string
    level?: string
    [key: string]: unknown
  }

  /** Pembungkus `fetch` yang menyisipkan header Authorization otomatis. */
  export function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>
  /** Ref reaktif berisi user yang sedang login (dibaca dari localStorage). */
  export const authUser: Ref<AuthUser | null>
  /** Akses ref user yang sedang login. */
  export function useAuthUser(): Ref<AuthUser | null>
  /** Muat ulang data user dari server. */
  export function refreshUser(): Promise<AuthUser | null>
  export function initAuth(): Promise<void>
  export function getToken(): string | null
  export function getUser(): AuthUser | null
  export function setUser(user: AuthUser | null): void

  export interface AuthService {
    login(nik_admin: string, password: string): Promise<AuthUser>
    logout(): void
    getToken(): string | null
    getUser(): AuthUser | null
    setUser(user: AuthUser | null): void
    refreshUser(): Promise<AuthUser | null>
    initAuth(): Promise<void>
    [key: string]: unknown
  }

  export const authService: AuthService
}

declare module '@/services/addressBookService' {
  export const addressBookService: Record<string, (...args: any[]) => any>
}

declare module '@/services/repair' {
  export const repairService: Record<string, (...args: any[]) => any>
}

declare module '@/services/masterImportService' {
  export const masterImportService: Record<string, (...args: any[]) => any>
}

declare module '@/services/monitoringKendaraanService' {
  export const monitoringKendaraanService: Record<string, (...args: any[]) => any>
}

declare module '@/services/salesCostService' {
  export const salesCostService: Record<string, (...args: any[]) => any>
}

declare module '@/services/subcontractorService' {
  export const subcontractorService: Record<string, (...args: any[]) => any>
}

// PENTING: jangan deklarasikan modul di sini bila file sebenarnya berekstensi
// `.ts` (mis. `deliveryTemplateService.ts`, `truckMileageService.ts`).
// `declare module` akan MENIMPA (shadow) modul aslinya sehingga tipe yang
// diekspor file tersebut hilang dan memicu error TS2305.
