const MongoClient = require('mongodb').MongoClient;

const services = require('../../config/services');
const logger = require('./Logger');

let db;

try {
  MongoClient.connect(services.mongodb.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }, (err, client) => {
    logger.info('MongoDB Connected');
    db = client.db('avbot');
  })
} catch (error) {
  logger.error(error);
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  });
}

module.exports = {
  async getDb() {
    while (!db) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(10000)
    }
    return db;
  },

  async isPremiumGuild(guildId) {
    try {
      while (!db) {
        // eslint-disable-next-line no-await-in-loop
        await sleep(10000)
      }
      const settings = await db.collection('settings');
      const guildSettings = await settings.findOne({ guild: guildId });
      return !!guildSettings.isPremium;
    } catch (error) {
      logger.error(`[x] ${error}`);
      return false;
    }
  }
};
