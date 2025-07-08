// PM2 生产环境配置文件
module.exports = {
  apps: [{
    name: 'exam-system',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/your/exam-system',
    instances: 'max', // 根据CPU核心数启动实例
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      ADMIN_PASSWORD: 'your-secure-production-password',
      JWT_SECRET: 'your-very-long-and-random-secret-key'
    },
    
    // 日志配置
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // 进程管理
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    
    // 健康检查
    watch: false,
    ignore_watch: [
      'node_modules',
      'logs',
      '.next',
      'data'
    ],
    
    // 其他配置
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};
