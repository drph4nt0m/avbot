const MongoClient = require('mongodb').MongoClient;
const services = require('../../config/services');
const logger = require('./Logger');

module.exports = class Database {

  static async isPremiumGuild(guildId) {
    try {
      const client = await MongoClient.connect(services.mongodb.uri, { useUnifiedTopology: true });
      const settings = client.db('avbot').collection('settings');
      const guildSettings = await settings.findOne({ guild: guildId });
      client.close();
      return !!guildSettings.isPremium;
    } catch (error) {
      logger.error(`[x] ${error}`);
      return false;
    }
  }
};
