const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const AvBrief3 = require('../../utils/AvBrief3');
const Avwx = require('../../utils/Avwx');

module.exports = class AtisCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'atis',
      group: 'weather',
      memberName: 'atis',
      aliases: [],
      description: 'Gives you the live ATIS for the chosen airport',
      examples: ['atis <icao>'],
      args: [
        {
          key: 'icao',
          prompt: 'What ICAO would you like the bot to give ATIS for?',
          type: 'string',
          parse: (val) => val.toUpperCase(),
        },
      ],
    });
  }

  async run(msg, { icao }) {
    const atisEmbed = new Discord.MessageEmbed()
      .setTitle(`ATIS for ${icao.toUpperCase()}`)
      .setColor('#0099ff')
      .setFooter(this.client.user.username)
      .setTimestamp();

    try {
      const { speech } = await AvBrief3.getAtis(icao);
      atisEmbed.setDescription(speech);
    } catch (error) {
      try {
        const { speech } = await Avwx.getMetar(icao);
        atisEmbed.setDescription(speech);
      } catch (err) {
        atisEmbed
          .setColor('#ff0000')
          .setDescription(`${msg.author}, ${err.message}`);
      }
    }

    return msg.embed(atisEmbed);
  }
};
