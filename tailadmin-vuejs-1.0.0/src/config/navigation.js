import { GridIcon, CalenderIcon, UserCircleIcon, PieChartIcon, TableIcon, BoxCubeIcon } from '@/icons'

export const getMenuGroups = (userLevel) => {
  const isAdmin = userLevel === 'admin'
  const isMekanik = userLevel === 'mekanik'
  const isCs = userLevel === 'cs'

  if (isCs) {
    return [
      {
        title: '',
        items: [
          {
            icon: GridIcon,
            name: 'Dashboard',
            subItems: [{ name: 'Schedule Pengiriman', path: '/schedule-pengiriman', pro: false }],
          },
          {
            icon: UserCircleIcon,
            name: 'User Profile',
            path: '/profile',
          },
        ],
      },
    ]
  }
  const menuGroups = [
    {
      title: '',
      items: [
        {
          icon: GridIcon,
          name: 'Dashboard',
          subItems: [
            { name: 'Home', path: '/', pro: false },
            { name: 'Schedule Pengiriman', path: '/schedule-pengiriman', pro: false }
          ],
        },
        {
          icon: CalenderIcon,
          name: 'Calendar',
          path: '/calendar',
        },
        {
          icon: UserCircleIcon,
          name: 'User Profile',
          path: '/profile',
        },
        {
          icon: TableIcon,
          name: 'Master',
          subItems: [
            { name: 'Truck', path: '/master/trucks', pro: false },
            { name: 'Driver', path: '/master/drivers', pro: false },
            { name: 'Customer', path: '/master/customers', pro: false },
            { name: 'Area', path: '/master/areas', pro: false },
            { name: 'Warehouse', path: '/master/warehouses', pro: false },
            { name: 'Subcont', path: '/master/subconts', pro: false },
            { name: 'Admin', path: '/master/admins', pro: false },
          ],
        },
        {
          icon: BoxCubeIcon,
          name: 'Data Transport',
          subItems: [
            { name: 'Data Truck', path: '/data-transport/data-truck', pro: false },
            { name: 'Data Chasis', path: '/data-transport/data-chasis', pro: false },
            { name: 'Data Supir', path: '/data-transport/data-supir', pro: false },
          ],
        },
        {
          icon: TableIcon,
          name: 'Transaksi',
          subItems: [
            { name: 'Sales Cost', path: '/sales-cost', pro: false },
            { name: 'Subcontractor', path: '/subcontractor', pro: false },
            { name: 'Repair', path: '/repair', pro: false },
          ],
        },
      ],
    },
    {
      title: 'Others',
      searchable: false,
      items: [
        {
          icon: PieChartIcon,
          name: 'Charts',
          subItems: [
            { name: 'Line Chart', path: '/line-chart', pro: false },
            { name: 'Bar Chart', path: '/bar-chart', pro: false },
          ],
        },
        {
          icon: BoxCubeIcon,
          name: 'Ui Elements',
          subItems: [
            { name: 'Alerts', path: '/alerts', pro: false },
            { name: 'Avatars', path: '/avatars', pro: false },
            { name: 'Badge', path: '/badge', pro: false },
            { name: 'Buttons', path: '/buttons', pro: false },
            { name: 'Images', path: '/images', pro: false },
            { name: 'Videos', path: '/videos', pro: false },
          ],
        },
      ],
    },
  ]

  if (isMekanik) {
    // Filter menu for mekanik
    menuGroups.forEach((group) => {
      // Remove Master menu
      group.items = group.items.filter((item) => item.name !== 'Master')
      
      // Filter Transaksi menu
      const transaksiMenu = group.items.find((item) => item.name === 'Transaksi')
      if (transaksiMenu) {
        transaksiMenu.subItems = transaksiMenu.subItems.filter(
          (subItem) => subItem.name === 'Repair'
        )
      }
    })
  } else if (!isAdmin) {
    menuGroups.forEach((group) => {
      group.items = group.items.filter((item) => item.name !== 'Master')
    })
  }

  return menuGroups
}

export const flattenMenuGroups = (menuGroups) => {
  const routes = []

  menuGroups.forEach((group) => {
    if (group.searchable === false) {
      return
    }
    const groupTitle = group.title || ''
    group.items.forEach((item) => {
      if (item.searchable === false) {
        return
      }
      if (item.path) {
        routes.push({
          name: item.name,
          path: item.path,
          groupTitle,
          parentName: null,
        })
      }
      if (Array.isArray(item.subItems)) {
        item.subItems.forEach((subItem) => {
          if (!subItem.path || subItem.searchable === false) {
            return
          }
          routes.push({
            name: subItem.name,
            path: subItem.path,
            groupTitle,
            parentName: item.name,
          })
        })
      }
    })
  })

  return routes
}
