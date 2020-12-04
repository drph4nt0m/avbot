const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const logger = require('../../utils/Logger');
const Vatsim = require('../../utils/Vatsim');

module.exports = class VatsimCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'vatsim',
      group: 'vatsim',
      memberName: 'vatsim',
      aliases: [],
      description: 'Gives you the information for the chosen call sign on the VATSIM network',
      examples: ['vatsim <call_sign>'],
      args: [
        {
          key: 'callSign',
          prompt: 'What call sign would you like the bot to give information for?',
          type: 'string',
          parse: (val) => val.toUpperCase()
        }
      ]
    });
  }

  async run(msg, { callSign }) {
    const vatsimEmbed = new Discord.MessageEmbed()
      .setTitle(`${callSign.toUpperCase()}`)
      .setColor('#0099ff')
      .setFooter(`${this.client.user.username} • Source: VATSIM API`)
      .setTimestamp();

    try {
      const { vatsimClient } = await Vatsim.getClientInfo(callSign);

      vatsimEmbed.setTitle(`Vatsim : ${callSign}`);
      // .setURL(`https://webeye.ivao.aero/?callsign=${vatsimClient.callSign}`)

      if (vatsimClient.clientType === 'PILOT') {
        vatsimEmbed.addFields(
          {
            name: `Call Sign`,
            value: vatsimClient.callSign,
            inline: true
          },
          {
            name: `CID`,
            value: vatsimClient.cid,
            inline: true
          },
          {
            name: `Name`,
            value: vatsimClient.name,
            inline: true
          },
          {
            name: `Departure`,
            value: vatsimClient.departureAerodrome,
            inline: true
          },
          {
            name: `Destination`,
            value: vatsimClient.destinationAerodrome,
            inline: true
          },
          {
            name: `Transponder`,
            value: vatsimClient.transponderCode,
            inline: true
          },
          {
            name: `Latitude`,
            value: vatsimClient.latitude,
            inline: true
          },
          {
            name: `Longitude`,
            value: vatsimClient.longitude,
            inline: true
          },
          {
            name: `Altitude`,
            value: vatsimClient.altitude,
            inline: true
          },
          {
            name: `Groundspeed`,
            value: vatsimClient.groundSpeed,
            inline: true
          },
          {
            name: `Cruising Speed`,
            value: vatsimClient.cruisingSpeed,
            inline: true
          },
          {
            name: `Cruising Level`,
            value: vatsimClient.cruisingLevel,
            inline: true
          },
          {
            name: `Departure Time`,
            value: vatsimClient.departureTime,
            inline: true
          },
          {
            name: `EET`,
            value: `${vatsimClient.eetHours}:${vatsimClient.eetMinutes}`,
            inline: true
          },
          {
            name: `Aircraft`,
            value: vatsimClient.aircraft,
            inline: true
          },
          {
            name: `Route`,
            value: vatsimClient.route,
            inline: true
          }
        );
      } else if (vatsimClient.clientType === 'ATC') {
        vatsimEmbed.addFields(
          {
            name: `Call Sign`,
            value: vatsimClient.callSign,
            inline: true
          },
          {
            name: `CID`,
            value: vatsimClient.cid,
            inline: true
          },
          {
            name: `Name`,
            value: vatsimClient.name,
            inline: true
          },
          {
            name: `Position`,
            value: vatsimClient.facilityType,
            inline: true
          },
          {
            name: `Frequency`,
            value: vatsimClient.frequency,
            inline: true
          },
          {
            name: `ATIS`,
            value: vatsimClient.atis,
            inline: true
          }
        );
      }
    } catch (error) {
      logger.error(`[${this.client.shard.ids}] ${error}`);
      vatsimEmbed.setColor('#ff0000').setDescription(`${msg.author}, ${error.message}`);
    }

    return msg.embed(vatsimEmbed);
  }
};
