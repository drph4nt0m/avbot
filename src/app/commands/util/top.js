const Discord = require('discord.js');
const { Command } = require('discord.js-commando');

module.exports = class TopCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'top',
      group: 'util',
      memberName: 'top',
      aliases: [],
      description: 'Gives you the top servers.',
      examples: ['top'],
      args: [
        {
          key: 'count',
          default: '1000',
          prompt: 'What would you like the minimum member count to be?',
          type: 'string',
        },
      ],
      ownerOnly: true,
    });
  }

  async run(msg, { count }) {
    const topServers = await this.client.shard
      .broadcastEval(
        `this.guilds.cache
        .map((g) => {
          return {
            id: g.id,
            name: g.name,
            owner: g.owner ? g.owner.user.tag : 'unkown',
            memberCount: g.memberCount,
          };
        })`
      )
      .then((guilds) => [].concat(...guilds))
      .then((guilds) => guilds.filter((guild) => guild.memberCount >= count))
      .then((guilds) => guilds.sort());

    topServers.forEach((s) => {
      const topsEmbed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('AvBot Top Servers!')
        .setURL('https://avbot.in')
        .setThumbnail('https://avbot.in/assets/logo.png')
        .setFooter(this.client.user.username)
        .setTimestamp()
        .addFields([
          {
            name: 'Name',
            value: s.name,
          },
          {
            name: 'Id',
            value: `[${s.id}](https://top.gg/servers/${s.id})`,
          },
          {
            name: 'Owner',
            value: s.owner,
          },
          {
            name: '# of members',
            value: s.memberCount,
          },
        ]);
      msg.embed(topsEmbed);
    });
    return null;
  }
};
