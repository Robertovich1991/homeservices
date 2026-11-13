// Secrets and runtime settings live in /var/www/home-service/shared/.env on the server.
// The JSON store is single-writer, so the API must run as exactly one fork-mode process.
module.exports = {
  apps: [
    {
      name: 'home-service-api',
      cwd: '/var/www/home-service/current/server',
      script: 'index.js',
      node_args: '--env-file=/var/www/home-service/shared/.env',
      exec_mode: 'fork',
      instances: 1,
      max_memory_restart: '300M',
      kill_timeout: 5000,
      time: true,
    },
  ],
};
