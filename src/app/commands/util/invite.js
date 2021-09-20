const { MessageEmbed } = require('discord.js');
const { Command } = require('discord.js-commando');

module.exports = class InviteCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'invite',
      group: 'util',
      memberName: 'invite',
      aliases: ['link'],
      description: 'Gives you the AvBot invite link to add it to your Discord server',
      examples: ['invite', 'link']
    });
  }

  async run(msg) {
    if (msg.guild && !msg.channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) {
      return msg.reply(
        `AvBot doesn't have permissions to send Embeds in this channel. Please enable "Embed Links" under channel permissions for AvBot.`
      );
    }
    const inviteEmbed = new MessageEmbed()
      .setTitle('AvBot')
      .setColor('#1a8fe3')
      .setDescription('[Click here to add AvBot to you Discord server](https://link.avbot.in/addme)')
      .addField('\u200b', '[Click here to support avbot](https://link.avbot.in/donate)')
      .setFooter(`${this.client.user.username} • @dr_ph4nt0m#8402`)
      .setTimestamp();

    return msg.embed(inviteEmbed);
  }
};
