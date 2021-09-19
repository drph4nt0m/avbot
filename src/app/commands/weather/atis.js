const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const AvBrief3 = require('../../utils/AvBrief3');
const Avwx = require('../../utils/Avwx');
const logger = require('../../utils/Logger');

module.exports = class AtisCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'atis',
      group: 'weather',
      memberName: 'atis',
      aliases: ['a'],
      description: 'Gives you the live ATIS for the chosen airport',
      examples: ['atis <icao>'],
      args: [
        {
          key: 'icao',
          prompt: 'What ICAO would you like the bot to give ATIS for?',
          type: 'string',
          parse: (val) => val.toUpperCase().replace(/\s/g, '')
        }
      ]
    });
  }

  async run(msg, { icao }) {
    if (msg.guild && !msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
      return msg.reply(
        `AvBot doesn't have permissions to send Embeds in this channel. Please enable "Embed Links" under channel permissions for AvBot.`
      );
    }
    const atisEmbed = new Discord.MessageEmbed()
      .setTitle(`ATIS for ${icao.toUpperCase()}`)
      .setColor('#0099ff')
      .setFooter(`${this.client.user.username} • This is not a source for official briefing • Please use the appropriate forums`)
      .setTimestamp();

    try {
      const { speech } = await AvBrief3.getAtis(icao);
      atisEmbed
        .setDescription(speech)
        .setFooter(
          `${this.client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AvBrief3`
        );
    } catch (error) {
      logger.error(`[${this.client.shard.ids}] ${error}`);
      try {
        const { speech } = await Avwx.getMetar(icao);
        atisEmbed
          .setDescription(speech)
          .setFooter(`${this.client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AVWX`);
      } catch (err) {
        logger.error(`[${this.client.shard.ids}] ${err}`);
        atisEmbed.setColor('#ff0000').setDescription(`${msg.author}, ${err.message}`);
      }
    }

    return msg.embed(atisEmbed);
  }
};
