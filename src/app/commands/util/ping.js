const { oneLine } = require('common-tags');
const { Command } = require('discord.js-commando');

module.exports = class PingCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'ping',
      group: 'util',
      memberName: 'ping',
      aliases: [],
      description: "Checks the AvBot's ping to the Discord server",
      examples: ['ping'],
      hidden: true,
      throttling: {
        usages: 5,
        duration: 10
      }
    });
  }

  async run(msg) {
    const pingMsg = await msg.reply('Pinging...');
    return pingMsg.edit(oneLine`
      ${msg.channel.type !== 'dm' ? `${msg.author},` : ''}
      Pong! The message round-trip took
      ${(pingMsg.editedTimestamp || pingMsg.createdTimestamp) - (msg.editedTimestamp || msg.createdTimestamp)}ms.
      ${this.client.ws.ping ? `The heartbeat ping is ${Math.round(this.client.ws.ping)}ms.` : ''}
    `);
  }
};
