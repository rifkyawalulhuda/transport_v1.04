import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Transport Management System',
  description: 'Documentation for Sankyu Transport Management System (TMS)',
  base: '/',
  lastUpdated: false,
  // outline property removed

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' }
    ],

    sidebar: [
      {
        text: 'Changelog',
        items: [
          { text: 'Changelog v0.3', link: '/changelog/changelog' },
        ]
      },
            {
        text: 'Bug Tracker',
        collapsed: true, // default tertutup (opsional)
        items: [
          { text: '21 Januari 2026', link: '/bug-tracker/21-jan-2026' },
        ]
      },
      {
        text: 'Guide',
        items: [
          { text: 'Dashboard Overview', link: '/guide/dashboard' },
          { text: 'User Guide', link: '/guide/user-guide' },
          { text: 'Admin Guide', link: '/guide/admin-guide' }
        ]
      }
    ],

    search: {
      provider: 'local'
    },

    // ⬇️ TAMBAHKAN FOOTER DI SINI
footer: {
  message: 'Built with ❤️ using VitePress',
  copyright:
    '© 2026 <a href="https://sankyu.co.id" target="_blank">Sankyu Transport</a>'
}

  }
})
