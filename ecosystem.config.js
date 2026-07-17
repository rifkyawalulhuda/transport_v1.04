module.exports = {
  apps: [
    {
      name: 'transport-backend',
      script: 'server.js',
      cwd: './node_backend',
      watch: false,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'transport-frontend',
      script: './tailadmin-vuejs-1.0.0/node_modules/vite/bin/vite.js',
      cwd: './tailadmin-vuejs-1.0.0',
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
}
