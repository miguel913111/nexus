module.exports = {
  apps: [
    {
      name: 'nexus-api',
      script: './scripts/start-api.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3002,
      },
      log_file: './logs/nexus-api.log',
      error_file: './logs/nexus-api-error.log',
      out_file: './logs/nexus-api-out.log',
      time: true,
    },
    {
      name: 'nexus-web',
      script: './scripts/start-web.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      log_file: './logs/nexus-web.log',
      error_file: './logs/nexus-web-error.log',
      out_file: './logs/nexus-web-out.log',
      time: true,
    },
  ],
};
