const { MessageEmbed } = require('discord.js');
const { Command } = require('discord.js-commando');

module.exports = class InviteCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'invite',
      group: 'util',
      memberName: 'invite',
      aliases: ['link'],
      description:
        'Gives you the AvBot invite link to add it to your Discord server',
      examples: ['invite', 'link'],
    });
  }

  async run(msg) {
    const donateEmbed = new MessageEmbed()
      .setTitle('AvBot')
      .setColor('#1a8fe3')
      .setDescription(
        '[Click here to add AvBot to you Discord server](https://link.avbot.in/addme)'
      )
      .setFooter(this.client.user.username)
      .setTimestamp();

    return msg.embed(donateEmbed);
  }
};
