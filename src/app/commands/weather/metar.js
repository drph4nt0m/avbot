const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const Avwx = require('../../utils/Avwx');
const AvBrief3 = require('../../utils/AvBrief3');

module.exports = class MetarCommand extends (
  Command
) {
  constructor(client) {
    super(client, {
      name: 'metar',
      group: 'weather',
      memberName: 'metar',
      aliases: [],
      description: 'Gives you the live METAR for the chosen airport',
      examples: ['metar <icao>'],
      args: [
        {
          key: 'icao',
          prompt: 'What ICAO would you like the bot to give METAR for?',
          type: 'string',
          parse: (val) => val.toUpperCase(),
        },
      ],
    });
  }

  async run(msg, { icao }) {
    const metarEmbed = new Discord.MessageEmbed()
      .setTitle(`METAR for ${icao.toUpperCase()}`)
      .setColor('#0099ff')
      .setFooter(this.client.user.username)
      .setTimestamp();

    try {
      const { raw, readable } = await Avwx.getMetar(icao);

      metarEmbed.addFields(
        {
          name: 'Raw Report',
          value: raw,
        },
        {
          name: 'Readable Report',
          value: readable,
        }
      );
    } catch (error) {
      try {
        const { raw } = await AvBrief3.getMetar(icao);

        metarEmbed.addFields({
          name: 'Raw Report',
          value: raw,
        });
      } catch (err) {
        metarEmbed
          .setColor('#ff0000')
          .setDescription(`${msg.author}, ${err.message}`);
      }
    }

    return msg.embed(metarEmbed);
  }
};
