const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const Avwx = require('../../utils/Avwx');
const AvBrief3 = require('../../utils/AvBrief3');
const logger = require('../../utils/Logger');

module.exports = class TafCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'taf',
      group: 'weather',
      memberName: 'taf',
      aliases: [],
      description: 'Gives you the live TAF for the chosen airport',
      examples: ['taf <icao>'],
      args: [
        {
          key: 'icao',
          prompt: 'What ICAO would you like the bot to give TAF for?',
          type: 'string',
          parse: (val) => val.toUpperCase()
        }
      ]
    });
  }

  async run(msg, { icao }) {
    const tafEmbed = new Discord.MessageEmbed()
      .setTitle(`TAF for ${icao.toUpperCase()}`)
      .setColor('#0099ff')
      .setFooter(this.client.user.username)
      .setTimestamp();

    try {
      const { raw, readable } = await Avwx.getTaf(icao);

      tafEmbed.addFields(
        {
          name: 'Raw Report',
          value: raw
        },
        {
          name: 'Readable Report',
          value: readable
        }
      );
    } catch (error) {
      logger.error(`[${this.client.shard.ids}] ${error}`);
      try {
        const { raw } = await AvBrief3.getTaf(icao);

        tafEmbed.addFields({
          name: 'Raw Report',
          value: raw
        });
      } catch (err) {
        logger.error(`[${this.client.shard.ids}] ${err}`);
        tafEmbed.setColor('#ff0000').setDescription(`${msg.author}, ${err.message}`);
      }
    }

    return msg.embed(tafEmbed);
  }
};
