const { MessageEmbed } = require('discord.js');
const { Command } = require('discord.js-commando');

module.exports = class DonateCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'donate',
      group: 'util',
      memberName: 'donate',
      aliases: ['support'],
      description: 'Support AvBot by donating.',
      examples: ['donate', 'support']
    });
  }

  async run(msg) {
    const donateEmbed = new MessageEmbed()
      .setTitle('Donate')
      .setColor('#1a8fe3')
      .setDescription('[Click here to support avbot](https://link.avbot.in/donate)')
      .setFooter(this.client.user.username)
      .setTimestamp();

    return msg.embed(donateEmbed);
  }
};
