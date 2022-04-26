import type {TextChannel} from "discord.js";
import {MessageEmbed} from "discord.js";
import type {ArgsOf, Client} from "discordx";
import {Discord, On} from "discordx";
import {injectable} from "tsyringe";

import logger from "../utils/LoggerFactory.js";

@Discord()
@injectable()
export class GuildCreate {

    @On("guildCreate")
    private async botJoins([guild]: ArgsOf<"guildCreate">, client: Client): Promise<void> {
        try {
            const welcomeEmbed = new MessageEmbed()
                .setTitle(`Hello ${guild.name} and thank you for choosing AvBot`)
                .setColor("#1a8fe3")
                .setDescription(
                    `If you need any help regarding AvBot or have any suggestions join our [AvBot Support Server](https://go.av8.dev/support).
        To get started try \`!help\`.
        [Buy me a coffee](https://go.av8.dev/donate)`
                )
                .setFooter({
                    text: `${client.user.username} • @dr_ph4nt0m#8402 • Thank you for showing your support by using AvBot`
                })
                .setTimestamp();
            const textChannel = guild.channels.cache
                .filter((c) => c.type === "GUILD_TEXT")
                .first() as TextChannel;
            await textChannel.send({
                embeds: [welcomeEmbed]
            });
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
        }
    }
}
