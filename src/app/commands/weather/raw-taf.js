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
          parse: (val) => val.toUpperCase()
        }
      ]
    });
  }

  async run(msg, { icao }) {
    const rawTafEmbed = new Discord.MessageEmbed()
      .setTitle(`Raw TAF for ${icao.toUpperCase()}`)
      .setColor('#0099ff')
      .setFooter(this.client.user.username)
      .setTimestamp();

    try {
      const { raw } = await Avwx.getTaf(icao);

      rawTafEmbed.setDescription(raw);
    } catch (error) {
      logger.error(`[${this.client.shard.ids}] ${error}`);
      try {
        const { raw } = await AvBrief3.getTaf(icao);

        rawTafEmbed.setDescription(raw);
      } catch (err) {
        logger.error(`[${this.client.shard.ids}] ${err}`);
        rawTafEmbed.setColor('#ff0000').setDescription(`${msg.author}, ${err.message}`);
      }
    }

    return msg.embed(rawTafEmbed);
  }
};
