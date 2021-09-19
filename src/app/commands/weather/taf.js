const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const Avwx = require('../../utils/Avwx');
const AvBrief3 = require('../../utils/AvBrief3');
const logger = require('../../utils/Logger');

module.exports = class TafCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'taf',
      group: 'weather',
      memberName: 'taf',
      aliases: ['t'],
      description: 'Gives you the live TAF for the chosen airport',
      examples: ['taf <icao>'],
      args: [
        {
          key: 'icao',
          prompt: 'What ICAO would you like the bot to give TAF for?',
          type: 'string',
          parse: (val) => val.toUpperCase().replace(/\s/g, '')
        }
      ]
    });
  }

  async run(msg, { icao }) {
    if (msg.guild && !msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
      return msg.reply(
        `AvBot doesn't have permissions to send Embeds in this channel. Please enable "Embed Links" under channel permissions for AvBot.`
      );
    }
    const tafEmbed = new Discord.MessageEmbed()
      .setTitle(`TAF for ${icao.toUpperCase()}`)
      .setColor('#0099ff')
      .setFooter(`${this.client.user.username} • This is not a source for official briefing • Please use the appropriate forums`)
      .setTimestamp();

    try {
      const { raw, readable } = await Avwx.getTaf(icao);

      if (readable.length < 600) {
        tafEmbed
          .addFields(
            {
              name: 'Raw Report',
              value: raw
            },
            {
              name: 'Readable Report',
              value: readable
            }
          )
          .setFooter(`${this.client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AVWX`);

        return msg.embed(tafEmbed);
      } else {
        const tafEmbeds = [];
        let tempEmbed = new Discord.MessageEmbed()
          .setTitle(`TAF for ${icao.toUpperCase()}`)
          .setColor('#0099ff')
          .addField('Raw Report', raw)
          .setFooter(`${this.client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AVWX`)
          .setTimestamp();

        tafEmbeds.push(tempEmbed);

        const readableList = readable.split('. ');
        let buffer = '';

        for (let i = 0; i < readableList.length; i += 1) {
          const currentLine = `${readableList[i]}. `;
          buffer += currentLine;
          if (buffer.length > 600) {
            tempEmbed = new Discord.MessageEmbed()
              .setTitle(`TAF for ${icao.toUpperCase()}`)
              .setColor('#0099ff')
              .addField(`Readable Report [${tafEmbeds.length}]`, buffer)
              .setFooter(
                `${this.client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AVWX`
              )
              .setTimestamp();

            tafEmbeds.push(tempEmbed);
            buffer = '';
          }
        }

        tempEmbed = tafEmbed;
        if (buffer.length > 0) {
          tafEmbeds.push(tempEmbed.addField(`Readable Report [${tafEmbeds.length}]`, buffer));
        }

        for (let i = 0; i < tafEmbeds.length; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          await msg.embed(
            tafEmbeds[i].setFooter(
              `${this.client.user.username} • Message ${i + 1} of ${
                tafEmbeds.length
              } • This is not a source for official briefing • Please use the appropriate forums • Source: AVWX`
            )
          );
        }

        return null;
      }
    } catch (error) {
      logger.error(`[${this.client.shard.ids}] ${error}`);
      try {
        const { raw } = await AvBrief3.getTaf(icao);

        tafEmbed
          .addFields({
            name: 'Raw Report',
            value: raw
          })
          .setFooter(
            `${this.client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AvBrief3`
          );
      } catch (err) {
        logger.error(`[${this.client.shard.ids}] ${err}`);
        tafEmbed.setColor('#ff0000').setDescription(`${msg.author}, ${err.message}`);
      }
    }

    return msg.embed(tafEmbed);
  }
};
