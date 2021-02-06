const Discord = require('discord.js');
const { Command } = require('discord.js-commando');

module.exports = class StatCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'stat',
      group: 'util',
      memberName: 'stat',
      aliases: ['stats'],
      description: 'Gives you the AvBot stats.',
      examples: ['stat'],
      ownerOnly: true
    });
  }

  async run(msg) {
    const guilds = await this.client.shard.fetchClientValues('guilds.cache.size');
    const statsEmbed = new Discord.MessageEmbed()
      .setColor('#0099ff')
      .setTitle('AvBot Stats!')
      .setURL('https://avbot.in')
      .setThumbnail('https://avbot.in/assets/logo.png')
      .setFooter(this.client.user.username)
      .setTimestamp()
      .addFields(
        {
          name: 'Server Count',
          value: guilds.reduce((acc, guildCount) => acc + guildCount, 0)
        },
        {
          name: 'Uptime',
          value: this.dhms(process.uptime())
        }
      );
    return msg.embed(statsEmbed);
  }

  dhms = (t) => {
    const cd = 24 * 60 * 60;
    const ch = 60 * 60;
    const cm = 60;
    let d = Math.floor(t / cd);
    let h = Math.floor((t - d * cd) / ch);
    let m = Math.floor((t - d * cd - h * ch) / cm);
    let s = Math.floor(t - d * cd - h * ch - m * cm);
    const pad = (n) => (n < 10 ? `0${n}` : n);
    if (s === 60) {
      m += 1;
      s = 0;
    }
    if (m === 60) {
      h += 1;
      m = 0;
    }
    if (h === 24) {
      d += 1;
      h = 0;
    }
    return `${pad(d)} days \n${pad(h)} hours \n${pad(m)} minutes \n${pad(s)} seconds`;
  };
};
