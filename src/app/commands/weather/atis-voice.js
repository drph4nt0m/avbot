const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const gTTS = require('gtts');
const fs = require('fs');
const AvBrief3 = require('../../utils/AvBrief3');
const Avwx = require('../../utils/Avwx');
const logger = require('../../utils/Logger');

module.exports = class AtisVoiceCommand extends Command {
  voiceChannels = {};

  tmpDir = `${process.cwd()}/tmp`;

  constructor(client) {
    super(client, {
      name: 'atis-voice',
      group: 'weather',
      memberName: 'atis-voice',
      aliases: ['av', 'atisvoice'],
      description: 'Gives you the live ATIS as voice for the chosen airport',
      examples: ['atis-voice <icao>', 'atis-voice -stop'],
      guildOnly: true,
      args: [
        {
          key: 'icao',
          prompt: 'What ICAO would you like the bot to give ATIS for?',
          type: 'string',
          parse: (val) => val.toUpperCase().replace(/\s/g, '')
        }
      ]
    });
  }

  async run(msg, { icao }) {
    if (!msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS') || !msg.channel.permissionsFor(msg.guild.me).has('ADD_REACTIONS')) {
      return msg.reply(
        `AvBot doesn't have permissions to send Embeds and/or to add reactions in this channel. Please enable "Embed Links" and "Add Reactions" under channel permissions for AvBot.`
      );
    }
    if (msg.member.voice.channel) {
      if (
        !msg.member.voice.channel.permissionsFor(msg.guild.me).has('CONNECT') ||
        !msg.member.voice.channel.permissionsFor(msg.guild.me).has('SPEAK')
      ) {
        return msg.reply(
          `AvBot doesn't have permissions to connect and/or to speak in your voice channel. Please enable "Connect" and "Speak" under channel permissions for AvBot.`
        );
      }
      if (msg.member.voice.channel.full) {
        const atisEmbed = new Discord.MessageEmbed()
          .setTitle(`ATIS for ${icao.toUpperCase()}`)
          .setColor('#ff0000')
          .setDescription(`${msg.author}, AvBot is unable to join the voice channel as it is already full.`)
          .setFooter(`${this.client.user.username} • This is not a source for official briefing • Please use the appropriate forums`)
          .setTimestamp();

        return msg.embed(atisEmbed);
      }
      if (icao === '-STOP') {
        if (this.voiceChannels[msg.member.voice.channel.id]) {
          this.voiceChannels[msg.member.voice.channel.id].connection.disconnect();
          msg.reply('AvBot left the voice channel');
        } else {
          msg.reply('AvBot already left the voice channel');
        }
      } else {
        const atisEmbed = new Discord.MessageEmbed()
          .setTitle(`ATIS for ${icao.toUpperCase()}`)
          .setColor('#0099ff')
          .setFooter(`${this.client.user.username} • This is not a source for official briefing • Please use the appropriate forums`)
          .setTimestamp();

        let atisFound = false;

        try {
          const { speech } = await AvBrief3.getAtis(icao);
          atisFound = true;

          atisEmbed
            .setDescription(speech)
            .setFooter(
              `${this.client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AvBrief3`
            );

          // eslint-disable-next-line new-cap
          const gtts = new gTTS(speech, 'en-uk');

          if (!fs.existsSync(this.tmpDir)) {
            fs.mkdirSync(this.tmpDir);
          }
          gtts.save(`${this.tmpDir}/${msg.member.voice.channel.id}_${icao}.mp3`);

          const sleep = (ms) =>
            new Promise((resolve) => {
              setTimeout(resolve, ms);
            });

          const play = (connection) => {
            try {
              if (!fs.existsSync(this.tmpDir)) {
                fs.mkdirSync(this.tmpDir);
              }

              const dispatcher = connection.play(`${this.tmpDir}/${connection.channel.id}_${icao}.mp3`);
              dispatcher.on('finish', async () => {
                await sleep(1000);
                if (connection.channel.members.array().filter((member) => member.id !== this.client.user.id).length === 0) {
                  connection.disconnect();
                  msg.reply('AvBot left the voice channel');
                } else {
                  play(connection);
                }
              });
            } catch (err) {
              logger.error(`[${this.client.shard.ids}] ${err}`);
            }
          };

          if (this.client.voice.connections.filter((conn) => conn.channel.id === msg.member.voice.channel.id).array().length > 0) {
            const { connection } = this.voiceChannels[msg.member.voice.channel.id];
            connection.disconnect();
            await sleep(3000);
          }

          const connection = await msg.member.voice.channel.join();

          play(connection);

          this.voiceChannels[msg.member.voice.channel.id] = {
            channel: msg.member.voice.channel,
            connection
          };
        } catch (error) {
          logger.error(`[${this.client.shard.ids}] ${error}`);
          try {
            const { speech } = await Avwx.getMetar(icao);
            atisFound = true;

            atisEmbed
              .setDescription(speech)
              .setFooter(
                `${this.client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AVWX`
              );

            // eslint-disable-next-line new-cap
            const gtts = new gTTS(speech, 'en-uk');
            if (!fs.existsSync(this.tmpDir)) {
              fs.mkdirSync(this.tmpDir);
            }

            gtts.save(`${this.tmpDir}/${msg.member.voice.channel.id}_${icao}.mp3`);

            const sleep = (ms) =>
              new Promise((resolve) => {
                setTimeout(resolve, ms);
              });

            const play = (connection) => {
              try {
                if (!fs.existsSync(this.tmpDir)) {
                  fs.mkdirSync(this.tmpDir);
                }

                const dispatcher = connection.play(`${this.tmpDir}/${connection.channel.id}_${icao}.mp3`);
                dispatcher.on('finish', async () => {
                  await sleep(1000);
                  if (connection.channel.members.array().filter((member) => member.id !== this.client.user.id).length === 0) {
                    connection.disconnect();
                    msg.reply('AvBot left the voice channel');
                  } else {
                    play(connection);
                  }
                });
              } catch (err) {
                logger.error(`[${this.client.shard.ids}] ${err}`);
              }
            };

            if (this.client.voice.connections.filter((conn) => conn.channel.id === msg.member.voice.channel.id).array().length > 0) {
              const { connection } = this.voiceChannels[msg.member.voice.channel.id];
              connection.disconnect();
              await sleep(3000);
            }

            const connection = await msg.member.voice.channel.join();

            play(connection);

            this.voiceChannels[msg.member.voice.channel.id] = {
              channel: msg.member.voice.channel,
              connection
            };
          } catch (err) {
            logger.error(`[${this.client.shard.ids}] ${err}`);
            atisEmbed.setColor('#ff0000').setDescription(`${msg.author}, ${err.message}`);
          }
        }

        const sentMsg = await msg.embed(atisEmbed);
        if (atisFound) {
          await sentMsg.react('🛑');

          const filter = (reaction, user) => ['🛑'].includes(reaction.emoji.name) && user.id === msg.author.id;

          sentMsg
            .awaitReactions(filter, { max: 1 })
            .then((collected) => {
              const reaction = collected.first();
              if (reaction.emoji.name === '🛑') {
                if (msg.member.voice.channel) {
                  if (this.voiceChannels[msg.member.voice.channel.id]) {
                    this.voiceChannels[msg.member.voice.channel.id].connection.disconnect();
                    msg.reply('AvBot left the voice channel');
                  } else {
                    msg.reply('AvBot already left the voice channel');
                  }
                }
              }
            })
            .catch((err) => {
              logger.error(`[${this.client.shard.ids}] ${err}`);
            });
        }
      }
    } else {
      msg.reply('You need to join a voice channel first!');
    }
    return null;
  }
};
