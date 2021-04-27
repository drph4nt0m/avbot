const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const Dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const Avwx = require('../../utils/Avwx');
const Charts = require('../../utils/Charts');
const logger = require('../../utils/Logger');

Dayjs.extend(utc);

module.exports = class ChartCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'chart',
      group: 'misc',
      memberName: 'chart',
      aliases: ['c', 'charts'],
      description: 'Gives you the the latest chart for the chosen airport',
      examples: ['chart <icao>'],
      hidden: true,
      args: [
        {
          key: 'icao',
          prompt: 'What ICAO would you like the bot to give you chart for?',
          type: 'string',
          parse: (val) => val.toUpperCase()
        }
      ]
    });
  }

  async run(msg, { icao }) {
    const chartEmbed = new Discord.MessageEmbed()
      .setTitle(`CHART for ${icao}`)
      .setColor('#0099ff')
      .setFooter(`${this.client.user.username} • This is not a source for official briefing. Please use the appropriate forums.`)
      .setTimestamp();

    try {
      const chart = await Charts.getChart(icao);

      if (!chart) {
        throw new Error(`${icao} chart is not available in our database`)
      }
      chartEmbed.setDescription(`[Click here for ${icao} Charts](${chart.link})`);
    } catch (error) {
      logger.error(`[${this.client.shard.ids}] ${error}`);
      try {
        await Avwx.getStation(icao);
        chartEmbed.setColor('#ff0000').setDescription(`${msg.author}, ${icao} chart is not available in our database`);
      } catch (err) {
        logger.error(`[${this.client.shard.ids}] ${error}`);
        chartEmbed.setColor('#ff0000').setDescription(`${msg.author}, ${icao} chart is not available in our database`);
      }
    }
    return msg.embed(chartEmbed);
  }
};
