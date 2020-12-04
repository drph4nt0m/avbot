const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const gTTS = require('gtts');
const fs = require('fs');
const AvBrief3 = require('../../utils/AvBrief3');
const Avwx = require('../../utils/Avwx');
const logger = require('../../utils/Logger');

module.exports = class AtisVoiceCommand extends Command {
  voiceChannels = {};

  tmpDir = `${__dirname}/tmp`;

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
          parse: (val) => val.toUpperCase()
        }
      ]
    });
  }

  async run(msg, { icao }) {
    if (msg.member.voice.channel) {
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
          .setFooter(this.client.user.username)
          .setTimestamp();

        try {
          const { speech } = await AvBrief3.getAtis(icao);
          atisEmbed.setDescription(speech);

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
            if (!fs.existsSync(this.tmpDir)) {
              fs.mkdirSync(this.tmpDir);
            }

            const dispatcher = connection.play(`${this.tmpDir}/${msg.member.voice.channel.id}_${icao}.mp3`);
            dispatcher.on('finish', async () => {
              await sleep(1000);
              play(connection);
            });
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

            atisEmbed.setDescription(speech);

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

                const dispatcher = connection.play(`${this.tmpDir}/${msg.member.voice.channel.id}_${icao}.mp3`);
                dispatcher.on('finish', async () => {
                  await sleep(1000);
                  play(connection);
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

        msg.embed(atisEmbed);
      }
    } else {
      msg.reply('You need to join a voice channel first!');
    }
  }
};
