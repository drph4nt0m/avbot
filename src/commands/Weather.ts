import {Category, NotBot} from "@discordx/utilities";
import type {AutocompleteInteraction, CommandInteraction} from "discord.js";
import {MessageEmbed} from "discord.js";
import {Client, Discord, Guard, Slash, SlashGroup, SlashOption} from "discordx";
import {injectable} from "tsyringe";

import {RequiredBotPerms} from "../guards/RequiredBotPerms.js";
import {AvwxManager} from "../model/framework/manager/AvwxManager.js";
import logger from "../utils/LoggerFactory.js";
import {InteractionUtils} from "../utils/Utils.js";

@Discord()
@SlashGroup({
    description: "Weather commands",
    name: "weather"
})
@SlashGroup("weather")
@Category("Weather commands")
@injectable()
export class Weather {

    public constructor(private _avwxManager: AvwxManager) {
    }

    @Slash("metar", {
        description: "Gives you the live METAR for the chosen airport"
    })
    @Guard(NotBot, RequiredBotPerms(["EMBED_LINKS"]))
    private async metar(
        @SlashOption("icao", {
            autocomplete: (interaction: AutocompleteInteraction) => InteractionUtils.search(interaction, AvwxManager),
            description: "What ICAO would you like the bot to give METAR for?",
            type: "STRING",
            required: true
        })
            icao: string,
        @SlashOption("raw", {
            description: "Gives you the live raw METAR for the chosen airport",
            type: "BOOLEAN",
            required: false
        })
            rawData: boolean,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        await interaction.deferReply();
        const title = rawData ? `Raw METAR for ${icao.toUpperCase()}` : `METAR for ${icao.toUpperCase()}`;
        const metarEmbed = new MessageEmbed()
            .setTitle(title)
            .setColor("#0099ff")
            .setTimestamp();
        try {
            const {raw, readable} = await this._avwxManager.getMetar(icao);
            if (rawData) {
                metarEmbed.setDescription(raw);
            } else {
                metarEmbed
                    .addFields(
                        {
                            name: "Raw Report",
                            value: raw
                        },
                        {
                            name: "Readable Report",
                            value: readable
                        }
                    );
            }
        } catch (err) {
            logger.error(`[${client.shard.ids}] ${err}`);
            metarEmbed.setColor("#ff0000").setDescription(`${interaction.member}, ${err.message}`);
        }
        metarEmbed.setFooter({
            text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AVWX`
        });
        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [metarEmbed]
        });
    }
}
