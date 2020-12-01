const Discord = require('discord.js');
const { Command } = require('discord.js-commando');

module.exports = class HelpCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'help',
      group: 'util',
      memberName: 'help',
      aliases: ['commands', 'commands'],
      description: 'Displays a list of available commands, or detailed information for a specified command',
      examples: ['help', 'help <command>'],
      hidden: true,
      args: [
        {
          key: 'command',
          prompt: 'Which command would you like to view the help for?',
          type: 'string',
          default: ''
        }
      ]
    });
  }

  async run(msg, args) {
    const commands = this.client.registry.findCommands(args.command, false, msg);
    const showAll = args.command && args.command.toLowerCase() === 'all';

    if (args.command && !showAll) {
      if (commands.length === 1 && !commands[0].ownerOnly) {
        const fields = [];

        fields.push({
          name: 'Command',
          value: commands[0].name
        });

        if (commands[0].aliases && commands[0].aliases.length > 0) {
          fields.push({
            name: 'Aliases',
            value: commands[0].aliases.join(', ')
          });
        }

        fields.push({
          name: 'Description',
          value: commands[0].description
        });

        if (commands[0].examples && commands[0].examples.length > 0) {
          fields.push({
            name: 'Examples',
            value: commands[0].examples.join('\n')
          });
        }

        const helpEmbed = new Discord.MessageEmbed()
          .setColor('#0099ff')
          .setTitle('AvBot to the rescue!')
          .setURL('https://avbot.in')
          .setThumbnail('https://avbot.in/assets/logo.png')
          .setFooter(this.client.user.username)
          .setTimestamp()
          .addFields(fields);
        return msg.embed(helpEmbed);
      }
      if (commands.length > 1) {
        return msg.reply('Multiple commands found. Please be more specific.');
      }

      return msg.reply(
        `Unable to identify command. Use ${msg.usage(
          null,
          msg.channel.type === 'dm' ? null : undefined,
          msg.channel.type === 'dm' ? null : undefined
        )} to view the list of all commands.`
      );
    }

    const fields = [];

    commands.forEach((command) => {
      if (!command.ownerOnly && !command.hidden) {
        fields.push({
          name: command.name,
          value: command.description
        });
      }
    });

    const helpEmbed = new Discord.MessageEmbed()
      .setColor('#0099ff')
      .setTitle('AvBot to the rescue!')
      .setURL('https://avbot.in')
      .setThumbnail('https://avbot.in/assets/logo.png')
      .setFooter(this.client.user.username)
      .setTimestamp()
      .addFields(fields);

    return msg.embed(helpEmbed);
  }
};
