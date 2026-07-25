module.exports = {
  apps: [
    {
      name: 'transport-backend-prod',
      script: 'server.js',
      cwd: './node_backend',
      watch: false,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
