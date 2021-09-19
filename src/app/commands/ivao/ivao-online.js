const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const Ivao = require('../../utils/Ivao');
const logger = require('../../utils/Logger');

module.exports = class IvaoOnlineCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'ivao-online',
      group: 'ivao',
      memberName: 'ivao-online',
      aliases: ['io', 'ivaoonline'],
      description: 'Gives you the information for all ATCs which match the given partial callsign on the IVAO network',
      examples: ['ivao-online <partial_icao_code>'],
      args: [
        {
          key: 'partialCallSign',
          prompt: 'What partial callsign would you like the bot to give information for?',
          type: 'string',
          parse: (val) =>
            val
              .toUpperCase()
              .replace(/[^A-Z0-9_]/g, '')
              .replace(/\s/g, '')
        }
      ]
    });
  }

  async run(msg, { partialCallSign }) {
    if (msg.guild && !msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
      return msg.reply(
        `AvBot doesn't have permissions to send Embeds in this channel. Please enable "Embed Links" under channel permissions for AvBot.`
      );
    }
    const ivaoEmbed = new Discord.MessageEmbed()
      .setTitle(`${partialCallSign.toUpperCase()}`)
      .setColor('#0099ff')
      .setFooter(`${this.client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: IVAO API`)
      .setTimestamp();

    try {
      const { atcList } = await Ivao.getPartialAtcClientInfo(partialCallSign);

      ivaoEmbed.setTitle(`IVAO : ${partialCallSign}`);

      atcList.forEach((atc) => {
        ivaoEmbed.addField(`${atc.callSign}`, `VID: ${atc.vid}, Frequency: ${atc.frequency}`);
      });
    } catch (error) {
      logger.error(`[${this.client.shard.ids}] ${error}`);
      ivaoEmbed.setColor('#ff0000').setDescription(`${msg.author}, ${error.message}`);
    }

    return msg.embed(ivaoEmbed);
  }
};
