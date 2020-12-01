const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const Ivao = require('../../utils/Ivao');

module.exports = class IvaoCommand extends (
  Command
) {
  constructor(client) {
    super(client, {
      name: 'ivao',
      group: 'ivao',
      memberName: 'ivao',
      aliases: [],
      description:
        'Gives you the information for the chosen call sign on the IVAO network',
      examples: ['ivao <call_sign>'],
      args: [
        {
          key: 'callSign',
          prompt:
            'What call sign would you like the bot to give information for?',
          type: 'string',
          parse: (val) => val.toUpperCase(),
        },
      ],
    });
  }

  async run(msg, { callSign }) {
    const ivaoEmbed = new Discord.MessageEmbed()
      .setTitle(`${callSign.toUpperCase()}`)
      .setColor('#0099ff')
      .setFooter(`${this.client.user.username} • Source: IVAO API`)
      .setTimestamp();

    try {
      const { ivaoClient } = await Ivao.getClientInfo(callSign);

      ivaoEmbed
        .setTitle(`IVAO : ${callSign} (open on Webeye)`)
        .setURL(`https://webeye.ivao.aero/?callsign=${ivaoClient.callSign}`);

      if (ivaoClient.clientType === 'PILOT') {
        ivaoEmbed.addFields(
          {
            name: `Call Sign`,
            value: ivaoClient.callSign,
            inline: true,
          },
          {
            name: `VID`,
            value: ivaoClient.vid,
            inline: true,
          },
          {
            name: `Rating`,
            value: ivaoClient.atcPilotRating,
            inline: true,
          },
          {
            name: `Departure`,
            value: ivaoClient.departureAerodrome,
            inline: true,
          },
          {
            name: `Destination`,
            value: ivaoClient.destinationAerodrome,
            inline: true,
          },
          {
            name: `Transponder`,
            value: ivaoClient.transponderCode,
            inline: true,
          },
          {
            name: `Latitude`,
            value: ivaoClient.latitude,
            inline: true,
          },
          {
            name: `Longitude`,
            value: ivaoClient.longitude,
            inline: true,
          },
          {
            name: `Altitude`,
            value: ivaoClient.altitude,
            inline: true,
          },
          {
            name: `Groundspeed`,
            value: ivaoClient.groundSpeed,
            inline: true,
          },
          {
            name: `Cruising Speed`,
            value: ivaoClient.cruisingSpeed,
            inline: true,
          },
          {
            name: `Cruising Level`,
            value: ivaoClient.cruisingLevel,
            inline: true,
          },
          {
            name: `Departure Time`,
            value: ivaoClient.departureTime,
            inline: true,
          },
          {
            name: `EET`,
            value: `${ivaoClient.eetHours}:${ivaoClient.eetMinutes}`,
            inline: true,
          },
          {
            name: `Aircraft`,
            value: ivaoClient.aircraft.split('/')[1],
            inline: true,
          },
          {
            name: `Route`,
            value: ivaoClient.route,
            inline: true,
          }
        );
      } else if (ivaoClient.clientType === 'ATC') {
        ivaoEmbed.addFields(
          {
            name: `Call Sign`,
            value: ivaoClient.callSign,
            inline: true,
          },
          {
            name: `VID`,
            value: ivaoClient.vid,
            inline: true,
          },
          {
            name: `Rating`,
            value: ivaoClient.atcPilotRating,
            inline: true,
          },
          {
            name: `Position`,
            value: ivaoClient.facilityType,
            inline: true,
          },
          {
            name: `Frequency`,
            value: ivaoClient.frequency,
            inline: true,
          },
          {
            name: `ATIS`,
            value: ivaoClient.atis,
            inline: true,
          }
        );
      }
    } catch (error) {
      ivaoEmbed
        .setColor('#ff0000')
        .setDescription(`${msg.author}, ${error.message}`);
    }

    return msg.embed(ivaoEmbed);
  }
};
