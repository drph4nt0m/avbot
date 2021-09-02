module.exports = {
  apps: [
    {
      name: 'avbot',
      script: 'node',
      args: './src/app/index.js',
      watch: ['src'],
      watch_delay: 1000,
      ignore_watch: ['node_modules', 'tmp', '*.log']
    }
  ]
};
