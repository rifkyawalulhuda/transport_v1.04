import { createRouter, createWebHistory } from 'vue-router'
import { applyRouteMeta } from '@/utils/seo'
import { authService, initAuth } from '@/services/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { left: 0, top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'Ecommerce',
      component: () => import('../views/Ecommerce.vue'),
      meta: {
        title: 'Dashboard',
      },
    },
    {
      path: '/calendar',
      name: 'Calendar',
      component: () => import('../views/Others/Calendar.vue'),
      meta: {
        title: 'Calendar',
      },
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('../views/Others/UserProfile.vue'),
      meta: {
        title: 'Profile',
      },
    },
    {
      path: '/notifications',
      name: 'Notifications',
      component: () => import('../views/Others/Notifications.vue'),
      meta: {
        title: 'Notifications',
      },
    },
    {
      path: '/sales-cost',
      name: 'Sales Cost',
      component: () => import('../views/Transaksi/SalesCost.vue'),
      meta: {
        title: 'Sales Cost',
      },
    },
    {
      path: '/sales-cost/new',
      name: 'Input Sales Cost',
      component: () => import('../views/Transaksi/InputSalesCost.vue'),
      meta: {
        title: 'Input Sales Cost',
      },
    },
    {
      path: '/sales-cost/:id/edit',
      name: 'Edit Sales Cost',
      component: () => import('../views/Transaksi/EditSalesCost.vue'),
      meta: {
        title: 'Edit Sales Cost',
      },
    },
    {
      path: '/sales-cost/:id',
      name: 'Detail Sales Cost',
      component: () => import('../views/Transaksi/DetailSalesCost.vue'),
      meta: {
        title: 'Detail Sales Cost',
      },
    },
    {
      path: '/sales-cost/:id/print',
      name: 'Print Sales Cost',
      component: () => import('../views/Transaksi/PrintSalesCost.vue'),
      meta: {
        title: 'Print Sales Cost',
      },
    },
    {
      path: '/subcontractor',
      name: 'Sub Contractor',
      component: () => import('../views/Transaksi/Subcontractor.vue'),
      meta: {
        title: 'Sub Contractor',
      },
    },
    {
      path: '/subcontractor/new',
      name: 'Input Sub Contractor',
      component: () => import('../views/Transaksi/InputSubcontractor.vue'),
      meta: {
        title: 'Input Sub Contractor',
      },
    },
    {
      path: '/subcontractor/:id/edit',
      name: 'Edit Sub Contractor',
      component: () => import('../views/Transaksi/EditSubcontractor.vue'),
      meta: {
        title: 'Edit Sub Contractor',
      },
    },
    {
      path: '/subcontractor/:id/detail',
      name: 'Detail Sub Contractor',
      component: () => import('../views/Transaksi/DetailSubcontractor.vue'),
      meta: {
        title: 'Detail Sub Contractor',
      },
    },
    {
      path: '/repair',
      name: 'Repair',
      component: () => import('../pages/Repair/RepairList.vue'),
      meta: {
        title: 'Repair',
        roles: ['admin', 'user', 'mekanik']
      },
    },
    {
      path: '/repair/new',
      name: 'Input Repair',
      component: () => import('../pages/Repair/RepairCreate.vue'),
      meta: {
        title: 'Input Repair',
        roles: ['admin', 'user', 'mekanik']
      },
    },
    {
      path: '/repair/:id',
      name: 'Detail Repair',
      component: () => import('../pages/Repair/RepairDetail.vue'),
      meta: {
        title: 'Detail Repair',
        roles: ['admin', 'user', 'mekanik']
      },
    },
    {
      path: '/repair/:id/edit',
      name: 'Edit Repair',
      component: () => import('../pages/Repair/RepairEdit.vue'),
      meta: {
        title: 'Edit Repair',
        roles: ['admin', 'user', 'mekanik']
      },
    },
    {
      path: '/master/trucks',
      name: 'Master Truck',
      component: () => import('../views/Master/TruckMaster.vue'),
      meta: {
        title: 'Master: Trucks',
      },
    },
    {
      path: '/master/drivers',
      name: 'Master Driver',
      component: () => import('../views/Master/DriverMaster.vue'),
      meta: {
        title: 'Master: Drivers',
      },
    },
    {
      path: '/master/customers',
      name: 'Master Customer',
      component: () => import('../views/Master/CustomerMaster.vue'),
      meta: {
        title: 'Master: Customers',
      },
    },
    {
      path: '/master/areas',
      name: 'Master Area',
      component: () => import('../views/Master/AreaMaster.vue'),
      meta: {
        title: 'Master: Areas',
      },
    },
    {
      path: '/master/warehouses',
      name: 'Master Warehouse',
      component: () => import('../views/Master/WarehouseMaster.vue'),
      meta: {
        title: 'Master: Warehouses',
      },
    },
    {
      path: '/master/subconts',
      name: 'Master Subcont',
      component: () => import('../views/Master/SubcontMaster.vue'),
      meta: {
        title: 'Master: Subconts',
      },
    },
    {
      path: '/master/admins',
      name: 'Master Admin',
      component: () => import('../views/Master/AdminMaster.vue'),
      meta: {
        title: 'Master: Admins',
      },
    },
    {
      path: '/data-transport/data-truck',
      name: 'Data Truck',
      component: () => import('../views/DataTransport/DataTruck.vue'),
      meta: {
        title: 'Data Transport: Data Truck',
      },
    },
    {
      path: '/data-transport/data-truck/create',
      name: 'Create Data Truck',
      component: () => import('../views/DataTransport/InputDataTruck.vue'),
      meta: {
        title: 'Data Transport: Create Data Truck',
      },
    },
    {
      path: '/data-transport/data-truck/edit/:id',
      name: 'Edit Data Truck',
      component: () => import('../views/DataTransport/EditDataTruck.vue'),
      meta: {
        title: 'Data Transport: Edit Data Truck',
      },
    },
    {
      path: '/data-transport/data-truck/detail/:id',
      name: 'Detail Data Truck',
      component: () => import('../views/DataTransport/DetailDataTruck.vue'),
      meta: {
        title: 'Data Transport: Detail Data Truck',
      },
    },
    {
      path: '/data-transport/data-chasis',
      name: 'Data Chasis',
      component: () => import('../views/DataTransport/DataChasis.vue'),
      meta: {
        title: 'Data Transport: Data Chasis',
      },
    },
    {
      path: '/data-transport/data-chasis/create',
      name: 'Create Data Chasis',
      component: () => import('../views/DataTransport/InputDataChasis.vue'),
      meta: {
        title: 'Data Transport: Create Data Chasis',
      },
    },
    {
      path: '/data-transport/data-chasis/edit/:id',
      name: 'Edit Data Chasis',
      component: () => import('../views/DataTransport/EditDataChasis.vue'),
      meta: {
        title: 'Data Transport: Edit Data Chasis',
      },
    },
    {
      path: '/data-transport/data-chasis/detail/:id',
      name: 'Detail Data Chasis',
      component: () => import('../views/DataTransport/DetailDataChasis.vue'),
      meta: {
        title: 'Data Transport: Detail Data Chasis',
      },
    },
    {
      path: '/data-transport/data-supir',
      name: 'Data Supir',
      component: () => import('../views/DataTransport/DataSupir.vue'),
      meta: {
        title: 'Data Transport: Data Supir',
      },
    },
    {
      path: '/data-transport/data-supir/create',
      name: 'Create Data Supir',
      component: () => import('../views/DataTransport/InputDataSupir.vue'),
      meta: {
        title: 'Data Transport: Create Data Supir',
      },
    },
    {
      path: '/data-transport/data-supir/edit/:id',
      name: 'Edit Data Supir',
      component: () => import('../views/DataTransport/EditDataSupir.vue'),
      meta: {
        title: 'Data Transport: Edit Data Supir',
      },
    },
    {
      path: '/data-transport/data-supir/detail/:id',
      name: 'Detail Data Supir',
      component: () => import('../views/DataTransport/DetailDataSupir.vue'),
      meta: {
        title: 'Data Transport: Detail Data Supir',
      },
    },
    {
      path: '/line-chart',
      name: 'Line Chart',
      component: () => import('../views/Chart/LineChart/LineChart.vue'),
    },
    {
      path: '/bar-chart',
      name: 'Bar Chart',
      component: () => import('../views/Chart/BarChart/BarChart.vue'),
    },
    {
      path: '/alerts',
      name: 'Alerts',
      component: () => import('../views/UiElements/Alerts.vue'),
      meta: {
        title: 'Alerts',
      },
    },
    {
      path: '/avatars',
      name: 'Avatars',
      component: () => import('../views/UiElements/Avatars.vue'),
      meta: {
        title: 'Avatars',
      },
    },
    {
      path: '/badge',
      name: 'Badge',
      component: () => import('../views/UiElements/Badges.vue'),
      meta: {
        title: 'Badge',
      },
    },

    {
      path: '/buttons',
      name: 'Buttons',
      component: () => import('../views/UiElements/Buttons.vue'),
      meta: {
        title: 'Buttons',
      },
    },

    {
      path: '/images',
      name: 'Images',
      component: () => import('../views/UiElements/Images.vue'),
      meta: {
        title: 'Images',
      },
    },
    {
      path: '/videos',
      name: 'Videos',
      component: () => import('../views/UiElements/Videos.vue'),
      meta: {
        title: 'Videos',
      },
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Auth/Login.vue'),
      meta: {
        title: 'Login',
      },
    },
  ],
})

export default router

const APP_NAME = 'Transport App'

const toTitleCase = (value: string) =>
  value
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

const inferPageTitle = (to: { meta?: Record<string, unknown>; name?: unknown; path: string }) => {
  const metaTitle = to.meta?.title as string | undefined
  if (metaTitle) {
    return metaTitle
  }

  if (typeof to.name === 'string' && to.name.trim()) {
    return toTitleCase(to.name)
  }

  const lastSegment = to.path.split('/').filter(Boolean).pop()
  if (lastSegment) {
    return toTitleCase(lastSegment)
  }

  return APP_NAME
}

router.beforeEach(async (to, from, next) => {
  const token = authService.getToken()
  const isLoginRoute = to.path === '/login'

  if (token && !isLoginRoute) {
    await initAuth()
  }

  if (!token && !isLoginRoute) {
    return next('/login')
  }

  if (token && isLoginRoute) {
    return next('/')
  }

  const user = authService.getUser()
  if (user && to.meta.roles) {
    const roles = to.meta.roles as string[]
    if (!roles.includes(user.level)) {
      // Redirect unauthorized access to home or 403 page
      // For now redirecting to repair if mekanik tries to access other pages
      if (user.level === 'mekanik') {
        return next('/repair')
      }
      return next('/')
    }
  }

  return next()
})

router.afterEach((to) => {
  const pageTitle = inferPageTitle(to)
  applyRouteMeta(to.meta, pageTitle, APP_NAME)
})
