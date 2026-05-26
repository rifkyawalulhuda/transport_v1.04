import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Transport Management System',
  description: 'Documentation for Sankyu Transport Management System (TMS)',
  base: '/transport_v1.04/',
  lastUpdated: false,

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Developer', link: '/developer/tech-stack' },
      { text: 'Guide', link: '/guide/dashboard' }
    ],

    sidebar: [
      {
        text: 'Developer Documentation',
        items: [
          { text: 'Tech Stack', link: '/developer/tech-stack' },
          { text: 'Architecture', link: '/developer/architecture' },
          { text: 'Development Setup', link: '/developer/development-setup' },
          { text: 'Database & Migrations', link: '/developer/database' },
          { text: 'API Reference', link: '/developer/api-reference' },
          { text: 'Deployment', link: '/developer/deployment' },
          { text: 'Troubleshooting', link: '/developer/troubleshooting' },
          { text: 'Coding Conventions', link: '/developer/conventions' }
        ]
      },
      {
        text: 'Guide',
        items: [
          { text: 'Dashboard Overview', link: '/guide/dashboard' },
          { text: 'User Guide', link: '/guide/user-guide' },
          { text: 'Admin Guide', link: '/guide/admin-guide' }
        ]
      },
      {
        text: 'Changelog',
        items: [
          { text: 'Changelog v0.3', link: '/changelog/changelog' }
        ]
      },
      {
        text: 'Bug Tracker',
        collapsed: true,
        items: [
          { text: '21 Januari 2026', link: '/bug-tracker/21-jan-2026' }
        ]
      }
    ],

    search: {
      provider: 'local'
    },

    footer: {
      message: 'Built with ❤️ using VitePress',
      copyright:
        '© 2026 <a href="https://sankyu.co.id" target="_blank">Sankyu Transport</a>'
    }
  }
})
