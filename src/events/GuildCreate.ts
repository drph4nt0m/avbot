import type { TextChannel } from "discord.js";
import { EmbedBuilder, Formatters } from "discord.js";
import type { ArgsOf, Client } from "discordx";
import { Discord, On } from "discordx";
import { injectable } from "tsyringe";

import { Property } from "../model/framework/decorators/Property.js";
import type { NODE_ENV } from "../model/Typeings.js";
import logger from "../utils/LoggerFactory.js";
import { OnReady } from "./OnReady.js";

@Discord()
@injectable()
export class GuildCreate {
    @Property("NODE_ENV")
    private readonly environment: NODE_ENV;

    public constructor(private _onReady: OnReady) {}

    @On("guildCreate")
    private async botJoins([guild]: ArgsOf<"guildCreate">, client: Client): Promise<void> {
        try {
            const welcomeEmbed = new EmbedBuilder()
                .setTitle(`Hello ${guild.name} and thank you for choosing AvBot`)
                .setColor("#1a8fe3")
                .setDescription(
                    `If you need any help regarding AvBot or have any suggestions 
                    join our ${Formatters.hyperlink("AvBot Support Server", "https://go.av8.dev/support")}.
                    To get started try ${Formatters.inlineCode("\\help")}.
                    ${Formatters.hyperlink("Support AvBot", "https://go.av8.dev/donate")}`
                )
                .setFooter({
                    text: `${client.user.username} • @dr_ph4nt0m#8402 • Thank you for showing your support by using AvBot`
                })
                .setTimestamp();
            const textChannel = guild.channels.cache.filter((c) => c.type === "GUILD_TEXT").first() as TextChannel;
            await textChannel.send({
                embeds: [welcomeEmbed]
            });
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
        }

        if (this.environment === "development") {
            await this._onReady.initAppCommands(client);
        }
    }
}
