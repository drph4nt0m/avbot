const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const Avwx = require('../../utils/Avwx');
const AvBrief3 = require('../../utils/AvBrief3');
const logger = require('../../utils/Logger');

module.exports = class RawMetarCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'raw-metar',
      group: 'weather',
      memberName: 'raw-metar',
      aliases: ['rm'],
      description: 'Gives you the live raw METAR for the chosen airport',
      examples: ['raw-metar <icao>'],
      args: [
        {
          key: 'icao',
          prompt: 'What ICAO would you like the bot to give raw METAR for?',
          type: 'string',
          parse: (val) => val.toUpperCase()
        }
      ]
    });
  }

  async run(msg, { icao }) {
    const rawMetarEmbed = new Discord.MessageEmbed()
      .setTitle(`Raw METAR for ${icao.toUpperCase()}`)
      .setColor('#0099ff')
      .setFooter(this.client.user.username)
      .setTimestamp();

    try {
      const { raw } = await Avwx.getMetar(icao);

      rawMetarEmbed.setDescription(raw);
    } catch (error) {
      logger.error(`[${this.client.shard.ids}] ${error}`);
      try {
        const { raw } = await AvBrief3.getMetar(icao);

        rawMetarEmbed.setDescription(raw);

      } catch (err) {
        logger.error(`[${this.client.shard.ids}] ${err}`);
        rawMetarEmbed.setColor('#ff0000').setDescription(`${msg.author}, ${err.message}`);
      }
    }

    return msg.embed(rawMetarEmbed);
  }
};
