const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const Dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const Avwx = require('../../utils/Avwx');
const Charts = require('../../utils/Charts');

Dayjs.extend(utc);

module.exports = class ChartCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'chart',
      group: 'misc',
      memberName: 'chart',
      aliases: ['charts'],
      description: 'Gives you the the latest chart for the chosen airport',
      examples: ['chart <icao>'],
      hidden: true,
      args: [
        {
          key: 'icao',
          prompt: 'What ICAO would you like the bot to give you chart for?',
          type: 'string',
          parse: (val) => val.toUpperCase(),
        },
      ],
    });
  }

  async run(msg, { icao }) {
    const chartEmbed = new Discord.MessageEmbed()
      .setTitle(`CHART for ${icao}`)
      .setColor('#0099ff')
      .setFooter(
        `${this.client.user.username} • This is not a source for official briefing. Please use the appropriate forums.`
      )
      .setTimestamp();

    // disable the command
    chartEmbed
      .setColor('#00ff00')
      .setDescription(
        `${msg.author}, we are migrating from Jepessen charts to freely
        and openly available charts and hence chart is temporarily disabled.
        We need the community's help in doing so.
        Help us in collecting such charts by joining our support server.
        https://link.avbot.in/support`
      )
      .setFooter(
        `${this.client.user.username} • @dr_ph4nt0m#6615 • Thank you for showing your support by using AvBot`
      );

    return msg.embed(chartEmbed);

    try {
      const chart = await Charts.getChart(icao);

      chartEmbed.setDescription(`[Click here for ${icao} Charts](${chart})`);
    } catch (error) {
      try {
        await Avwx.getStation(icao);

        chartEmbed
          .setColor('#ff0000')
          .setDescription(
            `${msg.author}, ${icao} chart is not available in our database`
          );
      } catch (err) {
        chartEmbed
          .setColor('#ff0000')
          .setDescription(`${msg.author}, ${err.message}`);
      }
    }
    return msg.embed(chartEmbed);
  }
};
