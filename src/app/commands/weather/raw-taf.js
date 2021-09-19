const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const Avwx = require('../../utils/Avwx');
const AvBrief3 = require('../../utils/AvBrief3');
const logger = require('../../utils/Logger');

module.exports = class RawTafCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'raw-taf',
      group: 'weather',
      memberName: 'raw-taf',
      aliases: ['rt'],
      description: 'Gives you the live raw TAF for the chosen airport',
      examples: ['raw-taf <icao>'],
      args: [
        {
          key: 'icao',
          prompt: 'What ICAO would you like the bot to give raw TAF for?',
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
    const rawTafEmbed = new Discord.MessageEmbed()
      .setTitle(`Raw TAF for ${icao.toUpperCase()}`)
      .setColor('#0099ff')
      .setFooter(`${this.client.user.username} • This is not a source for official briefing • Please use the appropriate forums`)
      .setTimestamp();

    try {
      const { raw } = await Avwx.getTaf(icao);

      rawTafEmbed
        .setDescription(raw)
        .setFooter(`${this.client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AVWX`);
    } catch (error) {
      logger.error(`[${this.client.shard.ids}] ${error}`);
      try {
        const { raw } = await AvBrief3.getTaf(icao);

        rawTafEmbed
          .setDescription(raw)
          .setFooter(
            `${this.client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AvBrief3`
          );
      } catch (err) {
        logger.error(`[${this.client.shard.ids}] ${err}`);
        rawTafEmbed.setColor('#ff0000').setDescription(`${msg.author}, ${err.message}`);
      }
    }

    return msg.embed(rawTafEmbed);
  }
};
