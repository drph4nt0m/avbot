require('../config/setup');
require('../config/sentry');

const { ShardingManager } = require('discord.js');
const services = require('../config/services');
const logger = require('./utils/Logger');

const manager = new ShardingManager('src/app/bot.js', {
  totalShards: 'auto',
  token: services.discord.token
});

manager.on('shardCreate', (shard) => {
  logger.info(`Launched shard ${shard.id}`);
});

manager.spawn();
