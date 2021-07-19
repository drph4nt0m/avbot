const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const Nats = require('../../utils/Nats');
const logger = require('../../utils/Logger');

dayjs.extend(utc);

module.exports = class NatsCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'nats',
      group: 'weather',
      memberName: 'nats',
      aliases: [],
      description: 'Gives you the latest North Atlantic Track information',
      examples: ['nats', 'nats <ident>'],
      args: [
        {
          key: 'ident',
          prompt: 'Which track would you like to get information about?',
          type: 'string',
          default: '',
          parse: (val) => val.toUpperCase()
        }
      ]
    });
  }

  async run(msg, { ident }) {
    if (!ident) {
      const natsEmbed = new Discord.MessageEmbed().setTitle(`NATS`).setColor('#0099ff').setFooter(this.client.user.username).setTimestamp();

      try {
        const { nats } = await Nats.getAllTracks();

        console.log(nats);

        nats.forEach((track) => {
          natsEmbed.addField(`${track.ident}`, `${track.route.nodes[0].ident}-${track.route.nodes[track.route.nodes.length - 1].ident}`);
        });
      } catch (error) {
        logger.error(`[${this.client.shard.ids}] ${error}`);
        natsEmbed.setColor('#ff0000').setDescription(`${msg.author}, ${error.message}`);
      }

      return msg.embed(natsEmbed);
    } else {
      const natsEmbed = new Discord.MessageEmbed()
        .setTitle(`NAT | Track ${ident}`)
        .setColor('#0099ff')
        .setFooter(this.client.user.username)
        .setTimestamp();

      try {
        const { nat } = await Nats.getTrackInformation(ident);

        console.log(nat);
        let route = '';
        nat.route.nodes.forEach((node) => {
          route += `${node.ident} `;
        });
        natsEmbed.addField('Route', `${route}`);
        if (nat.route.eastLevels.length > 0) {
          natsEmbed.addField('East levels', `${nat.route.eastLevels.join(', ')}`);
        }
        if (nat.route.westLevels.length > 0) {
          natsEmbed.addField('West levels', `${nat.route.westLevels.join(', ')}`);
        }

        natsEmbed.addField(
          'Validity',
          `${dayjs(nat.validFrom).utc().format('YYYY-MM-DD HH:mm:ss [Z]')} to ${dayjs(nat.validTo).utc().format('YYYY-MM-DD HH:mm:ss [Z]')}`
        );
      } catch (error) {
        logger.error(`[${this.client.shard.ids}] ${error}`);
        natsEmbed.setColor('#ff0000').setDescription(`${msg.author}, ${error.message}`);
      }

      return msg.embed(natsEmbed);
    }
  }
};
