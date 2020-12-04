const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const OpenSky = require('../../utils/OpenSky');
const AviationStack = require('../../utils/AviationStack');
const AeroDataBox = require('../../utils/AeroDataBox');
const AirportData = require('../../utils/AirportData');
const logger = require('../../utils/Logger');
const Database = require('../../utils/Database');
const services = require('../../../config/services');

module.exports = class LiveCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'live',
      group: 'misc',
      memberName: 'live',
      aliases: ['l', 'irl'],
      description: '[premium] Gives you the information for the chosen call sign in real life',
      examples: ['live <callsign>'],
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
    msg.channel.startTyping();
    const liveEmbed = new Discord.MessageEmbed()
      .setTitle(`${callSign.toUpperCase()}`)
      .setColor('#0099ff')
      .setFooter(`${this.client.user.username} • Source: The OpenSky Network API | AviationStack | AeroDataBox | AirportData`)
      .setTimestamp();
    if (!await Database.isPremiumGuild(msg.guild.id)) {
      logger.error(`[${this.client.shard.ids}] ${msg.guild.id} tried using live command`);
      liveEmbed.setColor('#00ff00')
        .setDescription(`${msg.author}, this command is only available for premium servers. If you want to join the premium program, join [AvBot Support Server](${services.discord.supportServerInvite}) and contact the developer.`)
        .setFooter(`${this.client.user.username} • @dr_ph4nt0m#6615`);
      msg.channel.stopTyping();
      return msg.embed(liveEmbed);
    }
    let icao24 = null;

    try {
      const flightInfo = await OpenSky.getFlightInfo(callSign);
      icao24 = flightInfo.icao24;

      liveEmbed.addFields([
        {
          name: 'Callsign',
          value: flightInfo.callsign,
          inline: true
        },
        {
          name: 'Ground Speed',
          value: flightInfo.velocity,
          inline: true
        },
        {
          name: 'Heading',
          value: flightInfo.true_track,
          inline: true
        },
        {
          name: 'Altitude',
          value: flightInfo.geo_altitude,
          inline: true
        },
        {
          name: 'Climb Rate',
          value: flightInfo.vertical_rate,
          inline: true
        },
        {
          name: 'Squawk',
          value: flightInfo.squawk,
          inline: true
        },
        {
          name: 'Country of Origin',
          value: flightInfo.origin_country,
          inline: true
        },
        {
          name: 'ICAO Address',
          value: flightInfo.icao24,
          inline: true
        }
      ])
    } catch (error) {
      logger.error(`[${this.client.shard.ids}] ${error}`);
      liveEmbed.setColor('#ff0000').setDescription(`${msg.author}, ${error.message}`);
      msg.channel.stopTyping();
      return msg.embed(liveEmbed);
    }

    try {
      const flightInfo = await AviationStack.getFlightInfo(callSign);

      liveEmbed.addFields([
        {
          name: 'Departure',
          value: flightInfo.departure ? flightInfo.departure.icao + (flightInfo.departure.airport ? ` | ${flightInfo.departure.airport}` : '') : 'Unknown',
          inline: true
        },
        {
          name: 'Arrival',
          value: flightInfo.arrival.icao ? flightInfo.arrival.icao + (flightInfo.arrival.airport ? ` | ${flightInfo.arrival.airport}` : '') : 'Unknown',
          inline: true
        }
      ])
    } catch (error) {
      logger.error(`[${this.client.shard.ids}] ${error}`);
    }

    try {
      const aircraftInfo = await AeroDataBox.getAircraftInfo(icao24);

      liveEmbed.addFields([
        {
          name: 'Airline',
          value: aircraftInfo.airlineName ? aircraftInfo.airlineName : 'Unknown',
          inline: true
        },
        {
          name: 'Aircraft',
          value: aircraftInfo.typeName ? aircraftInfo.typeName : 'Unknown',
          inline: true
        },
        {
          name: 'Registration',
          value: aircraftInfo.reg ? aircraftInfo.reg : 'Unknown',
          inline: true
        }
      ])
    } catch (error) {
      logger.error(`[${this.client.shard.ids}] ${error}`);
    }

    try {
      const aircraftImage = await AirportData.getAircraftImage(icao24);

      liveEmbed.setImage(aircraftImage.image).addField('Image Credits', `[${aircraftImage.photographer}](${aircraftImage.link})`);
    } catch (error) {
      logger.error(`[${this.client.shard.ids}] ${error}`);
    }
    msg.channel.stopTyping();
    return msg.embed(liveEmbed);
  }
};
