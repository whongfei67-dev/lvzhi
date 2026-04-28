// ============================================
// 律植 - PM2 进程管理配置
// 位置: /root/lvzhi/ecosystem.config.js
// ============================================

module.exports = {
  apps: [
    // API 后端服务
    {
      name: 'lvzhi-api',
      script: 'dist/index.js',
      cwd: '/root/lvzhi/api',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      // 日志配置
      error_file: '/root/.pm2/logs/lvzhi-api-error.log',
      out_file: '/root/.pm2/logs/lvzhi-api-out.log',
      log_file: '/root/.pm2/logs/lvzhi-api.log',
      time: true,
      // 资源限制
      max_memory_restart: '500M',
      // 自动重启
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      // 监听重启（代码变化时）
      watch: false,
      ignore_watch: ['node_modules', '.next', 'dist', 'logs'],
      // 重启延迟
      wait_ready: true,
      kill_timeout: 5000
    },
    
    // Web 前端服务
    {
      name: 'lvzhi-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: '/root/lvzhi/web',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // 日志配置
      error_file: '/root/.pm2/logs/lvzhi-web-error.log',
      out_file: '/root/.pm2/logs/lvzhi-web-out.log',
      log_file: '/root/.pm2/logs/lvzhi-web.log',
      time: true,
      // 资源限制
      max_memory_restart: '1G',
      // 自动重启
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      // 监听重启
      watch: false,
      ignore_watch: ['node_modules', '.next', 'dist', 'logs'],
      // 重启延迟
      wait_ready: true,
      kill_timeout: 5000
    }
  ]
};
