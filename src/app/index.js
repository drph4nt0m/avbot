require('../config/setup');
require('./server');

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

let shards = 1;
if (services.environment === 'production') {
  shards = 4;
}

manager.spawn(shards, 1000, -1);
