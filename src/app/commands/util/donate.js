const { MessageEmbed } = require('discord.js');
const { Command } = require('discord.js-commando');

module.exports = class DonateCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'donate',
      group: 'util',
      memberName: 'donate',
      aliases: ['d', 'support'],
      description: 'Support AvBot by donating.',
      examples: ['donate', 'support']
    });
  }

  async run(msg) {
    if (msg.guild && !msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
      return msg.reply(
        `AvBot doesn't have permissions to send Embeds in this channel. Please enable "Embed Links" under channel permissions for AvBot.`
      );
    }
    const donateEmbed = new MessageEmbed()
      .setTitle('Donate')
      .setColor('#1a8fe3')
      .setDescription('[Click here to support avbot](https://link.avbot.in/donate)')
      .setFooter(`${this.client.user.username} • @dr_ph4nt0m#0001`)
      .setTimestamp();

    return msg.embed(donateEmbed);
  }
};
