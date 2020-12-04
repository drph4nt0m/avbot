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

module.exports = class ZuluCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'zulu',
      group: 'time',
      memberName: 'zulu',
      aliases: ['zt'],
      description: 'Gives you the current zulu time or specific zulu time for the given local Time and ICAO',
      args: [
        {
          key: 'icao',
          type: 'string',
          prompt: 'Enter ICAO code',
          default: '',
          parse: (val) => val.toUpperCase()
        },
        {
          key: 'localtime',
          type: 'string',
          prompt: 'Enter Local time',
          default: '',
          validate: (val) => {
            if (!val) {
              return true;
            }
            if (val.length !== 4) {
              return 'Local time must be in HHMM format';
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

  async run(msg, { icao, localtime }) {
    const zuluEmbed = new MessageEmbed().setTitle('ZULU Time').setColor('#1a8fe3').setFooter(this.client.user.username).setTimestamp();

    if (!(icao || localtime)) {
      const timestring = dayjs.utc().format('DD/MM HH:mm');
      zuluEmbed.setDescription(`${timestring} Z`);
    } else if (icao && localtime) {
      try {
        const {
          station: { latitude, longitude }
        } = await Avwx.getStation(icao);
        const { gmtOffset } = await Geonames.getTimezone(latitude, longitude);
        const [HH, MM] = [localtime.substr(0, 2), localtime.substr(2)];
        const timestring = dayjs().utcOffset(gmtOffset).hour(HH).minute(MM).utc().format('DD/MM HHmm');

        zuluEmbed.setTitle(`Zulu Time at ${icao} when local time is ${localtime}hrs`).setDescription(`${timestring}z`);
      } catch (error) {
        logger.error(`[${this.client.shard.ids}] ${error}`);
        zuluEmbed.setColor('#ff0000').setDescription(`${msg.author}, ${error.message}`);
      }
    } else {
      zuluEmbed.setColor('#ff0000').setDescription('Command syntax: zulu [ICAO] [Local time]');
    }
    return msg.embed(zuluEmbed);
  }
};
