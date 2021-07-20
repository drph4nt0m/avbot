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
          parse: (val) => val.toUpperCase()
        }
      ]
    });
  }

  async run(msg, { icao }) {
    const briefEmbed = new Discord.MessageEmbed()
      .setTitle(`BRIEF for ${icao}`)
      .setColor('#0099ff')
      .setFooter(`${this.client.user.username} • This is not a source for official briefing. Please use the appropriate forums.`)
      .setTimestamp();

    const zuluTime = Dayjs.utc().format('YYYY-MM-DD HH:mm:ss [Z]');

    briefEmbed.addField(`**Zulu**`, `${zuluTime}`);

    try {
      const { raw } = await Avwx.getMetar(icao);

      briefEmbed.addField(`**METAR**`, raw);
    } catch (error) {
      logger.error(`[${this.client.shard.ids}] ${error}`);
      try {
        const { raw } = await AvBrief3.getMetar(icao);

        briefEmbed.addField('**METAR**', raw);
      } catch (err) {
        logger.error(`[${this.client.shard.ids}] ${err}`);
      }
    }

    try {
      const { raw } = await Avwx.getTaf(icao);

      briefEmbed.addField(`**TAF**`, raw);
    } catch (error) {
      logger.error(`[${this.client.shard.ids}] ${error}`);
      try {
        const { raw } = await AvBrief3.getTaf(icao);

        briefEmbed.addField('**TAF**', raw);
      } catch (err) {
        logger.error(`[${this.client.shard.ids}] ${err}`);
      }
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
