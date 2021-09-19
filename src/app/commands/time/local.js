const { MessageEmbed } = require('discord.js');
const { Command } = require('discord.js-commando');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const Avwx = require('../../utils/Avwx');
const Geonames = require('../../utils/Geonames');
const logger = require('../../utils/Logger');

dayjs.extend(utc);
dayjs.extend(timezone);

module.exports = class LocalCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'local',
      group: 'time',
      memberName: 'local',
      aliases: ['lt'],
      description: 'Gives you the specific local time for the given zulu Time and ICAO',
      args: [
        {
          key: 'icao',
          type: 'string',
          prompt: 'Enter ICAO code',
          default: '',
          parse: (val) => val.toUpperCase().replace(/\s/g, '')
        },
        {
          key: 'zulutime',
          type: 'string',
          prompt: 'Enter Zulu time',
          default: '',
          validate: (val) => {
            if (!val) {
              return true;
            }
            if (val.length !== 4) {
              return 'Zulu time must be in HHMM format';
            }
            const [HH, MM] = [val.substr(0, 2), val.substr(2)];
            if (HH > 23 || HH < 0) {
              return 'Invalid HH';
            }
            if (MM > 59 || MM < 0) {
              return 'Invalid MM';
            }
            return true;
          }
        }
      ]
    });
  }

  async run(msg, { icao, zulutime }) {
    if (msg.guild && !msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
      return msg.reply(
        `AvBot doesn't have permissions to send Embeds in this channel. Please enable "Embed Links" under channel permissions for AvBot.`
      );
    }
    const localEmbed = new MessageEmbed()
      .setTitle('Local Time')
      .setColor('#1a8fe3')
      .setFooter(`${this.client.user.username} • This is not a source for official briefing • Please use the appropriate forums`)
      .setTimestamp();

    if (!(icao || zulutime)) {
      localEmbed.setColor('#ff0000').setDescription('Command syntax: local [ICAO] [Zulu time]');
    } else if (icao && zulutime) {
      try {
        const {
          station: { latitude, longitude }
        } = await Avwx.getStation(icao);
        const { timezoneId } = await Geonames.getTimezone(latitude, longitude);
        const [HH, MM] = [zulutime.substr(0, 2), zulutime.substr(2)];

        const timestring = dayjs().utc().hour(HH).minute(MM).tz(timezoneId).format('DD/MM HHmm');

        localEmbed.setTitle(`Local Time at ${icao} when zulu time is ${zulutime}hrs`).setDescription(`${timestring}hrs`);
      } catch (error) {
        logger.error(`[${this.client.shard.ids}] ${error}`);
        localEmbed.setColor('#ff0000').setDescription(`${msg.author}, ${error.message}`);
      }
    } else {
      localEmbed.setColor('#ff0000').setDescription('Command syntax: local [ICAO] [Zulu time]');
    }

    return msg.embed(localEmbed);
  }
};
