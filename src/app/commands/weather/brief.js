const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const Dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const Avwx = require('../../utils/Avwx');
const Charts = require('../../utils/Charts');
const AvBrief3 = require('../../utils/AvBrief3');
const logger = require('../../utils/Logger');

Dayjs.extend(utc);

module.exports = class BriefCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'brief',
      group: 'weather',
      memberName: 'brief',
      aliases: ['b'],
      description: 'Gives you the live METAR, zulu time and the latest chart for the chosen airport',
      examples: ['brief <icao>'],
      args: [
        {
          key: 'icao',
          prompt: 'What ICAO would you like the bot to BRIEF you for?',
          type: 'string',
          parse: (val) => val.toUpperCase().replace(/\s/g, '')
        }
      ]
    });
  }

  async run(msg, { icao }) {
    if (!msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
      return msg.reply(
        `AvBot doesn't have permissions to send Embeds in this channel. Please enable "Embed Links" under channel permissions for AvBot.`
      );
    }
    const briefEmbed = new Discord.MessageEmbed()
      .setTitle(`BRIEF for ${icao}`)
      .setColor('#0099ff')
      .setFooter(`${this.client.user.username} • This is not a source for official briefing • Please use the appropriate forums`)
      .setTimestamp();

    const zuluTime = Dayjs.utc().format('YYYY-MM-DD HH:mm:ss [Z]');

    briefEmbed.addField(`**Zulu**`, `${zuluTime}`);

    const sourcesList = [];
    try {
      const { raw } = await Avwx.getMetar(icao);
      sourcesList.push('AVWX');

      briefEmbed.addField(`**METAR**`, raw);
    } catch (error) {
      logger.error(`[${this.client.shard.ids}] ${error}`);
      try {
        const { raw } = await AvBrief3.getMetar(icao);
        sourcesList.push('AvBrief3');

        briefEmbed.addField('**METAR**', raw);
      } catch (err) {
        logger.error(`[${this.client.shard.ids}] ${err}`);
      }
    }

    try {
      const { raw } = await Avwx.getTaf(icao);
      sourcesList.push('AVWX');

      briefEmbed.addField(`**TAF**`, raw);
    } catch (error) {
      logger.error(`[${this.client.shard.ids}] ${error}`);
      try {
        const { raw } = await AvBrief3.getTaf(icao);
        sourcesList.push('AvBrief3');

        briefEmbed.addField('**TAF**', raw);
      } catch (err) {
        logger.error(`[${this.client.shard.ids}] ${err}`);
      }
    }

    const sources = sourcesList.filter((v, i, a) => a.indexOf(v) === i).join(' | ');
    if (sources) {
      briefEmbed.setFooter(
        `${this.client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: ${sources}`
      );
    }

    try {
      const chart = await Charts.getChart(icao);

      briefEmbed.addField(`**CHART**`, `[Click here for ${icao} Charts](${chart.link})`);
    } catch (err) {
      logger.error(`[${this.client.shard.ids}] ${err}`);
    }

    return msg.embed(briefEmbed);
  }
};
