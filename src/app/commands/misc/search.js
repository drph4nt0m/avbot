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
    const searchEmbed = new Discord.MessageEmbed()
      .setTitle(`Search : ${location.toUpperCase()}`)
      .setColor('#0099ff')
      .setFooter(
        `${this.client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: GeoNames | AVWX`
      )
      .setTimestamp();

    try {
      const { latitude, longitude } = await Geonames.getCoordinates(location);

      searchEmbed.setTitle(`Search : ${location.toUpperCase()} [${latitude}, ${longitude}]`);

      const stations = await Avwx.getStationsByCoords(latitude, longitude, location);

      stations.forEach((station) => {
        let title = `${station.station.icao}`;
        if (station.station.iata) {
          title += ` / ${station.station.iata}`;
        }

        const desc = `${station.station.name}\n`;
        // if (station.station.note) {
        //   desc += station.station.note;
        // }
        searchEmbed.addField(title, accents.remove(desc));
      });
    } catch (error) {
      logger.error(`[${this.client.shard.ids}] ${error}`);
      searchEmbed.setColor('#ff0000').setDescription(`${msg.author}, ${error.message}`);
    }

    return msg.embed(searchEmbed);
  }
};
