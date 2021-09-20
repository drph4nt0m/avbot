const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const Mongo = require('../../utils/Mongo');

module.exports = class ApiCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'api',
      group: 'util',
      memberName: 'api',
      aliases: ['apis'],
      description: "Gives you the AvBot's usage of APIs",
      examples: ['api'],
      ownerOnly: true
    });
  }

  async run(msg) {
    if (msg.guild && !msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
      return msg.reply(
        `AvBot doesn't have permissions to send Embeds in this channel. Please enable "Embed Links" under channel permissions for AvBot.`
      );
    }
    const apisCounts = await Mongo.getAPIUsage();

    const apisEmbed = new Discord.MessageEmbed()
      .setColor('#0099ff')
      .setTitle('API Usages!')
      .setURL('https://avbot.in')
      .setThumbnail('https://avbot.in/assets/logo.png')
      .setFooter(`${this.client.user.username} • @dr_ph4nt0m#8402`)
      .setTimestamp();

    apisCounts
      .sort((a, b) => b.count - a.count)
      .forEach((c) => {
        apisEmbed.addField(c.hostname, `${c.count}`, false);
      });

    return msg.embed(apisEmbed);
  }
};
