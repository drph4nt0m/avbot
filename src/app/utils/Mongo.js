const MongoClient = require('mongodb').MongoClient;

const services = require('../../config/services');
const logger = require('./Logger');

let db;

try {
  MongoClient.connect(
    services.mongodb.uri,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    },
    (err, client) => {
      logger.info('MongoDB Connected');
      db = client.db('avbot');
    }
  );
} catch (error) {
  logger.error(error);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

module.exports = {
  async getDb() {
    while (!db) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(10000);
    }
    return db;
  },

  async isPremiumGuild(guildId) {
    try {
      while (!db) {
        // eslint-disable-next-line no-await-in-loop
        await sleep(10000);
      }
      const settings = await db.collection('settings');
      const guildSettings = await settings.findOne({ guild: guildId });
      return !!guildSettings.isPremium;
    } catch (error) {
      logger.error(`[x] ${error}`);
      return false;
    }
  },

  async increaseCommandCount(command) {
    try {
      while (!db) {
        // eslint-disable-next-line no-await-in-loop
        await sleep(10000);
      }
      const stats = await db.collection('stats');
      await stats.update({ command }, { $inc: { count: 1 } }, { upsert: true });
      return true;
    } catch (error) {
      logger.error(`[x] ${error}`);
      return false;
    }
  },

  async getCommandCounts() {
    try {
      while (!db) {
        // eslint-disable-next-line no-await-in-loop
        await sleep(10000);
      }
      const stats = await db.collection('stats');
      const counts = await stats.find().toArray();
      let total = 0;
      counts.forEach((c) => {
        total += c.count;
      });
      return { total, counts };
    } catch (error) {
      logger.error(`[x] ${error}`);
      return false;
    }
  },

  async increaseAPIUsage(hostname) {
    try {
      while (!db) {
        // eslint-disable-next-line no-await-in-loop
        await sleep(10000);
      }
      const apiUsage = await db.collection('api-usage');
      await apiUsage.update({ hostname }, { $inc: { count: 1 } }, { upsert: true });
      return true;
    } catch (error) {
      logger.error(`[x] ${error}`);
      return false;
    }
  },

  async getAPIUsage() {
    try {
      while (!db) {
        // eslint-disable-next-line no-await-in-loop
        await sleep(10000);
      }
      const apiUsage = await db.collection('api-usage');
      const counts = await apiUsage.find().toArray();
      return counts;
    } catch (error) {
      logger.error(`[x] ${error}`);
      return false;
    }
  }
};
