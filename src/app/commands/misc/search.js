const Discord = require('discord.js');
const accents = require('remove-accents');
const { Command } = require('discord.js-commando');
const Geonames = require('../../utils/Geonames');
const Avwx = require('../../utils/Avwx');
const logger = require('../../utils/Logger');

module.exports = class IcaoCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'search',
      group: 'misc',
      memberName: 'search',
      aliases: ['s'],
      description: 'Gives you the nearest airport for a chosen location',
      examples: ['search <location>'],
      args: [
        {
          key: 'location',
          prompt: 'What location would you like the bot to search for?',
          type: 'string'
        }
      ]
    });
  }

  async run(msg, { location }) {
    const stationEmbed = new Discord.MessageEmbed()
      .setTitle(`Search : ${location.toUpperCase()}`)
      .setColor('#0099ff')
      .setFooter(this.client.user.username)
      .setTimestamp();

    try {
      const { latitude, longitude } = await Geonames.getCoordinates(location);

      const { station } = await Avwx.getStationByCoords(latitude, longitude, location);

      stationEmbed.addFields(
        {
          name: 'ICAO',
          value: station.icao || 'Unknown',
          inline: true
        },
        {
          name: 'IATA',
          value: station.iata || 'Unknown',
          inline: true
        },
        {
          name: 'Name',
          value: accents.remove(station.name) || 'Unknown',
          inline: true
        },
        {
          name: 'City',
          value: accents.remove(station.city) || 'Unknown',
          inline: true
        },
        {
          name: 'Country',
          value: accents.remove(station.country) || 'Unknown',
          inline: true
        },
        {
          name: 'Type',
          value: station.type.split('_')[0] || 'Unknown',
          inline: true
        },
        {
          name: 'Latitude',
          value: station.latitude || 'Unknown',
          inline: true
        },
        {
          name: 'Longitude',
          value: station.longitude || 'Unknown',
          inline: true
        },
        {
          name: 'Elevation',
          value: `${station.elevation_ft} ft` || 'Unknown',
          inline: true
        },
        {
          name: 'Runways',
          value:
            (() => {
              const r = station.runways;
              let runways = '';
              if (r) {
                r.forEach((rw) => {
                  if (rw.length_ft !== 0 && rw.width_ft !== 0) {
                    runways += `${rw.ident1}-${rw.ident2} : Length - ${rw.length_ft} ft, Width - ${rw.width_ft} ft\n`;
                  } else {
                    runways += `${rw.ident1}-${rw.ident2} : Length - NA, Width - NA\n`;
                  }
                });
              }
              return runways;
            })() || 'Unknown',
          inline: true
        },
        {
          name: 'More Info',
          value:
            (() => {
              let links = '';
              if (station.website) {
                links += `Official Website: ${station.website}`;
                if (station.wiki) {
                  links += `\nWikipedia: ${station.wiki}`;
                }
              } else if (station.wiki) {
                links += `\nWikipedia: ${station.wiki}`;
              }
              return links;
            })() || 'Unknown'
        }
      );
    } catch (error) {
      logger.error(`[${this.client.shard.ids}] ${error}`);
      stationEmbed.setColor('#ff0000').setDescription(`${msg.author}, ${error.message}`);
    }

    return msg.embed(stationEmbed);
  }
};
