const path = require('path');
const { CommandoClient } = require('discord.js-commando');
const { MongoClient } = require('mongodb');
const MongoDBProvider = require('commando-provider-mongo').MongoDBProvider;
const DBL = require('dblapi.js');
const { MessageEmbed } = require('discord.js');
const services = require('../config/services');
const logger = require('./utils/Logger');
const Mongo = require('./utils/Mongo');

const client = new CommandoClient({
  commandPrefix: '!',
  owner: services.discord.owners,
  invite: services.discord.supportServerInvite,
  nonCommandEditable: true
});

client
  .setProvider(
    MongoClient.connect(services.mongodb.uri, {
      useUnifiedTopology: true
    }).then((cl) => new MongoDBProvider(cl, 'avbot'))
  )
  .then(() => {
    logger.info(`[${client.shard.ids}] MongoDB Connected!`);
  })
  .catch((error) => logger.error(`[${client.shard.ids}] ${error}`));

client.registry
  .registerDefaultTypes()
  .registerGroups([
    ['util', 'Utility commands'],
    ['weather', 'Weather commands'],
    ['ivao', 'IVAO commands'],
    ['vatsim', 'VATSIM commands'],
    ['time', 'Time commands'],
    ['misc', 'Miscellaneous commands']
  ])
  .registerCommandsIn(path.join(__dirname, 'commands'));

const dbl = new DBL(services.dbl.token, client);

client.once('ready', async () => {
  logger.info(`[${client.shard.ids}] Logged in as ${client.user.tag}! (${client.user.id})`);

  let guildsCount = (await client.shard.fetchClientValues('guilds.cache.size')).reduce((acc, guildCount) => acc + guildCount, 0);
  let commandsCount = (await Mongo.getCommandCounts()).total;

  client.user.setActivity({
    type: 'WATCHING',
    name: `${guildsCount} servers | ${commandsCount}+ commands used`
  });

  setInterval(async () => {
    dbl.postStats(client.guilds.size, client.shard.Id);

    guildsCount = (await client.shard.fetchClientValues('guilds.cache.size')).reduce((acc, guildCount) => acc + guildCount, 0);
    commandsCount = (await Mongo.getCommandCounts()).total;

    client.user.setActivity({
      type: 'WATCHING',
      name: `${guildsCount} servers | ${commandsCount}+ commands used`
    });
  }, 1800000);
});

client.on('guildCreate', (guild) => {
  try {
    const welcomeEmbed = new MessageEmbed()
      .setTitle(`Hello ${guild.name} and thank you for choosing AvBot`)
      .setColor('#1a8fe3')
      .setDescription(
        `If you need any help regarding AvBot or have any suggestions join our [AvBot Support Server](https://link.avbot.in/support).
        To get started try \`!help\`.
        [Buy me a coffee](https://link.avbot.in/donate)`
      )
      .setFooter(`${client.user.username} • @dr_ph4nt0m#6615 • Thank you for showing your support by using AvBot`)
      .setTimestamp();

    guild.channels.cache
      .filter((c) => c.type === 'text')
      .first()
      .send(welcomeEmbed);
  } catch (error) {
    logger.error(`[${client.shard.ids}] ${error}`);
  }
});

client.on('commandRun', (command) => {
  Mongo.increaseCommandCount(command.name);
});

client.on('error', (error) => logger.error(`[${client.shard.ids}] ${error}`));

client.login(services.discord.token);

// Optional events
dbl.on('posted', () => {
  logger.info(`[${client.shard.ids}] Server count posted!`);
});

dbl.on('error', (error) => {
  logger.error(`[${client.shard.ids}] Oops! ${error}`);
});
